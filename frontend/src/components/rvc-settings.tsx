import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface RvcModel {
    name: string;
    model_path: string;
    index_path: string | null;
}

export default function RvcSettings() {
    // RVC specific states
    const [rvcModels, setRvcModels] = useState<string[]>([])
    const [selectedRvcModel, setSelectedRvcModel] = useState<string>("")
    const [isRvcServerRunning, setIsRvcServerRunning] = useState(false)
    const [edgeModels, setEdgeModels] = useState<string[]>([])
    const [selectedEdgeModel, setSelectedEdgeModel] = useState<string>("")

    useEffect(() => {
        checkRvcServerStatus()
        fetchRvcModels()
        fetchEdgeModels()

        // Poll server status every 5 seconds
        // const interval = setInterval(checkRvcServerStatus, 5000)
        // return () => clearInterval(interval)
    }, [])

    const checkRvcServerStatus = async () => {
        try {
            const response = await fetch('/api/rvc/status')
            const data = await response.json()
            setIsRvcServerRunning(data.running)
        } catch (error) {
            console.error('Failed to check RVC server status:', error)
            setIsRvcServerRunning(false)
        }
    }

    const fetchRvcModels = async () => {
        try {
            const response = await fetch('/api/rvc/models')
            const data = await response.json()
            setRvcModels(data.models.map((model: RvcModel) => model.name) || [])
            if (data.current_model) {
                setSelectedRvcModel(data.current_model)
            }
        } catch (error) {
            console.error('Failed to fetch RVC models:', error)
        }
    }

    const fetchEdgeModels = async () => {
        try {
            const response = await fetch('/api/rvc/edge-models')
            const data = await response.json()
            setEdgeModels(data.models || [])
        } catch (error) {
            console.error('Failed to fetch Edge TTS models:', error)
        }
    }

    const handleRvcModelChange = async (modelName: string) => {
        try {
            const response = await fetch(`/api/rvc/load_model/${modelName}`, {
                method: 'POST'
            })
            const data = await response.json()
            if (response.ok) {
                setSelectedRvcModel(modelName)
            } else {
                console.error(data.error || 'Failed to load RVC model')
            }
        } catch (error) {
            console.error('Failed to load RVC model:', error)
        }
    }

    return (
        <div className="space-y-2">
            <Card>
                {/* <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        RVC Settings
                        <Badge variant={isRvcServerRunning ? "default" : "destructive"}>
                            {isRvcServerRunning ? "Server Running" : "Server Not Running"}
                        </Badge>
                    </CardTitle>
                </CardHeader> */}
                <CardContent className="space-y-6">
                    {isRvcServerRunning && (
                        <>
                            <Label>RVC Model</Label>
                            <Select
                                value={selectedRvcModel}
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
                                value={selectedEdgeModel}
                                onValueChange={setSelectedEdgeModel}
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
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}