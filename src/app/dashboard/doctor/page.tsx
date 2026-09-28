'use client';

import React from 'react';
import { Mail, Clock, Shield, Star, Activity, CheckCircle, FileText, Settings, User } from 'lucide-react';

export default function DoctorPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-[#24333B]">
      <div>
        <h1 className="text-3xl font-bold">Doctor Profile</h1>
        <p className="text-[#78858A]">Manage your professional profile and statistics</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-2xl border border-[#DDE7E1] p-8 text-center shadow-[0_8px_24px_rgba(36,51,59,0.055)]">
            <div className="w-24 h-24 mx-auto rounded-full bg-[#3D8062] text-white flex items-center justify-center text-3xl font-bold mb-4">
              AR
            </div>
            <h2 className="text-xl font-bold text-[#24333B]">Dr. Ananya Rao</h2>
            <p className="text-[#78858A] mb-4">Consultant Neurologist</p>
            <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#E8F4EC] text-[#347654] inline-block mb-6">
              Available
            </span>

            <div className="h-px bg-[#DDE7E1] w-full mb-6"></div>

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#3D8062]" />
                <div>
                  <div className="text-xs text-[#78858A]">Doctor ID</div>
                  <div className="text-sm font-medium">DR-0148</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-[#3D8062]" />
                <div>
                  <div className="text-xs text-[#78858A]">Specialization</div>
                  <div className="text-sm font-medium">Neurology — Neurodegenerative</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-[#3D8062]" />
                <div>
                  <div className="text-xs text-[#78858A]">Experience</div>
                  <div className="text-sm font-medium">12 Years</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#3D8062]" />
                <div>
                  <div className="text-xs text-[#78858A]">Email</div>
                  <div className="text-sm font-medium">dr.ananya@neurodiagnosis.ai</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#3D8062]" />
                <div>
                  <div className="text-xs text-[#78858A]">Schedule</div>
                  <div className="text-sm font-medium">Mon-Fri, 9:00 AM - 5:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)] flex flex-col justify-center">
              <div className="text-[#78858A] text-sm mb-1">Total Assessments</div>
              <div className="text-3xl font-bold text-[#24333B]">328</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)] flex flex-col justify-center">
              <div className="text-[#78858A] text-sm mb-1">This Month</div>
              <div className="text-3xl font-bold text-[#24333B]">42</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)] flex flex-col justify-center">
              <div className="text-[#78858A] text-sm mb-1">Accuracy Rate</div>
              <div className="text-3xl font-bold text-[#3D8062]">94.2%</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)] flex flex-col justify-center">
              <div className="text-[#78858A] text-sm mb-1">Avg. Time</div>
              <div className="text-3xl font-bold text-[#24333B]">12 min</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)]">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="bg-[#3D8062] hover:bg-[#346D54] text-white px-5 py-2.5 rounded-[10px] flex items-center gap-2 transition-colors">
                <FileText className="w-5 h-5" /> Start New Assessment
              </button>
              <button className="border border-[#3D8062] text-[#3D8062] hover:bg-[#EEF4F0] px-5 py-2.5 rounded-[10px] flex items-center gap-2 transition-colors">
                <CheckCircle className="w-5 h-5" /> View All Reports
              </button>
              <button className="border border-[#DDE7E1] text-[#24333B] hover:bg-[#F4F8F5] px-5 py-2.5 rounded-[10px] flex items-center gap-2 transition-colors">
                <Settings className="w-5 h-5" /> Update Profile
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)]">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { text: 'Completed review for patient P-1024', time: '2 hours ago' },
                { text: 'Updated clinical notes for P-1020', time: '5 hours ago' },
                { text: 'Started new Alzheimer\'s assessment', time: 'Yesterday' },
                { text: 'Exported monthly report', time: '2 days ago' },
                { text: 'Logged into system', time: '3 days ago' },
              ].map((activity, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0 border-[#DDE7E1]">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#3D8062]"></div>
                    <span className="text-sm">{activity.text}</span>
                  </div>
                  <span className="text-xs text-[#78858A]">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
