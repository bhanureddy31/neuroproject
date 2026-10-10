import React, { forwardRef } from 'react';



export type ReportScope =

  | 'both'

  | 'alzheimer'

  | 'parkinson';



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

  /*

   * ---------------------------------------------------------

   * PATIENT DATA

   * ---------------------------------------------------------

   */



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



  /*

   * ---------------------------------------------------------

   * PROBABILITY PARSER

   * ---------------------------------------------------------

   */



  const parseProbabilities = (

    value?: string | Record<string, number>

  ): Record<string, number> => {

    if (!value) {

      return {};

    }



    if (typeof value === 'object') {

      return value;

    }



    try {

      const parsed = JSON.parse(value);



      if (

        parsed &&

        typeof parsed === 'object' &&

        !Array.isArray(parsed)

      ) {

        return parsed;

      }



      return {};

    } catch {

      return {};

    }

  };



  const alzProbs = parseProbabilities(

    report.alzheimerProbs

  );



  const parkProbs = parseProbabilities(

    report.parkinsonProbs

  );



  /*

   * ---------------------------------------------------------

   * REPORT SCOPE

   * ---------------------------------------------------------

   */



  const showAlzheimer =

    scope === 'alzheimer' || scope === 'both';



  const showParkinson =

    scope === 'parkinson' || scope === 'both';



  /*

   * ---------------------------------------------------------

   * DATE

   * ---------------------------------------------------------

   */



  const analysisDate = report.createdAt

    ? new Date(report.createdAt).toLocaleDateString(

        'en-US',

        {

          year: 'numeric',

          month: 'long',

          day: 'numeric',

        }

      )

    : 'Not provided';



  /*

   * ---------------------------------------------------------

   * FORMAT HELPERS

   * ---------------------------------------------------------

   */



  const formatConfidence = (

    value?: number

  ): string => {

    if (

      typeof value !== 'number' ||

      !Number.isFinite(value)

    ) {

      return 'N/A';

    }



    return `${value.toFixed(1)}%`;

  };



 const getProbability = (

  value: unknown

): number | null => {

  if (value === undefined || value === null || value === '') {

    return null;

  }



  const number = Number(value);



  if (!Number.isFinite(number)) {

    return null;

  }



  if (number <= 1) {

    return number * 100;

  }



  return number;

};

  /*

   * ---------------------------------------------------------

   * PROBABILITY BAR

   * ---------------------------------------------------------

   */



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
    value === null
      ? 0
      : Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-[3px]">
      <div className="flex items-center justify-between gap-3">
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
          {value !== null ? `${percentage.toFixed(1)}%` : 'N/A'}
        </span>
      </div>

      <div className="h-[5px] w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#174F59] rounded-full"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
};

  /*

   * ---------------------------------------------------------

   * AI RESULT CARD

   * ---------------------------------------------------------

   */



  const AIResultCard = ({

    title,

    prediction,

    confidence,

  }: {

    title: string;

    prediction?: string;

    confidence?: number;

  }) => {

    return (

      <div className="border border-gray-300 rounded-md p-3 bg-white">

        <div className="flex items-center justify-between gap-4">

          <div className="min-w-0">

            <div className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#174F59]">

              {title}

            </div>



            <div className="text-[17px] leading-tight font-black mt-1 truncate">

              {prediction || 'Result unavailable'}

            </div>

          </div>



          <div className="text-right shrink-0">

            <div className="text-[7px] uppercase tracking-wide text-gray-500">

              Model Confidence

            </div>



            <div className="text-[17px] leading-tight font-black text-[#174F59] mt-1">

              {formatConfidence(confidence)}

            </div>

          </div>

        </div>

      </div>

    );

  };



  /*

   * ---------------------------------------------------------

   * REPORT

   * ---------------------------------------------------------

   */



  return (

    <div

      ref={ref}

      id="professional-doctor-report-pdf"

      className="w-full max-w-[850px] mx-auto bg-white text-black font-sans"

      style={{

        fontFamily:

          'Arial, Helvetica, sans-serif',

      }}

    >

      <div

        className="border border-black bg-white"

        style={{

          pageBreakInside: 'avoid',

        }}

      >

        {/* =====================================================

            HEADER

        ====================================================== */}



        <div className="px-6 py-4 border-b border-black flex items-center justify-between gap-6">

          <div>

            <div className="text-[12px] font-black uppercase tracking-[0.14em] text-[#174F59]">

              Neurodiagnosis AI

            </div>



            <div className="text-[7px] uppercase tracking-[0.12em] text-gray-500 mt-1">

              MRI analysis and decision support

            </div>

          </div>



          <div className="text-right">

            <div className="text-[22px] font-black uppercase tracking-tight leading-none">

              AI MRI REPORT

            </div>



            <div className="text-[7px] text-gray-500 uppercase tracking-wide mt-1">

              AI-assisted MRI classification

            </div>

          </div>

        </div>



        {/* =====================================================

            PATIENT

        ====================================================== */}



        <div className="px-6 py-2.5 border-b border-black bg-gray-50">

          <div className="text-[8px] font-black uppercase tracking-[0.12em] mb-2">

            Patient Information

          </div>



          <div className="grid grid-cols-6 gap-x-4 gap-y-2">

            <div className="col-span-2">

              <div className="text-[6px] uppercase font-bold text-gray-500">

                Patient Name

              </div>



              <div className="text-[10px] font-bold mt-[2px]">

                {patient.name || 'Not provided'}

              </div>

            </div>



            <div>

              <div className="text-[6px] uppercase font-bold text-gray-500">

                Age

              </div>



              <div className="text-[10px] font-bold mt-[2px]">

                {typeof patient.age === 'number'

                  ? `${patient.age} yrs`

                  : 'Not provided'}

              </div>

            </div>



            <div>

              <div className="text-[6px] uppercase font-bold text-gray-500">

                Gender

              </div>



              <div className="text-[10px] font-bold mt-[2px]">

                {patient.gender || 'Not provided'}

              </div>

            </div>



            <div>

              <div className="text-[6px] uppercase font-bold text-gray-500">

                Patient ID

              </div>



              <div className="text-[10px] font-bold font-mono text-[#174F59] mt-[2px]">

                {patient.id ||

                  report.patientId ||

                  'Not provided'}

              </div>

            </div>



            <div>

              <div className="text-[6px] uppercase font-bold text-gray-500">

                Assessment ID

              </div>



              <div className="text-[10px] font-bold font-mono mt-[2px]">

                {report.id}

              </div>

            </div>

          </div>



          <div className="mt-2 pt-2 border-t border-gray-300 flex items-center justify-between">

            <div>

              <span className="text-[6px] uppercase font-bold text-gray-500">

                Analysis Date

              </span>



              <span className="text-[8px] font-semibold ml-2">

                {analysisDate}

              </span>

            </div>



            <div className="text-[6px] text-gray-500 uppercase tracking-wide">

              MRI-based AI assessment

            </div>

          </div>

        </div>



        {/* =====================================================

            AI ASSESSMENT

        ====================================================== */}



        <div className="px-6 py-3 border-b border-black">

          <div className="text-[8px] font-black uppercase tracking-[0.12em] mb-2.5">

            AI Assessment

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

                title="Alzheimer's Classification"

                prediction={

                  report.alzheimerClass

                }

                confidence={

                  report.alzheimerConfidence

                }

              />

            )}



            {showParkinson && (

              <AIResultCard

                title="Parkinson's Classification"

                prediction={

                  report.parkinsonClass

                }

                confidence={

                  report.parkinsonConfidence

                }

              />

            )}

          </div>



          {!report.alzheimerClass &&

            !report.parkinsonClass && (

              <div className="border border-gray-300 rounded-md p-3 text-[9px] text-gray-500">

                No AI classification result is

                available for this assessment.

              </div>

            )}

        </div>



        {/* =====================================================

            MRI + GRAD-CAM

        ====================================================== */}



        <div className="px-6 py-3 border-b border-black">

          <div className="text-[8px] font-black uppercase tracking-[0.12em] mb-2.5">

            MRI Analysis &amp; Explainability

          </div>



          <div className="grid grid-cols-2 gap-4">

            {/* INPUT MRI */}



            <div className="border border-gray-300 rounded-md overflow-hidden">

              <div className="px-3 py-1.5 bg-[#111827] text-white text-[7px] font-bold uppercase tracking-wide text-center">

                Input MRI

              </div>



              <div className="h-[190px] bg-black flex items-center justify-center overflow-hidden">

                {report.mriImage ? (

                  <img

                    src={report.mriImage}

                    alt="Input MRI"

                    className="w-full h-full object-contain"

                  />

                ) : (

                  <div className="text-gray-500 text-[8px] text-center px-4">

                    MRI visualization unavailable

                  </div>

                )}

              </div>



              <div className="px-2 py-1 text-[6px] text-gray-500 text-center">

                Source MRI used for AI analysis

              </div>

            </div>



            {/* GRAD-CAM */}



            <div className="border border-gray-300 rounded-md overflow-hidden">

              <div className="px-3 py-1.5 bg-[#111827] text-white text-[7px] font-bold uppercase tracking-wide text-center">

                Grad-CAM

              </div>



              <div className="h-[190px] bg-black flex items-center justify-center overflow-hidden">

                {report.gradcamHeatmap ? (

                  <img

                    src={report.gradcamHeatmap}

                    alt="Grad-CAM visualization"

                    className="w-full h-full object-contain"

                  />

                ) : (

                  <div className="text-gray-500 text-[8px] text-center px-4">

                    Grad-CAM visualization unavailable

                    for this saved assessment.

                  </div>

                )}

              </div>



              <div className="px-2 py-1 text-[6px] text-gray-500 text-center">

                Real model explainability output

              </div>

            </div>

          </div>

        </div>



        {/* =====================================================

            MODEL PROBABILITIES

        ====================================================== */}



        <div className="px-6 py-3 border-b border-black">

          <div className="text-[8px] font-black uppercase tracking-[0.12em] mb-3">

            Model Probabilities

          </div>



          <div

            className={

              showAlzheimer && showParkinson

                ? 'grid grid-cols-2 gap-5'

                : 'grid grid-cols-1'

            }

          >

            {/* ALZHEIMER */}



            {showAlzheimer && (

              <div>

                <div className="text-[7px] font-bold uppercase tracking-wide mb-2">

                  Alzheimer&apos;s — Experiment 10

                </div>



                <div className="space-y-2">

                  <ProbabilityBar

                    label="Non Demented"

                    value={getProbability(

                      alzProbs.NonDemented

                    )}

                    active={

                      report.alzheimerClass ===

                      'NonDemented'

                    }

                  />



                  <ProbabilityBar

                    label="Very Mild Demented"

                    value={getProbability(

                      alzProbs.VeryMildDemented

                    )}

                    active={

                      report.alzheimerClass ===

                      'VeryMildDemented'

                    }

                  />



                  <ProbabilityBar

                    label="Mild Demented"

                    value={getProbability(

                      alzProbs.MildDemented

                    )}

                    active={

                      report.alzheimerClass ===

                      'MildDemented'

                    }

                  />



                  <ProbabilityBar

                    label="Moderate Demented"

                    value={getProbability(

                      alzProbs.ModerateDemented

                    )}

                    active={

                      report.alzheimerClass ===

                      'ModerateDemented'

                    }

                  />

                </div>

              </div>

            )}



            {/* PARKINSON */}



            {showParkinson && (

              <div

                className={

                  showAlzheimer

                    ? 'border-l border-gray-300 pl-5'

                    : ''

                }

              >

                <div className="text-[7px] font-bold uppercase tracking-wide mb-2">

                  Parkinson&apos;s — Experiment 06

                </div>



                <div className="space-y-2">

                  <ProbabilityBar

                    label="Healthy Control"

                    value={getProbability(

                      parkProbs.CO

                    )}

                    active={

                      report.parkinsonClass ===

                      'Healthy Control'

                    }

                  />



                  <ProbabilityBar

                    label="Parkinson's Disease"

                    value={getProbability(

                      parkProbs.PD

                    )}

                    active={

                      report.parkinsonClass ===

                      "Parkinson's Disease"

                    }

                  />

                </div>

              </div>

            )}

          </div>

        </div>



        {/* =====================================================

            STATUS

        ====================================================== */}



        <div className="px-6 py-2.5 border-b border-black bg-gray-50">

          <div className="grid grid-cols-2 gap-6">

            <div>

              <div className="text-[6px] uppercase font-bold text-gray-500 tracking-wide">

                AI Analysis

              </div>



              <div className="text-[10px] font-black text-[#174F59] mt-1">

                {report.status ||

                  'AI Analysis Completed'}

              </div>

            </div>



            <div>

              <div className="text-[6px] uppercase font-bold text-gray-500 tracking-wide">

                Clinical Review

              </div>



              <div className="text-[10px] font-black mt-1">

                Pending

              </div>

            </div>

          </div>

        </div>



        {/* =====================================================

            DISCLAIMER

        ====================================================== */}



        <div className="px-6 py-2.5">

          <div className="text-[7px] leading-relaxed text-gray-500 text-center">

            <span className="font-bold text-gray-700">

              Research / Decision Support.

            </span>{' '}

            This report contains AI-generated MRI

            classification and model explainability

            results. The output is not a clinically

            validated diagnosis and should not be used

            as a substitute for evaluation by a qualified

            healthcare professional.

          </div>

        </div>



        {/* =====================================================

            FOOTER

        ====================================================== */}



        <div className="border-t border-gray-300 px-6 py-2 flex items-center justify-between gap-4">

          <div className="text-[6px] uppercase tracking-wide text-gray-400">

            Neurodiagnosis AI Research

          </div>



          <div className="text-[6px] font-mono text-gray-400">

            {report.id}

          </div>



          <div className="text-[6px] uppercase tracking-wide text-gray-400">

            AI MRI Report

          </div>

        </div>

      </div>

    </div>

  );

});



ProfessionalMedicalReport.displayName =

  'ProfessionalMedicalReport';
