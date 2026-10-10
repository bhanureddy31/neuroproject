import path from 'path';
import fs from 'fs';
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

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
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
