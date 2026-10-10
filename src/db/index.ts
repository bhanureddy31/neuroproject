import path from 'path';
import fs from 'fs';
import os from 'os';
import { DatabaseSync } from 'node:sqlite';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodPressure?: string | null;
  bloodSugar?: string | null;
  memoryInfo?: string | null;
  movementInfo?: string | null;
  medicalHistory?: string | null;
  createdAt: string;
}

export interface Assessment {
  id: string;
  patientId: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  assessmentType: string;
  mriImage?: string | null;
  alzheimerClass?: string | null;
  alzheimerConfidence?: number | null;
  alzheimerProbs?: string | null;
  parkinsonClass?: string | null;
  parkinsonConfidence?: number | null;
  parkinsonProbs?: string | null;
  gradcamHeatmap?: string | null;
  clinicalNotes?: string | null;
  doctorReview?: string | null;
  status: string;
  createdAt: string;
}

// Global persistent database connection
let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir =
    process.env.DATABASE_DIR ||
    (process.env.VERCEL
      ? path.join(os.tmpdir(), 'neuro_data')
      : path.join(process.cwd(), 'data'));

  if (!fs.existsSync(/*turbopackIgnore: true*/ dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // In case directory already exists or cannot be created
    }
  }

  const dbFile = path.join(dataDir, 'neurodiagnosis.db');
  dbInstance = new DatabaseSync(dbFile);

  // Initialize tables and demo data
  initSchema(dbInstance);

  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      blood_pressure TEXT,
      blood_sugar TEXT,
      memory_info TEXT,
      movement_info TEXT,
      medical_history TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      assessment_type TEXT NOT NULL,
      mri_image TEXT,
      alzheimer_class TEXT,
      alzheimer_confidence REAL,
      alzheimer_probs TEXT,
      parkinson_class TEXT,
      parkinson_confidence REAL,
      parkinson_probs TEXT,
      gradcam_heatmap TEXT,
      clinical_notes TEXT,
      doctor_review TEXT,
      status TEXT NOT NULL DEFAULT 'Completed',
      created_at TEXT NOT NULL
    );
  `);

  // Seed initial clinic patients if table is empty
  const patientCount = (db.prepare('SELECT count(*) as count FROM patients').get() as any)?.count || 0;
  if (patientCount === 0) {
    const seedPatients = [
      {
        id: 'P-1024',
        name: 'Eleanor Vance',
        age: 72,
        gender: 'Female',
        bp: '135/85 mmHg',
        sugar: '110 mg/dL',
        mem: 'Mild episodic memory lapses, occasional word-finding difficulties over past 6 months',
        mov: 'Normal gait, no resting tremor observed',
        hist: 'Hypertension managed on Lisinopril, family history of late-onset dementia',
        created: '2026-10-09 09:30:00'
      },
      {
        id: 'P-1031',
        name: 'Robert Sterling',
        age: 68,
        gender: 'Male',
        bp: '128/80 mmHg',
        sugar: '104 mg/dL',
        mem: 'Intact short-term recall and orientation',
        mov: 'Unilateral right hand resting tremor, slight bradykinesia during finger tapping',
        hist: 'No cardiovascular events, non-smoker',
        created: '2026-10-09 11:15:00'
      },
      {
        id: 'P-1045',
        name: 'Margaret Chen',
        age: 76,
        gender: 'Female',
        bp: '142/88 mmHg',
        sugar: '122 mg/dL',
        mem: 'Gradual spatial disorientation and difficulty with complex daily activities',
        mov: 'Mild rigidity in lower extremities',
        hist: 'Type 2 diabetes, hyperlipidemia on Atorvastatin',
        created: '2026-10-10 08:20:00'
      }
    ];

    const insertP = db.prepare(`
      INSERT INTO patients (id, name, age, gender, blood_pressure, blood_sugar, memory_info, movement_info, medical_history, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of seedPatients) {
      insertP.run(p.id, p.name, p.age, p.gender, p.bp, p.sugar, p.mem, p.mov, p.hist, p.created);
    }

    const insertA = db.prepare(`
      INSERT INTO assessments (id, patient_id, assessment_type, mri_image, alzheimer_class, alzheimer_confidence, alzheimer_probs, parkinson_class, parkinson_confidence, parkinson_probs, gradcam_heatmap, clinical_notes, doctor_review, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertA.run(
      'NA-892104',
      'P-1024',
      "Dual Assessment (Alzheimer's & Parkinson's)",
      null,
      'VeryMildDemented',
      89.4,
      JSON.stringify({ NonDemented: 0.082, VeryMildDemented: 0.894, MildDemented: 0.021, ModerateDemented: 0.003 }),
      'Healthy Control',
      94.1,
      JSON.stringify({ CO: 0.941, PD: 0.059 }),
      null,
      'Cognitive: Mild episodic memory lapses. Motor: Normal gait. Medical History: Hypertension.',
      'Correlates with early-stage hippocampal microstructural change. Scheduled for 6-month cognitive follow-up.',
      'AI Analysis Completed',
      '2026-10-09 10:00:00'
    );
  }
}

// Database helper functions
export const db = {
  clearAllData(): void {
    const database = getDb();
    database.exec('DELETE FROM assessments; DELETE FROM patients;');
  },

  deletePatient(id: string): void {
    const database = getDb();
    const delAssess = database.prepare('DELETE FROM assessments WHERE patient_id = ?');
    delAssess.run(id);
    const delPatient = database.prepare('DELETE FROM patients WHERE id = ?');
    delPatient.run(id);
  },

  deleteAssessment(id: string): void {
    const database = getDb();
    const delAssess = database.prepare('DELETE FROM assessments WHERE id = ?');
    delAssess.run(id);
  },
  getAllPatients(): Patient[] {
    const raw = getDb().prepare('SELECT * FROM patients ORDER BY created_at DESC').all() as any[];
    return raw.map((r) => ({
      id: r.id,
      name: r.name,
      age: r.age,
      gender: r.gender,
      bloodPressure: r.blood_pressure,
      bloodSugar: r.blood_sugar,
      memoryInfo: r.memory_info,
      movementInfo: r.movement_info,
      medicalHistory: r.medical_history,
      createdAt: r.created_at,
    }));
  },

  getPatientById(id: string): Patient | null {
    const r = getDb().prepare('SELECT * FROM patients WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      age: r.age,
      gender: r.gender,
      bloodPressure: r.blood_pressure,
      bloodSugar: r.blood_sugar,
      memoryInfo: r.memory_info,
      movementInfo: r.movement_info,
      medicalHistory: r.medical_history,
      createdAt: r.created_at,
    };
  },

  upsertPatient(p: Patient): Patient {
    const stmt = getDb().prepare(`
      INSERT INTO patients (id, name, age, gender, blood_pressure, blood_sugar, memory_info, movement_info, medical_history, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        age=excluded.age,
        gender=excluded.gender,
        blood_pressure=excluded.blood_pressure,
        blood_sugar=excluded.blood_sugar,
        memory_info=excluded.memory_info,
        movement_info=excluded.movement_info,
        medical_history=excluded.medical_history;
    `);
    stmt.run(p.id, p.name, p.age, p.gender, p.bloodPressure || null, p.bloodSugar || null, p.memoryInfo || null, p.movementInfo || null, p.medicalHistory || null, p.createdAt);
    return p;
  },

  getAllAssessments(): Assessment[] {
    const raw = getDb().prepare(`
      SELECT 
        a.id, a.patient_id as patientId, a.assessment_type as assessmentType,
        a.mri_image as mriImage, a.alzheimer_class as alzheimerClass, a.alzheimer_confidence as alzheimerConfidence,
        a.alzheimer_probs as alzheimerProbs, a.parkinson_class as parkinsonClass, a.parkinson_confidence as parkinsonConfidence,
        a.parkinson_probs as parkinsonProbs, a.gradcam_heatmap as gradcamHeatmap, a.clinical_notes as clinicalNotes,
        a.doctor_review as doctorReview, a.status, a.created_at as createdAt,
        p.name as patientName, p.age as patientAge, p.gender as patientGender
      FROM assessments a
      LEFT JOIN patients p ON a.patient_id = p.id
      ORDER BY a.created_at DESC
    `).all() as any[];
    return raw;
  },

  getAssessmentById(id: string): (Assessment & { patient?: Patient }) | null {
    const a = getDb().prepare(`
      SELECT 
        a.id, a.patient_id as patientId, a.assessment_type as assessmentType,
        a.mri_image as mriImage, a.alzheimer_class as alzheimerClass, a.alzheimer_confidence as alzheimerConfidence,
        a.alzheimer_probs as alzheimerProbs, a.parkinson_class as parkinsonClass, a.parkinson_confidence as parkinsonConfidence,
        a.parkinson_probs as parkinsonProbs, a.gradcam_heatmap as gradcamHeatmap, a.clinical_notes as clinicalNotes,
        a.doctor_review as doctorReview, a.status, a.created_at as createdAt,
        p.id as p_id, p.name as p_name, p.age as p_age, p.gender as p_gender,
        p.blood_pressure as p_bp, p.blood_sugar as p_bs, p.memory_info as p_mem,
        p.movement_info as p_mov, p.medical_history as p_hist, p.created_at as p_created
      FROM assessments a
      LEFT JOIN patients p ON a.patient_id = p.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!a) return null;

    return {
      id: a.id,
      patientId: a.patientId,
      assessmentType: a.assessmentType,
      mriImage: a.mriImage,
      alzheimerClass: a.alzheimerClass,
      alzheimerConfidence: a.alzheimerConfidence,
      alzheimerProbs: a.alzheimerProbs,
      parkinsonClass: a.parkinsonClass,
      parkinsonConfidence: a.parkinsonConfidence,
      parkinsonProbs: a.parkinsonProbs,
      gradcamHeatmap: a.gradcamHeatmap,
      clinicalNotes: a.clinicalNotes,
      doctorReview: a.doctorReview,
      status: a.status,
      createdAt: a.createdAt,
      patient: a.p_id
        ? {
            id: a.p_id,
            name: a.p_name,
            age: a.p_age,
            gender: a.p_gender,
            bloodPressure: a.p_bp,
            bloodSugar: a.p_bs,
            memoryInfo: a.p_mem,
            movementInfo: a.p_mov,
            medicalHistory: a.p_hist,
            createdAt: a.p_created,
          }
        : undefined,
    };
  },

  insertAssessment(a: Assessment): Assessment {
    const stmt = getDb().prepare(`
      INSERT INTO assessments (id, patient_id, assessment_type, mri_image, alzheimer_class, alzheimer_confidence, alzheimer_probs, parkinson_class, parkinson_confidence, parkinson_probs, gradcam_heatmap, clinical_notes, doctor_review, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      a.id,
      a.patientId,
      a.assessmentType,
      a.mriImage || null,
      a.alzheimerClass || null,
      a.alzheimerConfidence !== undefined && a.alzheimerConfidence !== null
  ? a.alzheimerConfidence
  : null,
      a.alzheimerProbs || null,
      a.parkinsonClass || null,
       a.parkinsonConfidence !== undefined && a.parkinsonConfidence !== null
  ? a.parkinsonConfidence
  : null,
      a.parkinsonProbs || null,
      a.gradcamHeatmap || null,
      a.clinicalNotes || null,
      a.doctorReview || null,
      a.status,
      a.createdAt
    );
    return a;
  },
};
