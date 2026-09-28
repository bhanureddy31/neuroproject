'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Plus, RefreshCw, X, User, HeartPulse, FilePlus, Trash2 } from 'lucide-react';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodPressure?: string;
  bloodSugar?: string;
  memoryInfo?: string;
  movementInfo?: string;
  medicalHistory?: string;
  createdAt?: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDeletePatient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete patient "${name}" (${id}) and any linked assessment records?`)) return;
    try {
      const res = await fetch(`/api/patients?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchPatients();
      }
    } catch (err) {
      console.error('Failed to delete patient:', err);
    }
  };

  // New Patient Form State
  const [formData, setFormData] = useState({
    id: `P-${1000 + Math.floor(Math.random() * 9000)}`,
    name: '',
    age: '',
    gender: 'Female',
    bloodPressure: '120/80 mmHg',
    bloodSugar: '100 mg/dL',
    memoryInfo: '',
    movementInfo: '',
    medicalHistory: '',
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patients');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPatients(json.data);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age) return;
    setSaving(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        fetchPatients();
        // Reset form ID
        setFormData({
          id: `P-${1000 + Math.floor(Math.random() * 9000)}`,
          name: '',
          age: '',
          gender: 'Female',
          bloodPressure: '120/80 mmHg',
          bloodSugar: '100 mg/dL',
          memoryInfo: '',
          movementInfo: '',
          medicalHistory: '',
        });
      }
    } catch (err) {
      console.error('Failed to create patient:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const nameMatch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = (p.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || idMatch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-[#24333B]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Patient Records</h1>
          <p className="text-[#78858A]">Centralized registry of clinical cohorts & neuro-assessments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#3D8062] hover:bg-[#346D54] text-white px-5 py-2.5 rounded-[10px] flex items-center gap-2 transition-all font-semibold shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" /> Add New Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-[#DDE7E1] shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78858A] w-5 h-5" />
          <input
            type="text"
            placeholder="Search patients by name or ID (e.g. Riya Sharma, P-1024)..."
            className="w-full pl-10 pr-4 py-2 border border-[#DDE7E1] rounded-[10px] focus:outline-none focus:border-[#3D8062] text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={fetchPatients}
          disabled={loading}
          className="px-4 py-2 border border-[#DDE7E1] rounded-[10px] text-xs font-semibold text-[#78858A] hover:bg-[#F4F8F5] flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3D8062]' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Patient Cards List */}
      <div className="space-y-3">
        {loading && patients.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#DDE7E1] text-[#78858A]">
            <RefreshCw className="w-6 h-6 animate-spin text-[#3D8062] mx-auto mb-2" />
            <span>Loading patient records from SQLite database...</span>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#DDE7E1] p-8 text-[#78858A]">
            <User className="w-12 h-12 text-[#3D8062] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-[#24333B] mb-1">
              {searchTerm ? 'No Matching Patients' : 'Patient Database is Empty'}
            </h3>
            <p className="text-xs text-[#78858A] mb-6 max-w-md mx-auto">
              {searchTerm
                ? 'No patient records matched your search query. Try another search or clear the filter.'
                : 'All previous data has been cleared. Add a new patient record below to register clinical intake and run evaluations.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#3D8062] hover:bg-[#346D54] text-white px-5 py-2.5 rounded-[10px] inline-flex items-center gap-2 font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Patient
            </button>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const initials = patient.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase();

            return (
              <div
                key={patient.id}
                className="bg-white border border-[#DDE7E1] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-[0_8px_24px_rgba(36,51,59,0.055)] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EEF4F0] text-[#3D8062] font-extrabold flex items-center justify-center text-base shrink-0 border border-[#DDE7E1]">
                    {initials}
                  </div>

                  <div>
                    <h3 className="font-bold text-[#24333B] text-base">{patient.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#78858A] mt-0.5">
                      <span className="font-mono font-bold text-[#3D8062]">{patient.id}</span>
                      <span>&bull;</span>
                      <span>{patient.age} yrs</span>
                      <span>&bull;</span>
                      <span>{patient.gender}</span>
                      {patient.bloodPressure && (
                        <>
                          <span>&bull;</span>
                          <span>BP: {patient.bloodPressure}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <button
                    onClick={() => router.push(`/dashboard/new-assessment?patientId=${patient.id}`)}
                    className="px-3.5 py-1.5 rounded-[8px] bg-[#EEF4F0] text-[#3D8062] hover:bg-[#3D8062] hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Launch new assessment pre-filled with this patient"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Run Assessment</span>
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/history`)}
                    className="px-3 py-1.5 rounded-[8px] border border-[#DDE7E1] text-[#78858A] hover:bg-[#F4F8F5] transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>History</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePatient(patient.id, patient.name)}
                    className="p-1.5 rounded-[8px] border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
                    title="Delete Patient Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-[#78858A] hover:text-[#24333B] p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#24333B] mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-[#3D8062]" /> Register Patient Intake
            </h2>
            <p className="text-xs text-[#78858A] mb-5">
              Enter clinical demographics to create a permanent patient file.
            </p>

            <form onSubmit={handleAddPatient} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#78858A] mb-1">Assigned MRN / ID</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.id}
                    className="w-full h-10 rounded-[8px] border border-[#DDE7E1] px-3 bg-[#EEF4F0] font-mono text-[#78858A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#78858A] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singhania"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 rounded-[8px] border border-[#DDE7E1] px-3 focus:outline-none focus:border-[#3D8062]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#78858A] mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    placeholder="65"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full h-10 rounded-[8px] border border-[#DDE7E1] px-3 focus:outline-none focus:border-[#3D8062]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#78858A] mb-1">Sex</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full h-10 rounded-[8px] border border-[#DDE7E1] px-2 focus:outline-none focus:border-[#3D8062] bg-white cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#78858A] mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    className="w-full h-10 rounded-[8px] border border-[#DDE7E1] px-3 focus:outline-none focus:border-[#3D8062]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#78858A] mb-1">Cognitive / Memory Complaints</label>
                <textarea
                  rows={2}
                  placeholder="MMSE score, recall issues, temporal orientation..."
                  value={formData.memoryInfo}
                  onChange={(e) => setFormData({ ...formData, memoryInfo: e.target.value })}
                  className="w-full rounded-[8px] border border-[#DDE7E1] p-2.5 focus:outline-none focus:border-[#3D8062] resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#78858A] mb-1">Motor / Movement Presentation</label>
                <textarea
                  rows={2}
                  placeholder="UPDRS signs, tremors, rigidity, posture, gait..."
                  value={formData.movementInfo}
                  onChange={(e) => setFormData({ ...formData, movementInfo: e.target.value })}
                  className="w-full rounded-[8px] border border-[#DDE7E1] p-2.5 focus:outline-none focus:border-[#3D8062] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-[#DDE7E1]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#DDE7E1] rounded-[8px] text-[#78858A] hover:bg-[#F4F8F5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#3D8062] hover:bg-[#346D54] text-white rounded-[8px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Registering...' : 'Save Patient to SQLite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
