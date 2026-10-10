"""
NeuroDiagnosis AI Clinical Inference Engine

Local/repository inference backend.

Alzheimer:
    - Uses the Experiment 10 inference package/checkpoint in this repository.
    - Input: image file.

Parkinson:
    - Uses the frozen Exp06 deployment checkpoint in this repository.
    - Input: raw NIfTI (.nii / .nii.gz).
    - Frozen preprocessing:
        canonical orientation
        1 mm isotropic resampling
        1-99 percentile subject-wise normalization
        anatomical-center detection
        slices at [-10, -5, 0, +5, +10] mm
        np.rot90
        224x224 resize
    - Subject prediction = mean of five slice PD probabilities.
    - Real Grad-CAM target layer = model.features[8].

Important:
    No synthetic MRI.
    No fabricated prediction fallback.
    If inference fails, the script returns success=False.
"""

import argparse
import base64
import io
import json
import os
import sys
import traceback

import numpy as np
import torch
import torch.nn as nn
import nibabel as nib

from PIL import Image
from scipy.ndimage import zoom
from torchvision import models, transforms


# ---------------------------------------------------------------------
# Windows UTF-8
# ---------------------------------------------------------------------

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


# ---------------------------------------------------------------------
# Repository paths
# ---------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)

PACKAGES_DIR = os.path.join(REPO_ROOT, "packages")
MODELS_DIR = os.path.join(REPO_ROOT, "models")


# ---------------------------------------------------------------------
# Parkinson deployment configuration
# ---------------------------------------------------------------------

PARKINSON_PACKAGE = os.path.join(
    PACKAGES_DIR,
    "Parkinson_Deployment_Package",
)

PARKINSON_CHECKPOINT = os.path.join(
    PARKINSON_PACKAGE,
    "best_exp06_model.pth",
)

PARKINSON_CONFIG = os.path.join(
    PARKINSON_PACKAGE,
    "deployment_config.json",
)

PARKINSON_CLASSES = {
    0: "CO",
    1: "PD",
}

PARKINSON_SLICE_OFFSETS_MM = [-10, -5, 0, 5, 10]

TARGET_SPACING = (1.0, 1.0, 1.0)
TARGET_SIZE = (224, 224)

LOWER_PERCENTILE = 1
UPPER_PERCENTILE = 99

TISSUE_THRESHOLD = 0.20


# ---------------------------------------------------------------------
# Device
# ---------------------------------------------------------------------

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ---------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------

def is_nifti_file(path):
    path_lower = path.lower()
    return path_lower.endswith(".nii") or path_lower.endswith(".nii.gz")


def load_json(path):
    if not os.path.exists(path):
        return None

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------
# Parkinson preprocessing
# ---------------------------------------------------------------------

def canonicalize_nifti(path):
    """
    Load NIfTI and convert it to closest canonical orientation.
    """
    img = nib.load(path)
    canonical_img = nib.as_closest_canonical(img)

    data = canonical_img.get_fdata(dtype=np.float32)

    spacing = tuple(float(x) for x in canonical_img.header.get_zooms()[:3])

    return data, spacing


def resample_to_1mm(data, spacing):
    """
    Resample the volume to 1 mm isotropic spacing.
    """
    spacing = np.asarray(spacing, dtype=np.float32)

    zoom_factors = spacing / np.asarray(
        TARGET_SPACING,
        dtype=np.float32,
    )

    if np.allclose(zoom_factors, 1.0, atol=1e-3):
        return data.astype(np.float32)

    return zoom(
        data,
        zoom=zoom_factors,
        order=1,
    ).astype(np.float32)


def normalize_intensity(data):
    """
    Subject-wise 1-99 percentile normalization.

    Only non-zero voxels are used to calculate percentile limits.
    """
    data = np.asarray(data, dtype=np.float32)

    nonzero = data[data != 0]

    if nonzero.size == 0:
        raise ValueError("MRI volume contains no non-zero voxels.")

    low = np.percentile(
        nonzero,
        LOWER_PERCENTILE,
    )

    high = np.percentile(
        nonzero,
        UPPER_PERCENTILE,
    )

    if high <= low:
        normalized = np.zeros_like(data, dtype=np.float32)
        normalized[data != 0] = 1.0
        return normalized

    normalized = (data - low) / (high - low)

    normalized = np.clip(
        normalized,
        0.0,
        1.0,
    )

    normalized[data == 0] = 0.0

    return normalized.astype(np.float32)


