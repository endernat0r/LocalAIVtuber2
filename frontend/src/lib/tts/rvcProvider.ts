import { BaseTTSProvider } from "./baseTTSProvider";

interface RVCModel {
    name: string;
    model_path: string;
    index_path: string | null;
}

export class RVCProvider extends BaseTTSProvider {
    private currentVoice: string | null = null;
    private currentEdgeVoice: string | null = null;

    async getVoices(): Promise<string[]> {
        const response = await fetch('/api/rvc/models');
        const data = await response.json();
        return data.models.map((model: RVCModel) => model.name);
    }

    async getEdgeVoices(): Promise<string[]> {
        const response = await fetch('/api/rvc/edge-models');
        const data = await response.json();
        return data.models;
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
    }

    setEdgeVoice(voice: string): void {
        this.currentEdgeVoice = voice;
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