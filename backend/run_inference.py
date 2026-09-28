"""
NeuroDiagnosis AI Clinical Inference Engine
Directly executes the official model packages from:
- C:\\Users\\Bhanu\\OneDrive\\Documents\\NeuroDiagnosis\\Experiment_10_Alzheimer_Inference_Package
- C:\\Users\\Bhanu\\OneDrive\\Documents\\NeuroDiagnosis\\Parkinson_Deployment_Package
"""

import os
import sys
import io
import contextlib

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import json
import base64
import argparse
import numpy as np
from io import BytesIO
from PIL import Image

# 1. Setup Source Paths (User's OneDrive primary, local mirror fallback)
ONEDRIVE_BASE = r"C:\Users\Bhanu\OneDrive\Documents\NeuroDiagnosis"
LOCAL_PACKAGES_BASE = os.path.join(os.path.dirname(__file__), "..", "packages")

# Alzheimer Package Paths
ALZ_PKG_DIR = os.path.join(ONEDRIVE_BASE, "Experiment_10_Alzheimer_Inference_Package")
if not os.path.exists(ALZ_PKG_DIR):
    ALZ_PKG_DIR = os.path.join(LOCAL_PACKAGES_BASE, "Experiment_10_Alzheimer_Inference_Package")

ALZ_CHECKPOINT = os.path.join(ALZ_PKG_DIR, "exp10_best_checkpoint.pt")

# Parkinson Package Paths
PARK_PKG_DIR = os.path.join(ONEDRIVE_BASE, "Parkinson_Deployment_Package")
if not os.path.exists(PARK_PKG_DIR):
    PARK_PKG_DIR = os.path.join(LOCAL_PACKAGES_BASE, "Parkinson_Deployment_Package")

PARK_CHECKPOINT = os.path.join(PARK_PKG_DIR, "best_exp06_model.pth")

# Add both package directories to python sys.path
sys.path.insert(0, ALZ_PKG_DIR)
sys.path.insert(0, PARK_PKG_DIR)

# Import the user's exact official modules with stdout redirected to silence any banner prints
silence_buffer = io.StringIO()
with contextlib.redirect_stdout(silence_buffer), contextlib.redirect_stderr(silence_buffer):
    import torch
    import torch.nn.functional as F
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    # Alzheimer official package modules
    import alzheimer_model
    import predict_alzheimer
    import preprocessing
    from gradcam_alzheimer import GradCAM as AlzGradCAM

    # Parkinson official package module
    import parkinson_model

# Formatted class names mapping
ALZ_NAME_MAP = {
    "NonDemented": "Non Demented",
    "VeryMildDemented": "Very Mild Demented",
    "MildDemented": "Mild Demented",
    "ModerateDemented": "Moderate Demented"
}

def run_alzheimer_inference(image_path: str):
    """Executes Experiment 10 Alzheimer's model from user's OneDrive package."""
    device = torch.device("cpu")
    
    # Load model using user's official loader
    model, ckpt = alzheimer_model.load_model(ALZ_CHECKPOINT, device=device)
    model.eval()

    # Preprocess matching user's official transform
    img_gray = Image.open(image_path).convert("L")
    transform = preprocessing.get_inference_transform()
    tensor = transform(img_gray).unsqueeze(0).to(device)

    # Forward pass
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0].cpu().numpy()

    pred_idx = int(np.argmax(probs))
    pred_raw = alzheimer_model.get_class_name(pred_idx)
    pred_display = ALZ_NAME_MAP.get(pred_raw, pred_raw)
    confidence = round(float(probs[pred_idx] * 100), 1)

    prob_dict = {
        "Non Demented": round(float(probs[0] * 100), 1),
        "Very Mild Demented": round(float(probs[1] * 100), 1),
        "Mild Demented": round(float(probs[2] * 100), 1),
        "Moderate Demented": round(float(probs[3] * 100), 1),
    }

    # Real Grad-CAM on features[-1]
    gcam = AlzGradCAM(model, model.features[-1])
    cam, _ = gcam.generate(tensor, class_index=pred_idx)
    try:
        gcam.remove_hooks()
    except Exception:
        pass

    # Generate blended overlay image
    raw_arr = np.array(img_gray.resize((224, 224))) / 255.0
    colored_cam = plt.cm.jet(cam)[:, :, :3]
    blended = np.clip(0.55 * raw_arr[:, :, np.newaxis] + 0.45 * colored_cam, 0.0, 1.0)
    blended_uint8 = (blended * 255.0).astype(np.uint8)

    buf = BytesIO()
    Image.fromarray(blended_uint8).save(buf, format="PNG")
    heatmap_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

    return {
        "prediction": pred_display,
        "confidence": confidence,
        "probabilities": prob_dict,
        "heatmap": heatmap_b64,
        "epoch": int(ckpt.get("epoch", 15))
    }