def find_anatomical_center(data_norm):
    """
    Find the anatomical center using the frozen tissue threshold.

    The threshold is 20% of the normalized maximum.
    """
    threshold = TISSUE_THRESHOLD

    tissue = data_norm > threshold

    if not np.any(tissue):
        raise ValueError(
            "Unable to find anatomical center: "
            "no tissue voxels passed the threshold."
        )

    coords = np.argwhere(tissue)

    center = np.mean(coords, axis=0)

    center_z = int(round(float(center[2])))

    return center_z


def resize_slice(slice_2d):
    """
    Rotate using the frozen np.rot90 operation,
    then resize to 224x224 using bilinear interpolation,
    then convert to uint8.
    """
    slice_2d = np.asarray(
        slice_2d,
        dtype=np.float32,
    )

    slice_2d = np.rot90(slice_2d)

    slice_2d = np.clip(
        slice_2d,
        0.0,
        1.0,
    )

    image_uint8 = (
        slice_2d * 255.0
    ).astype(np.uint8)

    image = Image.fromarray(
        image_uint8,
        mode="L",
    )

    image = image.resize(
        TARGET_SIZE,
        Image.Resampling.BILINEAR,
    )

    return np.asarray(
        image,
        dtype=np.uint8,
    )


def preprocess_parkinson_nifti(path):
    """
    Complete frozen Parkinson preprocessing.

    Returns:
        slices_uint8:
            list of five 224x224 uint8 slices

        metadata:
            preprocessing information
    """
    data, spacing = canonicalize_nifti(path)

    data = resample_to_1mm(
        data,
        spacing,
    )

    data_norm = normalize_intensity(data)

    center_z = find_anatomical_center(
        data_norm,
    )

    z_indices = [
        center_z + offset
        for offset in PARKINSON_SLICE_OFFSETS_MM
    ]

    depth = data_norm.shape[2]

    if min(z_indices) < 0 or max(z_indices) >= depth:
        raise ValueError(
            "Requested Parkinson slice positions are outside "
            f"the resampled volume. "
            f"center_z={center_z}, depth={depth}, "
            f"z_indices={z_indices}"
        )

    slices = []

    for z in z_indices:
        slice_2d = data_norm[:, :, z]

        slice_uint8 = resize_slice(
            slice_2d,
        )

        slices.append(slice_uint8)

    metadata = {
        "original_spacing": list(spacing),
        "target_spacing": list(TARGET_SPACING),
        "resampled_shape": list(data_norm.shape),
        "center_z": center_z,
        "z_indices": z_indices,
        "slice_offsets_mm": PARKINSON_SLICE_OFFSETS_MM,
    }

    return slices, metadata


# ---------------------------------------------------------------------
# Parkinson model
# ---------------------------------------------------------------------

def create_parkinson_model():
    """
    Create the exact EfficientNet-B0 architecture used by
    the deployment checkpoint.
    """
    model = models.efficientnet_b0(
        weights=None,
    )

    in_features = model.classifier[1].in_features

    model.classifier[1] = nn.Linear(
        in_features,
        2,
    )

    checkpoint = torch.load(
        PARKINSON_CHECKPOINT,
        map_location="cpu",
    )

    if "model_state_dict" not in checkpoint:
        raise ValueError(
            "Parkinson checkpoint does not contain "
            "'model_state_dict'."
        )

    model.load_state_dict(
        checkpoint["model_state_dict"],
        strict=True,
    )

    model.to(DEVICE)

    model.eval()

    return model, checkpoint


# ---------------------------------------------------------------------
# Image preprocessing for EfficientNet
# ---------------------------------------------------------------------

IMAGENET_TRANSFORM = transforms.Compose(
    [
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[
                0.485,
                0.456,
                0.406,
            ],
            std=[
                0.229,
                0.224,
                0.225,
            ],
        ),
    ]
)


def prepare_slice_for_model(slice_uint8):
    """
    Convert grayscale MRI slice into a 3-channel tensor.
    """
    image = Image.fromarray(
        slice_uint8,
        mode="L",
    )

    image_rgb = image.convert("RGB")

    tensor = IMAGENET_TRANSFORM(
        image_rgb,
    )

    return tensor


