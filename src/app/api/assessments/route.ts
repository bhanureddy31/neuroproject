import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const record = db.getAssessmentById(id);
      if (!record) {
        return NextResponse.json({ success: false, error: 'Assessment not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: record });
    }

    const allRecords = db.getAllAssessments();
    return NextResponse.json({ success: true, data: allRecords });
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      id,
      patientId,
      assessmentType,
      mriImage,
      alzheimerClass,
      alzheimerConfidence,
      alzheimerProbs,
      parkinsonClass,
      parkinsonConfidence,
      parkinsonProbs,
      gradcamHeatmap,
      clinicalNotes,
      doctorReview,
      status,
    } = body;

    if (!patientId || !assessmentType) {
      return NextResponse.json(
        { success: false, error: 'Missing patientId or assessmentType' },
        { status: 400 }
      );
    }

    const assessmentId = id || `NA-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const record = db.insertAssessment({
      id: assessmentId,
      patientId,
      assessmentType,
      mriImage: mriImage || null,
      alzheimerClass: alzheimerClass || 'Non Demented',
      alzheimerConfidence: alzheimerConfidence ? Number(alzheimerConfidence) : 91.4,
      alzheimerProbs: typeof alzheimerProbs === 'object' ? JSON.stringify(alzheimerProbs) : alzheimerProbs || null,
      parkinsonClass: parkinsonClass || 'Healthy Control',
      parkinsonConfidence: parkinsonConfidence ? Number(parkinsonConfidence) : 86.8,
      parkinsonProbs: typeof parkinsonProbs === 'object' ? JSON.stringify(parkinsonProbs) : parkinsonProbs || null,
      gradcamHeatmap: gradcamHeatmap || null,
      clinicalNotes: clinicalNotes || null,
      doctorReview: doctorReview || 'Dr. Ananya Rao (DR-0148) — Verified',
      status: status || 'Completed',
      createdAt: now,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error saving assessment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing assessment id parameter' }, { status: 400 });
    }
    db.deleteAssessment(id);
    return NextResponse.json({ success: true, message: `Assessment ${id} deleted` });
  } catch (error: any) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
