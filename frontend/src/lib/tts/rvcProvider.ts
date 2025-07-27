import { BaseTTSProvider } from "./baseTTSProvider";

interface RVCModel {
    name: string;
    model_path: string;
    index_path: string | null;
}

type RVCStateUpdateCallback = () => void;

export class RVCProvider extends BaseTTSProvider {
    private currentVoice: string | null = null;
    private currentEdgeVoice: string | null = null;
    private voices: string[] = [];
    private edgeVoices: string[] = [];
    private subscribers = new Set<RVCStateUpdateCallback>();

    constructor() {
        super();
        this.initialize();
    }

    private async initialize() {
        await this.fetchVoices();
        await this.fetchEdgeVoices();
    }

    subscribe(callback: RVCStateUpdateCallback): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notifySubscribers() {
        this.subscribers.forEach(callback => callback());
    }

    private async fetchVoices() {
        const response = await fetch('/api/rvc/models');
        const data = await response.json();
        this.voices = data.models.map((model: RVCModel) => model.name);
        this.notifySubscribers();
    }

    private async fetchEdgeVoices() {
        const response = await fetch('/api/rvc/edge-models');
        const data = await response.json();
        this.edgeVoices = data.models;
        this.notifySubscribers();
    }

    getVoices(): string[] {
        return this.voices;
    }

    getEdgeVoices(): string[] {
        return this.edgeVoices;
    }

    getCurrentVoice(): string | null {
        return this.currentVoice;
    }

    getCurrentEdgeVoice(): string | null {
        return this.currentEdgeVoice;
    }

    async setVoice(voice: string): Promise<void> {
        const response = await fetch(`/api/rvc/load_model/${voice}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to load RVC model');
        }

        this.currentVoice = voice;
        this.notifySubscribers();
    }

    setEdgeVoice(voice: string): void {
        this.currentEdgeVoice = voice;
        this.notifySubscribers();
    }

    async generateAudio(text: string): Promise<Response> {
        if (!this.currentVoice || !this.currentEdgeVoice) {
            throw new Error("RVC model and Edge TTS voice must be selected");
        }

        const response = await fetch("/api/rvc/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text,
                voice: this.currentEdgeVoice,
                model_name: this.currentVoice
            })
        });

        if (!response.ok) {
            throw new Error("RVC conversion failed");
        }

        return response;
    }
}