# ---------------------------------------------------------------------
# Real Grad-CAM
# ---------------------------------------------------------------------

class GradCAM:
    """
    Minimal real Grad-CAM implementation.
    """

    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer

        self.activations = None
        self.gradients = None

        self.forward_handle = target_layer.register_forward_hook(
            self._forward_hook
        )

        self.backward_handle = target_layer.register_full_backward_hook(
            self._backward_hook
        )

    def _forward_hook(
        self,
        module,
        inputs,
        output,
    ):
        self.activations = output

    def _backward_hook(
        self,
        module,
        grad_input,
        grad_output,
    ):
        self.gradients = grad_output[0]

    def generate(
        self,
        input_tensor,
        target_class,
    ):
        self.model.zero_grad(
            set_to_none=True
        )
        output = self.model(
            input_tensor
        )
        score = output[:, target_class].sum()
        score.backward()
        activations = self.activations
        gradients = self.gradients
        if activations is None or gradients is None:
            raise RuntimeError(
                "Grad-CAM hooks did not capture "
                "activations/gradients."
            )
        weights = gradients.mean(
            dim=(2, 3),
            keepdim=True,
        )
        cam = (
            weights * activations
        ).sum(
            dim=1,
        )
        cam = torch.relu(
            cam
        )
        cam = cam.detach().cpu().numpy()
        cam = cam[0]
        cam_min = cam.min()
        cam_max = cam.max()
        if cam_max > cam_min:
            cam = (
                cam - cam_min
            ) / (
                cam_max - cam_min
            )
        else:
            cam = np.zeros_like(
                cam,
                dtype=np.float32,
            )
        return cam.astype(
            np.float32
        )
    def close(self):
        self.forward_handle.remove()
        self.backward_handle.remove()
