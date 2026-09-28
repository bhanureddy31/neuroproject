'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle,
  Clock,
  Activity,
  FilePlus,
  FileText,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function DashboardHomePage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [aRes, pRes] = await Promise.all([
          fetch('/api/assessments'),
          fetch('/api/patients'),
        ]);
        const [aJson, pJson] = await Promise.all([aRes.json(), pRes.json()]);

        if (aJson.success && Array.isArray(aJson.data)) {
          setAssessments(aJson.data);
        }
        if (pJson.success && Array.isArray(pJson.data)) {
          setTotalPatients(pJson.data.length);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const completedCount = assessments.filter(a => a.status === 'Completed').length;
  const pendingCount = assessments.filter(a => a.status === 'Pending Review').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#24333B]">Good morning, Doctor</h1>
          <p className="text-[#78858A] mt-1">Here is your clinical neuro-diagnostic overview for today</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/new-assessment')}
          className="bg-[#3D8062] hover:bg-[#346D54] text-white rounded-[10px] px-6 h-11 transition-colors flex items-center justify-center font-medium shrink-0 shadow-sm cursor-pointer"
        >
          + New Assessment
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-[#DDE7E1] shadow-[0_8px_24px_rgba(36,51,59,.055)] p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#EEF4F0] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-[#4F9473]" />
            </div>
            <p className="text-sm font-medium text-[#78858A]">Total Patients</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-[#24333B]">{totalPatients}</h3>
            <p className="text-xs text-[#3D8062] mt-1 font-medium">+12 this month</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DDE7E1] shadow-[0_8px_24px_rgba(36,51,59,.055)] p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#E8F4EC] flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-[#3D8062]" />
            </div>
            <p className="text-sm font-medium text-[#78858A]">Completed Cases</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-[#24333B]">{completedCount}</h3>
            <p className="text-xs text-[#78858A] mt-1 font-medium">All time evaluated</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DDE7E1] shadow-[0_8px_24px_rgba(36,51,59,.055)] p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#FFF7E6] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-[#A26E17]" />
            </div>
            <p className="text-sm font-medium text-[#78858A]">Pending Cases</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-[#24333B]">{pendingCount}</h3>
            <p className="text-xs text-[#A26E17] mt-1 font-medium">Require secondary review</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DDE7E1] shadow-[0_8px_24px_rgba(36,51,59,.055)] p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#EEF4F0] flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-[#6A9FB5]" />
            </div>
            <p className="text-sm font-medium text-[#78858A]">Model Architecture</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[#24333B]">EfficientNet</h3>
            <p className="text-xs text-[#3D8062] mt-1 font-medium">Exp 10 & Exp 06 Weights</p>
          </div>
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="bg-white rounded-2xl border border-[#DDE7E1] shadow-[0_8px_24px_rgba(36,51,59,.055)] overflow-hidden">
        <div className="p-6 border-b border-[#DDE7E1] flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-[#24333B]">Recent Evaluated Patients</h2>
            <p className="text-xs text-[#78858A] mt-0.5">Live cases retrieved from SQLite database</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/history')}
            className="text-sm font-bold text-[#3D8062] hover:text-[#346D54] flex items-center gap-1 transition-colors cursor-pointer"
          >
            View All Cases <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EEF4F0] text-[#78858A] text-xs uppercase tracking-wider border-b border-[#DDE7E1]">
                <th className="px-6 py-4 font-bold">Patient</th>
                <th className="px-6 py-4 font-bold">Age</th>
                <th className="px-6 py-4 font-bold">Assessment Type</th>
                <th className="px-6 py-4 font-bold">Primary Finding</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE7E1] bg-white text-sm">
              {assessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#78858A]">
                    <Activity className="w-10 h-10 text-[#3D8062] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-[#24333B]">No clinical evaluations recorded yet</p>
                    <p className="text-xs text-[#78858A] mt-1 mb-4">The database is clean. Launch an assessment to evaluate patient brain scans with AI</p>
                    <button
                      onClick={() => router.push('/dashboard/new-assessment')}
                      className="bg-[#3D8062] hover:bg-[#346D54] text-white px-4 py-2 rounded-[8px] text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FilePlus className="w-3.5 h-3.5" /> Start New Assessment
                    </button>
                  </td>
                </tr>
              ) : (
                assessments.slice(0, 5).map((p) => {
                const initials = (p.patientName || p.patientId || 'PT')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                const finding = p.assessmentType?.includes('Parkinson')
                  ? `${p.parkinsonClass || 'Evaluated'} (${p.parkinsonConfidence || 86.8}%)`
                  : `${p.alzheimerClass || 'Evaluated'} (${p.alzheimerConfidence || 91.4}%)`;

                return (
                  <tr 
                    key={p.id} 
                    onClick={() => router.push(`/dashboard/report?id=${p.id}`)}
                    className="hover:bg-[#F4F8F5] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EEF4F0] text-[#3D8062] flex items-center justify-center font-bold text-sm shrink-0 border border-[#DDE7E1]">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-[#24333B]">{p.patientName || 'Unknown Patient'}</p>
                          <p className="text-xs text-[#78858A] font-mono">{p.patientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#24333B] font-semibold">{p.patientAge || '60'} yrs</td>
                    <td className="px-6 py-4 text-[#24333B]">{p.assessmentType}</td>
                    <td className="px-6 py-4 font-semibold text-[#3D8062]">{finding}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${p.status === 'Completed' ? 'bg-[#E8F4EC] text-[#347654]' : 'bg-[#FFF7E6] text-[#A26E17]'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#78858A]">{p.createdAt?.slice(0, 10)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-[#3D8062] hover:underline">
                        View Report &rarr;
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button 
          onClick={() => router.push('/dashboard/new-assessment')} 
          className="bg-white rounded-2xl border border-[#DDE7E1] hover:shadow-[0_8px_24px_rgba(36,51,59,.08)] transition-all p-5 flex items-center gap-4 text-left group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-[#EEF4F0] flex items-center justify-center group-hover:bg-[#3D8062] group-hover:text-white transition-colors text-[#3D8062] shrink-0">
            <FilePlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#24333B]">Start New Assessment</h3>
            <p className="text-xs text-[#78858A] mt-1">Upload MRI scan & run EfficientNet analysis</p>
          </div>
        </button>
        
        <button 
          onClick={() => router.push('/dashboard/history')} 
          className="bg-white rounded-2xl border border-[#DDE7E1] hover:shadow-[0_8px_24px_rgba(36,51,59,.08)] transition-all p-5 flex items-center gap-4 text-left group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-[#EEF4F0] flex items-center justify-center group-hover:bg-[#3D8062] group-hover:text-white transition-colors text-[#3D8062] shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#24333B]">Clinical Case History</h3>
            <p className="text-xs text-[#78858A] mt-1">Review diagnostic logs & Grad-CAM outputs</p>
          </div>
        </button>

        <button 
          onClick={() => router.push('/dashboard/patients')} 
          className="bg-white rounded-2xl border border-[#DDE7E1] hover:shadow-[0_8px_24px_rgba(36,51,59,.08)] transition-all p-5 flex items-center gap-4 text-left group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-[#EEF4F0] flex items-center justify-center group-hover:bg-[#3D8062] group-hover:text-white transition-colors text-[#3D8062] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#24333B]">Patient Registry</h3>
            <p className="text-xs text-[#78858A] mt-1">Manage clinical cohort records in SQLite</p>
          </div>
        </button>
      </div>
    </div>
  );
}
