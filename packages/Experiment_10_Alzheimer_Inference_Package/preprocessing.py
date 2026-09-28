
from torchvision import transforms


IMAGE_SIZE = 224

IMAGENET_MEAN = [
    0.485,
    0.456,
    0.406
]

IMAGENET_STD = [
    0.229,
    0.224,
    0.225
]


def get_inference_transform():
    """
    Deterministic Experiment 10 inference preprocessing.

    Pipeline:
        Grayscale MRI
        -> 3 channels
        -> Resize 224x224
        -> Tensor
        -> ImageNet normalization
    """

    return transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize(
            (IMAGE_SIZE, IMAGE_SIZE)
        ),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=IMAGENET_MEAN,
            std=IMAGENET_STD
        )
    ])