# ---------------------------------------------------------------------
# Parkinson inference
# ---------------------------------------------------------------------
def run_parkinson_inference(path):
    """
    Run the complete Parkinson pipeline:
        raw NIfTI
        -> preprocessing
        -> five slices
        -> EfficientNet
        -> subject aggregation
        -> real Grad-CAM
    """
    if not os.path.exists(PARKINSON_CHECKPOINT):
        raise FileNotFoundError(
            "Parkinson deployment checkpoint not found: "
            f"{PARKINSON_CHECKPOINT}"
        )

    slices, preprocessing_metadata = preprocess_parkinson_nifti(
        path
    )

    model, checkpoint = create_parkinson_model()

    tensors = [
        prepare_slice_for_model(slice_img)
        for slice_img in slices
    ]

    batch = torch.stack(
        tensors,
        dim=0,
    ).to(DEVICE)

    with torch.no_grad():
        logits = model(batch)
        probabilities = torch.softmax(
            logits,
            dim=1,
        )

    probabilities_np = (
        probabilities
        .detach()
        .cpu()
        .numpy()
    )

    pd_probabilities = probabilities_np[:, 1]

    mean_pd_probability = float(
        np.mean(
            pd_probabilities
        )
    )

    predicted_class = int(
        mean_pd_probability >= 0.5
    )

    predicted_label = PARKINSON_CLASSES[
        predicted_class
    ]

    # -------------------------------------------------------------
    # Real Grad-CAM
    # Verified target layer:
    # model.features[8]
    # -------------------------------------------------------------

    target_layer = model.features[8]

    gradcam = GradCAM(
        model,
        target_layer,
    )

    gradcam_results = []

    try:
        for index in range(len(slices)):
            single_tensor = (
                tensors[index]
                .unsqueeze(0)
                .to(DEVICE)
            )

            slice_class = int(
                probabilities_np[index].argmax()
            )

            cam = gradcam.generate(
                single_tensor,
                slice_class,
            )

            gradcam_results.append(
                {
                    "slice_index": index,
                    "target_class": slice_class,
                    "target_label": PARKINSON_CLASSES[
                        slice_class
                    ],
                    "cam_shape": list(
                        cam.shape
                    ),
                    "cam_min": float(
                        cam.min()
                    ),
                    "cam_max": float(
                        cam.max()
                    ),
                    "cam": cam.tolist(),
                }
            )

    finally:
        gradcam.close()

    slice_results = []

    for index, offset in enumerate(
        PARKINSON_SLICE_OFFSETS_MM
    ):
        co_probability = float(
            probabilities_np[index, 0]
        )

        pd_probability = float(
            probabilities_np[index, 1]
        )
        slice_results.append(
            {
                "slice_index": index,
                "offset_mm": offset,
                "co_probability": co_probability,
                "pd_probability": pd_probability,
                "prediction": PARKINSON_CLASSES[
                    int(
                        probabilities_np[index].argmax()
                    )
                ],
            }
        )
        # Central preprocessed MRI slice used for the
        # corresponding real Grad-CAM visualization.
        central_slice = Image.fromarray(
            slices[2],
            mode="L",
        ).convert("RGB")
        # -----------------------------------------------------------------
        # Render the real central-slice Grad-CAM as a heatmap overlay.
        #
        # gradcam_results[2]["cam"] contains the actual Grad-CAM generated
        # from model.features[8] for the central slice.
        # -----------------------------------------------------------------
        central_cam = np.asarray(
            gradcam_results[2]["cam"],
            dtype=np.float32,
        )

        # Resize the real Grad-CAM feature map to the 224x224
        # displayed MRI slice.
        central_cam_image = Image.fromarray(
            (central_cam * 255.0)
            .clip(0, 255)
            .astype(np.uint8),
            mode="L",
        )

        central_cam_image = central_cam_image.resize(
            central_slice.size,
            Image.Resampling.BILINEAR,
        )

        cam_pixels = np.asarray(
            central_cam_image,
            dtype=np.float32,
        ) / 255.0

        # Create a colored heatmap from the real Grad-CAM values.
        heatmap_array = np.zeros(
            (
                cam_pixels.shape[0],
                cam_pixels.shape[1],
                3,
            ),
            dtype=np.uint8,
        )

        low_mask = cam_pixels < 0.25
        mid_low_mask = (
            (cam_pixels >= 0.25)
            & (cam_pixels < 0.5)
        )
        mid_high_mask = (
            (cam_pixels >= 0.5)
            & (cam_pixels < 0.75)
        )
        high_mask = cam_pixels >= 0.75

        # Blue -> cyan
        value = cam_pixels[low_mask]
        heatmap_array[low_mask, 0] = 0
        heatmap_array[low_mask, 1] = (
            value * 4 * 180
        ).clip(0, 255).astype(np.uint8)
        heatmap_array[low_mask, 2] = (
            255 - value * 4 * 100
        ).clip(0, 255).astype(np.uint8)

        # Cyan -> yellow
        value = cam_pixels[mid_low_mask]
        t = (value - 0.25) * 4
        heatmap_array[mid_low_mask, 0] = 0
        heatmap_array[mid_low_mask, 1] = (
            180 + 75 * t
        ).clip(0, 255).astype(np.uint8)
        heatmap_array[mid_low_mask, 2] = (
            155 - 155 * t
        ).clip(0, 255).astype(np.uint8)

        # Yellow -> red
        value = cam_pixels[mid_high_mask]
        t = (value - 0.5) * 4
        heatmap_array[mid_high_mask, 0] = (
            255 * t
        ).clip(0, 255).astype(np.uint8)
        heatmap_array[mid_high_mask, 1] = 255
        heatmap_array[mid_high_mask, 2] = 0

        # Red
        value = cam_pixels[high_mask]
        t = (value - 0.75) * 4
        heatmap_array[high_mask, 0] = 255
        heatmap_array[high_mask, 1] = (
            255 - 255 * t
        ).clip(0, 255).astype(np.uint8)
        heatmap_array[high_mask, 2] = 0

        heatmap_rgb = Image.fromarray(
            heatmap_array,
            mode="RGB",
        )

        # Blend the actual MRI with the actual Grad-CAM.
        gradcam_overlay = Image.blend(
            central_slice,
            heatmap_rgb,
            alpha=0.42,
        )

        # Encode the real Grad-CAM overlay as a data URL.
        overlay_buffer = io.BytesIO()

        gradcam_overlay.save(
            overlay_buffer,
            format="PNG",
        )

        gradcam_heatmap_base64 = base64.b64encode(
            overlay_buffer.getvalue()
        ).decode("utf-8")

        # Also keep the original central MRI slice.
        buffer = io.BytesIO()

        central_slice.save(
            buffer,
            format="PNG",
        )

        central_slice_base64 = base64.b64encode(
            buffer.getvalue()
        ).decode("utf-8")

    return {
        "success": True,
        "model": "EfficientNet-B0",
        "experiment": "Experiment 06 Domain-Robust",
        "checkpoint": os.path.relpath(
            PARKINSON_CHECKPOINT,
            REPO_ROOT,
        ),
        "device": str(DEVICE),
        "prediction": predicted_label,
        "class_index": predicted_class,
        "probabilities": {
            "CO": float(
                1.0 - mean_pd_probability
            ),
            "PD": mean_pd_probability,
        },
        "aggregation": {
            "method": "mean_pd_probability",
            "slice_count": 5,
            "threshold": 0.5,
        },
        "preprocessing": preprocessing_metadata,
        "slice_results": slice_results,
                "explainability": {
            "method": "Grad-CAM",
            "target_layer": "model.features[8]",
            "display_slice_index": 2,
            "display_slice_offset_mm": 0,
            "display_slice": (
                "data:image/png;base64,"
                + central_slice_base64
            ),
            "heatmapUrl": (
                "data:image/png;base64,"
                + gradcam_heatmap_base64
            ),
            "results": gradcam_results,
        },
        "checkpoint_metadata": {
            "epoch": checkpoint.get(
                "epoch"
            ),
            "best_val_sub_f1": checkpoint.get(
                "best_val_sub_f1"
            ),
            "val_sub_acc": checkpoint.get(
                "val_sub_acc"
            ),
            "val_sub_bal_acc": checkpoint.get(
                "val_sub_bal_acc"
            ),
        },
        "medical_use": (
            "AI MRI classification/research decision support; "
            "not clinically validated for diagnosis."
        ),
    }


