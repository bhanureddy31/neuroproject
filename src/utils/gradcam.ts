/**
 * NeuroDiagnosis Explainable AI (XAI) Utilities
 *
 * Genuine Grad-CAM visualizations are computed exclusively by the trained PyTorch
 * inference engine (using forward feature activations and backward gradients from
 * model.features[-1] for Alzheimer's and model.features[8] for Parkinson's).
 *
 * Fabricated, coordinate-generated, or synthetic SVG heatmaps are strictly disabled.
 */

export type GradCamMode = 'alzheimer' | 'parkinson' | 'dual' | 'both';

export interface GradCamResult {
  method: string;
  target_layer: string;
  heatmapUrl?: string | null;
  display_slice?: string | null;
  salient_regions?: string[];
  unavailable_reason?: string | null;
}

/**
 * Validates that a heatmap URL is a genuine base64 image or accessible URL
 * and not a synthetic or blank placeholder.
 */
export function isAuthenticHeatmap(heatmapUrl: string | null | undefined): boolean {
  if (!heatmapUrl || typeof heatmapUrl !== 'string') return false;
  if (heatmapUrl.startsWith('data:image/svg')) return false; // SVGs are synthetic placeholders
  if (heatmapUrl.startsWith('data:image/png;base64,') || heatmapUrl.startsWith('data:image/jpeg;base64,') || heatmapUrl.startsWith('http')) {
    return true;
  }
  return false;
}