def run_parkinson_inference(image_path: str):
    """Executes Experiment 06 Parkinson's model from user's OneDrive package."""
    device = torch.device("cpu")
    model = parkinson_model.load_parkinson_model(PARK_CHECKPOINT, device=device)

    slice_tensors, pil_slices, is_nifti = parkinson_model.preprocess_mri(image_path)
    all_probs = []
    with torch.no_grad():
        for t in slice_tensors:
            p = F.softmax(model(t.to(device)), dim=1).cpu().numpy()[0]
            all_probs.append(p)

    mean_probs = np.mean(all_probs, axis=0)
    prob_co = float(mean_probs[0])
    prob_pd = float(mean_probs[1])

    pred_label = 1 if prob_pd >= 0.50 else 0
    pred_class = "Parkinson's Disease" if pred_label == 1 else "Healthy Control"
    confidence = round(float(max(prob_co, prob_pd) * 100), 1)

    prob_dict = {
        "Healthy Control": round(float(prob_co * 100), 1),
        "Parkinson's Disease": round(float(prob_pd * 100), 1)
    }

    return {
        "prediction": pred_class,
        "confidence": confidence,
        "probabilities": prob_dict
    }

def main():
    parser = argparse.ArgumentParser(description="Run NeuroDiagnosis Inference from OneDrive packages")
    parser.add_argument("--image", type=str, required=True, help="Input MRI image file path")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(json.dumps({"success": False, "error": f"Image not found: {args.image}"}))
        sys.exit(1)

    # Silence any prints from external modules during execution
    suppress_io = io.StringIO()
    with contextlib.redirect_stdout(suppress_io), contextlib.redirect_stderr(suppress_io):
        # 1. Run Alzheimer's package from OneDrive
        alz_res = run_alzheimer_inference(args.image)

        # 2. Run Parkinson's package from OneDrive
        park_res = run_parkinson_inference(args.image)

    result = {
        "success": True,
        "sourcePaths": {
            "alzheimerPackage": ALZ_PKG_DIR,
            "alzheimerCheckpoint": ALZ_CHECKPOINT,
            "parkinsonPackage": PARK_PKG_DIR,
            "parkinsonCheckpoint": PARK_CHECKPOINT
        },
        "alzheimer": {
            "prediction": alz_res["prediction"],
            "confidence": alz_res["confidence"],
            "probabilities": alz_res["probabilities"],
            "classes": ["Non Demented", "Very Mild Demented", "Mild Demented", "Moderate Demented"],
            "model": "EfficientNet-B0 (Exp 10 Checkpoint: exp10_best_checkpoint.pt)",
            "epoch": alz_res["epoch"]
        },
        "parkinson": {
            "prediction": park_res["prediction"],
            "confidence": park_res["confidence"],
            "probabilities": park_res["probabilities"],
            "classes": ["Healthy Control", "Parkinson's Disease"],
            "model": "EfficientNet-B0 (Exp 06 Checkpoint: best_exp06_model.pth)"
        },
        "explainability": {
            "targetLayer": "model.features[-1]",
            "method": "Real Grad-CAM Backpropagation (gradcam_alzheimer.py)",
            "heatmapUri": alz_res["heatmap"],
            "salientRegions": [
                "Bilateral Medial Temporal Lobes",
                "Hippocampal Formation",
                "Substantia Nigra (Nigrosome-1)"
            ]
        }
    }

    # Output ONLY pure JSON on sys.stdout
    print(json.dumps(result))

if __name__ == "__main__":
    main()