# ---------------------------------------------------------------------
# Alzheimer inference
# ---------------------------------------------------------------------
def generate_alzheimer_gradcam(model, input_tensor, target_class, display_image):
    """
    Generate a real Grad-CAM visualization from the Alzheimer
    EfficientNet-B0 model.

    This uses the model's final convolutional feature block:
    model.features[-1]
    """

    activations = None
    gradients = None

    target_layer = model.features[-1]

    def forward_hook(module, inputs, output):
        nonlocal activations
        activations = output

    def backward_hook(module, grad_input, grad_output):
        nonlocal gradients
        gradients = grad_output[0]

    forward_handle = target_layer.register_forward_hook(
        forward_hook
    )

    backward_handle = target_layer.register_full_backward_hook(
        backward_hook
    )

    try:
        model.zero_grad(set_to_none=True)

        logits = model(input_tensor)

        target_score = logits[:, target_class].sum()

        target_score.backward()

        if activations is None or gradients is None:
            raise RuntimeError(
                "Grad-CAM activation or gradient was not captured."
            )

        # Global-average-pool gradients to obtain channel weights.
        weights = gradients.mean(
            dim=(2, 3),
            keepdim=True
        )

        # Weighted combination of feature maps.
        cam = (weights * activations).sum(
            dim=1,
            keepdim=True
        )

        # Grad-CAM uses the positive contribution.
        cam = torch.relu(cam)

        # Normalize to [0, 1].
        cam_min = cam.min()
        cam_max = cam.max()

        if (cam_max - cam_min).abs().item() > 1e-8:
            cam = (
                cam - cam_min
            ) / (
                cam_max - cam_min
            )
        else:
            cam = torch.zeros_like(cam)

        # Resize the CAM to the original displayed image size.
        display_width, display_height = display_image.size

        cam = torch.nn.functional.interpolate(
            cam,
            size=(display_height, display_width),
            mode="bilinear",
            align_corners=False,
        )

        cam_array = (
            cam[0, 0]
            .detach()
            .cpu()
            .numpy()
        )

        # Convert the grayscale MRI to RGB.
        base_image = display_image.convert("RGB")

        # Create a smooth heatmap using PIL.
        heatmap_array = (
            (cam_array * 255.0)
            .clip(0, 255)
            .astype("uint8")
        )

        heatmap_gray = Image.fromarray(
            heatmap_array,
            mode="L"
        )

        # Build a red/yellow heatmap from the CAM intensity.
        heatmap_rgb = Image.new(
            "RGB",
            base_image.size,
            (0, 0, 0)
        )

        heatmap_pixels = heatmap_gray.load()
        output_pixels = heatmap_rgb.load()

        for y in range(display_height):
            for x in range(display_width):
                value = heatmap_pixels[x, y] / 255.0

                # Blue -> cyan -> yellow -> red style mapping.
                if value < 0.25:
                    r = 0
                    g = int(value * 4 * 180)
                    b = int(255 - value * 4 * 100)
                elif value < 0.5:
                    t = (value - 0.25) * 4
                    r = 0
                    g = int(180 + 75 * t)
                    b = int(155 - 155 * t)
                elif value < 0.75:
                    t = (value - 0.5) * 4
                    r = int(255 * t)
                    g = 255
                    b = 0
                else:
                    t = (value - 0.75) * 4
                    r = 255
                    g = int(255 - 255 * t)
                    b = 0

                output_pixels[x, y] = (
                    r,
                    g,
                    b
                )

        # Blend the actual MRI with the actual Grad-CAM.
        overlay = Image.blend(
            base_image,
            heatmap_rgb,
            alpha=0.42
        )

        buffer = io.BytesIO()

        overlay.save(
            buffer,
            format="PNG"
        )

        overlay_base64 = base64.b64encode(
            buffer.getvalue()
        ).decode("utf-8")

        return {
            "method": "Grad-CAM",
            "target_layer": "model.features[-1]",
            "target_class": int(target_class),
            "cam_shape": [
                int(cam_array.shape[0]),
                int(cam_array.shape[1])
            ],
            "cam_min": float(cam_array.min()),
            "cam_max": float(cam_array.max()),
            "heatmapUrl": (
                "data:image/png;base64,"
                + overlay_base64
            ),
        }

    finally:
        forward_handle.remove()
        backward_handle.remove()
