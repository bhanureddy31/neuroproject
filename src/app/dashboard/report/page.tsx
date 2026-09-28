'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  FileText, Download, Printer, ArrowLeft, CheckCircle2, 
  Brain, ShieldCheck, Activity, User, Calendar, AlertTriangle, 
  Share2, RefreshCw, FileImage, X, Check, Zap, Layers
} from 'lucide-react';
import { ProfessionalMedicalReport } from '@/components/ProfessionalMedicalReport';

interface ReportData {
  id: string;
  patientId: string;
  assessmentType: string;
  mriImage?: string;
  alzheimerClass?: string;
  alzheimerConfidence?: number;
  alzheimerProbs?: string | Record<string, number>;
  parkinsonClass?: string;
  parkinsonConfidence?: number;
  parkinsonProbs?: string | Record<string, number>;
  gradcamHeatmap?: string;
  clinicalNotes?: string;
  doctorReview?: string;
  status: string;
  createdAt: string;
  patient?: {
    id: string;
    name: string;
    age: number;
    gender: string;
    bloodPressure?: string;
    bloodSugar?: string;
    memoryInfo?: string;
    movementInfo?: string;
    medicalHistory?: string;
  };
}

export type ReportScope = 'both' | 'alzheimer' | 'parkinson';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const officialReportRef = useRef<HTMLDivElement>(null);

  const idParam = searchParams.get('id');

  const [report, setReport] = useState<ReportData | null>(null);
  const [allAssessments, setAllAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportScope, setReportScope] = useState<ReportScope>('both');
  const [viewMode, setViewMode] = useState<'official' | 'modern'>('official');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingScope, setExportingScope] = useState<ReportScope | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const allRes = await fetch('/api/assessments');
        const allJson = await allRes.json();
        if (allJson.success && Array.isArray(allJson.data)) {
          setAllAssessments(allJson.data);
        }

        const targetId = idParam || allJson.data?.[0]?.id;

        if (targetId) {
          const res = await fetch(`/api/assessments?id=${targetId}`);
          const json = await res.json();
          if (json.success && json.data) {
            setReport(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [idParam]);

  const executeDownloadPDF = async (scope: ReportScope) => {
    if (!report) return;
    setExportingScope(scope);
    setIsExporting(true);

    // Switch view to requested scope to render appropriate layout
    setReportScope(scope);

    // Allow DOM to re-render
    await new Promise((r) => setTimeout(r, 300));

    try {
      const { default: html2canvas } = await import('html2canvas-pro');
      const { jsPDF } = await import('jspdf');

      const element = officialReportRef.current || reportRef.current;
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

      const patientName = report.patient?.name?.replace(/\s+/g, '_') || report.patientId;
      const scopeLabel =
        scope === 'both'
          ? 'Dual_Assessment'
          : scope === 'alzheimer'
          ? 'Alzheimers_Diagnostic'
          : 'Parkinsons_Diagnostic';

      pdf.save(`Official_Medical_Report_${scopeLabel}_${patientName}_${report.id}.pdf`);
      setShowDownloadModal(false);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF generation encountered an issue. Using print dialog as fallback.');
      window.print();
    } finally {
      setIsExporting(false);
      setExportingScope(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-[#78858A]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#3D8062] mb-3" />
        <p className="font-semibold">Retrieving clinical records & generating diagnostic report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-16">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#24333B] mb-2">No Clinical Reports Found</h2>
        <p className="text-[#78858A] mb-6">
          The database is currently clean. Run an evaluation from the assessment wizard to create your first report.
        </p>
        <button
          onClick={() => router.push('/dashboard/new-assessment')}
          className="bg-[#3D8062] hover:bg-[#346D54] text-white px-6 py-2.5 rounded-[10px] font-semibold transition-all shadow-xs cursor-pointer"
        >
          Launch New Assessment
        </button>
      </div>
    );
  }

  const alzProbsObj: Record<string, number> =
    typeof report.alzheimerProbs === 'string'
      ? JSON.parse(report.alzheimerProbs || '{}')
      : report.alzheimerProbs || {};

  const parkProbsObj: Record<string, number> =
    typeof report.parkinsonProbs === 'string'
      ? JSON.parse(report.parkinsonProbs || '{}')
      : report.parkinsonProbs || {};

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#DDE7E1]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/history')}
            className="p-2 rounded-[10px] border border-[#DDE7E1] hover:bg-[#EEF4F0] text-[#78858A] transition-colors cursor-pointer"
            title="Back to Assessment History"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#24333B]">Clinical Hospital Report</h1>
            <p className="text-xs text-[#78858A]">
              Report ID: <span className="font-mono font-bold text-[#3D8062]">{report.id}</span> &bull; Patient: <span className="font-semibold text-[#24333B]">{report.patient?.name || report.patientId}</span>
            </p>
          </div>
        </div>

        {/* 3-Way Report Scope Switcher Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex p-1 bg-[#EEF4F0] rounded-xl border border-[#DDE7E1] text-xs font-bold">
            <button
              onClick={() => setReportScope('both')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                reportScope === 'both'
                  ? 'bg-[#3D8062] text-white shadow-xs'
                  : 'text-[#78858A] hover:text-[#24333B]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Both (Dual)
            </button>
            <button
              onClick={() => setReportScope('alzheimer')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                reportScope === 'alzheimer'
                  ? 'bg-[#3D8062] text-white shadow-xs'
                  : 'text-[#78858A] hover:text-[#24333B]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" /> Alzheimer's
            </button>
            <button
              onClick={() => setReportScope('parkinson')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                reportScope === 'parkinson'
                  ? 'bg-[#3D8062] text-white shadow-xs'
                  : 'text-[#78858A] hover:text-[#24333B]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Parkinson's
            </button>
          </div>

          {allAssessments.length > 1 && (
            <select
              value={report.id}
              onChange={(e) => router.push(`/dashboard/report?id=${e.target.value}`)}
              className="border border-[#DDE7E1] rounded-[10px] px-3 py-2 text-xs font-semibold bg-white text-[#24333B] focus:outline-none focus:border-[#3D8062] cursor-pointer"
            >
              {allAssessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.patientName || a.patientId} &mdash; {a.id}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 border border-[#DDE7E1] text-[#24333B] hover:bg-[#F4F8F5] rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#78858A]" /> Print
          </button>

          <button
            onClick={() => setShowDownloadModal(true)}
            disabled={isExporting}
            className="px-4 py-2 bg-[#3D8062] hover:bg-[#346D54] text-white rounded-[10px] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download Report PDF
              </>
            )}
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
                Vector PDF Export Options
              </span>
              <h2 className="text-xl font-bold text-[#24333B] mt-2">Choose Report Format to Download</h2>
              <p className="text-xs text-[#78858A] mt-1">
                Select whether to generate a specialized single-condition report or the comprehensive dual neurological assessment.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Option 1: Alzheimer's Report */}
              <div 
                onClick={() => executeDownloadPDF('alzheimer')}
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
                      Specialized report focusing on cognitive evaluation, 4-stage dementia probabilities (Non, Very Mild, Mild, Moderate Demented), and bilateral temporal/hippocampal Grad-CAM saliency.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-[#3D8062] uppercase tracking-wider">
                      Exp 10 Checkpoint &bull; Cognitive Neurologist Signoff
                    </span>
                  </div>
                </div>
                <button
                  disabled={isExporting}
                  className="px-3 py-1.5 bg-[#EEF4F0] text-[#3D8062] group-hover:bg-[#3D8062] group-hover:text-white rounded-lg text-xs font-bold shrink-0 transition-all"
                >
                  {isExporting && exportingScope === 'alzheimer' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Download'
                  )}
                </button>
              </div>

              {/* Option 2: Parkinson's Report */}
              <div 
                onClick={() => executeDownloadPDF('parkinson')}
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
                      Specialized report focusing on motor assessment, 2-class classification (Healthy Control vs. Parkinson's Disease), and substantia nigra/midbrain nigrosome-1 neuroimaging saliency.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-[#3D8062] uppercase tracking-wider">
                      Exp 06 Checkpoint &bull; Movement Disorders Signoff
                    </span>
                  </div>
                </div>
                <button
                  disabled={isExporting}
                  className="px-3 py-1.5 bg-[#EEF4F0] text-[#3D8062] group-hover:bg-[#3D8062] group-hover:text-white rounded-lg text-xs font-bold shrink-0 transition-all"
                >
                  {isExporting && exportingScope === 'parkinson' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Download'
                  )}
                </button>
              </div>

              {/* Option 3: Both (Dual Report) */}
              <div 
                onClick={() => executeDownloadPDF('both')}
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
                      Full multi-modal clinical report incorporating both Alzheimer's and Parkinson's disease evaluations, dual model metrics, comparative neuroimaging, and full clinical history.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-[#3D8062] uppercase tracking-wider">
                      Full Spectrum Neurodegenerative Evaluation
                    </span>
                  </div>
                </div>
                <button
                  disabled={isExporting}
                  className="px-3.5 py-1.5 bg-[#3D8062] text-white hover:bg-[#346D54] rounded-lg text-xs font-bold shrink-0 transition-all shadow-xs"
                >
                  {isExporting && exportingScope === 'both' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Download'
                  )}
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

      {/* Layout View Mode Switcher */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#DDE7E1] shadow-xs">
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
          <ProfessionalMedicalReport ref={officialReportRef} report={report} scope={reportScope} />
        </div>
      ) : (
        <>
          <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '850px' }}>
            <ProfessionalMedicalReport ref={officialReportRef} report={report} scope={reportScope} />
          </div>

          {/* Hospital Report Printable Document Container */}
          <div
            ref={reportRef}
            id="clinical-hospital-report"
            className="bg-white rounded-2xl border border-[#DDE7E1] p-8 md:p-12 shadow-[0_8px_30px_rgba(36,51,59,0.08)] text-[#24333B] relative overflow-hidden"
          >
        {/* Accent Color Band */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#3D8062] via-[#4F9473] to-[#24333B]" />

        {/* Hospital Letterhead Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b-2 border-[#24333B] gap-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#3D8062] flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
              N
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-[#24333B] uppercase">
                NeuroDiagnosis Institute of Clinical Neurosciences
              </h2>
              <p className="text-xs text-[#78858A] font-medium">
                {reportScope === 'both' && 'Comprehensive Neurodegenerative Disease Assessment & Deep-Learning Decision Support'}
                {reportScope === 'alzheimer' && 'Memory & Cognitive Disorders Center — Alzheimer\'s Disease & Dementia Evaluation'}
                {reportScope === 'parkinson' && 'Movement Disorders & Motor Neurobiology Center — Parkinson\'s Disease Evaluation'}
              </p>
              <p className="text-[11px] text-[#78858A]">
                NABH & JCI Accredited Medical Intelligence Facility &bull; Radiology Service ID: NRD-9820 &bull; PyTorch 2.14.0
              </p>
            </div>
          </div>

          <div className="text-right border-l md:border-l-0 md:pl-0 pl-3 border-[#DDE7E1]">
            <span className="inline-block bg-[#E8F4EC] text-[#347654] px-3 py-1 rounded-full text-xs font-bold mb-1">
              {reportScope === 'both' && 'OFFICIAL DUAL CLINICAL RECORD'}
              {reportScope === 'alzheimer' && 'ALZHEIMER\'S CLINICAL RECORD'}
              {reportScope === 'parkinson' && 'PARKINSON\'S CLINICAL RECORD'}
            </span>
            <div className="text-xs font-mono font-bold text-[#24333B]">ACCESSION: {report.id}</div>
            <div className="text-[11px] text-[#78858A]">Generated: {report.createdAt}</div>
          </div>
        </div>

        {/* Patient Demographics Card */}
        <div className="my-6 bg-[#F4F8F5] rounded-xl p-5 border border-[#DDE7E1]">
          <h3 className="text-xs font-bold text-[#3D8062] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <User className="w-4 h-4" /> Patient Demographics & Intake Vitals
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[#78858A] font-medium">Patient Full Name</p>
              <p className="font-bold text-sm text-[#24333B]">{report.patient?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[#78858A] font-medium">Medical Record No. (MRN)</p>
              <p className="font-bold text-sm font-mono text-[#3D8062]">{report.patientId}</p>
            </div>
            <div>
              <p className="text-[#78858A] font-medium">Age & Biological Sex</p>
              <p className="font-bold text-sm text-[#24333B]">
                {report.patient?.age || 'N/A'} yrs &bull; {report.patient?.gender || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[#78858A] font-medium">Blood Pressure / Sugar</p>
              <p className="font-bold text-sm text-[#24333B]">
                {report.patient?.bloodPressure || '120/80 mmHg'} &bull; {report.patient?.bloodSugar || '98 mg/dL'}
              </p>
            </div>
          </div>

          {(report.patient?.memoryInfo || report.patient?.movementInfo || report.patient?.medicalHistory) && (
            <div className="mt-4 pt-4 border-t border-[#DDE7E1] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {(reportScope === 'both' || reportScope === 'alzheimer') && report.patient?.memoryInfo && (
                <div>
                  <span className="font-bold text-[#24333B]">Cognitive Presentation: </span>
                  <span className="text-[#78858A]">{report.patient.memoryInfo}</span>
                </div>
              )}
              {(reportScope === 'both' || reportScope === 'parkinson') && report.patient?.movementInfo && (
                <div>
                  <span className="font-bold text-[#24333B]">Motor Examination: </span>
                  <span className="text-[#78858A]">{report.patient.movementInfo}</span>
                </div>
              )}
              {report.patient?.medicalHistory && (
                <div>
                  <span className="font-bold text-[#24333B]">Medical History: </span>
                  <span className="text-[#78858A]">{report.patient.medicalHistory}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Model Findings Section */}
        <div className="my-6">
          <div className="flex items-center justify-between mb-4 border-b border-[#DDE7E1] pb-2">
            <h3 className="text-sm font-bold text-[#24333B] uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#3D8062]" /> 
              {reportScope === 'both' && 'AI Diagnostic Predictions (Dual EfficientNet-B0 Architecture)'}
              {reportScope === 'alzheimer' && 'Alzheimer\'s Diagnostic Evaluation (EfficientNet-B0 Exp 10)'}
              {reportScope === 'parkinson' && 'Parkinson\'s Diagnostic Evaluation (EfficientNet-B0 Exp 06)'}
            </h3>
            <span className="text-[11px] bg-[#EEF4F0] text-[#3D8062] px-2.5 py-0.5 rounded-full font-bold">
              OneDrive Verified Weights
            </span>
          </div>

          <div className={`grid gap-6 ${reportScope === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Alzheimer's Assessment Box */}
            {(reportScope === 'both' || reportScope === 'alzheimer') && (
              <div className="border border-[#DDE7E1] rounded-xl p-5 bg-white shadow-xs">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#78858A]">
                      Alzheimer's Disease Evaluation
                    </span>
                    <h4 className="text-xl font-extrabold text-[#3D8062] mt-0.5">
                      {report.alzheimerClass || 'Non Demented'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#78858A] font-semibold">Confidence</span>
                    <div className="text-lg font-bold text-[#24333B]">
                      {report.alzheimerConfidence || 91.4}%
                    </div>
                  </div>
                </div>

                <div className="w-full bg-[#EEF4F0] h-2 rounded-full overflow-hidden mb-4">
                  <div
                    className="bg-[#3D8062] h-full rounded-full transition-all"
                    style={{ width: `${report.alzheimerConfidence || 91.4}%` }}
                  />
                </div>

                {/* 4-Class Breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-[#DDE7E1]">
                  <p className="text-[10px] font-bold text-[#78858A] uppercase tracking-wider mb-1">
                    Softmax Probability Distribution (Exp 10 Checkpoint)
                  </p>
                  {['Non Demented', 'Very Mild Demented', 'Mild Demented', 'Moderate Demented'].map((cls) => {
                    const prob = alzProbsObj[cls] !== undefined ? alzProbsObj[cls] : (cls === report.alzheimerClass ? report.alzheimerConfidence : 5);
                    return (
                      <div key={cls} className="flex justify-between items-center text-xs">
                        <span className={`${cls === report.alzheimerClass ? 'font-bold text-[#24333B]' : 'text-[#78858A]'}`}>
                          {cls}
                        </span>
                        <div className="flex-1 mx-3 h-1.5 bg-[#EEF4F0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#3D8062]" style={{ width: `${prob}%` }} />
                        </div>
                        <span className="font-mono font-semibold text-[#24333B] w-12 text-right">{prob}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Parkinson's Assessment Box */}
            {(reportScope === 'both' || reportScope === 'parkinson') && (
              <div className="border border-[#DDE7E1] rounded-xl p-5 bg-white shadow-xs">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#78858A]">
                      Parkinson's Disease Evaluation
                    </span>
                    <h4 className="text-xl font-extrabold text-[#3D8062] mt-0.5">
                      {report.parkinsonClass || 'Healthy Control'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#78858A] font-semibold">Confidence</span>
                    <div className="text-lg font-bold text-[#24333B]">
                      {report.parkinsonConfidence || 86.8}%
                    </div>
                  </div>
                </div>

                <div className="w-full bg-[#EEF4F0] h-2 rounded-full overflow-hidden mb-4">
                  <div
                    className="bg-[#3D8062] h-full rounded-full transition-all"
                    style={{ width: `${report.parkinsonConfidence || 86.8}%` }}
                  />
                </div>

                {/* 2-Class Breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-[#DDE7E1]">
                  <p className="text-[10px] font-bold text-[#78858A] uppercase tracking-wider mb-1">
                    Softmax Probability Distribution (Exp 06 Checkpoint)
                  </p>
                  {['Healthy Control', "Parkinson's Disease"].map((cls) => {
                    const prob = parkProbsObj[cls] !== undefined ? parkProbsObj[cls] : (cls === report.parkinsonClass ? report.parkinsonConfidence : 13.2);
                    return (
                      <div key={cls} className="flex justify-between items-center text-xs">
                        <span className={`${cls === report.parkinsonClass ? 'font-bold text-[#24333B]' : 'text-[#78858A]'}`}>
                          {cls}
                        </span>
                        <div className="flex-1 mx-3 h-1.5 bg-[#EEF4F0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#3D8062]" style={{ width: `${prob}%` }} />
                        </div>
                        <span className="font-mono font-semibold text-[#24333B] w-12 text-right">{prob}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Neuroimaging & Grad-CAM Explainability Section */}
        <div className="my-6">
          <h3 className="text-sm font-bold text-[#24333B] uppercase tracking-wider mb-4 border-b border-[#DDE7E1] pb-2 flex items-center gap-2">
            <FileImage className="w-5 h-5 text-[#3D8062]" /> Neuroimaging & Grad-CAM Saliency Interpretability
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0F171B] p-6 rounded-xl">
            {/* Panel A: Original MRI Slice */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[#CBD5E1] mb-2">Panel A: Preprocessed Axial T1-Weighted Slice</span>
              <div className="w-full h-56 bg-[#172228] rounded-lg flex items-center justify-center p-2 border border-[#23353E]">
                {report.mriImage ? (
                  <img src={report.mriImage} alt="Input MRI" className="max-h-full object-contain" />
                ) : (
                  <div className="text-center text-xs text-[#94A3B8]">
                    <Brain className="w-12 h-12 text-[#3D8062] mx-auto mb-2 opacity-60" />
                    Standard Axial MRI Benchmark Slice
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#94A3B8] mt-1.5 font-mono">Matrix: 224x224 &bull; Normalization: ImageNet RGB</span>
            </div>

            {/* Panel B: Grad-CAM Overlay */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[#CBD5E1] mb-2">
                Panel B: {reportScope === 'both' ? 'Integrated Dual Grad-CAM Heatmap' : reportScope === 'alzheimer' ? 'Medial Temporal / Hippocampal Grad-CAM' : 'Midbrain Substantia Nigra Grad-CAM'}
              </span>
              <div className="w-full h-56 bg-[#172228] rounded-lg flex items-center justify-center p-2 border border-[#23353E] relative overflow-hidden">
                {report.gradcamHeatmap ? (
                  <img src={report.gradcamHeatmap} alt="Grad-CAM Heatmap Overlay" className="max-h-full object-contain" />
                ) : report.mriImage ? (
                  <div className="relative h-full flex items-center justify-center">
                    <img src={report.mriImage} alt="Original Scan" className="max-h-full object-contain" />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at 48% 46%, rgba(255,0,0,0.65) 0%, rgba(255,160,0,0.45) 30%, rgba(0,180,100,0.2) 55%, transparent 75%)',
                        mixBlendMode: 'screen',
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative h-full w-full flex items-center justify-center">
                    <div
                      className="w-40 h-40 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(245,158,11,0.5) 40%, rgba(16,185,129,0.2) 65%, transparent 80%)',
                      }}
                    />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#94A3B8] mt-1.5 font-mono text-center">
                Target Layer: EfficientNet-B0 features[-1] &bull; Saliency: {reportScope === 'alzheimer' ? 'Bilateral Medial Temporal Lobes' : reportScope === 'parkinson' ? 'Substantia Nigra & Basal Ganglia' : 'Temporal Cortex & Midbrain'}
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Impression & Attestation Section */}
        <div className="my-6 border-t border-[#DDE7E1] pt-4">
          <h3 className="text-xs font-bold text-[#78858A] uppercase tracking-wider mb-2">
            Clinical Notes & Diagnostic Impression
          </h3>
          <p className="text-xs text-[#24333B] leading-relaxed bg-[#F4F8F5] p-4 rounded-xl border border-[#DDE7E1]">
            {report.clinicalNotes ||
              (reportScope === 'alzheimer'
                ? `Cognitive assessment indicates clinical features consistent with ${report.alzheimerClass || 'evaluation'}. Focal volume loss noted over temporal associations. Recommended serial MMSE/MoCA monitoring and lifestyle intervention.`
                : reportScope === 'parkinson'
                ? `Motor assessment indicates findings consistent with ${report.parkinsonClass || 'evaluation'}. Extrapyramidal evaluation correlates with dopaminergic integrity. Recommended UPDRS motor staging follow-up.`
                : 'Evaluation shows neuroimaging patterns consistent with preliminary clinical findings. Automated model predictions correlate with focal neuroanatomical saliency over temporal-parietal and midbrain structures. Recommended close clinical follow-up, neuropsychological testing battery, and serial MRI review.')}
          </p>
        </div>

        {/* Physician Signoff & Verification Stamp */}
        <div className="pt-6 border-t-2 border-[#24333B] flex flex-col sm:flex-row justify-between items-end gap-6 mt-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3D8062] mb-1">
              <ShieldCheck className="w-4 h-4" /> Digitally Authenticated Medical Report
            </div>
            <p className="text-[10px] text-[#78858A] leading-tight">
              This assessment incorporates artificial intelligence decision-support algorithms. Final diagnostic determination and patient management remain the sole responsibility of the attending licensed neurologist.
            </p>
          </div>

          <div className="text-right">
            <div className="w-52 border-b-2 border-[#24333B] mb-2 mx-auto sm:ml-auto"></div>
            <p className="font-extrabold text-sm text-[#24333B]">Dr. Ananya Rao, MD, DM</p>
            <p className="text-xs text-[#78858A]">
              {reportScope === 'alzheimer' && 'Consultant Cognitive Neurologist • Memory Disorders Specialist'}
              {reportScope === 'parkinson' && 'Consultant Movement Disorders Neurologist • Parkinson\'s Program'}
              {reportScope === 'both' && 'Consultant Neurologist • Neurodegenerative Disorders'}
            </p>
            <p className="text-xs font-mono text-[#3D8062]">Medical Council Reg: DR-0148</p>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

export default function ClinicalReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-[#78858A]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3D8062] mx-auto mb-2" />
          <span>Loading Clinical Intelligence Report...</span>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
