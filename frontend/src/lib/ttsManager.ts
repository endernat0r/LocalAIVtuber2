import { pipelineManager } from './pipelineManager';
import { globalStateManager } from './globalStateManager';

type TTSProvider = "gpt-sovits" | "rvc";
type TTSUpdateCallback = () => void;

export class TTSManager {
    private abortController: AbortController | null = null;
    private currentAudio: HTMLAudioElement | null = null;
    private isProcessing: boolean = false;
    private isPlaying: boolean = false;
    private subscribers: Set<TTSUpdateCallback> = new Set();

    constructor() {
        this.setupPipelineSubscription();
    }

    public subscribe(callback: TTSUpdateCallback): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notifySubscribers() {
        this.subscribers.forEach(callback => callback());
    }

    private setupPipelineSubscription() {
        return pipelineManager.subscribe(() => {
            this.processNextTTS();
            this.processNextAudio();
        });
    }

    private analyzeAudio(audio: HTMLAudioElement) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        const updateVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            const avgVolume = dataArray.reduce((a, b) => a + b, 0);
            const normalizedVolume = avgVolume / 15096;
            globalStateManager.updateState("ttsLiveVolume", normalizedVolume);
            if (!audio.paused) {
                requestAnimationFrame(updateVolume);
            }
        };

        updateVolume();
    }

    public async generateAudioFromText(text: string, provider: TTSProvider = "gpt-sovits"): Promise<string> {
        const abortController = new AbortController();
        this.abortController = abortController;

        if (provider === "rvc") {
            const response = await fetch("/api/rvc/convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    voice: "en-US-AriaNeural",
                    model_name: "qiqigenshin"
                }),
                signal: abortController.signal
            });

            if (!response.ok) {
                throw new Error("RVC conversion failed");
            }

            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } else {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
                signal: abortController.signal
            });

            if (!response.ok) {
                throw new Error("TTS generation failed");
            }

            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }
    }

    private async processNextTTS() {
        const currentTask = pipelineManager.getCurrentTask();
        if (currentTask?.status == "pending_interruption" && !currentTask.interruptionState?.tts) {
            if (this.abortController) {
                this.abortController.abort();
            }
            this.isProcessing = false;
            pipelineManager.markInterruptionState("tts");
            return;
        }
        
        if (this.isProcessing) return;

        const next = pipelineManager.getNextTaskForTTS();
        if (!next) return;

        const { taskId, responseIndex, task } = next;
        const textToSpeak = task.response[responseIndex].text;

        this.isProcessing = true;

        try {
            const audioUrl = await this.generateAudioFromText(textToSpeak);
            pipelineManager.addTTSAudio(taskId, responseIndex, audioUrl);
            this.isProcessing = false;
        } catch (err) {
            console.error("TTS pipeline error:", err);
            this.isProcessing = false;
        }
    }

    private async processNextAudio() {
        const currentTask = pipelineManager.getCurrentTask();
        if (currentTask?.status == "pending_interruption" && !currentTask.interruptionState?.audio) {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                this.currentAudio = null;
            }
            this.isPlaying = false;
            pipelineManager.markInterruptionState("audio");
            return;
        }

        if (this.isPlaying) return;

        const next = pipelineManager.getNextTaskForAudio();
        if (!next) return;

        const { taskId, responseIndex, task } = next;

        const audioUrl = task.response[responseIndex].audio;
        this.isPlaying = true;

        const audio = new Audio(audioUrl!);
        this.currentAudio = audio;
        audio.play();
        this.analyzeAudio(audio);

        audio.onended = () => {
            this.isPlaying = false;
            this.currentAudio = null;
            pipelineManager.markPlaybackFinished(taskId, responseIndex);
        };
    }
}

export const ttsManager = new TTSManager(); 