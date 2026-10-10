"""
NeuroDiagnosis FastAPI Microservice for Remote Inference (Hugging Face / Render / Docker Deployment)
"""

import os
import sys
import tempfile
import json
import subprocess
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NeuroDiagnosis PyTorch Inference API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "NeuroDiagnosis PyTorch Inference Engine",
        "version": "1.0.0"
    }

@app.post("/predict")
async def predict(
    mriFile: UploadFile = File(...),
    mode: str = Form("dual"),
    patientData: str = Form(None)
):
    filename = mriFile.filename.lower() if mriFile.filename else "image.png"
    extension = ".nii.gz" if filename.endswith(".nii.gz") else os.path.splitext(filename)[1] or ".png"
    
    with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as temp_file:
        content = await mriFile.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        script_path = os.path.join(os.path.dirname(__file__), "run_inference.py")
        python_exec = sys.executable
        cmd = [python_exec, script_path, "--image", temp_path, "--mode", mode]
        
        res = subprocess.run(cmd, capture_output=True, text=True)
        stdout = res.stdout
        
        first_brace = stdout.find("{")
        last_brace = stdout.rfind("}")
        if first_brace == -1 or last_brace == -1:
            raise HTTPException(
                status_code=500,
                detail=f"Inference output parse error. Stderr: {res.stderr or stdout}"
            )
            
        py_output = json.loads(stdout[first_brace:last_brace + 1])
        return py_output
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
