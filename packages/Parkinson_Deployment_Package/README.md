# Parkinson's Disease MRI Classification & Grad-CAM Package
Trained on 177 subjects (930 slices) across 3 cohorts (Dryad, OpenNeuro ds005892, OpenNeuro ds001907).

## Files
- `best_exp06_model.pth`: Trained EfficientNet-B0 weights.
- `parkinson_model.py`: Standalone script for preprocessing, prediction, and Grad-CAM.
- `requirements.txt`: Python package dependencies.

## Quickstart on your Local Computer

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Predict on any scan (3D NIfTI or 2D slice)
```bash
python parkinson_model.py --input scan.nii.gz --model best_exp06_model.pth --output report.png
```

### 3. Use in your own Python script
```python
from parkinson_model import load_parkinson_model, predict_and_visualize
model = load_parkinson_model('best_exp06_model.pth', device='cpu')
res = predict_and_visualize('patient_scan.nii.gz', model, device='cpu', output_image_path='report.png')
print('Diagnosis:', res['predicted_class'])
print('Confidence:', res['confidence_pct'], '%')
```
