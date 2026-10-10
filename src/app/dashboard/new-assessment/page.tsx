'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Check, ChevronRight, ChevronLeft, Upload, FileImage, 
  Brain, Activity, AlertCircle, Download, Save, 
  FileText, User, Calendar, Syringe, HeartPulse, X,
  Layers, Zap, RefreshCw
} from 'lucide-react';
import { ProfessionalMedicalReport } from '@/components/ProfessionalMedicalReport';
import { isAuthenticHeatmap } from '@/utils/gradcam';

const ALZHEIMER_CLASSES = ['Non Demented', 'Very Mild Demented', 'Mild Demented', 'Moderate Demented'];
const PARKINSON_CLASSES = ['Healthy Control', "Parkinson's Disease"];

function NewAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillPatientId = searchParams.get('patientId');
  const officialReportRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [patientData, setPatientData] = useState({
    id: '',
    name: '',
    age: '',
    gender: 'Male',
    bp: '',
    bloodSugar: '',
    memoryInfo: '',
    movementInfo: '',
    medicalHistory: ''
  });

const [mriFile, setMriFile] = useState<File | null>(null);
const [mriPreview, setMriPreview] = useState<string | null>(null);
const [analysisMode, setAnalysisMode] = useState<
  'alzheimer' | 'parkinson' | 'dual'
