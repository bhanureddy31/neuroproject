
from pathlib import Path

import torch
from PIL import Image

from alzheimer_model import load_model, get_class_name
from preprocessing import get_inference_transform


def predict_mri(
    image_path,
    checkpoint_path,
    device=None
):
    """
    Run Experiment 10 inference on a single MRI image.

    Returns:
        {
            "predicted_class": str,
            "confidence": float,
            "probabilities": dict
        }
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

    # --------------------------------------------------------
    # LOAD AND PREPROCESS IMAGE
    # --------------------------------------------------------

    image = Image.open(image_path).convert("L")

    transform = get_inference_transform()

    image_tensor = transform(image)
    image_tensor = image_tensor.unsqueeze(0).to(device)

    # --------------------------------------------------------
    # INFERENCE
    # --------------------------------------------------------

    with torch.no_grad():

        logits = model(image_tensor)

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

        class_name = get_class_name(index)

        probability_dict[class_name] = float(
            probabilities[index].item()
        )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "probabilities": probability_dict,
        "checkpoint_epoch": int(
            checkpoint["epoch"]
        )
    }


if __name__ == "__main__":

    import argparse

    parser = argparse.ArgumentParser(
        description="Experiment 10 Alzheimer MRI inference"
    )

    parser.add_argument(
        "--image",
        required=True,
        help="Path to MRI image"
    )

    parser.add_argument(
        "--checkpoint",
        required=True,
        help="Path to Experiment 10 checkpoint"
    )

    args = parser.parse_args()

    result = predict_mri(
        image_path=args.image,
        checkpoint_path=args.checkpoint
    )

    print("\nExperiment 10 Alzheimer MRI Prediction")
    print("=" * 55)

    print(
        f"Prediction : {result['predicted_class']}"
    )

    print(
        f"Confidence : "
        f"{result['confidence'] * 100:.2f}%"
    )

    print("\nClass probabilities:")

    for class_name, probability in result[
        "probabilities"
    ].items():

        print(
            f"  {class_name:<20} "
            f"{probability * 100:>7.2f}%"
        )

    print(
        f"\nCheckpoint epoch: "
        f"{result['checkpoint_epoch']}"
    )
