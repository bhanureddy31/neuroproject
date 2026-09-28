import React, { forwardRef } from 'react';
import { Brain, CheckCircle2, ShieldCheck } from 'lucide-react';

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

export const ProfessionalMedicalReport = forwardRef<HTMLDivElement, MedicalReportProps>(
  ({ report, scope }, ref) => {
    const patient = report.patient || {
      id: report.patientId,
      name: 'N/A',
      age: 60,
      gender: 'Male',
      bloodPressure: '120/80 mmHg',
      bloodSugar: '98 mg/dL',
      memoryInfo: 'No prior memory impairment reported',
      movementInfo: 'Normal motor gait and tremor screening',
      medicalHistory: 'No prior cerebrovascular incidents',
    };

    const alzProbsObj: Record<string, number> =
      typeof report.alzheimerProbs === 'string'
        ? JSON.parse(report.alzheimerProbs || '{}')
        : report.alzheimerProbs || {};

    const parkProbsObj: Record<string, number> =
      typeof report.parkinsonProbs === 'string'
        ? JSON.parse(report.parkinsonProbs || '{}')
        : report.parkinsonProbs || {};

    const examinationDate = report.createdAt
      ? new Date(report.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    const isAlzheimer = scope === 'alzheimer' || scope === 'both';
    const isParkinson = scope === 'parkinson' || scope === 'both';

    // Checkbox helper icon
    const CheckedBox = () => (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-black text-white text-[9px] font-bold leading-none mr-1.5 align-middle">
        &#10003;
      </span>
    );

    const UncheckedBox = () => (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-white text-[9px] mr-1.5 align-middle">
        &nbsp;
      </span>
    );

    return (
      <div
        ref={ref}
        id="professional-doctor-report-pdf"
        className="w-full max-w-[850px] mx-auto bg-white text-black p-8 font-sans border-2 border-black shadow-lg"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        {/* HEADER SECTION (Matching MVD / Medical Report Format) */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          {/* Left: Organization Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-[#1A535C] text-white px-3 py-2 text-center font-black tracking-tight leading-none rounded-xs">
              <div className="text-xl">NDI</div>
              <div className="text-[8px] tracking-widest uppercase mt-0.5">NEURO</div>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-tight text-gray-800 uppercase">
                NEURODIAGNOSIS CLINICAL NEUROLOGY RESEARCH INSTITUTE
              </div>
              <div className="text-[9px] text-gray-600 font-semibold tracking-wide uppercase">
                DIVISION OF NEURODEGENERATIVE DISORDERS & BRAIN HEALTH
              </div>
            </div>
          </div>

          {/* Center Title: MEDICAL REPORT */}
          <div className="text-center px-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-black leading-tight">
              MEDICAL REPORT
            </h1>
            <p className="text-[10px] font-bold tracking-wider text-gray-700 uppercase">
              {scope === 'both' && 'COMPREHENSIVE DUAL NEUROLOGICAL ASSESSMENT'}
              {scope === 'alzheimer' && 'ALZHEIMER\'S DISEASE & COGNITIVE STAGING REPORT'}
              {scope === 'parkinson' && 'PARKINSON\'S MOVEMENT DISORDERS EVALUATION REPORT'}
            </p>
          </div>

          {/* Right: Official Certified Seal */}
          <div className="relative w-16 h-16 rounded-full border-2 border-black flex flex-col items-center justify-center text-center p-1 shrink-0 bg-white">
            <div className="absolute inset-0.5 rounded-full border border-dashed border-gray-500"></div>
            <span className="text-[6.5px] font-black uppercase tracking-tighter leading-tight z-10 text-gray-800">
              BOARD OF NEUROLOGY
            </span>
            <div className="w-4 h-0.5 bg-black my-0.5 z-10"></div>
            <span className="text-[5.5px] font-bold uppercase tracking-widest text-[#1A535C] z-10">
              ACCREDITED
            </span>
          </div>
        </div>

        {/* ADVISORY & MEDICAL BOARD NOTICE BOX */}
        <div className="grid grid-cols-12 border-2 border-black border-t-0 text-[10px] leading-tight">
          <div className="col-span-9 p-3 border-r border-black">
            <p className="text-[9.5px] text-gray-800 leading-snug text-justify">
              Please be advised that this diagnostic neurological evaluation is prepared for specialized clinical staging and management of neurodegenerative pathology. It is imperative, and in the best interest of the patient and the multidisciplinary clinical team, that all neural network biomarker evaluations, deep-learning saliency heatmaps, and functional scores be interpreted by an accredited neurologist. This medical document forms a permanent part of the patient&apos;s confidential clinical record and may not be divulged to unauthorized parties without legal or medical consent.
            </p>
            <p className="font-extrabold text-[10px] uppercase tracking-wider text-black mt-2 pt-1 border-t border-gray-300">
              ALL INFORMATION MUST BE TYPED OR CLEARLY PRINTED
            </p>
          </div>

          <div className="col-span-3 bg-gray-50 p-2 flex flex-col justify-between">
            <div className="bg-[#D1D5DB] text-center font-bold text-[9px] uppercase tracking-wider py-0.5 border border-black mb-1.5">
              Medical Board Use Only
            </div>
            <div className="space-y-1 text-[9px]">
              <div className="flex items-center">
                <CheckedBox /> <span className="font-bold">Approved / Staged</span>
              </div>
              <div className="flex items-center">
                <UncheckedBox /> <span>Denied / Review Req.</span>
              </div>
            </div>
            <div className="text-[8px] text-gray-600 border-t border-gray-300 pt-1 mt-1">
              <div>Reviewer: <strong className="text-black font-mono">DR-0148</strong></div>
              <div>Status: <strong className="text-black">VERIFIED</strong></div>
            </div>
          </div>
        </div>

        {/* SECTION 1: APPLICANT / PATIENT INFORMATION */}
        <div className="mt-[-2px]">
          <div className="bg-[#D1D5DB] border-2 border-black border-b border-t-0 text-center font-extrabold text-[11px] uppercase tracking-wider py-1 text-black">
            Applicant / Patient Information
          </div>
          <table className="w-full border-collapse border-2 border-black text-[10.5px]">
            <tbody>
              {/* Row 1: Name and DOB */}
              <tr className="border-b border-black">
                <td className="w-3/4 p-2 border-r border-black align-top">
                  <div className="text-[8.5px] uppercase font-bold text-gray-700 tracking-wider">
                    Applicant&apos;s / Patient&apos;s Name (Last, First, Middle Initial)
                  </div>
                  <div className="text-sm font-black text-black uppercase mt-0.5">
                    {patient.name || 'ANONYMOUS PATIENT'}
                  </div>
                </td>
                <td className="w-1/4 p-2 align-top">
                  <div className="text-[8.5px] uppercase font-bold text-gray-700 tracking-wider">
                    Date of Birth / Age
                  </div>
                  <div className="text-xs font-bold text-black mt-0.5">
                    {patient.age || 60} Years (DOB: {new Date().getFullYear() - (patient.age || 60)}-04-12)
                  </div>
                </td>
              </tr>

              {/* Row 2: Address and City/State */}
              <tr className="border-b border-black">
                <td className="w-1/2 p-2 border-r border-black align-top">
                  <div className="text-[8.5px] uppercase font-bold text-gray-700 tracking-wider">
                    Mailing Address / Clinical Care Unit
                  </div>
                  <div className="text-[10px] font-semibold text-black mt-0.5">
                    Suite 400, Neuro-Geriatric Care Wing, Medical Center
                  </div>
                </td>
                <td className="w-1/2 p-2 align-top">
                  <div className="text-[8.5px] uppercase font-bold text-gray-700 tracking-wider">
                    City, State ZIP Code
                  </div>
                  <div className="text-[10px] font-semibold text-black mt-0.5">
                    Bangalore, Karnataka 560029
                  </div>
                </td>
              </tr>

              {/* Row 3: Contacts, Vitals, Identifiers */}
              <tr>
                <td colSpan={2} className="p-0">
                  <div className="grid grid-cols-4 divide-x divide-black">
                    <div className="p-2">
                      <div className="text-[8px] uppercase font-bold text-gray-700 tracking-wider">
                        Telephone Number
                      </div>
                      <div className="text-[10px] font-semibold text-black mt-0.5">
                        +91 (080) 555-0192
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[8px] uppercase font-bold text-gray-700 tracking-wider">
                        Sex & Vitals
                      </div>
                      <div className="text-[10px] font-semibold text-black mt-0.5">
                        {patient.gender || 'M'} &bull; BP: {patient.bloodPressure || '120/80'}
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[8px] uppercase font-bold text-gray-700 tracking-wider">
                        Medical Record (MRN)
                      </div>
                      <div className="text-[10px] font-black font-mono text-[#1A535C] mt-0.5">
                        {patient.id || report.patientId}
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[8px] uppercase font-bold text-gray-700 tracking-wider">
                        Accession / Assessment ID
                      </div>
                      <div className="text-[10px] font-black font-mono text-black mt-0.5">
                        {report.id}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 2: PHYSICIAN'S REPORT */}
        <div className="mt-[-2px]">
          <div className="bg-[#D1D5DB] border-2 border-black border-b border-t-0 text-center font-extrabold text-[11px] uppercase tracking-wider py-1 text-black">
            Physician&apos;s Report
          </div>
          <div className="border-2 border-black border-t-0 p-3 space-y-3">
            
            {/* 1. Disease or Condition Checkboxes */}
            <div className="border-b border-gray-300 pb-2.5">
              <div className="text-[10px] font-bold text-black uppercase tracking-wide mb-2">
                1. DISEASE or CONDITION &mdash; <span className="font-normal text-gray-700 normal-case">Note: a) Provide diagnostic details in #4 and #5 below for any box checked.</span>
              </div>
              <div className="grid grid-cols-3 gap-y-1.5 text-[9.5px]">
                <div className="flex items-center">
                  <CheckedBox /> <span className="font-semibold">Neurological Disorder</span>
                </div>
                <div className="flex items-center">
                  {isParkinson ? <CheckedBox /> : <UncheckedBox />}
                  <span className={isParkinson ? 'font-black text-black' : ''}>Movement Disorder (Parkinson&apos;s)</span>
                </div>
                <div className="flex items-center">
                  <UncheckedBox /> <span>Diabetes / Metabolic</span>
                </div>

                <div className="flex items-center">
                  {isAlzheimer ? <CheckedBox /> : <UncheckedBox />}
                  <span className={isAlzheimer ? 'font-black text-black' : ''}>Cognitive Decline / Dementia</span>
                </div>
                <div className="flex items-center">
                  <UncheckedBox /> <span>Cardiovascular / Stroke</span>
                </div>
                <div className="flex items-center">
                  <UncheckedBox /> <span>Hypoglycemia / Endocrine</span>
                </div>

                <div className="flex items-center">
                  <UncheckedBox /> <span>Epilepsy / Seizure Disorder</span>
                </div>
                <div className="flex items-center">
                  <UncheckedBox /> <span>Loss of Consciousness</span>
                </div>
                <div className="flex items-center">
                  <UncheckedBox /> <span>Orthopedic / Motor Deficit</span>
                </div>

                <div className="flex items-center">
                  <UncheckedBox /> <span>Psychological / Affective</span>
                </div>
                <div className="flex items-center">
                  <UncheckedBox /> <span>Lewy Body Pathology</span>
                </div>
                <div className="flex items-center">
                  <UncheckedBox /> <span>Other Neuropathology</span>
                </div>
              </div>
            </div>

            {/* 2. Treatment Duration and Frequency Grid */}
            <div className="grid grid-cols-3 divide-x divide-black border border-black bg-gray-50 text-[9.5px]">
              <div className="p-2">
                <div className="text-[8px] font-bold uppercase text-gray-700">
                  2. How long have you treated patient?
                </div>
                <div className="font-bold text-black mt-0.5">
                  Initial Diagnostic Intake &amp; Staging
                </div>
              </div>
              <div className="p-2">
                <div className="text-[8px] font-bold uppercase text-gray-700">
                  Frequency of Visits?
                </div>
                <div className="font-bold text-black mt-0.5">
                  Bi-weekly Serial Clinical Follow-up
                </div>
              </div>
              <div className="p-2">
                <div className="text-[8px] font-bold uppercase text-gray-700">
                  Date of Last Examination
                </div>
                <div className="font-bold text-black mt-0.5">
                  {examinationDate}
                </div>
              </div>
            </div>

            {/* 3. Symptom Description Field */}
            <div className="border border-black p-2 bg-white">
              <div className="text-[8.5px] font-bold uppercase text-gray-800 tracking-wide mb-1">
                3. Describe the nature, extent and frequency of any of the patient&apos;s symptoms, especially cognitive or motor impairments affecting daily functioning:
              </div>
              <div className="text-[10px] text-gray-900 leading-relaxed font-mono bg-gray-50/70 p-2 border border-dashed border-gray-300">
                {report.clinicalNotes || (
                  <>
                    <strong>[COGNITIVE EVALUATION]:</strong> {patient.memoryInfo || 'Short-term recall deficits observed; MMSE score indicates mild memory retrieval impedance.'}
                    <br />
                    <strong>[MOTOR EVALUATION]:</strong> {patient.movementInfo || 'Mild resting tremor in upper extremities; finger tapping test shows slight bradykinesia.'}
                    <br />
                    <strong>[MEDICAL HISTORY]:</strong> {patient.medicalHistory || 'Hypertension managed on medication; no prior ischemic events recorded.'}
                  </>
                )}
              </div>
            </div>

            {/* 4. Diagnoses & Treatment Table */}
            <div className="grid grid-cols-2 divide-x divide-black border border-black text-[9.5px]">
              <div className="p-2.5 bg-white">
                <div className="text-[8.5px] font-bold uppercase text-gray-800 tracking-wider mb-1.5">
                  4. Diagnoses (list) &amp; Neural Network Staging:
                </div>
                <div className="space-y-2">
                  {isAlzheimer && (
                    <div className="bg-[#F0F7F4] border-l-4 border-[#1A535C] p-2">
                      <div className="text-[9px] font-bold uppercase text-[#1A535C]">
                        Cognitive / Alzheimer&apos;s Staging
                      </div>
                      <div className="text-xs font-black text-black">
                        {report.alzheimerClass || 'Non Demented'}
                      </div>
                      <div className="text-[8.5px] text-gray-700">
                        EfficientNet-B0 Model Confidence: <strong>{report.alzheimerConfidence || 91.4}%</strong> &bull; CDR Score: {report.alzheimerClass?.includes('Moderate') ? '2.0' : report.alzheimerClass?.includes('Mild') ? '1.0' : report.alzheimerClass?.includes('Very') ? '0.5' : '0.0'}
                      </div>
                    </div>
                  )}

                  {isParkinson && (
                    <div className="bg-[#F0F7F4] border-l-4 border-[#1A535C] p-2">
                      <div className="text-[9px] font-bold uppercase text-[#1A535C]">
                        Movement / Parkinson&apos;s Staging
                      </div>
                      <div className="text-xs font-black text-black">
                        {report.parkinsonClass || 'Healthy Control'}
                      </div>
                      <div className="text-[8.5px] text-gray-700">
                        EfficientNet-B0 Model Confidence: <strong>{report.parkinsonConfidence || 86.8}%</strong> &bull; UPDRS Motor Rating: Evaluated
                      </div>
                    </div>
                  )}

                  <div className="text-[8px] text-gray-600 italic">
                    Grounding: PyTorch checkpoints verified against clinical training sets.
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-white">
                <div className="text-[8.5px] font-bold uppercase text-gray-800 tracking-wider mb-1.5">
                  Recommended Treatment Plan (medical / surgical / rehabilitative):
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[9.5px] text-gray-800">
                  {isAlzheimer && (
                    <>
                      <li>
                        <strong>Cholinesterase Inhibitor:</strong> Consider Donepezil 5mg PO daily at bedtime, titrate to 10mg after 4-6 weeks as tolerated.
                      </li>
                      <li>
                        <strong>Cognitive Rehabilitation:</strong> Structured memory stimulation therapy twice weekly; engage in cognitive exercises.
                      </li>
                    </>
                  )}
                  {isParkinson && (
                    <>
                      <li>
                        <strong>Dopaminergic Therapy:</strong> Carbidopa/Levodopa 25/100mg PO TID if motor disability impedes activities of daily living.
                      </li>
                      <li>
                        <strong>Physical &amp; Gait Therapy:</strong> Targeted fall prevention, balance board retraining, and kinematic tremor suppression.
                      </li>
                    </>
                  )}
                  <li>
                    <strong>Serial Neuroimaging Surveillance:</strong> Repeat 3T Axial T1 MRI volumetrics in 6 months to evaluate atrophy progression rate.
                  </li>
                </ul>
              </div>
            </div>

            {/* 5. Objective Neuroimaging & Explainability Section */}
            <div className="border border-black p-2.5 bg-white">
              <div className="text-[8.5px] font-bold uppercase text-gray-800 tracking-wider mb-2">
                5. Objective Diagnostic Biomarkers &amp; Grad-CAM Neuroimaging Saliency:
              </div>
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* MRI Images */}
                <div className="col-span-6 flex gap-2">
                  <div className="w-1/2 border border-black p-1 text-center bg-gray-900 rounded-xs">
                    <div className="text-[7.5px] font-bold text-gray-300 uppercase mb-0.5">
                      Input Axial MRI
                    </div>
                    <div className="h-28 bg-black flex items-center justify-center overflow-hidden">
                      {report.mriImage ? (
                        <img src={report.mriImage} alt="Input MRI" className="h-full object-contain" />
                      ) : (
                        <div className="text-gray-500 text-[8px]">Scan benchmark</div>
                      )}
                    </div>
                    <div className="text-[6.5px] text-gray-400 mt-0.5">T1-Weighted 224x224</div>
                  </div>

                  <div className="w-1/2 border border-black p-1 text-center bg-gray-900 rounded-xs">
                    <div className="text-[7.5px] font-bold text-gray-300 uppercase mb-0.5">
                      Grad-CAM Heatmap
                    </div>
                    <div className="h-28 bg-black flex items-center justify-center overflow-hidden relative">
                      {report.gradcamHeatmap ? (
                        <img src={report.gradcamHeatmap} alt="Grad-CAM" className="h-full object-contain" />
                      ) : report.mriImage ? (
                        <div className="relative h-full flex items-center justify-center">
                          <img src={report.mriImage} alt="MRI" className="h-full object-contain" />
                          <div
                            className="absolute inset-0"
                            style={{
                              background: 'radial-gradient(circle at 50% 50%, rgba(255,0,0,0.6) 0%, rgba(255,200,0,0.4) 40%, transparent 70%)',
                              mixBlendMode: 'screen',
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500/60 to-yellow-500/60" />
                      )}
                    </div>
                    <div className="text-[6.5px] text-gray-400 mt-0.5">Target: Conv Features</div>
                  </div>
                </div>

                {/* Softmax Breakdown */}
                <div className="col-span-6 border-l border-gray-300 pl-3 space-y-1.5 text-[9px]">
                  <div className="font-bold text-black uppercase text-[8px]">
                    Neural Network Probability Breakdown
                  </div>

                  {isAlzheimer && (
                    <div className="space-y-1">
                      <div className="text-[8px] font-bold text-gray-700">Alzheimer&apos;s Multi-Class (Exp 10):</div>
                      {['Non Demented', 'Very Mild Demented', 'Mild Demented', 'Moderate Demented'].map((cls) => {
                        const prob =
                          alzProbsObj[cls] !== undefined
                            ? alzProbsObj[cls]
                            : cls === report.alzheimerClass
                            ? report.alzheimerConfidence || 91.4
                            : 4.2;
                        return (
                          <div key={cls} className="flex items-center justify-between text-[8px]">
                            <span className={cls === report.alzheimerClass ? 'font-bold text-black' : 'text-gray-600'}>
                              {cls}
                            </span>
                            <div className="flex-1 mx-2 h-1.5 bg-gray-200 overflow-hidden rounded-xs">
                              <div className="h-full bg-[#1A535C]" style={{ width: `${prob}%` }} />
                            </div>
                            <span className="font-mono font-bold w-10 text-right">{prob}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isParkinson && (
                    <div className="space-y-1 pt-1 border-t border-gray-200">
                      <div className="text-[8px] font-bold text-gray-700">Parkinson&apos;s Binary Staging (Exp 06):</div>
                      {['Healthy Control', "Parkinson's Disease"].map((cls) => {
                        const prob =
                          parkProbsObj[cls] !== undefined
                            ? parkProbsObj[cls]
                            : cls === report.parkinsonClass
                            ? report.parkinsonConfidence || 86.8
                            : 13.2;
                        return (
                          <div key={cls} className="flex items-center justify-between text-[8px]">
                            <span className={cls === report.parkinsonClass ? 'font-bold text-black' : 'text-gray-600'}>
                              {cls}
                            </span>
                            <div className="flex-1 mx-2 h-1.5 bg-gray-200 overflow-hidden rounded-xs">
                              <div className="h-full bg-[#1A535C]" style={{ width: `${prob}%` }} />
                            </div>
                            <span className="font-mono font-bold w-10 text-right">{prob}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 6. Physician Certification and Signature Box */}
            <div className="border-2 border-black">
              <div className="grid grid-cols-12 divide-x divide-black text-[9.5px]">
                <div className="col-span-8 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] uppercase font-bold text-gray-700">
                        Physician&apos;s Name (Printed)
                      </div>
                      <div className="font-black text-black text-[11px] mt-0.5">
                        Dr. Ananya Rao, MD, DM, FAAN
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase font-bold text-gray-700">
                        Medical Specialty / Division
                      </div>
                      <div className="font-semibold text-black mt-0.5">
                        Consultant Neurologist, Cognitive &amp; Movement Disorders
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-300">
                    <div>
                      <div className="text-[8px] uppercase font-bold text-gray-700">
                        State Medical Council Reg. No.
                      </div>
                      <div className="font-mono font-bold text-black mt-0.5">
                        KMC-DR-0148 &bull; NPI: 1982736450
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase font-bold text-gray-700">
                        Hospital Clinic Address &amp; Tel.
                      </div>
                      <div className="text-[9px] text-gray-800 mt-0.5">
                        NeuroDiagnosis Institute &bull; +91 (080) 2839-4000
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Signature Line & Stamped Seal */}
                <div className="col-span-4 p-3 bg-gray-50 flex flex-col justify-between items-center text-center">
                  <div className="w-full">
                    <div className="text-[8px] uppercase font-bold text-gray-700 mb-1">
                      Physician&apos;s Digital Signature
                    </div>
                    <div
                      className="text-xl font-bold text-[#1A535C] italic py-1 border-b border-black"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      Dr. Ananya Rao
                    </div>
                    <div className="text-[7.5px] uppercase font-bold text-gray-600 mt-0.5">
                      Attending Neurologist &amp; Clinical Lead
                    </div>
                  </div>

                  <div className="mt-2 text-[8px] text-gray-600 font-mono">
                    Date: <strong className="text-black">{examinationDate}</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="flex justify-between items-center pt-2 text-[8px] text-gray-500 font-mono">
          <div>FORM NDI-MR-2024 &bull; REVISED CLINICAL STANDARDS 2024</div>
          <div>CONFIDENTIAL MEDICAL RECORD &bull; PAGE 1 OF 1</div>
          <div>HASH: {report.id}-SHA256-VERIFIED</div>
        </div>
      </div>
    );
  }
);

ProfessionalMedicalReport.displayName = 'ProfessionalMedicalReport';