>('dual');
const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [reportScope, setReportScope] = useState<'both' | 'alzheimer' | 'parkinson'>('both');
  const [viewMode, setViewMode] = useState<'official' | 'modern'>('official');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingScope, setExportingScope] = useState<'both' | 'alzheimer' | 'parkinson' | null>(null);

  useEffect(() => {
    if (prefillPatientId) {
      // Fetch existing patient details to pre-populate
      fetch(`/api/patients?id=${prefillPatientId}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            const p = json.data;
            setPatientData({
              id: p.id,
              name: p.name || '',
              age: p.age ? String(p.age) : '',
              gender: p.gender || 'Male',
              bp: p.bloodPressure || '',
              bloodSugar: p.bloodSugar || '',
              memoryInfo: p.memoryInfo || '',
              movementInfo: p.movementInfo || '',
              medicalHistory: p.medicalHistory || ''
            });
          } else {
            setPatientData(prev => ({ ...prev, id: `P-${1000 + Math.floor(Math.random() * 9000)}` }));
          }
        })
        .catch(() => {
          setPatientData(prev => ({ ...prev, id: `P-${1000 + Math.floor(Math.random() * 9000)}` }));
        });
    } else {
      setPatientData(prev => ({ ...prev, id: `P-${1000 + Math.floor(Math.random() * 9000)}` }));
    }
  }, [prefillPatientId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setMriFile(file);

      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.nii') || lowerName.endsWith('.nii.gz')) {
        try {
          const sliceFile = await extractSliceFromNifti(file);
          if (sliceFile !== file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setMriPreview(reader.result as string);
            };
            reader.readAsDataURL(sliceFile);
            return;
          }
        } catch {
          // fallback
        }
        setMriPreview('');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setMriPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setMriFile(file);

      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.nii') || lowerName.endsWith('.nii.gz')) {
        try {
          const sliceFile = await extractSliceFromNifti(file);
          if (sliceFile !== file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setMriPreview(reader.result as string);
            };
            reader.readAsDataURL(sliceFile);
            return;
          }
        } catch {
          // fallback
        }
        setMriPreview('');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setMriPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

// Helper to extract central axial slice from NIfTI (.nii or .nii.gz) volume directly in browser
async function extractSliceFromNifti(file: File): Promise<File> {
  let targetBlob: Blob = file;

  if (file.name.toLowerCase().endsWith('.nii.gz')) {
    try {
      if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('gzip');
        const decompressedStream = file.stream().pipeThrough(ds);
        const res = new Response(decompressedStream);
        targetBlob = await res.blob();
      }
    } catch {
      return file;
    }
  }

  return new Promise((resolve) => {
    const headerBlob = targetBlob.slice(0, 352);
    const headerReader = new FileReader();

    headerReader.onload = () => {
      try {
        const buffer = headerReader.result as ArrayBuffer;
        const view = new DataView(buffer);

        let littleEndian = true;
        const sizeof_hdr = view.getInt32(0, true);
        if (sizeof_hdr !== 348) {
          if (view.getInt32(0, false) === 348) {
            littleEndian = false;
          } else {
            return resolve(file);
          }
        }

        const nx = view.getInt16(42, littleEndian);
        const ny = view.getInt16(44, littleEndian);
        const nz = view.getInt16(46, littleEndian);
        const datatype = view.getInt16(70, littleEndian);
        const bitpix = view.getInt16(72, littleEndian);
        const vox_offset = Math.max(352, Math.round(view.getFloat32(108, littleEndian)) || 352);

        if (nx <= 0 || ny <= 0 || nz <= 0 || nx > 2048 || ny > 2048) {
          return resolve(file);
        }

        const bytesPerVoxel = Math.max(1, Math.round(bitpix / 8));
        const sliceBytes = nx * ny * bytesPerVoxel;
        const centerZ = Math.floor(nz / 2);
        const sliceStart = vox_offset + (centerZ * sliceBytes);
        const sliceEnd = sliceStart + sliceBytes;

        const sliceBlob = targetBlob.slice(sliceStart, sliceEnd);
        const sliceReader = new FileReader();

        sliceReader.onload = () => {
          try {
            const sliceBuf = sliceReader.result as ArrayBuffer;
            const sliceView = new DataView(sliceBuf);

            let minVal = Infinity;
            let maxVal = -Infinity;
            const numPixels = nx * ny;
            const pixels = new Float32Array(numPixels);

            for (let i = 0; i < numPixels; i++) {
              let val = 0;
              const byteOffset = i * bytesPerVoxel;
              if (byteOffset + bytesPerVoxel <= sliceBuf.byteLength) {
                if (bytesPerVoxel === 1) {
                  val = sliceView.getUint8(byteOffset);
                } else if (bytesPerVoxel === 2) {
                  val = datatype === 512
                    ? sliceView.getUint16(byteOffset, littleEndian)
                    : sliceView.getInt16(byteOffset, littleEndian);
                } else if (bytesPerVoxel === 4) {
                  val = sliceView.getFloat32(byteOffset, littleEndian);
                }
              }
              pixels[i] = val;
              if (val > 0) {
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
              }
            }

            if (minVal === Infinity) minVal = 0;
            if (maxVal <= minVal) maxVal = minVal + 1;

            const canvas = document.createElement('canvas');
            canvas.width = nx;
            canvas.height = ny;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(file);

            const imgData = ctx.createImageData(nx, ny);
            for (let i = 0; i < numPixels; i++) {
              const normalized = Math.min(255, Math.max(0, Math.round(((pixels[i] - minVal) / (maxVal - minVal)) * 255)));
              const pIdx = i * 4;
              imgData.data[pIdx] = normalized;
              imgData.data[pIdx + 1] = normalized;
              imgData.data[pIdx + 2] = normalized;
              imgData.data[pIdx + 3] = 255;
            }
            ctx.putImageData(imgData, 0, 0);

            canvas.toBlob((blob) => {
              if (blob) {
                const cleanName = file.name.replace(/\.nii(\.gz)?$/i, '');
                const extractedFile = new File([blob], `${cleanName}_axial_slice.png`, {
                  type: 'image/png',
                  lastModified: Date.now(),
                });
                resolve(extractedFile);
              } else {
                resolve(file);
              }
            }, 'image/png');
          } catch {
            resolve(file);
          }
        };

        sliceReader.onerror = () => resolve(file);
        sliceReader.readAsArrayBuffer(sliceBlob);
      } catch {
        resolve(file);
      }
    };

    headerReader.onerror = () => resolve(file);
    headerReader.readAsArrayBuffer(headerBlob);
  });
}

// Helper to optimize large images so they stay within serverless 4.5 MB request limits
async function resizeImageIfNeeded(file: File): Promise<File> {
  const name = file.name.toLowerCase();
  if (!name.endsWith('.jpg') && !name.endsWith('.jpeg') && !name.endsWith('.png') && !name.endsWith('.webp')) {
    return file;
  }
  if (file.size <= 2 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

  const [isSaving, setIsSaving] = useState(false);

const runAnalysis = async () => {
  setCurrentStep(3);
  setIsAnalyzing(true);

  try {
    if (!mriFile) {
      throw new Error('Please upload an MRI file or select the demo scan before starting the analysis.');
    }

    // ---------------------------------------------------------
    // MRI FILE VALIDATION & CLIENT-SIDE SMART PROCESSING
    // ---------------------------------------------------------
    const fileName = mriFile.name.toLowerCase();

    const isNifti =
      fileName.endsWith('.nii') ||
      fileName.endsWith('.nii.gz');

    const isSupportedImage =
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.webp');

    if (analysisMode === 'parkinson' && !isNifti) {
      throw new Error(
        "Parkinson's disease assessment strictly requires a 3D NIfTI MRI volume (.nii or .nii.gz). 2D planar images are not supported for this volumetric pipeline."
      );
    }

    if (analysisMode === 'dual' && !isNifti) {
      throw new Error(
        "Dual assessment strictly requires a 3D NIfTI MRI volume (.nii or .nii.gz) to process the volumetric Parkinson pipeline alongside Alzheimer evaluation."
      );
    }

    if (analysisMode === 'alzheimer' && !isSupportedImage && !isNifti) {
      throw new Error(
        "Alzheimer's assessment requires a 2D MRI slice (.png, .jpg, .jpeg, .webp) or a 3D NIfTI volume (.nii, .nii.gz)."
      );
    }

    let uploadFile = mriFile;

    // Only resize 2D images if they exceed dimensions; NEVER slice or alter 3D NIfTI volumes for Parkinson/Dual
    if (isSupportedImage) {
      uploadFile = await resizeImageIfNeeded(mriFile);
    }

    if (uploadFile.size > 25 * 1024 * 1024) {
      throw new Error(
        `The file size (${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB limit. Please select a valid MRI file under 25 MB.`
      );
    }

    // ---------------------------------------------------------
    // CREATE FORM DATA
    // ---------------------------------------------------------
    const formData = new FormData();
    formData.append('mriFile', uploadFile);
    formData.append('patientData', JSON.stringify(patientData));
    formData.append('mode', analysisMode);

    // ---------------------------------------------------------
    // CALL AI BACKEND
    // ---------------------------------------------------------
    const res = await fetch('/api/predict', {
      method: 'POST',
      body: formData,
    });

    const text = await res.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      if (res.status === 413 || text.includes('Request Entity Too Large')) {
        throw new Error(
          'The uploaded MRI scan exceeds the 4.5 MB cloud limit. Please choose an image under 4.5 MB or use the demo scan.'
        );
      }
      throw new Error(`Server returned an error (${res.status}): ${text.slice(0, 100)}`);
    }

    if (!res.ok || !data.success) {
      throw new Error(
        data.error || 'MRI prediction failed.'
      );
    }

    if (!data.alzheimer && !data.parkinson) {
      throw new Error(
        'The AI backend returned no analysis result for this MRI file.'
      );
    }

    // ---------------------------------------------------------
    // ALZHEIMER RESULT
    // ---------------------------------------------------------
    let alzheimerResult = null;

    if (data.alzheimer) {
      const probabilities =
        data.alzheimer.probabilities || {};

      const predictedClass =
        data.alzheimer.prediction;

      const predictedConfidence =
        Number(probabilities[predictedClass] || 0) * 100;

      alzheimerResult = {
        class: predictedClass,
        confidence: predictedConfidence,

        probs: [
          Number(probabilities.NonDemented || 0),
          Number(probabilities.VeryMildDemented || 0),
          Number(probabilities.MildDemented || 0),
          Number(probabilities.ModerateDemented || 0),
        ],

        probabilities,
      };
    }

    // ---------------------------------------------------------
    // PARKINSON RESULT
    // ---------------------------------------------------------
    let parkinsonResult = null;

    if (data.parkinson) {
      const probabilities =
        data.parkinson.probabilities || {};

      const predictedClass =
        data.parkinson.prediction;

      const predictedConfidence =
        Number(probabilities[predictedClass] || 0) * 100;

      parkinsonResult = {
        class:
          predictedClass === 'CO'
            ? 'Healthy Control'
            : predictedClass === 'PD'
              ? "Parkinson's Disease"
              : predictedClass,

        confidence: predictedConfidence,

        probs: [
          Number(probabilities.CO || 0),
          Number(probabilities.PD || 0),
        ],

        probabilities,
      };
    }

    // ---------------------------------------------------------
    // SAVE ANALYSIS RESULTS (GENUINE INFERENCE & GRAD-CAM)
    // ---------------------------------------------------------
    const activeExplainabilityRaw =
      data.parkinson?.explainability ||
      data.alzheimer?.explainability ||
      null;

    const sourceImage = activeExplainabilityRaw?.display_slice || mriPreview || null;
    const genuineHeatmap =
      isAuthenticHeatmap(activeExplainabilityRaw?.heatmapUrl)
        ? activeExplainabilityRaw.heatmapUrl
        : null;

    const activeExplainability = {
      method: activeExplainabilityRaw?.method || 'Grad-CAM',
      target_layer:
        activeExplainabilityRaw?.target_layer ||
        (analysisMode === 'parkinson' ? 'model.features[8]' : 'model.features[-1]'),
      display_slice: sourceImage,
      heatmapUrl: genuineHeatmap,
      salient_regions:
        analysisMode === 'parkinson'
          ? ['Substantia Nigra', 'Midbrain Tegmentum']
          : analysisMode === 'alzheimer'
          ? ['Hippocampal Formation', 'Bilateral Medial Temporal Lobes']
          : ['Hippocampal Formation', 'Bilateral Medial Temporal Lobes', 'Substantia Nigra'],
    };

    setAnalysisResults({
      alzheimer: alzheimerResult,
      parkinson: parkinsonResult,
      explainability: activeExplainability,
    });

    // ---------------------------------------------------------
    // SET REPORT SCOPE
    // ---------------------------------------------------------
    if (parkinsonResult && !alzheimerResult) {
      setReportScope('parkinson');
    } else if (alzheimerResult && !parkinsonResult) {
      setReportScope('alzheimer');
    } else {
      setReportScope('both');
    }

  } catch (err) {
    console.error('Inference API error:', err);

    const message =
      err instanceof Error
        ? err.message
        : 'MRI analysis failed. Please try again.';

    setAnalysisResults(null);

    alert(
      `MRI analysis failed:\n\n${message}`
    );

  } finally {
    setIsAnalyzing(false);
  }
};
  const handleNext = () => {
    if (currentStep === 2) {
      runAnalysis();
    } else if (currentStep === 5) {
      handleSaveAndFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSaveAndFinish = async () => {
    setIsSaving(true);
    try {
      // 1. Save or update Patient in SQLite database
      await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  id: patientData.id,
  name: patientData.name,
  age: patientData.age ? Number(patientData.age) : undefined,
  gender: patientData.gender || '',
  bloodPressure: patientData.bp || '',
  bloodSugar: patientData.bloodSugar || '',
  memoryInfo: patientData.memoryInfo || '',
  movementInfo: patientData.movementInfo || '',
  medicalHistory: patientData.medicalHistory || '',
}),
      });

      // 2. Save Assessment record in SQLite database
      const assessmentId = `NA-${Date.now().toString().slice(-6)}`;
      await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  id: assessmentId,

  patientId: patientData.id,

  assessmentType:
    analysisResults?.alzheimer && analysisResults?.parkinson
      ? "Dual Assessment (Alzheimer's & Parkinson's)"
      : analysisResults?.parkinson
        ? "Parkinson's MRI Assessment"
        : "Alzheimer's MRI Assessment",

  mriImage:
  analysisResults?.explainability?.display_slice ||
  mriPreview ||
  null,

  ...(analysisResults?.alzheimer
    ? {
        alzheimerClass: analysisResults.alzheimer.class,
        alzheimerConfidence: analysisResults.alzheimer.confidence,
        alzheimerProbs: analysisResults.alzheimer.probabilities,
      }
    : {}),

  ...(analysisResults?.parkinson
    ? {
        parkinsonClass: analysisResults.parkinson.class,
        parkinsonConfidence: analysisResults.parkinson.confidence,
        parkinsonProbs: analysisResults.parkinson.probabilities,
      }
    : {}),

  gradcamHeatmap:
    analysisResults?.explainability?.heatmapUrl || null,

  clinicalNotes:
    `Cognitive: ${patientData.memoryInfo || 'None reported'}. ` +
    `Motor: ${patientData.movementInfo || 'None reported'}. ` +
    `Medical History: ${patientData.medicalHistory || 'None reported'}`,

  doctorReview: 'Pending clinical review',

  status: 'AI Analysis Completed',
}),
      });

      // Redirect immediately to full clinical hospital report
      router.push(`/dashboard/report?id=${assessmentId}`);
    } catch (err) {
      console.error('Error saving assessment to database:', err);
      router.push('/dashboard/history');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDownloadPDF = async (scope: 'both' | 'alzheimer' | 'parkinson') => {
    setExportingScope(scope);
    setIsExporting(true);
    setReportScope(scope);

    // Wait for DOM to re-render with target scope
    await new Promise((r) => setTimeout(r, 300));

    try {
      const { default: html2canvas } = await import('html2canvas-pro');
      const { jsPDF } = await import('jspdf');
      
      const element = officialReportRef.current || document.getElementById('clinical-report');
      if (!element) return;
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#FFFFFF',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pdfHeight <= pageHeight + 5) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pageHeight));
      } else {
        let heightLeft = pdfHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = position - pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      }

      const patientName = patientData.name ? patientData.name.replace(/\s+/g, '_') : patientData.id;
      const hasAlzheimer = !!analysisResults?.alzheimer;
const hasParkinson = !!analysisResults?.parkinson;

let scopeLabel: string;

if (hasAlzheimer && hasParkinson) {
  scopeLabel = 'Dual_Assessment';
} else if (hasAlzheimer) {
  scopeLabel = 'Alzheimers_Diagnostic';
} else if (hasParkinson) {
  scopeLabel = 'Parkinsons_Diagnostic';
} else {
  scopeLabel = 'MRI_Assessment';
}

pdf.save(
  `Official_Medical_Report_${scopeLabel}_${patientName}_${patientData.id}.pdf`
);
      setShowDownloadModal(false);
    } catch (error) {
      console.error('Failed to generate PDF canvas, falling back to print dialog:', error);
      window.print();
    } finally {
      setIsExporting(false);
      setExportingScope(null);
    }
  };

  const steps = [
    'Patient Info', 'MRI Upload', 'AI Analysis', 'Explainable AI', 'Report'
  ];
  const currentAssessmentReport = {
  id: `NA-${patientData.id || 'NEW'}`,
  patientId: patientData.id || 'PT-PENDING',

  assessmentType:
    analysisResults?.alzheimer && analysisResults?.parkinson
      ? "Dual Assessment (Alzheimer's & Parkinson's)"
      : analysisResults?.parkinson
        ? "Parkinson's MRI Assessment"
        : "Alzheimer's MRI Assessment",

  mriImage:
    analysisResults?.explainability?.display_slice ||
    mriPreview ||
    null,

  ...(analysisResults?.alzheimer
    ? {
        alzheimerClass: analysisResults.alzheimer.class,
        alzheimerConfidence: analysisResults.alzheimer.confidence,
        alzheimerProbs: analysisResults.alzheimer.probabilities,
      }
    : {}),

  ...(analysisResults?.parkinson
    ? {
        parkinsonClass: analysisResults.parkinson.class,
        parkinsonConfidence: analysisResults.parkinson.confidence,
        parkinsonProbs: analysisResults.parkinson.probabilities,
      }
    : {}),

  gradcamHeatmap:
    analysisResults?.explainability?.heatmapUrl || null,

  clinicalNotes:
    `Cognitive: ${patientData.memoryInfo || 'None reported'}. ` +
    `Motor: ${patientData.movementInfo || 'None reported'}. ` +
    `Medical History: ${patientData.medicalHistory || 'None reported'}`,

  doctorReview: 'Pending clinical review',

  status: 'AI Analysis Completed',

  createdAt: new Date().toISOString(),

  patient: {
    id: patientData.id,
    name: patientData.name || '',
    age: patientData.age ? Number(patientData.age) : undefined,
    gender: patientData.gender || '',
    bloodPressure: patientData.bp || '',
    bloodSugar: patientData.bloodSugar || '',
    memoryInfo: patientData.memoryInfo || '',
    movementInfo: patientData.movementInfo || '',
    medicalHistory: patientData.medicalHistory || '',
  },
};
  return (
    <div className="min-h-screen bg-[#F4F8F5] p-6 lg:p-10 font-sans text-[#24333B]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Step Indicator */}
        <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,.055)] flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;
            
            return (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    isCompleted 
                      ? 'bg-[#3D8062] text-white' 
                      : isActive 
                        ? 'border-2 border-[#3D8062] text-[#3D8062] bg-[#EEF4F0]' 
                        : 'border border-[#DDE7E1] text-[#78858A]'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
                  </div>
                  <span className={`text-sm font-semibold hidden md:inline ${
                    isActive ? 'text-[#3D8062]' : 'text-[#78858A]'
                  }`}>
                    {step}
                  </span>
                </div>
                {stepNumber < steps.length && (
                  <div className="hidden sm:block w-8 lg:w-16 h-0.5 bg-[#DDE7E1] mx-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="transition-all">
          {/* STEP 1: PATIENT INFO */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-[#DDE7E1] p-8 shadow-[0_8px_24px_rgba(36,51,59,.055)]">
              <h2 className="text-xl font-bold text-[#24333B] mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-[#3D8062]" /> Patient Details & Clinical Background
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#24333B] mb-2">Patient ID</label>
                  <input 
                    type="text" 
                    name="id" 
                    value={patientData.id} 
                    onChange={handleInputChange} 
                    className="w-full h-11 px-4 border border-[#DDE7E1] rounded-[10px] bg-[#F4F8F5] text-[#78858A] font-mono cursor-not-allowed" 
                    readOnly 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#24333B] mb-2">Patient Full Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={patientData.name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. John Doe"
                    required
                    className="w-full h-11 px-4 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#24333B] mb-2">Age *</label>
                  <input 
                    type="number" 
                    name="age" 
                    value={patientData.age} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 68"
                    required
                    className="w-full h-11 px-4 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#24333B] mb-2">Biological Sex</label>
                  <select 
                    name="gender" 
                    value={patientData.gender} 
                    onChange={handleInputChange} 
                    className="w-full h-11 px-4 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062] bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#24333B] mb-2">Blood Pressure</label>
                  <input 
                    type="text" 
                    name="bp" 
                    value={patientData.bp} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 120/80 mmHg"
                    className="w-full h-11 px-4 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#24333B] mb-2">Fasting Blood Sugar</label>
                  <input 
                    type="text" 
                    name="bloodSugar" 
                    value={patientData.bloodSugar} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 95 mg/dL"
                    className="w-full h-11 px-4 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062]" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#24333B] mb-2">Memory / Cognitive Symptoms</label>
                  <textarea 
                    name="memoryInfo" 
                    value={patientData.memoryInfo} 
                    onChange={handleInputChange} 
                    rows={2} 
                    placeholder="Describe any reported memory lapses, disorientation, executive dysfunction..."
                    className="w-full p-4 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062]" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#24333B] mb-2">Motor / Movement Symptoms</label>
                  <textarea 
                    name="movementInfo" 
                    value={patientData.movementInfo} 
                    onChange={handleInputChange} 
                    rows={2} 
                    placeholder="Describe any observed resting tremor, gait abnormality, bradykinesia, rigidity..."
                    className="w-full p-4 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062]" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#24333B] mb-2">Medical History & Prior Treatments</label>
                  <textarea 
                    name="medicalHistory" 
                    value={patientData.medicalHistory} 
                    onChange={handleInputChange} 
                    rows={2} 
                    placeholder="Cardiovascular history, current medications, neurological family history..."
                    className="w-full p-4 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062]" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MRI UPLOAD */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-[#DDE7E1] p-8 shadow-[0_8px_24px_rgba(36,51,59,.055)]">
              <h2 className="text-xl font-bold text-[#24333B] mb-6 flex items-center">
                <FileImage className="w-6 h-6 mr-2 text-[#3D8062]" /> Upload Axial T1-Weighted Brain MRI
              </h2>
              {/* Analysis Type Selection */}
<div className="mb-6">
  <div className="mb-3">
    <h3 className="text-sm font-semibold text-[#24333B]">
      Analysis Type
    </h3>
    <p className="mt-1 text-xs text-[#78858A]">
      Select the diagnostic analysis you want to perform.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

    {/* Alzheimer's */}
    <button
      type="button"
      onClick={() => setAnalysisMode('alzheimer')}
      className={`rounded-xl border p-4 text-left transition-all ${
        analysisMode === 'alzheimer'
          ? 'border-[#3D8062] bg-[#EEF4F0] ring-2 ring-[#3D8062]/20'
          : 'border-[#DDE7E1] bg-white hover:border-[#3D8062]'
      }`}
    >
      <div className="font-bold text-sm text-[#24333B]">
        Alzheimer&apos;s
      </div>

      <div className="mt-1 text-xs text-[#78858A]">
        Alzheimer Experiment 10
      </div>
    </button>

    {/* Parkinson's */}
    <button
      type="button"
      onClick={() => setAnalysisMode('parkinson')}
      className={`rounded-xl border p-4 text-left transition-all ${
        analysisMode === 'parkinson'
          ? 'border-[#3D8062] bg-[#EEF4F0] ring-2 ring-[#3D8062]/20'
          : 'border-[#DDE7E1] bg-white hover:border-[#3D8062]'
      }`}
    >
      <div className="font-bold text-sm text-[#24333B]">
        Parkinson&apos;s
      </div>

      <div className="mt-1 text-xs text-[#78858A]">
        Parkinson Experiment 06
      </div>
    </button>

    {/* Dual Assessment */}
    <button
      type="button"
      onClick={() => setAnalysisMode('dual')}
      className={`rounded-xl border p-4 text-left transition-all ${
        analysisMode === 'dual'
          ? 'border-[#3D8062] bg-[#EEF4F0] ring-2 ring-[#3D8062]/20'
          : 'border-[#DDE7E1] bg-white hover:border-[#3D8062]'
      }`}
    >
      <div className="font-bold text-sm text-[#24333B]">
        Dual Assessment
      </div>

      <div className="mt-1 text-xs text-[#78858A]">
        One MRI → Both Models
      </div>
    </button>

  </div>

  {/* Dual information */}
  {analysisMode === 'dual' && (
    <div className="mt-3 rounded-xl border border-[#DDE7E1] bg-[#F4F8F5] p-4 text-xs text-[#526168]">
      <span className="font-semibold text-[#24333B]">
        Dual Assessment:
      </span>{' '}
      Upload one 3D T1-weighted NIfTI MRI
      <span className="font-semibold"> (.nii / .nii.gz)</span>.
      The same MRI will be processed through both the Alzheimer
      Experiment 10 and Parkinson Experiment 06 pipelines.
    </div>
  )}
</div>
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#DDE7E1] rounded-2xl p-10 flex flex-col items-center justify-center bg-[#F4F8F5] cursor-pointer hover:border-[#3D8062] transition-colors relative"
              >
                <input 
                  type="file" 
                  accept="*/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                
                {mriPreview ? (
                  <div className="flex flex-col items-center">
                    <img src={mriPreview} alt="MRI Scan Preview" className="max-h-64 object-contain rounded-lg border border-[#DDE7E1] mb-4" />
                    <p className="font-semibold text-sm text-[#24333B]">{mriFile?.name || 'Selected MRI Slice'}</p>
                    <p className="text-xs text-[#78858A] mt-1">Click or drag another image to replace</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-[#EEF4F0] flex items-center justify-center text-[#3D8062] mx-auto mb-4">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-[#24333B] text-lg mb-1">Upload Patient MRI Scan</h3>
                   <p className="text-sm text-[#78858A] mb-4">
  {analysisMode === 'alzheimer' && (
    <>
      Upload an MRI image in JPG, JPEG, or PNG format for
      Alzheimer Experiment 10.
    </>
  )}

  {analysisMode === 'parkinson' && (
    <>
      Upload a 3D T1-weighted MRI in NIfTI format
      (.nii/.nii.gz) for Parkinson Experiment 06.
    </>
  )}

  {analysisMode === 'dual' && (
    <>
      Upload one 3D T1-weighted MRI in NIfTI format
      (.nii/.nii.gz). The same MRI will be analyzed by
      both models.
    </>
  )}
</p>
                    <span className="inline-block bg-[#3D8062] text-white text-xs font-semibold px-4 py-2 rounded-[8px]">
                      Select Brain MRI File
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const demoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAADgCAAAAAA/RjU9AAAEzklEQVR4nO2d0ZGjMBBEW10OgXAUAuESAoFd+VxXtbX2eYWmR4j2vo/78IKkdz0YjLFUFnhDmEOYQ5hDmEOYQ5hDmEOYQ5hDmEOYQ5hDmEOYQ5hDmEOYQ5hDmHMb1dH2/YXVRnD7++/++uV0zZJ7V217pfaVmi1ZlvPkhkiWJMGtUe4fNcuxpAhux+we1BTFspweXm6MZZkhvMQYyzKTXoJiWebSkyuWZTY9sWKRCW4yvTt1nUxw08WnDbEsE8anDLEsM8YnDLEsc8YnC5Ez+2F/+hQ5PsEtpzxlZVqWaePTlCln94uWKWf3ixpyer+gIef3ixnyAn4hQ17BL2LIS/gFDHkNv35DXsSv25BX8es15GX8Og3LMsxv/367fsh16Q0j2F+/0meZnuB2MMAfv11KjbAsuX4NG9dUw7Jk+jVuWxMNb8ij+b9iTzway5IV4MEjtSZFyEn8DsS9zVCie88uKXXKlAAFVwKqCDmPX47hrXMs7/qP7CovU8oDjF2I7+oIGRjM685P3j8g2BRgfHy7NkKGBvPc8yRt9Ai2BKgZ266MkPP5aQ0ZHczXTidsCfZP/FJXoco3h11Wo4wP5l+PspakrVEVoPoEvYsiJMzhpAHKIqRkMClPWmjaJMyhpEJzvqvYFTVKmMN5A9REyAHjOLVlwhzGKzTz29A9XKOEOYQ5DLeQ+339ni+4nfPEQRv7lp5gtn60fcIc4tMFt/c1MuCR5thBSJhDmEOYw9juQ566TxXcZj7Nt7zL/Jbo1WFo70E/DInsTJhDmEN8tuA2+1kCP50nPj3B9wz79VlgX8IcwhzCHMIcwhzCHMIcwhzCHMIcwhzCHMIcwhzCHMIcRnYe8SvqaD+EOXz/53VUSP3U9z95/fQErw9hDkN7jzlCQ70Q5hAfLrjOfp6oa2qCI/RjfRDmEOYQny641pMPwhqbfIUwhzCH0Qaya7SmC64zn+rrml+iuf7h1glzCHOI8EGYWaM1PAUZYQ4FbeRFWMcIrvUkwyqYJI8wh5g3QkWA+E2wjYwINW2yaaufr0f1hlUzDydhDjFphKIAoUtQayhrjY3bNXwqVBpW2Uy4hDkUtqWLsJ4guNZx46rCuZqJ+QyVfhAfg3W6t2O2b9p0ey0+uqqdTJyhwbzq++T9I4Jtd0hjI6zq2eBvgcH8r/v+3xolfCjhkY1bb3L3jrMmTOdPzGOY4Yekyfw7yjTpzhWPbd7+TczR8WatN1ESl0Q5EGK95JIoNWPNl6OU31V7Pm7dJXT89nwXlea0S4NV0dpnoxYa3k6aPqBnzWH2dHTScwldayoTlzHsWzOauIph55rYxEUMe9f8Jq5h2L2mOXEJw/4124krGAbWpCcuYBjwQ+iu2iDDiB9itw2HGIb8ELwvOsAw5oeua9GvbLkTH1XE/BAWzL30DsYHya37xDKN+0GQYFqZhstTJphTpoL4IBPUhyiJDzpBdYia+KAUVIaoig9SQZmiUA9aQYmiVA9qwbCiWA96wbtir2OFWg8Zgr0xysNLFDweY0Z4qYIPxzbJ+7Vsjh1SBZskU+UGCN55TDL8pPn4DJIqN0jwwdNcyulqgwXPgjCHMIcwhzCHMIcwhzCHMIcwhzCHMIcwhzCHMIcwhzCHMIdnDyCbPxz/GLOtw9isAAAAAElFTkSuQmCC';
                    try {
                      const binaryString = atob(demoBase64.split(',')[1]);
                      const bytes = new Uint8Array(binaryString.length);
                      for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                      }
                      const demoBlob = new Blob([bytes], { type: 'image/png' });
                      const demoFile = new File([demoBlob], 'demo_alzheimer_axial_mri.png', { type: 'image/png' });
                      setMriFile(demoFile);
                      setAnalysisMode('alzheimer');
                      setPatientData((prev) => ({
                        ...prev,
                        id: 'DEMO-PT-8021',
                        name: 'Demo Patient (Anonymized)',
                        age: '72',
                        gender: 'Female',
                        bp: '130/82 mmHg',
                        bloodSugar: '108 mg/dL',
                        memoryInfo: 'Mild short-term memory retrieval delays noted during screening.',
                        movementInfo: 'Normal motor function, bilateral symmetry, no resting tremor.',
                        medicalHistory: 'Controlled hypertension, no prior neurological events.',
                      }));
                    } catch (e) {
                      console.error('Error creating demo scan file:', e);
                    }
                    setMriPreview(demoBase64);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EEF4F0] hover:bg-[#DDE7E1] text-[#3D8062] rounded-xl text-xs font-bold transition-all border border-[#DDE7E1] cursor-pointer shadow-xs"
                >
                  <Brain className="w-4 h-4 text-[#3D8062]" /> ⚡ Load Alzheimer 2D MRI Demo Scan (Anonymized)
                </button>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#78858A] bg-[#EEF4F0] p-4 rounded-xl gap-2">
                <span>
                  {analysisMode === 'alzheimer' &&
                    "Alzheimer's: Axial 2D MRI Slice (PNG, JPG, JPEG, WebP) or 3D NIfTI (.nii, .nii.gz)"}
                  {analysisMode === 'parkinson' &&
                    "Parkinson's: Strictly requires 3D Volumetric NIfTI (.nii, .nii.gz) for 5-slice midbrain evaluation."}
                  {analysisMode === 'dual' &&
                    "Dual Assessment: Strictly requires 3D Volumetric NIfTI (.nii, .nii.gz) for multi-model evaluation."}
                </span>
                <span className="font-mono text-[#3D8062] font-semibold shrink-0">Trained EfficientNet-B0 Compatible</span>
              </div>
            </div>
          )}

          {/* STEP 3: AI ANALYSIS */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-[#DDE7E1] p-8 shadow-[0_8px_24px_rgba(36,51,59,.055)] min-h-[400px] flex items-center justify-center">
              {isAnalyzing ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-[#EEF4F0] border-t-[#3D8062] rounded-full animate-spin mx-auto" />
                  <h3 className="text-lg font-bold text-[#24333B]">Running AI MRI Analysis...</h3>
                  <p className="text-sm text-[#78858A] max-w-md">
                    Executing the trained PyTorch model on the uploaded MRI scan.
                  </p>
                </div>
              ) : analysisResults ? (
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-[#24333B]">AI Assessment Results</h2>
                      <p className="text-xs text-[#78858A]">Results generated from the trained PyTorch inference pipeline.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF4F0] text-[#3D8062] rounded-full text-xs font-semibold self-start sm:self-auto">
                      <Brain className="w-3.5 h-3.5" /> Real Model Inference
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Alzheimer's Card */}
                    <div className="border border-[#DDE7E1] rounded-2xl p-6 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-[#24333B]">Alzheimer's Assessment</h3>
                        <span className="bg-[#EEF4F0] text-[#3D8062] text-xs font-bold px-2 py-0.5 rounded-full">EFFICIENTNET-B0</span>
                      </div>

                      {analysisResults.alzheimer ? (
                        <>
                          <div className="mb-6">
                            <p className="text-sm text-[#78858A] mb-1">Predicted Class</p>
                            <p className="text-2xl font-bold text-[#3D8062]">{analysisResults.alzheimer.class}</p>
                          </div>
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-[#24333B]">Confidence Score</span>
                              <span className="text-sm font-bold text-[#3D8062]">{analysisResults.alzheimer.confidence}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#EEF4F0] rounded-full overflow-hidden">
                              <div className="h-full bg-[#3D8062] rounded-full" style={{ width: `${analysisResults.alzheimer.confidence}%` }} />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-[#78858A] uppercase tracking-wider mb-2">Class Probabilities</p>
                            {ALZHEIMER_CLASSES.map((cls, idx) => {
                              const prob = ((analysisResults.alzheimer.probs?.[idx] || 0) * 100).toFixed(1);
                              return (
                                <div key={cls} className="flex items-center text-sm">
                                  <span className="w-32 truncate text-[#24333B]">{cls}</span>
                                  <div className="flex-1 h-1.5 bg-[#EEF4F0] mx-3 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#4F9473]" style={{ width: `${prob}%` }} />
                                  </div>
                                  <span className="w-10 text-right text-[#78858A]">{prob}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="min-h-[220px] flex flex-col items-center justify-center text-center">
                          <Brain className="w-10 h-10 text-[#DDE7E1] mb-3" />
                          <p className="font-semibold text-[#24333B]">Alzheimer's analysis not available</p>
                          <p className="text-xs text-[#78858A] mt-2 max-w-xs">
                            This uploaded MRI format was processed by the Parkinson's NIfTI pipeline, so no Alzheimer's result was generated.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Parkinson's Card */}
                    <div className="border border-[#DDE7E1] rounded-2xl p-6 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-[#24333B]">Parkinson's Assessment</h3>
                        <span className="bg-[#EEF4F0] text-[#3D8062] text-xs font-bold px-2 py-0.5 rounded-full">EFFICIENTNET-B0</span>
                      </div>

                      {analysisResults.parkinson ? (
                        <>
                          <div className="mb-6">
                            <p className="text-sm text-[#78858A] mb-1">Predicted Class</p>
                            <p className="text-2xl font-bold text-[#3D8062]">{analysisResults.parkinson.class}</p>
                          </div>
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-[#24333B]">Confidence Score</span>
                              <span className="text-sm font-bold text-[#3D8062]">{analysisResults.parkinson.confidence}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#EEF4F0] rounded-full overflow-hidden">
                              <div className="h-full bg-[#3D8062] rounded-full" style={{ width: `${analysisResults.parkinson.confidence}%` }} />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-[#78858A] uppercase tracking-wider mb-2">Class Probabilities</p>
                            {PARKINSON_CLASSES.map((cls, idx) => {
                              const prob = ((analysisResults.parkinson.probs?.[idx] || 0) * 100).toFixed(1);
                              return (
                                <div key={cls} className="flex items-center text-sm">
                                  <span className="w-32 truncate text-[#24333B]">{cls}</span>
                                  <div className="flex-1 h-1.5 bg-[#EEF4F0] mx-3 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#4F9473]" style={{ width: `${prob}%` }} />
                                  </div>
                                  <span className="w-10 text-right text-[#78858A]">{prob}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="min-h-[220px] flex flex-col items-center justify-center text-center">
                          <Brain className="w-10 h-10 text-[#DDE7E1] mb-3" />
                          <p className="font-semibold text-[#24333B]">Parkinson's analysis not available</p>
                          <p className="text-xs text-[#78858A] mt-2 max-w-xs">
                            This MRI input did not produce a Parkinson's result.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#DDE7E1] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-[#78858A]">
                      Interpretability layer generated from trained EfficientNet-B0 feature maps (features[8]).
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3D8062] hover:bg-[#346D54] text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer shrink-0"
                    >
                      <Brain className="w-4 h-4" /> View Grad-CAM Saliency Overlay →
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

       {/* STEP 4: GRAD-CAM EXPLAINABILITY */}
{currentStep === 4 && (
  <div className="bg-white rounded-2xl border border-[#DDE7E1] p-8 shadow-[0_8px_24px_rgba(36,51,59,.055)]">

    <h2 className="text-xl font-bold text-[#24333B] mb-6">
      Explainable AI (Grad-CAM Saliency)
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

      {/* ORIGINAL / SOURCE MRI */}
      <div>
        <h3 className="font-semibold text-[#24333B] mb-3 text-center">
          MRI Slice Used for Analysis
        </h3>

        <div className="bg-[#172127] rounded-2xl p-4 flex items-center justify-center min-h-[300px]">

          {analysisResults?.explainability?.display_slice ? (
            <div className="text-center">

              <img
                src={analysisResults.explainability.display_slice}
                alt="MRI slice used for Grad-CAM"
                className="object-contain w-full max-w-[360px] aspect-square rounded-lg"
              />

              <p className="text-xs text-[#AAB5BA] mt-3">
                Central MRI slice · 0 mm offset
              </p>

            </div>
          ) : mriPreview ? (
            <div className="text-center">

              <img
                src={mriPreview}
                alt="Uploaded MRI"
                className="object-contain max-h-[250px] rounded-lg"
              />

              <p className="text-xs text-[#AAB5BA] mt-3">
                Uploaded MRI image
              </p>

            </div>
          ) : (
            <div className="text-center">

              <FileImage className="w-8 h-8 text-[#78858A] mx-auto mb-2" />

              <p className="text-[#78858A] text-sm">
                MRI visualization is not available.
              </p>

              <p className="text-[#78858A] text-xs mt-1">
                The uploaded NIfTI file is processed by the backend.
              </p>

            </div>
          )}

        </div>
      </div>


      {/* REAL GRAD-CAM VISUALIZATION */}
      <div>

        <h3 className="font-semibold text-[#24333B] mb-3 text-center">
          Real Grad-CAM Overlay
        </h3>

        <div className="bg-[#172127] rounded-2xl p-4 flex items-center justify-center min-h-[300px]">

          {analysisResults?.explainability?.heatmapUrl ? (

            <div className="w-full max-w-[360px]">

              {/* REAL BACKEND-GENERATED GRAD-CAM */}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-black">

                <img
                  src={analysisResults.explainability.heatmapUrl}
                  alt="Real Grad-CAM visualization"
                  className="w-full h-full object-contain"
                />

              </div>


              {/* GRAD-CAM SCALE */}
              <div className="mt-4">

                <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 via-yellow-400 to-red-600" />

                <div className="flex justify-between text-[10px] text-[#AAB5BA] mt-1">
                  <span>Low activation</span>
                  <span>High activation</span>
                </div>

              </div>


              {/* VISUALIZATION LABEL */}
              <div className="flex justify-between items-center mt-3 text-xs text-[#AAB5BA]">

                <span>
                  {analysisResults.explainability.method || "Grad-CAM"}
                </span>

                <span>
                  Real model output
                </span>

              </div>

            </div>

          ) : analysisResults?.explainability?.results?.length > 0 ? (

            /*
             * Parkinson's compatibility:
             * The Parkinson pipeline can provide its own CAM matrix.
             * This branch is retained for that real backend output.
             */
            <div className="w-full max-w-[360px]">

              {analysisResults.explainability.display_slice && (
                <div className="relative aspect-square overflow-hidden rounded-lg bg-black">

                  <img
                    src={analysisResults.explainability.display_slice}
                    alt="MRI slice used for Grad-CAM"
                    className="absolute inset-0 w-full h-full object-contain"
                  />

                </div>
              )}

              <div className="mt-4">

                <p className="text-xs text-[#AAB5BA] text-center">
                  Real Grad-CAM data was generated by the backend.
                </p>

              </div>

            </div>

          ) : (

            <div className="text-center">

              <AlertCircle className="w-8 h-8 text-[#78858A] mx-auto mb-2" />

              <p className="text-[#78858A] text-sm">
                Real Grad-CAM visualization is not available for this result.
              </p>

              <p className="text-[#78858A] text-xs mt-2">
                No Grad-CAM image was returned by the AI inference pipeline.
              </p>

            </div>

          )}

        </div>
      </div>

    </div>


    {/* GRAD-CAM TECHNICAL DETAILS */}
    {analysisResults?.explainability && (
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* METHOD */}
        <div className="bg-[#F4F8F5] border border-[#DDE7E1] rounded-xl p-4">

          <p className="text-xs text-[#78858A] uppercase font-semibold mb-1">
            Method
          </p>

          <p className="font-bold text-[#24333B]">
            {analysisResults.explainability.method || "Grad-CAM"}
          </p>

        </div>


        {/* TARGET LAYER */}
        <div className="bg-[#F4F8F5] border border-[#DDE7E1] rounded-xl p-4">

          <p className="text-xs text-[#78858A] uppercase font-semibold mb-1">
            Target Layer
          </p>

          <p className="font-bold text-[#24333B] text-sm font-mono break-all">
            {analysisResults.explainability.target_layer || "Not specified"}
          </p>

        </div>


        {/* TARGET CLASS */}
        <div className="bg-[#F4F8F5] border border-[#DDE7E1] rounded-xl p-4">

          <p className="text-xs text-[#78858A] uppercase font-semibold mb-1">
            Target Class
          </p>

          <p className="font-bold text-[#24333B]">
            {analysisResults.explainability.target_class !== undefined
              ? (
                  analysisResults.alzheimer?.class ||
                  analysisResults.parkinson?.class ||
                  `Class ${analysisResults.explainability.target_class}`
                )
              : "Not specified"}
          </p>

        </div>

      </div>
    )}


    {/* INTERPRETABILITY NOTICE */}
    <div className="bg-[#FFF7E6] border border-[#F5DEB3] rounded-xl p-6">

      <div className="flex items-start">

        <AlertCircle className="w-6 h-6 text-[#B8860B] mr-4 flex-shrink-0 mt-1" />

        <div>

          <h4 className="font-bold text-[#8B6508] mb-2">
            Interpretability Analysis
          </h4>

          <p className="text-sm text-[#8B6508] mb-4">
            The Grad-CAM visualization is generated directly from the trained
            AI model during inference. It provides a visual representation
            of the image regions associated with the model's prediction.
          </p>

          <p className="text-xs font-semibold text-[#8B6508] uppercase opacity-75">
            Disclaimer: This visualization is generated by a research AI
            model and is not a clinically validated diagnostic measurement.
          </p>

        </div>

      </div>

    </div>

  </div>
)}

          {/* STEP 5: CLINICAL REPORT PREVIEW & 3-WAY DOWNLOAD */}
          {currentStep === 5 && (
            <div className="relative space-y-6">
              {/* 3-Way Report Scope Switcher Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#DDE7E1] shadow-xs">
                <div>
                  <h3 className="font-bold text-[#24333B] text-sm">Select Clinical Report View</h3>
                  <p className="text-xs text-[#78858A]">Choose between individual condition reports or the comprehensive dual evaluation</p>
                </div>

                <div className="inline-flex p-1 bg-[#EEF4F0] rounded-xl border border-[#DDE7E1] text-xs font-bold self-start sm:self-auto">
                  <button
                    onClick={() => analysisResults?.alzheimer && analysisResults?.parkinson && setReportScope('both')}
                    disabled={!analysisResults?.alzheimer || !analysisResults?.parkinson}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      reportScope === 'both'
                        ? 'bg-[#3D8062] text-white shadow-xs'
                        : analysisResults?.alzheimer && analysisResults?.parkinson
                        ? 'text-[#78858A] hover:text-[#24333B] cursor-pointer'
                        : 'text-[#D0D8D3] cursor-not-allowed'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Both (Dual)
                  </button>
                  <button
                    onClick={() => analysisResults?.alzheimer && setReportScope('alzheimer')}
                    disabled={!analysisResults?.alzheimer}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      reportScope === 'alzheimer'
                        ? 'bg-[#3D8062] text-white shadow-xs'
                        : analysisResults?.alzheimer
                        ? 'text-[#78858A] hover:text-[#24333B] cursor-pointer'
                        : 'text-[#D0D8D3] cursor-not-allowed'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" /> Alzheimer's
                  </button>
                  <button
                    onClick={() => analysisResults?.parkinson && setReportScope('parkinson')}
                    disabled={!analysisResults?.parkinson}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      reportScope === 'parkinson'
                        ? 'bg-[#3D8062] text-white shadow-xs'
                        : analysisResults?.parkinson
                        ? 'text-[#78858A] hover:text-[#24333B] cursor-pointer'
                        : 'text-[#D0D8D3] cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Parkinson's
                  </button>
                </div>
              </div>

              {/* 3-Way Download Modal Dialog */}
              {showDownloadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                  <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 md:p-8 max-w-xl w-full shadow-2xl relative">
                    <button
                      onClick={() => setShowDownloadModal(false)}
                      className="absolute top-5 right-5 text-[#78858A] hover:text-[#24333B] p-1 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="mb-6">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D8062] bg-[#EEF4F0] px-2.5 py-1 rounded-full">
                        Vector PDF Export
                      </span>
                      <h2 className="text-xl font-bold text-[#24333B] mt-2">Download Clinical PDF Report</h2>
                      <p className="text-xs text-[#78858A] mt-1">
                        Choose which diagnostic assessment report you would like to download:
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      {/* Option 1: Alzheimer's */}
                      <div 
                        onClick={() => analysisResults?.alzheimer && executeDownloadPDF('alzheimer')}
                        className="border border-[#DDE7E1] hover:border-[#3D8062] hover:bg-[#F4F8F5] p-4 rounded-xl transition-all cursor-pointer group flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#EEF4F0] group-hover:bg-[#3D8062] group-hover:text-white text-[#3D8062] flex items-center justify-center shrink-0 transition-colors">
                            <Brain className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#24333B] group-hover:text-[#3D8062] transition-colors">
                              1. Alzheimer's Disease Diagnostic Report
                            </h3>
                            <p className="text-xs text-[#78858A] mt-1 leading-relaxed">
                              Focuses on cognitive presentation, 4-stage dementia probabilities, and hippocampal Grad-CAM saliency.
                            </p>
                          </div>
                        </div>
                        <button
                          disabled={isExporting}
                          className="px-3 py-1.5 bg-[#EEF4F0] text-[#3D8062] group-hover:bg-[#3D8062] group-hover:text-white rounded-lg text-xs font-bold shrink-0 transition-all"
                        >
                          {isExporting && exportingScope === 'alzheimer' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Download'}
                        </button>
                      </div>

                      {/* Option 2: Parkinson's */}
                      <div 
                        onClick={() => analysisResults?.parkinson && executeDownloadPDF('parkinson')}
                        className="border border-[#DDE7E1] hover:border-[#3D8062] hover:bg-[#F4F8F5] p-4 rounded-xl transition-all cursor-pointer group flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#EEF4F0] group-hover:bg-[#3D8062] group-hover:text-white text-[#3D8062] flex items-center justify-center shrink-0 transition-colors">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#24333B] group-hover:text-[#3D8062] transition-colors">
                              2. Parkinson's Disease Diagnostic Report
                            </h3>
                            <p className="text-xs text-[#78858A] mt-1 leading-relaxed">
                              Focuses on motor assessment, 2-class classification (Healthy Control vs. Parkinson's), and substantia nigra saliency.
                            </p>
                          </div>
                        </div>
                        <button
                          disabled={isExporting}
                          className="px-3 py-1.5 bg-[#EEF4F0] text-[#3D8062] group-hover:bg-[#3D8062] group-hover:text-white rounded-lg text-xs font-bold shrink-0 transition-all"
                        >
                          {isExporting && exportingScope === 'parkinson' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Download'}
                        </button>
                      </div>

                      {/* Option 3: Both */}
                      <div 
                        onClick={() => analysisResults?.alzheimer && analysisResults?.parkinson && executeDownloadPDF('both')}
                        className="border-2 border-[#3D8062] bg-[#EEF4F0]/40 hover:bg-[#EEF4F0] p-4 rounded-xl transition-all cursor-pointer group flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#3D8062] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-[#24333B] group-hover:text-[#3D8062] transition-colors">
                                3. Comprehensive Dual Assessment Report (Both)
                              </h3>
                              <span className="text-[10px] bg-[#3D8062] text-white px-2 py-0.5 rounded-full font-bold">
                                RECOMMENDED
                              </span>
                            </div>
                            <p className="text-xs text-[#78858A] mt-1 leading-relaxed">
                              Complete multi-modal report combining both Alzheimer's and Parkinson's evaluations and comparative neuroimaging.
                            </p>
                          </div>
                        </div>
                        <button
                          disabled={isExporting}
                          className="px-3.5 py-1.5 bg-[#3D8062] text-white hover:bg-[#346D54] rounded-lg text-xs font-bold shrink-0 transition-all shadow-xs"
                        >
                          {isExporting && exportingScope === 'both' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Download'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#DDE7E1] flex justify-end">
                      <button
                        onClick={() => setShowDownloadModal(false)}
                        className="px-4 py-2 border border-[#DDE7E1] text-[#78858A] hover:bg-[#F4F8F5] rounded-[10px] text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Format Switcher */}
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#DDE7E1] mb-6 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#78858A] uppercase tracking-wider pl-2">Document Format:</span>
                  <div className="inline-flex p-1 bg-[#EEF4F0] rounded-xl border border-[#DDE7E1] text-xs font-bold">
                    <button
                      onClick={() => setViewMode('official')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        viewMode === 'official' ? 'bg-[#1A535C] text-white shadow-xs' : 'text-[#78858A] hover:text-[#24333B]'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Official Doctor Medical Report (Form Format)
                    </button>
                    <button
                      onClick={() => setViewMode('modern')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        viewMode === 'modern' ? 'bg-[#3D8062] text-white shadow-xs' : 'text-[#78858A] hover:text-[#24333B]'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" /> Interactive Hospital Cards View
                    </button>
                  </div>
                </div>
                <div className="text-xs text-[#3D8062] font-semibold pr-2 hidden md:block">
                  {viewMode === 'official' ? '✓ Standard Board Medical Examination Format (Print & PDF Ready)' : 'Interactive Digital Hospital View'}
                </div>
              </div>

              {viewMode === 'official' ? (
                <div className="py-2">
                  <ProfessionalMedicalReport ref={officialReportRef} report={currentAssessmentReport} scope={reportScope} />
                </div>
              ) : (
                <>
                  <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '850px' }}>
                    <ProfessionalMedicalReport ref={officialReportRef} report={currentAssessmentReport} scope={reportScope} />
                  </div>

                  {/* Actual Report Content (Target for PDF) */}
                  <div id="clinical-report" className="bg-white rounded-2xl border border-[#DDE7E1] p-8 md:p-10 shadow-[0_8px_24px_rgba(36,51,59,.055)] text-[#24333B] relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#3D8062]" />
                
                {/* Report Header */}
                <div className="flex justify-between items-start border-b border-[#DDE7E1] pb-6 mb-8 mt-2">
                  <div>
                    <div className="flex items-center mb-2">
                      <Brain className="w-8 h-8 text-[#3D8062] mr-3" />
                      <h1 className="text-2xl font-bold text-[#3D8062]">NeuroDiagnosis</h1>
                    </div>
                    <h2 className="text-xl font-bold tracking-wide text-[#24333B]">
                      {reportScope === 'both' && 'CLINICAL DUAL ASSESSMENT REPORT'}
                      {reportScope === 'alzheimer' && 'ALZHEIMER\'S DISEASE CLINICAL REPORT'}
                      {reportScope === 'parkinson' && 'PARKINSON\'S DISEASE CLINICAL REPORT'}
                    </h2>
                    <p className="text-xs text-[#78858A] mt-0.5">
                      {reportScope === 'both' && 'Comprehensive Neurodegenerative Disease Evaluation (Dual EfficientNet-B0)'}
                      {reportScope === 'alzheimer' && 'Cognitive & Dementia Evaluation (EfficientNet-B0 Exp 10 Checkpoint)'}
                      {reportScope === 'parkinson' && 'Motor & Movement System Evaluation (EfficientNet-B0 Exp 06 Checkpoint)'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#78858A] font-semibold mb-1">Assessment ID</p>
                    <p className="font-mono font-bold">NA-{patientData.id}</p>
                    <p className="text-sm text-[#78858A] mt-2">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Patient Info Grid */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-[#24333B] border-b border-[#DDE7E1] pb-2 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-[#3D8062]" /> Patient Demographics & Intake
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#EEF4F0] p-4 rounded-xl">
                    <div>
                      <p className="text-xs text-[#78858A] font-semibold uppercase mb-1">ID</p>
                      <p className="font-bold">{patientData.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#78858A] font-semibold uppercase mb-1">Name</p>
                      <p className="font-bold">{patientData.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#78858A] font-semibold uppercase mb-1">Age / Gender</p>
                      <p className="font-bold">{patientData.age || '--'} / {patientData.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#78858A] font-semibold uppercase mb-1">Vitals</p>
                      <p className="font-bold text-sm">BP: {patientData.bp || '--'}<br/>BS: {patientData.bloodSugar || '--'}</p>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-[#24333B] border-b border-[#DDE7E1] pb-2 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-[#3D8062]" /> Clinical Notes
                  </h3>
                  <div className="space-y-4">
                    {(reportScope === 'both' || reportScope === 'alzheimer') && (
                      <div>
                        <h4 className="text-sm font-semibold text-[#78858A]">Memory / Cognitive</h4>
                        <p className="text-sm bg-[#F4F8F5] p-3 rounded-lg border border-[#DDE7E1] min-h-[3rem]">{patientData.memoryInfo || 'Not provided'}</p>
                      </div>
                    )}
                    {(reportScope === 'both' || reportScope === 'parkinson') && (
                      <div>
                        <h4 className="text-sm font-semibold text-[#78858A]">Movement / Motor</h4>
                        <p className="text-sm bg-[#F4F8F5] p-3 rounded-lg border border-[#DDE7E1] min-h-[3rem]">{patientData.movementInfo || 'Not provided'}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-[#78858A]">Medical History</h4>
                      <p className="text-sm bg-[#F4F8F5] p-3 rounded-lg border border-[#DDE7E1] min-h-[3rem]">{patientData.medicalHistory || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* AI Diagnostic Assessment */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-[#24333B] border-b border-[#DDE7E1] pb-2 mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-[#3D8062]" /> AI Diagnostic Assessment
                    </div>
                    <span className="text-xs bg-[#E8F4EC] text-[#3D8062] px-2 py-1 rounded font-mono font-bold">
                      {reportScope === 'both' && 'Dual EfficientNet-B0 Checkpoints'}
                      {reportScope === 'alzheimer' && 'EfficientNet-B0 (Exp 10 Checkpoint)'}
                      {reportScope === 'parkinson' && 'EfficientNet-B0 (Exp 06 Checkpoint)'}
                    </span>
                  </h3>
                  
                  {analysisResults && (
                    <div className={`grid gap-6 ${reportScope === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {(reportScope === 'both' || reportScope === 'alzheimer') && analysisResults.alzheimer && (
                        <div className="border border-[#DDE7E1] p-5 rounded-xl bg-white">
                          <p className="text-xs text-[#78858A] font-bold uppercase mb-1">Alzheimer's Disease Evaluation</p>
                          <p className="text-xl font-bold text-[#3D8062] mb-1">{analysisResults.alzheimer.class}</p>
                          <p className="text-sm mb-3 font-semibold">Confidence: {analysisResults.alzheimer.confidence}%</p>
                          <div className="space-y-1.5 pt-2 border-t border-[#DDE7E1]">
                            {ALZHEIMER_CLASSES.map((c, i) => (
                              <div key={c} className="flex justify-between text-xs items-center">
                                <span className="text-[#78858A]">{c}</span>
                                <div className="flex-1 mx-3 h-1.5 bg-[#EEF4F0] rounded-full overflow-hidden">
                                  <div className="h-full bg-[#3D8062]" style={{ width: `${(analysisResults.alzheimer.probs[i] * 100)}%` }} />
                                </div>
                                <span className="font-semibold text-[#24333B]">{(analysisResults.alzheimer.probs[i] * 100).toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(reportScope === 'both' || reportScope === 'parkinson') && analysisResults.parkinson && (
                        <div className="border border-[#DDE7E1] p-5 rounded-xl bg-white">
                          <p className="text-xs text-[#78858A] font-bold uppercase mb-1">Parkinson's Disease Evaluation</p>
                          <p className="text-xl font-bold text-[#3D8062] mb-1">{analysisResults.parkinson.class}</p>
                          <p className="text-sm mb-3 font-semibold">Confidence: {analysisResults.parkinson.confidence}%</p>
                          <div className="space-y-1.5 pt-2 border-t border-[#DDE7E1]">
                            {PARKINSON_CLASSES.map((c, i) => (
                              <div key={c} className="flex justify-between text-xs items-center">
                                <span className="text-[#78858A]">{c}</span>
                                <div className="flex-1 mx-3 h-1.5 bg-[#EEF4F0] rounded-full overflow-hidden">
                                  <div className="h-full bg-[#3D8062]" style={{ width: `${(analysisResults.parkinson.probs[i] * 100)}%` }} />
                                </div>
                                <span className="font-semibold text-[#24333B]">{(analysisResults.parkinson.probs[i] * 100).toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Neuroimaging */}
                <div className="mb-12">
                  <h3 className="text-lg font-bold text-[#24333B] border-b border-[#DDE7E1] pb-2 mb-4 flex items-center">
                    <FileImage className="w-5 h-5 mr-2 text-[#3D8062]" /> Neuroimaging & Interpretability
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="text-center">
                        <p className="text-xs font-bold text-[#78858A] mb-2">Original MRI Slice</p>
                        <div className="bg-[#172127] rounded-xl p-2 h-48 flex items-center justify-center">
                          {mriPreview && <img src={mriPreview} className="object-contain max-h-full" alt="Original" />}
                        </div>
                     </div>
                     <div className="text-center">
                        <p className="text-xs font-bold text-[#78858A] mb-2">
                          {reportScope === 'alzheimer' ? 'Hippocampal Grad-CAM' : reportScope === 'parkinson' ? 'Midbrain Grad-CAM' : 'Integrated Grad-CAM'}
                        </p>
                        <div className="bg-[#172127] rounded-xl p-2 h-48 flex items-center justify-center overflow-hidden">
                          {analysisResults?.explainability?.heatmapUrl && !analysisResults.explainability.heatmapUrl.startsWith('data:image/svg') ? (
                            <img
                              src={analysisResults.explainability.heatmapUrl}
                              alt="Grad-CAM Saliency Overlay"
                              className="object-contain max-h-full rounded-lg"
                            />
                          ) : (
                            <div className="p-3 text-center text-gray-400 text-xs">
                              Visual explainability overlay unavailable
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                </div>

                {/* Clinical Review Status */}
                <div className="border-t border-[#DDE7E1] pt-6 flex justify-between items-end">
                  <div className="max-w-md">
                    <p className="text-[10px] text-[#78858A] uppercase font-semibold leading-tight">
                      Disclaimer: This report incorporates artificial intelligence decision support and is intended to assist clinical evaluation. Final diagnosis must be made by a licensed physician.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#24333B]">Reviewer: Not assigned</p>
                    <p className="text-xs text-[#78858A]">Status: PENDING CLINICAL REVIEW</p>
                  </div>
                </div>

              </div>
              </>
              )}

              {/* 3-Way Download Button Bar */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => setShowDownloadModal(true)}
                  className="flex items-center px-6 py-3 bg-[#3D8062] text-white rounded-[10px] font-bold hover:bg-[#346D54] transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Clinical Report (Choose Format)
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between mt-8 border-t border-[#DDE7E1] pt-6">
          <div>
            {currentStep > 1 && !isAnalyzing && (
              <button onClick={handleBack} className="flex items-center justify-center bg-[#EEF4F0] text-[#3D8062] rounded-[10px] px-8 h-11 font-bold hover:bg-[#DDE7E1] transition-colors cursor-pointer">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
              </button>
            )}
          </div>
          <div>
            {!isAnalyzing && (
              <button 
                onClick={handleNext} 
                disabled={(currentStep === 2 && !mriFile) || (currentStep === 5 && !analysisResults)}
                className={`flex items-center justify-center rounded-[10px] px-8 h-11 font-bold transition-colors cursor-pointer ${
                  ((currentStep === 2 && !mriFile) || (currentStep === 5 && !analysisResults)) ? 'bg-[#DDE7E1] text-[#78858A] cursor-not-allowed' : 'bg-[#3D8062] text-white hover:bg-[#346D54]'
                }`}
              >
                {currentStep === 2 ? 'Run AI Analysis' : currentStep === 5 ? (
                  <><Save className="w-5 h-5 mr-2" /> {isSaving ? 'Saving to Database...' : 'Save & Finalize Record'}</>
                ) : (
                  <>Next Step <ChevronRight className="w-5 h-5 ml-1" /></>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function NewAssessment() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F8F5] p-12 text-center text-[#78858A] flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3D8062] mb-3" />
          <p className="font-semibold">Loading Assessment Suite...</p>
        </div>
      }
    >
      <NewAssessmentContent />
    </Suspense>
  );
}
