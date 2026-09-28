import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const patient = db.getPatientById(id);
      if (!patient) {
        return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: patient });
    }

    const allPatients = db.getAllPatients();
    return NextResponse.json({ success: true, data: allPatients });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      id,
      name,
      age,
      gender,
      bloodPressure,
      bloodSugar,
      memoryInfo,
      movementInfo,
      medicalHistory,
    } = body;

    if (!id || !name || !age || !gender) {
      return NextResponse.json(
        { success: false, error: 'Missing required patient fields (id, name, age, gender)' },
        { status: 400 }
      );
    }

    const patient = db.upsertPatient({
      id,
      name,
      age: parseInt(age, 10),
      gender,
      bloodPressure: bloodPressure || null,
      bloodSugar: bloodSugar || null,
      memoryInfo: memoryInfo || null,
      movementInfo: movementInfo || null,
      medicalHistory: medicalHistory || null,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    return NextResponse.json({ success: true, data: patient });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing patient id parameter' }, { status: 400 });
    }
    db.deletePatient(id);
    return NextResponse.json({ success: true, message: `Patient ${id} deleted` });
  } catch (error: any) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
