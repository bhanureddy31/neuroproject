# Parkinson's Disease MRI Classification & Grad-CAM Pipeline
# Preprocessing and architecture matching Experiment 06 standards.

import os
import argparse
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import scipy.ndimage
import nibabel as nib

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models

def load_parkinson_model(checkpoint_path=None, device='cpu'):
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, 2)
    if checkpoint_path and os.path.exists(checkpoint_path):
        ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)
        state = ckpt.get('model_state_dict', ckpt)
        model.load_state_dict(state)
        print(f'[✓] Loaded checkpoint: {checkpoint_path}')
    elif checkpoint_path:
        raise FileNotFoundError(f'Checkpoint not found at: {checkpoint_path}')
    model = model.to(device)
    model.eval()
    return model

def preprocess_mri(file_path):
    pipe = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    is_nifti = file_path.endswith('.nii') or file_path.endswith('.nii.gz')
    slice_tensors, pil_slices = [], []
    if is_nifti:
        img_canon = nib.as_closest_canonical(nib.load(file_path))
        data = img_canon.get_fdata(dtype=np.float32)
        nz = data[(data > 0) & np.isfinite(data)]
        if len(nz) > 0:
            p1, p99 = np.percentile(nz, 1), np.percentile(nz, 99)
            data_norm = np.clip((data - p1) / (p99 - p1), 0.0, 1.0) if p99 > p1 else np.clip(data, 0.0, 1.0)
        else:
            data_norm = data
        z_dim = data_norm.shape[2]
        com = scipy.ndimage.center_of_mass(data_norm > 0.1)
        center_z = int(np.round(com[2])) if np.isfinite(com[2]) else z_dim // 2
        offsets = [-10, -5, 0, 5, 10]
        for off in offsets:
            target_z = int(np.clip(center_z + off, 0, z_dim - 1))
            slice_2d = np.rot90(data_norm[:, :, target_z])
            slice_uint8 = (slice_2d * 255.0).astype(np.uint8)
            img_pil = Image.fromarray(slice_uint8).resize((224, 224), resample=Image.Resampling.BILINEAR)
            slice_tensors.append(pipe(img_pil.convert('RGB')).unsqueeze(0))
            pil_slices.append(img_pil)
    else:
        img_pil = Image.open(file_path).convert('L').resize((224, 224), resample=Image.Resampling.BILINEAR)
        slice_tensors.append(pipe(img_pil.convert('RGB')).unsqueeze(0))
        pil_slices.append(img_pil)
    return slice_tensors, pil_slices, is_nifti

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.h1 = target_layer.register_forward_hook(self._f_hook)
        self.h2 = target_layer.register_full_backward_hook(self._b_hook)
    def _f_hook(self, m, i, o): self.activations = o.detach()
    def _b_hook(self, m, gi, go): self.gradients = go[0].detach()
    def generate(self, tensor, target_class):
        self.model.zero_grad()
        out = self.model(tensor)
        out[0, target_class].backward()
        weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True)
        cam = torch.sum(weights * self.activations, dim=1).squeeze().cpu().numpy()
        cam = np.maximum(cam, 0)
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        cam_resized = scipy.ndimage.zoom(cam, (224 / cam.shape[0], 224 / cam.shape[1]), order=2)
        return np.clip(cam_resized, 0.0, 1.0)
    def close(self):
        self.h1.remove()
        self.h2.remove()

def predict_and_visualize(mri_path, model, device='cpu', output_image_path='prediction_report.png'):
    slice_tensors, pil_slices, is_nifti = preprocess_mri(mri_path)
    all_probs = []
    with torch.no_grad():
        for t in slice_tensors:
            p = F.softmax(model(t.to(device)), dim=1).cpu().numpy()[0]
            all_probs.append(p)
    mean_probs = np.mean(all_probs, axis=0)
    prob_co, prob_pd = float(mean_probs[0]), float(mean_probs[1])
    pred_label = 1 if prob_pd >= 0.50 else 0
    pred_class = 'Parkinson\'s Disease (PD)' if pred_label == 1 else 'Healthy Control (CO)'
    confidence = max(prob_co, prob_pd) * 100
    key_idx = 2 if is_nifti else 0
    key_tensor = slice_tensors[key_idx].to(device)
    key_pil = pil_slices[key_idx]
    gcam = GradCAM(model, model.features[-1])
    cam = gcam.generate(key_tensor, target_class=pred_label)
    gcam.close()
    raw_gray = np.array(key_pil) / 255.0
    heatmap = plt.cm.jet(cam)[:, :, :3]
    overlay = np.clip(0.55 * raw_gray[:, :, np.newaxis] + 0.45 * heatmap, 0.0, 1.0)
    fig, axes = plt.subplots(1, 3, figsize=(15, 5), dpi=300)
    axes[0].imshow(raw_gray, cmap='gray')
    axes[0].set_title(f'A. Patient MRI Slice\n{os.path.basename(mri_path)[:25]}', fontsize=11, fontweight='bold')
    axes[0].axis('off')
    axes[1].imshow(cam, cmap='jet', vmin=0, vmax=1)
    axes[1].set_title('B. Grad-CAM Activation Heatmap\n(Salient Features)', fontsize=11, fontweight='bold')
    axes[1].axis('off')
    axes[2].imshow(overlay)
    c = 'red' if pred_label == 1 else 'green'
    axes[2].set_title(f'C. Decision Overlay\nPred: {pred_class} ({confidence:.1f}%)', fontsize=11, fontweight='bold', color=c)
    axes[2].axis('off')
    plt.tight_layout()
    plt.savefig(output_image_path, dpi=300, bbox_inches='tight')
    plt.close()
    return {'predicted_class': pred_class, 'confidence_pct': round(confidence, 2), 'prob_parkinson': round(prob_pd, 4), 'prob_control': round(prob_co, 4), 'report_image': output_image_path}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Parkinson MRI Classifier with Grad-CAM')
    parser.add_argument('--input', type=str, required=True, help='Path to MRI scan (.nii, .nii.gz, .png, .jpg)')
    parser.add_argument('--model', type=str, default='best_exp06_model.pth', help='Path to checkpoint')
    parser.add_argument('--output', type=str, default='prediction_report.png', help='Output figure path')
    args = parser.parse_args()
    dev = 'cuda' if torch.cuda.is_available() else 'cpu'
    m = load_parkinson_model(args.model, device=dev)
    res = predict_and_visualize(args.input, m, device=dev, output_image_path=args.output)
    print('=' * 50)
    print(f'PREDICTION:             {res["predicted_class"].upper()}')
    print(f'Confidence:            {res["confidence_pct"]}%')
    print(f'Probability Parkinson: {res["prob_parkinson"]*100:.2f}%')
    print(f'Probability Control:   {res["prob_control"]*100:.2f}%')
    print(f'Saved Report Image:    {res["report_image"]}')
    print('=' * 50)
    print('[DISCLAIMER] Research experiment model only. Not for clinical diagnosis.')
