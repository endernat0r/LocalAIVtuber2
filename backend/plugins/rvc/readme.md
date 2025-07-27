```
python -m venv venv
.\venv\Scripts\activate
pip install uv
uv pip install -r .\requirements.txt
uv pip install torch==2.4.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
```