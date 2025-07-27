import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ttsManager } from "@/lib/ttsManager";
import { RVCProvider } from "@/lib/tts/rvcProvider";
import { TTSVoice } from "@/lib/tts/gptsovitsProvider";

export default function RvcSettings() {
    const [rvcModels, setRvcModels] = useState<TTSVoice[]>([])
    const [selectedRvcModel, setSelectedRvcModel] = useState<string | null>(null)
    const [edgeModels, setEdgeModels] = useState<TTSVoice[]>([])
    const [selectedEdgeModel, setSelectedEdgeModel] = useState<string | null>(null)
    const provider = ttsManager.getCurrentProviderInstance() as RVCProvider;

    useEffect(() => {
        fetchRvcModels()
        fetchEdgeModels()
    }, [])

    const fetchRvcModels = async () => {
        try {
            const models = await provider.getVoices();
            setRvcModels(models);
            const currentModel = provider.getCurrentVoice();
            if (currentModel) {
                setSelectedRvcModel(currentModel);
            }
        } catch (error) {
            console.error('Failed to fetch RVC models:', error);
        }
    }

    const fetchEdgeModels = async () => {
        try {
            const models = await provider.getEdgeVoices();
            setEdgeModels(models);
            const currentEdgeVoice = provider.getCurrentEdgeVoice();
            if (currentEdgeVoice) {
                setSelectedEdgeModel(currentEdgeVoice);
            }
        } catch (error) {
            console.error('Failed to fetch Edge TTS models:', error);
        }
    }

    const handleRvcModelChange = async (modelName: string) => {
        try {
            await provider.setVoice(modelName);
            setSelectedRvcModel(modelName);
        } catch (error) {
            console.error('Failed to load RVC model:', error);
        }
    }

    const handleEdgeModelChange = (modelName: string) => {
        provider.setEdgeVoice(modelName);
        setSelectedEdgeModel(modelName);
    }

    return (
        <div className="space-y-2">
            <Card>
                <CardContent className="space-y-6">
                    <Label>RVC Model</Label>
                    <Select
                        value={selectedRvcModel || ''}
                        onValueChange={handleRvcModelChange}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select RVC Model" />
                        </SelectTrigger>
                        <SelectContent>
                            {rvcModels.map((model) => (
                                <SelectItem key={model.name} value={model.name}>
                                    {model.displayName || model.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Label>Edge TTS Model</Label>
                    <Select
                        value={selectedEdgeModel || ''}
                        onValueChange={handleEdgeModelChange}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select Edge TTS Model" />
                        </SelectTrigger>
                        <SelectContent>
                            {edgeModels.map((model) => (
                                <SelectItem key={model.name} value={model.name}>
                                    {model.displayName || model.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>
    )
}