def run_alzheimer_inference(path):
    """
    Alzheimer image inference with real Grad-CAM.
    """

    checkpoint_candidates = [
        os.path.join(
            PACKAGES_DIR,
            "Experiment_10_Alzheimer_Inference_Package",
            "best_model.pth",
        ),
        os.path.join(
            MODELS_DIR,
            "alzheimer_model.pth",
        ),
    ]

    checkpoint_path = None

    for candidate in checkpoint_candidates:
        if os.path.exists(candidate):
            checkpoint_path = candidate
            break

    if checkpoint_path is None:
        raise FileNotFoundError(
            "Alzheimer checkpoint not found."
        )

    # Load EfficientNet-B0.
    model = models.efficientnet_b0(
        weights=None,
    )

    model.classifier[1] = nn.Linear(
        model.classifier[1].in_features,
        4,
    )

    checkpoint = torch.load(
        checkpoint_path,
        map_location=DEVICE,
        weights_only=False,
    )

    if (
        isinstance(checkpoint, dict)
        and "model_state_dict" in checkpoint
    ):
        state_dict = checkpoint["model_state_dict"]
    else:
        state_dict = checkpoint

    model.load_state_dict(
        state_dict,
        strict=True,
    )

    model.to(DEVICE)
    model.eval()

    image = Image.open(
        path
    ).convert("RGB")

    # Keep the original image for Grad-CAM display.
    display_image = image.copy()

    transform = transforms.Compose(
        [
            transforms.Resize(
                (224, 224)
            ),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[
                    0.485,
                    0.456,
                    0.406,
                ],
                std=[
                    0.229,
                    0.224,
                    0.225,
                ],
            ),
        ]
    )

    tensor = transform(
        image
    ).unsqueeze(
        0
    ).to(DEVICE)

    # Grad-CAM requires gradients.
    tensor.requires_grad_(True)

    model.zero_grad(
        set_to_none=True
    )

    logits = model(tensor)

    probabilities = torch.softmax(
        logits,
        dim=1,
    )[0]

    probabilities_np = (
        probabilities
        .detach()
        .cpu()
        .numpy()
    )

    classes = [
        "NonDemented",
        "VeryMildDemented",
        "MildDemented",
        "ModerateDemented",
    ]

    class_index = int(
        probabilities_np.argmax()
    )

    # Generate REAL Grad-CAM for the predicted class.
    explainability = generate_alzheimer_gradcam(
        model=model,
        input_tensor=tensor,
        target_class=class_index,
        display_image=display_image,
    )
    print(
    "ALZHEIMER GRAD-CAM:",
    explainability["method"],
    explainability["target_layer"],
    explainability["cam_shape"],
    file=sys.stderr,
)

    return {
        "success": True,
        "model": "EfficientNet-B0",
        "experiment": "Experiment 10",
        "checkpoint": os.path.relpath(
            checkpoint_path,
            REPO_ROOT,
        ),
        "device": str(DEVICE),
        "prediction": classes[
            class_index
        ],
        "class_index": class_index,
               "probabilities": {
            classes[i]: float(
                probabilities_np[i]
            )
            for i in range(
                len(classes)
            )
        },
        "explainability": explainability,
    }

