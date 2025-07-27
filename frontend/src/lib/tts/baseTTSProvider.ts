export interface TTSVoice {
    name: string;
    displayName?: string;
}

export abstract class BaseTTSProvider {
    protected currentVoice: string | null = null;

    abstract getVoices(): Promise<TTSVoice[]>;
    abstract getCurrentVoice(): string | null;
    abstract setVoice(voice: string): Promise<void>;
    abstract generateAudio(text: string): Promise<Response>;
}