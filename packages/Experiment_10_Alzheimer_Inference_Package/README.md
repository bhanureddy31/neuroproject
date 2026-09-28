# Alzheimer MRI — Experiment 10 Inference Package

## 1. Overview

This package contains the inference and explainability components for the Alzheimer MRI classification model developed in Experiment 10.

Model:
- Architecture: EfficientNet-B0
- Pretrained base: ImageNet
- Number of classes: 4
- Best checkpoint: Epoch 19
- Best validation loss: 0.0635246435548955

This package is intended for inference and integration with the application/Streamlit interface.
No model training is performed by these files.

## 2. Class Mapping

| Index | Class |
|------:|-------|
| 0 | NonDemented |
| 1 | VeryMildDemented |
| 2 | MildDemented |
| 3 | ModerateDemented |

The mapping is also available in `class_names.json`.

## 3. Input Preprocessing

Inference preprocessing:

1. Convert MRI to grayscale
2. Convert grayscale image to 3 channels
3. Resize to 224 x 224
4. Convert to tensor
5. Apply ImageNet normalization

ImageNet normalization:
- Mean: [0.485, 0.456, 0.406]
- Std: [0.229, 0.224, 0.225]

No training augmentation is applied during inference.

## 4. Package Files

### alzheimer_model.py

Contains EfficientNet-B0 construction, checkpoint loading, and class-name mapping.

Main functions:
- `build_model()`
- `load_model()`
- `get_class_name()`

### preprocessing.py

Contains the deterministic inference preprocessing pipeline.

Main function:
- `get_inference_transform()`

### predict_alzheimer.py

Runs inference on a single MRI image.

Main function:
- `predict_mri(image_path, checkpoint_path, device=None)`

Returns:
- Predicted class
- Confidence
- Class probabilities
- Checkpoint epoch

### gradcam_alzheimer.py

Generates a Grad-CAM explanation for an MRI.

Target layer:
- `model.features[-1]`

Grad-CAM visualizes regions that influenced the model prediction.
It is not a direct visualization of Alzheimer's disease lesions.

### class_names.json

Stores the four-class output mapping.

### requirements.txt

Contains the Python dependencies required by the package.

## 5. Basic Usage

### Load the model

```python
from alzheimer_model import load_model

model, checkpoint = load_model(
    'exp10_best_checkpoint.pt'
)
```

### Run prediction

```python
from predict_alzheimer import predict_mri

result = predict_mri(
    image_path='patient_mri.jpg',
    checkpoint_path='exp10_best_checkpoint.pt'
)

print(result['predicted_class'])
print(result['confidence'])
print(result['probabilities'])
```

### Generate Grad-CAM

```python
from gradcam_alzheimer import create_gradcam

result = create_gradcam(
    image_path='patient_mri.jpg',
    checkpoint_path='exp10_best_checkpoint.pt',
    output_path='gradcam_result.png'
)
```

## 6. Streamlit Integration

The Streamlit application can import `predict_mri()` for prediction and `create_gradcam()` for explainability.

The model provides:
- Predicted class
- Confidence
- Four-class probabilities

Grad-CAM additionally provides the explanation heatmap.

## 7. Checkpoint

The trained checkpoint is `exp10_best_checkpoint.pt`.

This is the Experiment 10 best checkpoint from Epoch 19.
The checkpoint should be treated as read-only.

## 8. Important Usage Note

The model output represents the model's classification prediction and confidence.
It should not be presented as a standalone clinical diagnosis.

Grad-CAM provides model interpretability and should not be described as a direct disease-lesion detector.

## 9. Verification

The package has been verified using the Experiment 10 Epoch-19 checkpoint, real MRI inference, four-class probability output, and Grad-CAM generation.

Example verification:
- Input: VeryMildDemented (1).jpg
- Prediction: VeryMildDemented
- Confidence: 99.36%
- Checkpoint: Epoch 19
- Grad-CAM: Successfully generated