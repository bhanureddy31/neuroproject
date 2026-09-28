import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const patients = sqliteTable('patients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  bloodPressure: text('blood_pressure'),
  bloodSugar: text('blood_sugar'),
  memoryInfo: text('memory_info'),
  movementInfo: text('movement_info'),
  medicalHistory: text('medical_history'),
  createdAt: text('created_at').notNull(),
});

export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey(),
  patientId: text('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  assessmentType: text('assessment_type').notNull(),
  mriImage: text('mri_image'),
  alzheimerClass: text('alzheimer_class'),
  alzheimerConfidence: real('alzheimer_confidence'),
  alzheimerProbs: text('alzheimer_probs'), // JSON stringified
  parkinsonClass: text('parkinson_class'),
  parkinsonConfidence: real('parkinson_confidence'),
  parkinsonProbs: text('parkinson_probs'), // JSON stringified
  gradcamHeatmap: text('gradcam_heatmap'),
  clinicalNotes: text('clinical_notes'),
  doctorReview: text('doctor_review'),
  status: text('status').notNull().default('Completed'),
  createdAt: text('created_at').notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
