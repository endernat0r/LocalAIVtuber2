import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { ttsManager } from "@/lib/ttsManager";
import { GPTSoVITSProvider, TTSVoice } from "@/lib/tts/gptsovitsProvider";

export default function GptSovitsSettings() {
  const [voices, setVoices] = useState<TTSVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const provider = ttsManager.getCurrentProviderInstance() as GPTSoVITSProvider;

  useEffect(() => {
    fetchVoices()
  }, [])

  const fetchVoices = async () => {
    const voices = await provider.getVoices();
    setVoices(voices);
    const currentVoice = provider.getCurrentVoice();
    if (currentVoice) {
      setSelectedVoice(currentVoice);
    }
  }

  const handleVoiceChange = async (voice: string) => {
    try {
      await provider.setVoice(voice);
      setSelectedVoice(voice);
    } catch (error) {
      console.error('Failed to change voice:', error);
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>GPT-SoVITS Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-2">
          <Label>Voice Model</Label>
          <Select value={selectedVoice || ''} onValueChange={handleVoiceChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.name} value={voice.name}>
                  {voice.displayName || voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}