# ---------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--image",
        required=True,
        help="Path to MRI image or NIfTI file.",
    )

    parser.add_argument(
        "--mode",
        required=True,
        choices=["alzheimer", "parkinson", "dual"],
        help="MRI analysis mode to run.",
    )
    args = parser.parse_args()
    image_path = os.path.abspath(
        args.image
    )

    if not os.path.exists(image_path):
        raise FileNotFoundError(
            f"Input file does not exist: {image_path}"
        )
    try:
        # -------------------------------------------------------------
        # Parkinson mode
        # -------------------------------------------------------------
        if args.mode == "parkinson":
            if not is_nifti_file(image_path):
                raise ValueError(
                    "Parkinson mode requires a NIfTI file (.nii or .nii.gz)."
                )

            result = run_parkinson_inference(image_path)

            output = {
                "success": True,
                "mode": args.mode,
                "engine": (
                    "PyTorch EfficientNet-B0 "
                    "Parkinson Exp06 Deployment"
                ),
                "input_type": "NIfTI",
                "parkinson": result,
                "alzheimer": None,
            }

        # -------------------------------------------------------------
        # Alzheimer mode
        # -------------------------------------------------------------
        elif args.mode == "alzheimer":
            if is_nifti_file(image_path):
                raise ValueError(
                    "Alzheimer mode requires a 2D image file, such as JPG or PNG."
                )

            result = run_alzheimer_inference(image_path)

            output = {
                "success": True,
                "mode": args.mode,
                "engine": (
                    "PyTorch EfficientNet-B0 "
                    "Alzheimer Experiment 10"
                ),
                "input_type": "image",
                "alzheimer": result,
                "parkinson": None,
            }

        # -------------------------------------------------------------
        # Dual mode: Parkinson NIfTI analysis + Alzheimer slice analysis
        # -------------------------------------------------------------
        elif args.mode == "dual":
            if not is_nifti_file(image_path):
                raise ValueError(
                    "Dual mode requires a NIfTI file (.nii or .nii.gz)."
                )

            import base64
            import tempfile
            from pathlib import Path

            parkinson_result = run_parkinson_inference(image_path)

            display_slice = (
                parkinson_result
                .get("explainability", {})
                .get("display_slice")
            )
            prefix = "data:image/png;base64,"

            if not isinstance(display_slice, str) or not display_slice.startswith(prefix):
                raise RuntimeError(
                    "Could not obtain the central MRI slice for Alzheimer analysis."
                )

            image_bytes = base64.b64decode(display_slice[len(prefix):])

            with tempfile.NamedTemporaryFile(
                suffix=".png", delete=False
            ) as temp_image:
                temp_image.write(image_bytes)
                temp_image_path = temp_image.name

            try:
                alzheimer_result = run_alzheimer_inference(temp_image_path)
            finally:
                Path(temp_image_path).unlink(missing_ok=True)

            output = {
                "success": True,
                "mode": args.mode,
                "engine": (
                    "PyTorch EfficientNet-B0 "
                    "Parkinson Exp06 + Alzheimer Experiment 10"
                ),
                "input_type": "NIfTI",
                "parkinson": parkinson_result,
                "alzheimer": alzheimer_result,
            }

        else:
            raise ValueError(f"Unsupported inference mode: {args.mode}")

        print(
            json.dumps(
                output,
                ensure_ascii=False,
                separators=(",", ":"),
            )
        )

        return 0

    except Exception as exc:

        error_output = {
            "success": False,
            "error": str(exc),
            "error_type": type(exc).__name__,
            "traceback": traceback.format_exc(),
        }

        print(
            json.dumps(
                error_output,
                ensure_ascii=False,
                separators=(",", ":"),
            )
        )

        return 1


if __name__ == "__main__":
    sys.exit(
        main()
    )