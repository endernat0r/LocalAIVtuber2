import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ttsManager } from "@/lib/ttsManager";
import { RVCProvider } from "@/lib/tts/rvcProvider";

export default function RvcSettings() {
    const [selectedRvcModel, setSelectedRvcModel] = useState<string | null>(null);
    const [selectedEdgeModel, setSelectedEdgeModel] = useState<string | null>(null);
    const [rvcModels, setRvcModels] = useState<string[]>([]);
    const [edgeModels, setEdgeModels] = useState<string[]>([]);
    const provider = ttsManager.getCurrentProviderInstance() as RVCProvider;

    useEffect(() => {
        // Initial state
        setRvcModels(provider.getVoices());
        setEdgeModels(provider.getEdgeVoices());
        setSelectedRvcModel(provider.getCurrentVoice());
        setSelectedEdgeModel(provider.getCurrentEdgeVoice());

        // Subscribe to changes
        const unsubscribe = provider.subscribe(() => {
            setRvcModels(provider.getVoices());
            setEdgeModels(provider.getEdgeVoices());
            setSelectedRvcModel(provider.getCurrentVoice());
            setSelectedEdgeModel(provider.getCurrentEdgeVoice());
        });

        return unsubscribe;
    }, [provider]);

    const handleRvcModelChange = async (modelName: string) => {
        try {
            await provider.setVoice(modelName);
        } catch (error) {
            console.error('Failed to load RVC model:', error);
        }
    }

    const handleEdgeModelChange = (modelName: string) => {
        provider.setEdgeVoice(modelName);
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
                                <SelectItem key={model} value={model}>
                                    {model}
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
                                <SelectItem key={model} value={model}>
                                    {model}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>
    )
}