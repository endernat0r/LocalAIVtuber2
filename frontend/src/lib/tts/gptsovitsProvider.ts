import { BaseTTSProvider } from "./baseTTSProvider";

export interface TTSVoice {
    name: string;
    displayName?: string;
}

export class GPTSoVITSProvider extends BaseTTSProvider {
    private currentVoice: string | null = null;

    async getVoices(): Promise<TTSVoice[]> {
        const response = await fetch('/api/tts/voices');
        const data = await response.json();
        return data.voices.map((voice: string) => ({ name: voice }));
    }

    getCurrentVoice(): string | null {
        return this.currentVoice;
    }

    async setVoice(voice: string): Promise<void> {
        const response = await fetch('/api/tts/change-voice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ voice_name: voice })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to change voice');
        }

        this.currentVoice = voice;
    }

    async generateAudio(text: string): Promise<Response> {
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error("GPT-SoVITS generation failed");
        }

        return response;
    }
}