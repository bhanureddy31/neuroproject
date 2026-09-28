import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';

export async function POST(req: NextRequest) {
  try {
    db.clearAllData();
    return NextResponse.json({
      success: true,
      message: 'All clinical assessments and patient records have been permanently cleared from SQLite database.',
    });
  } catch (error: any) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clear database' },
      { status: 500 }
    );
  }
}
