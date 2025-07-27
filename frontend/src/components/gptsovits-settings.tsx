import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function GptSovitsSettings() {
    
  const [voices, setVoices] = useState<string[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("leaf")

  useEffect(() => {
    fetchVoices()
  }, [])

  const fetchVoices = async () => {
    const response = await fetch('/api/tts/voices')
    const data = await response.json()
    if (data.voices) {
      setVoices(data.voices)
      if (data.current_voice) {
        setSelectedVoice(data.current_voice)
      }
    }
  }

  const handleVoiceChange = async (voice: string) => {
    try {
      const response = await fetch('/api/tts/change-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voice_name: voice })
      })
      const data = await response.json()
      if (response.ok) {
        setSelectedVoice(voice)
      } else {
        console.error(data.error || 'Failed to change voice')
      }
    } catch (error) {
      console.error('Failed to change voice:', error)
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
                <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select Voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
    )
}