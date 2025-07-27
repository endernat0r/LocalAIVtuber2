import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import RvcSettings from "@/components/rvc-settings"
import GptSovitsSettings from "@/components/gptsovits-settings"
import { TextInputPreview } from "@/components/text-input-preview"
import { ttsManager } from "@/lib/ttsManager"

type TTSProvider = "gpt-sovits" | "rvc"

export default function TTSPage() {
  const [selectedProvider, setSelectedProvider] = useState<TTSProvider>(ttsManager.getSelectedProvider())

  useEffect(() => {
    const unsubscribe = ttsManager.subscribe(() => {
      setSelectedProvider(ttsManager.getSelectedProvider())
    })
    return unsubscribe
  }, [])

  const handleProviderChange = (value: TTSProvider) => {
    setSelectedProvider(value)
    ttsManager.setSelectedProvider(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <TextInputPreview />

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              TTS Provider Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProvider} onValueChange={handleProviderChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select TTS Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-sovits">GPT-SoVITS</SelectItem>
                <SelectItem value="rvc">RVC (Retrieval-based-Voice-Conversion)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Provider-specific Settings */}
        {selectedProvider === "gpt-sovits" && <GptSovitsSettings />}
        {selectedProvider === "rvc" && <RvcSettings />}
      </div>
    </div>
  )
}