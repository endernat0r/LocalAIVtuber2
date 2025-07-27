import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Power } from "lucide-react";

export default function RvcSettings() {
    // RVC specific states
    const [rvcModels, setRvcModels] = useState<string[]>([])
    const [selectedRvcModel, setSelectedRvcModel] = useState<string>("")
    const [isRvcServerRunning, setIsRvcServerRunning] = useState(false)
    const [isStartingServer, setIsStartingServer] = useState(false)

    useEffect(() => {
        checkRvcServerStatus()
        fetchRvcModels()
    }, [])

    const checkRvcServerStatus = async () => {
        try {
            const response = await fetch('http://localhost:8001/status')
            const data = await response.json()
            setIsRvcServerRunning(data.running)
        } catch (error) {
            console.error('Failed to check RVC server status:', error)
            setIsRvcServerRunning(false)
        }
    }

    const fetchRvcModels = async () => {
        try {
            const response = await fetch('http://localhost:8001/models')
            const data = await response.json()
            setRvcModels(data.models || [])
            if (data.current_model) {
                setSelectedRvcModel(data.current_model)
            }
        } catch (error) {
            console.error('Failed to fetch RVC models:', error)
        }
    }

    const toggleRvcServer = async () => {
        setIsStartingServer(true)
        try {
            const endpoint = isRvcServerRunning ? '/api/rvc/stop' : '/api/rvc/start'
            const response = await fetch(endpoint, { method: 'POST' })
            const data = await response.json()

            if (response.ok) {
                setIsRvcServerRunning(!isRvcServerRunning)
                if (!isRvcServerRunning) {
                    // If we just started the server, fetch models
                    await fetchRvcModels()
                }
            } else {
                console.error(data.error || 'Failed to toggle RVC server')
            }
        } catch (error) {
            console.error('Failed to toggle RVC server:', error)
        } finally {
            setIsStartingServer(false)
        }
    }

    const handleRvcModelChange = async (modelName: string) => {
        try {
            const response = await fetch(`/api/rvc/server/load_model/${modelName}`, {
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
                <CardHeader>
                    <CardTitle>RVC Settings</CardTitle>
                    <CardDescription>Configure Real-time Voice Conversion parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Server Control */}
                    <div className="flex items-center justify-between">
                        <Label>RVC Server Status</Label>
                        <Button
                            variant={isRvcServerRunning ? "destructive" : "default"}
                            onClick={toggleRvcServer}
                            disabled={isStartingServer}
                        >
                            {isStartingServer ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Power className="h-4 w-4 mr-2" />
                                    {isRvcServerRunning ? "Stop Server" : "Start Server"}
                                </>
                            )}
                        </Button>
                    </div>

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
                </CardContent>
            </Card>

        </div>
    )
}