import os
import sys
import logging
import json
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
from edge_tts_voices import SUPPORTED_VOICES
import asyncio
import soundfile as sf
import tempfile

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Get current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(current_dir, "models")
output_dir = os.path.join(current_dir, "output")

# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Initialize converter
from standalone_rvc_pack.voice_converter import StandaloneVoiceConverter
from standalone_rvc_pack.config import StandaloneConfig

config = StandaloneConfig()
converter = StandaloneVoiceConverter(config)
current_model = None

class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"
    pitch: str = "+0Hz"
    rate: str = "+0%"
    model_name: Optional[str] = None  # If provided, will run RVC after TTS
    f0_up_key: int = 0
    f0_method: str = "rmvpe"
    index_rate: float = 0.75
    filter_radius: int = 3
    resample_sr: int = 0
    rms_mix_rate: float = 0.25
    protect: float = 0.33

def get_available_models() -> List[Dict[str, str]]:
    """Get list of available RVC models"""
    models = []
    if os.path.exists(models_dir):
        for model_name in os.listdir(models_dir):
            model_dir = os.path.join(models_dir, model_name)
            if os.path.isdir(model_dir):
                # Look for .pth and .index files
                pth_file = None
                index_file = None
                for file in os.listdir(model_dir):
                    if file.endswith('.pth'):
                        pth_file = os.path.join(model_dir, file)
                    elif file.endswith('.index'):
                        index_file = os.path.join(model_dir, file)
                
                if pth_file:  # Only add if we found the .pth file
                    models.append({
                        "name": model_name,
                        "model_path": pth_file,
                        "index_path": index_file
                    })
    return models

def get_available_edge_models() -> List[Dict[str, str]]:
    return list(SUPPORTED_VOICES.keys())

@app.get("/status")
async def get_status():
    """Get RVC server status"""
    return JSONResponse(content={"running": True})

@app.get("/models")
async def list_models():
    """List available RVC models"""
    try:
        models = get_available_models()
        return JSONResponse(content={
            "models": models,
            "current_model": current_model
        })
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/edge-models")
async def list_edge_models():
    """List available Edge TTS models"""
    try:
        models = get_available_edge_models()
        return JSONResponse(content={
            "models": models
        })
    except Exception as e:
        logger.error(f"Error listing Edge TTS models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/load_model/{model_name}")
async def load_model(model_name: str):
    """Load an RVC model by name"""
    try:
        models = get_available_models()
        model_info = next((m for m in models if m["name"] == model_name), None)
        
        if not model_info:
            raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
            
        # Load the model
        converter.load_model(model_info["model_path"], model_info["index_path"])
        global current_model
        current_model = model_name
        
        return JSONResponse(content={
            "message": f"Model '{model_name}' loaded successfully",
            "model_info": model_info
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/convert")
async def convert_text(request: TTSRequest):
    """Convert text to speech using Edge TTS and optionally RVC"""
    try:
        # Generate filenames
        tts_output = os.path.join(output_dir, "tts_output.wav")
        rvc_output = os.path.join(output_dir, "rvc_output.wav")
        
        # Generate speech with Edge TTS
        communicate = edge_tts.Communicate(
            request.text, 
            request.voice
        )
        
        # Save TTS output
        await communicate.save(tts_output)
        
        # If no RVC model requested, return TTS output directly
        if not request.model_name:
            return FileResponse(
                tts_output,
                media_type="audio/wav",
                filename="output.wav"
            )
            
        # Load RVC model if needed
        if current_model != request.model_name:
            await load_model(request.model_name)
            
        # Convert voice with RVC
        info, audio_data = converter.convert_voice(
            tts_output,
            f0_up_key=request.f0_up_key,
            f0_method=request.f0_method,
            index_rate=request.index_rate,
            filter_radius=request.filter_radius,
            resample_sr=request.resample_sr,
            rms_mix_rate=request.rms_mix_rate,
            protect=request.protect
        )
        
        if audio_data[0] is None:
            raise HTTPException(status_code=500, detail=info)
            
        # Save RVC output
        sf.write(rvc_output, audio_data[1], audio_data[0])
        
        return FileResponse(
            rvc_output,
            media_type="audio/wav",
            filename="output.wav"
        )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting voice: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8001)
    
