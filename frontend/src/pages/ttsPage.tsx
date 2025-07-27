import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Download, Settings, Mic, Volume2 } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import RvcSettings from "@/components/rvc-settings"
import GptSovitsSettings from "@/components/gptsovits-settings"
import { ttsManager } from "@/lib/ttsManager"

type TTSProvider = "gpt-sovits" | "rvc"

export default function TTSPage() {
  const [selectedProvider, setSelectedProvider] = useState<TTSProvider>("gpt-sovits")
  const [text, setText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!text.trim()) return

    setIsGenerating(true)
    setAudioUrl(null)

    try {
      const url = await ttsManager.generateAudioFromText(text, selectedProvider)
      setAudioUrl(url)
      const audio = new Audio(url)
      audio.play()
    } catch (error) {
      console.error("Error fetching TTS audio:", error)
      alert("Failed to generate audio. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!audioUrl) return
    
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `tts-output-${Date.now()}.wav`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Text Input and Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Text Input & Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-input">Text to synthesize</Label>
              <Textarea
                id="text-input"
                placeholder="Enter the text you want to convert to speech..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="text-sm text-slate-500">{text.length} characters</div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleGenerate} disabled={!text.trim() || isGenerating} className="flex-1">
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Generate Speech
                  </>
                )}
              </Button>

              <Button variant="outline" disabled={!audioUrl} onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Audio Preview */}
            <div className="bg-accent rounded-lg p-4">
              {!audioUrl ? (
                <div className="text-center ">
                  Audio preview will appear here after generation
                </div>
              ) : (
                <AudioPlayer audioUrl={audioUrl} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              TTS Provider Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProvider} onValueChange={(value: TTSProvider) => setSelectedProvider(value)}>
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