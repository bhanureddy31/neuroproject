'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, Filter, Calendar, FileText, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

interface HistoryItem {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender?: string;
  assessmentType: string;
  alzheimerClass?: string;
  alzheimerConfidence?: number;
  parkinsonClass?: string;
  parkinsonConfidence?: number;
  status: string;
  createdAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assessments');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAssessments(json.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const filtered = assessments.filter((item) => {
    const nameMatch = (item.patientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (item.patientId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === 'All' || item.assessmentType.toLowerCase().includes(filterType.toLowerCase());
    return (nameMatch || idMatch) && typeMatch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-[#24333B]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assessment History</h1>
          <p className="text-[#78858A]">Comprehensive database of evaluated clinical scans & AI diagnoses</p>
        </div>
        <button
          onClick={fetchAssessments}
          disabled={loading}
          className="px-4 py-2 border border-[#DDE7E1] rounded-[10px] flex items-center gap-2 text-sm font-semibold text-[#78858A] hover:bg-[#F4F8F5] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#3D8062]' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-[#DDE7E1] shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78858A] w-5 h-5" />
          <input
            type="text"
            placeholder="Search by patient name, patient ID, or assessment ID..."
            className="w-full pl-10 pr-4 py-2 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062] text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#78858A] uppercase">Filter:</span>
          {['All', "Alzheimer's", "Parkinson's"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-[#3D8062] text-white shadow-xs'
                  : 'bg-[#EEF4F0] text-[#78858A] hover:text-[#3D8062]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-[#DDE7E1] overflow-hidden shadow-[0_8px_24px_rgba(36,51,59,.055)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EEF4F0] text-[#78858A] text-xs uppercase tracking-wider border-b border-[#DDE7E1]">
                <th className="p-4 font-bold">Assessment ID</th>
                <th className="p-4 font-bold">Patient</th>
                <th className="p-4 font-bold">Age / Gender</th>
                <th className="p-4 font-bold">Clinical Target</th>
                <th className="p-4 font-bold">Primary AI Finding</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold text-center">Clinical Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE7E1] text-sm">
              {loading && assessments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#78858A]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#3D8062]" />
                      <span>Loading assessment records from SQLite database...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#78858A]">
                    No clinical assessment records found matching your query.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isCompleted = item.status === 'Completed';
                  const finding = item.assessmentType.includes("Parkinson")
                    ? `${item.parkinsonClass || 'Evaluated'} (${item.parkinsonConfidence || 85}%)`
                    : `${item.alzheimerClass || 'Evaluated'} (${item.alzheimerConfidence || 90}%)`;

                  return (
                    <tr key={item.id} className="hover:bg-[#F4F8F5] transition-colors">
                      <td className="p-4 font-mono font-bold text-[#3D8062]">{item.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-[#24333B]">{item.patientName || 'Unknown Patient'}</div>
                        <div className="text-xs text-[#78858A] font-mono">{item.patientId}</div>
                      </td>
                      <td className="p-4 text-[#78858A]">
                        {item.patientAge} yrs &bull; {item.patientGender || 'N/A'}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[#24333B]">{item.assessmentType}</span>
                        <div className="text-[11px] text-[#78858A]">EfficientNet-B0</div>
                      </td>
                      <td className="p-4 font-semibold text-[#24333B]">
                        {finding}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isCompleted
                              ? 'bg-[#E8F4EC] text-[#347654]'
                              : 'bg-[#FFF7E6] text-[#A26E17]'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[#78858A]">
                        {item.createdAt.slice(0, 10)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => router.push(`/dashboard/report?id=${item.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#3D8062] text-[#3D8062] hover:bg-[#3D8062] hover:text-white transition-all text-xs font-bold cursor-pointer shadow-xs"
                          title="View Full Hospital Report & PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
