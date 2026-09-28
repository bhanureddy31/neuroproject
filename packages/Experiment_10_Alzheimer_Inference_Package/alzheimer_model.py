
import torch
import torch.nn as nn
from torchvision import models


CLASS_NAMES = {
    0: "NonDemented",
    1: "VeryMildDemented",
    2: "MildDemented",
    3: "ModerateDemented",
}


def build_model(num_classes=4):
    """
    Build the exact Experiment 10 EfficientNet-B0 architecture.

    Architecture:
        EfficientNet-B0
        ImageNet pretrained weights
        Final classifier: Linear(1280, 4)
    """

    model = models.efficientnet_b0(
        weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1
    )

    in_features = model.classifier[1].in_features

    model.classifier[1] = nn.Linear(
        in_features,
        num_classes
    )

    return model


def load_model(checkpoint_path, device=None):
    """
    Load the trained Experiment 10 checkpoint.

    This function performs inference-only model restoration.
    """

    if device is None:
        device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

    checkpoint = torch.load(
        checkpoint_path,
        map_location=device,
        weights_only=False
    )

    model = build_model(num_classes=4)

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model = model.to(device)
    model.eval()

    return model, checkpoint


def get_class_name(class_index):
    """Convert model output index to the Experiment 10 class name."""

    return CLASS_NAMES[int(class_index)]
