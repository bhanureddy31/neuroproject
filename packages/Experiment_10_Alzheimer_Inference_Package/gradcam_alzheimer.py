
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F

from PIL import Image

from alzheimer_model import load_model, get_class_name
from preprocessing import get_inference_transform


class GradCAM:
    """
    Grad-CAM implementation for Experiment 10 EfficientNet-B0.

    Target layer:
        model.features[-1]
    """

    def __init__(self, model, target_layer):

        self.model = model
        self.target_layer = target_layer

        self.activations = None
        self.gradients = None

        self.forward_handle = target_layer.register_forward_hook(
            self._save_activations
        )

        self.backward_handle = target_layer.register_full_backward_hook(
            self._save_gradients
        )

    def _save_activations(
        self,
        module,
        inputs,
        output
    ):
        self.activations = output.detach()

    def _save_gradients(
        self,
        module,
        grad_input,
        grad_output
    ):
        self.gradients = grad_output[0].detach()

    def generate(
        self,
        input_tensor,
        class_index=None
    ):
        """
        Generate a Grad-CAM heatmap.

        Returns:
            heatmap: numpy array in range [0, 1]
            class_index: class explained by Grad-CAM
        """

        self.model.zero_grad(set_to_none=True)

        output = self.model(input_tensor)

        if class_index is None:
            class_index = int(
                torch.argmax(output, dim=1).item()
            )

        score = output[:, class_index]

        score.backward()

        activations = self.activations
        gradients = self.gradients

        if activations is None:
            raise RuntimeError(
                "Grad-CAM activations were not captured."
            )

        if gradients is None:
            raise RuntimeError(
                "Grad-CAM gradients were not captured."
            )

        # Global average pooling of gradients
        weights = gradients.mean(
            dim=(2, 3),
            keepdim=True
        )

        # Weighted combination of feature maps
        cam = (
            weights * activations
        ).sum(dim=1, keepdim=True)

        # ReLU
        cam = F.relu(cam)

        # Resize CAM to input resolution
        cam = F.interpolate(
            cam,
            size=input_tensor.shape[-2:],
            mode="bilinear",
            align_corners=False
        )

        cam = cam[0, 0].cpu().numpy()

        # Normalize to [0, 1]
        cam -= cam.min()

        if cam.max() > 0:
            cam /= cam.max()

        return cam, class_index

    def remove_hooks(self):

        self.forward_handle.remove()
        self.backward_handle.remove()


def create_gradcam(
    image_path,
    checkpoint_path,
    output_path=None,
    device=None
):
    """
    Generate Grad-CAM for a single MRI.

    Returns:
        dictionary containing:
            prediction
            confidence
            probabilities
            heatmap
            original_image
            overlay
    """

    if device is None:
        device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

    image_path = Path(image_path)
    checkpoint_path = Path(checkpoint_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"MRI image not found: {image_path}"
        )

    if not checkpoint_path.exists():
        raise FileNotFoundError(
            f"Checkpoint not found: {checkpoint_path}"
        )

    # --------------------------------------------------------
    # LOAD MODEL
    # --------------------------------------------------------

    model, checkpoint = load_model(
        checkpoint_path,
        device=device
    )

    model.eval()

    # --------------------------------------------------------
    # LOAD IMAGE
    # --------------------------------------------------------

    original_image = Image.open(
        image_path
    ).convert("L")

    transform = get_inference_transform()

    input_tensor = transform(
        original_image
    ).unsqueeze(0).to(device)

    # --------------------------------------------------------
    # GRAD-CAM
    # --------------------------------------------------------

    target_layer = model.features[-1]

    gradcam = GradCAM(
        model,
        target_layer
    )

    heatmap, class_index = gradcam.generate(
        input_tensor
    )

    # --------------------------------------------------------
    # PREDICTION
    # --------------------------------------------------------

    with torch.no_grad():

        logits = model(input_tensor)

        probabilities = torch.softmax(
            logits,
            dim=1
        )[0]

    predicted_index = int(
        torch.argmax(probabilities).item()
    )

    predicted_class = get_class_name(
        predicted_index
    )

    confidence = float(
        probabilities[predicted_index].item()
    )

    probability_dict = {}

    for index in range(4):

        probability_dict[
            get_class_name(index)
        ] = float(
            probabilities[index].item()
        )

    # --------------------------------------------------------
    # CREATE OVERLAY
    # --------------------------------------------------------

    import matplotlib.pyplot as plt

    image_array = np.array(
        original_image
    ).astype(np.float32)

    image_array -= image_array.min()

    if image_array.max() > 0:
        image_array /= image_array.max()

    # Resize original image to heatmap size
    image_resized = np.array(
        Image.fromarray(
            (image_array * 255).astype(np.uint8)
        ).resize(
            (224, 224)
        )
    ) / 255.0

    fig = plt.figure(
        figsize=(6, 6)
    )

    plt.imshow(
        image_resized,
        cmap="gray"
    )

    plt.imshow(
        heatmap,
        cmap="jet",
        alpha=0.45
    )

    plt.axis("off")

    plt.title(
        f"{predicted_class} "
        f"({confidence * 100:.2f}%)"
    )

    plt.tight_layout()

    if output_path is not None:

        output_path = Path(output_path)
        output_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        plt.savefig(
            output_path,
            dpi=200,
            bbox_inches="tight"
        )

    plt.show()
    plt.close(fig)

    gradcam.remove_hooks()

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "probabilities": probability_dict,
        "heatmap": heatmap,
        "checkpoint_epoch": int(
            checkpoint["epoch"]
        )
    }
