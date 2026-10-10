"""
NeuroDiagnosis AI Clinical Inference Service
Executes genuine PyTorch inference and genuine Grad-CAM via backend/run_inference.py.
All simulated or coordinate-based heatmaps have been removed.
"""

import os
import sys
import json
import argparse
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
RUN_INFERENCE_SCRIPT = BACKEND_DIR / "run_inference.py"

def main():
    parser = argparse.ArgumentParser(description="NeuroDiagnosis Clinical AI Inference Service")
    parser.add_argument("--input", type=str, required=True, help="Path to input MRI scan slice or volume")
    parser.add_argument("--disease", type=str, choices=["alzheimer", "parkinson", "dual", "both"], default="alzheimer")
    parser.add_argument("--output", type=str, default="gradcam_report.png", help="Path to save Grad-CAM output")
    args = parser.parse_args()

    input_path = os.path.abspath(args.input)
    if not os.path.exists(input_path):
        print(f"Error: input file {input_path} does not exist", file=sys.stderr)
        sys.exit(1)

    mode = "dual" if args.disease in ["dual", "both"] else args.disease

    # Execute genuine inference engine
    import subprocess
    cmd = [sys.executable, str(RUN_INFERENCE_SCRIPT), "--image", input_path, "--mode", mode]
    res = subprocess.run(cmd, capture_output=True, text=True)

    if res.returncode != 0:
        print(f"Inference error:\n{res.stderr or res.stdout}", file=sys.stderr)
        sys.exit(res.returncode)

    stdout = res.stdout
    first_brace = stdout.find("{")
    last_brace = stdout.rfind("}")
    if first_brace == -1 or last_brace == -1:
        print(f"Could not parse inference JSON:\n{stdout}", file=sys.stderr)
        sys.exit(1)

    result = json.loads(stdout[first_brace:last_brace + 1])
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
