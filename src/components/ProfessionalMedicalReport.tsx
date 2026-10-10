import React, { forwardRef } from 'react';

export type ReportScope = 'both' | 'alzheimer' | 'parkinson';

export interface MedicalReportProps {
  report: {
    id: string;
    patientId: string;
    assessmentType?: string;
    mriImage?: string | null;
    alzheimerClass?: string;
    alzheimerConfidence?: number;
    alzheimerProbs?: string | Record<string, number>;
    parkinsonClass?: string;
    parkinsonConfidence?: number;
    parkinsonProbs?: string | Record<string, number>;
    gradcamHeatmap?: string | null;
    clinicalNotes?: string;
    doctorReview?: string;
    status?: string;
    createdAt?: string;
    patient?: {
      id?: string;
      name?: string;
      age?: number;
      gender?: string;
      bloodPressure?: string;
      bloodSugar?: string;
      memoryInfo?: string;
      movementInfo?: string;
      medicalHistory?: string;
    };
  };
  scope: ReportScope;
}

export const ProfessionalMedicalReport = forwardRef<
  HTMLDivElement,
  MedicalReportProps
>(({ report, scope }, ref) => {
  const patient = report.patient || {
    id: report.patientId,
    name: '',
    age: undefined,
    gender: '',
    bloodPressure: '',
    bloodSugar: '',
    memoryInfo: '',
    movementInfo: '',
    medicalHistory: '',
  };

  const parseProbabilities = (
    value?: string | Record<string, number>
  ): Record<string, number> => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      return {};
    } catch {
      return {};
    }
  };

  const alzProbs = parseProbabilities(report.alzheimerProbs);
  const parkProbs = parseProbabilities(report.parkinsonProbs);

  const showAlzheimer = scope === 'alzheimer' || scope === 'both';
  const showParkinson = scope === 'parkinson' || scope === 'both';

  const reportTitle =
    scope === 'alzheimer'
      ? 'AI-Assisted Alzheimer’s MRI Assessment Report'
      : scope === 'parkinson'
      ? 'AI-Assisted Parkinson’s MRI Assessment Report'
      : 'AI-Assisted Dual Neuro-Diagnostic Assessment Report';

  const reportSubtitle =
    scope === 'alzheimer'
      ? "AI-Assisted Alzheimer's Disease MRI Classification (EfficientNet-B0 Exp 10)"
      : scope === 'parkinson'
      ? "AI-Assisted Parkinson's Disease Volumetric MRI Classification (EfficientNet-B0 Exp 06)"
      : 'AI-Assisted Dual Neuro-Diagnostic Volumetric MRI Assessment';

  const analysisDate = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not provided';

  const formatConfidence = (value?: number): string => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 'N/A';
    }
    return `${value.toFixed(1)}%`;
  };

  const getProbability = (value: unknown): number | null => {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    if (num <= 1) return num * 100;
    return num;
  };

  const ProbabilityBar = ({
    label,
    value,
    active = false,
  }: {
    label: string;
    value: number | null;
    active?: boolean;
  }) => {
    const percentage =
      value === null ? 0 : Math.max(0, Math.min(100, value));

    return (
      <div className="space-y-[2px]">
        <div className="flex items-center justify-between gap-2">
          <span
            className={
              active
                ? 'text-[8px] font-bold text-black'
                : 'text-[8px] text-gray-600'
            }
          >
            {label}
          </span>
          <span
            className={
              active
                ? 'text-[8px] font-bold text-[#174F59]'
                : 'text-[8px] font-semibold text-gray-600'
            }
          >
            {value === null ? '—' : `${percentage.toFixed(1)}%`}
          </span>
        </div>
        <div className="h-[5px] w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              active ? 'bg-[#174F59]' : 'bg-gray-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const AIResultCard = ({
    title,
    prediction,
    confidence,
    modelMeta,
  }: {
    title: string;
    prediction?: string;
    confidence?: number;
    modelMeta: string;
  }) => (
    <div className="border border-gray-300 rounded-md p-2.5 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#174F59]">
            {title}
          </div>
          <div className="text-[15px] leading-tight font-black mt-0.5 truncate">
            {prediction || 'Result unavailable'}
          </div>
          <div className="text-[6px] text-gray-500 font-mono mt-0.5">
            Model: {modelMeta}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[7px] uppercase tracking-wide text-gray-500">
            Model Confidence
          </div>
          <div className="text-[15px] leading-tight font-black text-[#174F59] mt-0.5">
            {formatConfidence(confidence)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      id="professional-doctor-report-pdf"
      className="w-full max-w-[820px] mx-auto bg-white text-black font-sans print:max-w-none print:w-full print:m-0"
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        className="border border-black bg-white"
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
        }}
      >
        {/* HEADER */}
        <div className="px-5 py-3 border-b border-black flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#174F59]">
              NeuroDiagnosis AI
            </div>
            <div className="text-[7px] uppercase tracking-[0.12em] text-gray-500 mt-0.5">
              Clinical Decision Support System
            </div>
          </div>
          <div className="text-right">
            <div className="text-[18px] font-black uppercase tracking-tight leading-none text-[#174F59]">
              {reportTitle}
            </div>
            <div className="text-[7px] text-gray-500 uppercase tracking-wide mt-1">
              {reportSubtitle}
            </div>
          </div>
        </div>

        {/* PATIENT DEMOGRAPHICS */}
        <div className="px-5 py-2 border-b border-black bg-gray-50">
          <div className="text-[7px] font-black uppercase tracking-[0.12em] mb-1.5 text-gray-700">
            Patient Demographics &amp; Assessment Information
          </div>
          <div className="grid grid-cols-6 gap-x-3 gap-y-1">
            <div className="col-span-2">
              <div className="text-[6px] uppercase font-bold text-gray-500">
                Patient Name
              </div>
              <div className="text-[9px] font-bold mt-[1px]">
                {patient.name || 'Not provided'}
              </div>
            </div>
            <div>
              <div className="text-[6px] uppercase font-bold text-gray-500">
                Age
              </div>
              <div className="text-[9px] font-bold mt-[1px]">
                {typeof patient.age === 'number'
                  ? `${patient.age} yrs`
                  : 'Not provided'}
              </div>
            </div>
            <div>
              <div className="text-[6px] uppercase font-bold text-gray-500">
                Gender
              </div>
              <div className="text-[9px] font-bold mt-[1px]">
                {patient.gender || 'Not provided'}
              </div>
            </div>
            <div>
              <div className="text-[6px] uppercase font-bold text-gray-500">
                Patient ID
              </div>
              <div className="text-[9px] font-bold font-mono text-[#174F59] mt-[1px]">
                {patient.id || report.patientId || 'Not provided'}
              </div>
            </div>
            <div>
              <div className="text-[6px] uppercase font-bold text-gray-500">
                Assessment ID
              </div>
              <div className="text-[9px] font-bold font-mono mt-[1px]">
                {report.id}
              </div>
            </div>
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-gray-300 flex items-center justify-between text-[7px]">
            <div>
              <span className="font-bold text-gray-500 uppercase">Analysis Date:</span>{' '}
              <span className="font-semibold">{analysisDate}</span>
            </div>
            <div className="text-gray-500 uppercase tracking-wide">
              Mode: {scope.toUpperCase()} | Non-Invasive MRI Evaluation
            </div>
          </div>
        </div>

        {/* AI PREDICTION CARDS */}
        <div className="px-5 py-2.5 border-b border-black">
          <div className="text-[7px] font-black uppercase tracking-[0.12em] mb-2 text-gray-700">
            Model Diagnostic Classification
          </div>
          <div
            className={
              showAlzheimer && showParkinson
                ? 'grid grid-cols-2 gap-3'
                : 'grid grid-cols-1'
            }
          >
            {showAlzheimer && (
              <AIResultCard
                title="Alzheimer's Disease Classification"
                prediction={report.alzheimerClass}
                confidence={report.alzheimerConfidence}
                modelMeta="EfficientNet-B0 (Exp 10 Checkpoint)"
              />
            )}
            {showParkinson && (
              <AIResultCard
                title="Parkinson's Disease Classification"
                prediction={report.parkinsonClass}
                confidence={report.parkinsonConfidence}
                modelMeta="EfficientNet-B0 (Exp 06 Volumetric)"
              />
            )}
          </div>
          {!report.alzheimerClass && !report.parkinsonClass && (
            <div className="border border-gray-300 rounded-md p-2.5 text-[8px] text-gray-500 text-center">
              No diagnostic classification result is available for this assessment.
            </div>
          )}
        </div>

        {/* MRI + GRAD-CAM VISUALIZATION */}
        <div className="px-5 py-2.5 border-b border-black">
          <div className="text-[7px] font-black uppercase tracking-[0.12em] mb-2 text-gray-700">
            Neuroimaging &amp; Explainable AI (Grad-CAM Saliency)
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* INPUT MRI */}
            <div className="border border-gray-300 rounded-md overflow-hidden bg-black">
              <div className="px-2 py-1 bg-[#111827] text-white text-[7px] font-bold uppercase tracking-wide text-center">
                Input MRI Slice
              </div>
              <div className="h-[175px] bg-black flex items-center justify-center overflow-hidden">
                {report.mriImage ? (
                  <img
                    src={report.mriImage}
                    alt="Input MRI Slice"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-4 text-center text-gray-400 text-[8px]">
                    MRI scan image unavailable
                  </div>
                )}
              </div>
              <div className="px-2 py-0.5 text-[6px] text-gray-400 text-center bg-[#111827]">
                Analyzed anatomical MRI slice
              </div>
            </div>

            {/* GENUINE GRAD-CAM OVERLAY */}
            <div className="border border-gray-300 rounded-md overflow-hidden bg-black">
              <div className="px-2 py-1 bg-[#111827] text-white text-[7px] font-bold uppercase tracking-wide text-center">
                Grad-CAM Activation Heatmap
              </div>
              <div className="h-[175px] bg-black flex items-center justify-center overflow-hidden">
                {report.gradcamHeatmap && !report.gradcamHeatmap.startsWith('data:image/svg') ? (
                  <img
                    src={report.gradcamHeatmap}
                    alt="Grad-CAM Saliency Overlay"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-4 text-center text-gray-400 flex flex-col items-center justify-center">
                    <span className="text-[8px] font-bold text-gray-300 mb-1">
                      Visual Explainability Unavailable
                    </span>
                    <span className="text-[6.5px] text-gray-400 max-w-[220px] leading-tight">
                      Genuine model gradient overlay was not computed or is unavailable for this record.
                    </span>
                  </div>
                )}
              </div>
              <div className="px-2 py-0.5 text-[6px] text-gray-400 text-center bg-[#111827]">
                Real model gradient saliency (ReLU hook)
              </div>
            </div>
          </div>
        </div>

        {/* MODEL PROBABILITIES */}
        <div className="px-5 py-2.5 border-b border-black">
          <div className="text-[7px] font-black uppercase tracking-[0.12em] mb-2 text-gray-700">
            Class Prediction Probabilities
          </div>
          <div
            className={
              showAlzheimer && showParkinson
                ? 'grid grid-cols-2 gap-4'
                : 'grid grid-cols-1'
            }
          >
            {showAlzheimer && (
              <div>
                <div className="text-[7px] font-bold uppercase tracking-wide mb-1.5 text-gray-600">
                  Alzheimer&apos;s Disease — 4-Class Softmax
                </div>
                <div className="space-y-1.5">
                  <ProbabilityBar
                    label="Non Demented"
                    value={getProbability(alzProbs.NonDemented)}
                    active={report.alzheimerClass === 'NonDemented'}
                  />
                  <ProbabilityBar
                    label="Very Mild Demented"
                    value={getProbability(alzProbs.VeryMildDemented)}
                    active={report.alzheimerClass === 'VeryMildDemented'}
                  />
                  <ProbabilityBar
                    label="Mild Demented"
                    value={getProbability(alzProbs.MildDemented)}
                    active={report.alzheimerClass === 'MildDemented'}
                  />
                  <ProbabilityBar
                    label="Moderate Demented"
                    value={getProbability(alzProbs.ModerateDemented)}
                    active={report.alzheimerClass === 'ModerateDemented'}
                  />
                </div>
              </div>
            )}

            {showParkinson && (
              <div className={showAlzheimer ? 'border-l border-gray-300 pl-4' : ''}>
                <div className="text-[7px] font-bold uppercase tracking-wide mb-1.5 text-gray-600">
                  Parkinson&apos;s Disease — Volumetric 5-Slice Mean
                </div>
                <div className="space-y-1.5">
                  <ProbabilityBar
                    label="Healthy Control (CO)"
                    value={getProbability(parkProbs.CO)}
                    active={
                      report.parkinsonClass === 'Healthy Control' ||
                      report.parkinsonClass === 'CO'
                    }
                  />
                  <ProbabilityBar
                    label="Parkinson's Disease (PD)"
                    value={getProbability(parkProbs.PD)}
                    active={
                      report.parkinsonClass === "Parkinson's Disease" ||
                      report.parkinsonClass === 'PD'
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STATUS & AUDIT */}
        <div className="px-5 py-2 border-b border-black bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[6px] uppercase font-bold text-gray-500 tracking-wide">
                AI Analysis Engine Status
              </div>
              <div className="text-[9px] font-black text-[#174F59] mt-0.5">
                {report.status || 'AI Analysis Completed'}
              </div>
            </div>
            <div>
              <div className="text-[6px] uppercase font-bold text-gray-500 tracking-wide">
                Clinical Diagnostic Review
              </div>
              <div className="text-[9px] font-black mt-0.5">
                {report.doctorReview ? 'Reviewed by Physician' : 'Pending Clinical Verification'}
              </div>
            </div>
          </div>
        </div>

        {/* MEDICAL DISCLAIMER */}
        <div className="px-5 py-2">
          <div className="text-[6.5px] leading-relaxed text-gray-500 text-center">
            <span className="font-bold text-gray-700">
              Research / Decision Support Notice:
            </span>{' '}
            This report presents AI-generated MRI classification and explainability output generated by trained deep learning architectures. It is intended solely for clinical research and decision support and does not constitute an independent, clinically validated medical diagnosis. All findings must be interpreted in conjunction with comprehensive clinical history, cognitive evaluations, and specialist radiological review.
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-300 px-5 py-1.5 flex items-center justify-between text-[6px] text-gray-400">
          <div className="uppercase tracking-wide">NeuroDiagnosis AI Research System</div>
          <div className="font-mono">Assessment ID: {report.id}</div>
          <div className="uppercase tracking-wide">Confidential Medical Assessment</div>
        </div>
      </div>
    </div>
  );
});

ProfessionalMedicalReport.displayName = 'ProfessionalMedicalReport';
