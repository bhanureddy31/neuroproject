'use client';

import React, { useState } from 'react';
import { Moon, Sun, Bell, Shield, Info, Download, Trash2, Check, Sparkles } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-[#3D8062]' : 'bg-[#DDE7E1]'}`}
        aria-label={label}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-6' : 'left-1'}`}></div>
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, fontSize, setFontSize } = useSettings();

  const [emailNotif, setEmailNotif] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [reports, setReports] = useState(false);
  const [updates, setUpdates] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 2800);
  };

  const handleExportData = () => {
    const data = {
      user: 'Dr. Ananya Rao',
      license: 'DR-0148',
      theme,
      fontSize,
      exportedAt: new Date().toISOString(),
      samplePatientsCount: 5,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NeuroDiagnosis_Config_${Date.now()}.json`;
    a.click();
    showNotification('Exported clinical settings to JSON file.');
  };

  const handleClearDatabase = async () => {
    if (window.confirm('WARNING: Are you sure you want to permanently clear all patient records and assessments from the SQLite database? This action cannot be undone.')) {
      try {
        const res = await fetch('/api/clear-data', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          showNotification('All clinical database records permanently cleared.');
        }
      } catch (e) {
        alert('Failed to clear database');
      }
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear your local preferences and reset to defaults?')) {
      localStorage.removeItem('neuro_theme');
      localStorage.removeItem('neuro_font_size');
      setTheme('light');
      setFontSize('medium');
      showNotification('Preferences reset to default factory settings.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 text-[#24333B]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-[#78858A]">Configure your clinical workspace, appearance, and alerts</p>
        </div>

        {notificationMsg && (
          <div className="flex items-center gap-2 bg-[#E8F4EC] text-[#347654] px-4 py-2 rounded-xl text-sm font-semibold border border-[#4F9473]/30 shadow-sm animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{notificationMsg}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sun className="w-5 h-5 text-[#3D8062]" /> Appearance & Interface
            </h2>
            <span className="text-xs bg-[#EEF4F0] text-[#3D8062] px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Reactive
            </span>
          </div>

          <div className="space-y-6">
            {/* Theme Selector */}
            <div>
              <p className="text-sm font-semibold mb-2">Display Theme</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    showNotification('Light clinical theme activated');
                  }}
                  className={`py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    theme === 'light'
                      ? 'border-2 border-[#3D8062] bg-[#EEF4F0] text-[#3D8062] shadow-sm'
                      : 'border border-[#DDE7E1] text-[#78858A] hover:bg-[#F4F8F5]'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Light Clinical</div>
                    <div className="text-xs opacity-75">Mint & white high-contrast</div>
                  </div>
                  {theme === 'light' && <Check className="w-4 h-4 ml-auto text-[#3D8062]" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    showNotification('Dark diagnostic theme activated');
                  }}
                  className={`py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    theme === 'dark'
                      ? 'border-2 border-[#3D8062] bg-[#EEF4F0] text-[#3D8062] shadow-sm'
                      : 'border border-[#DDE7E1] text-[#78858A] hover:bg-[#F4F8F5]'
                  }`}
                >
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Dark Diagnostic</div>
                    <div className="text-xs opacity-75">Radiology low-glare mode</div>
                  </div>
                  {theme === 'dark' && <Check className="w-4 h-4 ml-auto text-[#3D8062]" />}
                </button>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="pt-2 border-t border-[#DDE7E1]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Base Typography Scale</p>
                <span className="text-xs text-[#78858A] uppercase font-mono">
                  Current: <strong className="text-[#3D8062]">{fontSize}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'small', label: 'Small (13px)', desc: 'Information dense' },
                  { id: 'medium', label: 'Medium (14.5px)', desc: 'Standard balanced' },
                  { id: 'large', label: 'Large (16.5px)', desc: 'High legibility' },
                ].map((item) => {
                  const isSelected = fontSize === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFontSize(item.id as 'small' | 'medium' | 'large');
                        showNotification(`Typography scaled to ${item.id}`);
                      }}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'border-2 border-[#3D8062] bg-[#EEF4F0] text-[#3D8062] shadow-sm'
                          : 'border-[#DDE7E1] text-[#78858A] hover:bg-[#F4F8F5]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#24333B]">{item.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#3D8062]" />}
                      </div>
                      <div className="text-xs text-[#78858A] mt-1">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)]">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#3D8062]" /> Clinical Notifications
          </h2>
          <div className="divide-y divide-[#DDE7E1]">
            <ToggleSwitch
              label="Email Notifications (Critical AI Alerts)"
              checked={emailNotif}
              onChange={() => {
                setEmailNotif(!emailNotif);
                showNotification(`Email alerts ${!emailNotif ? 'enabled' : 'disabled'}`);
              }}
            />
            <ToggleSwitch
              label="Real-time Assessment Complete Audio/Visual Chimes"
              checked={alerts}
              onChange={() => {
                setAlerts(!alerts);
                showNotification(`Assessment alerts ${!alerts ? 'enabled' : 'disabled'}`);
              }}
            />
            <ToggleSwitch
              label="Automated Weekly Departmental Summary Reports"
              checked={reports}
              onChange={() => {
                setReports(!reports);
                showNotification(`Weekly reports ${!reports ? 'enabled' : 'disabled'}`);
              }}
            />
            <ToggleSwitch
              label="EfficientNet Model Checkpoint & Firmware Updates"
              checked={updates}
              onChange={() => {
                setUpdates(!updates);
                showNotification(`Update telemetry ${!updates ? 'enabled' : 'disabled'}`);
              }}
            />
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)]">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#3D8062]" /> Data Governance & Storage
          </h2>
          <div className="space-y-4">
            <ToggleSwitch
              label="Auto-save active assessment drafts to Local Secure Storage"
              checked={autoSave}
              onChange={() => {
                setAutoSave(!autoSave);
                showNotification(`Auto-save ${!autoSave ? 'active' : 'suspended'}`);
              }}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-t border-[#DDE7E1]">
              <span className="text-sm font-medium mb-2 sm:mb-0">HIPAA Audit Trail & Manifest Retention</span>
              <select className="border border-[#DDE7E1] rounded-[10px] px-3 py-1.5 focus:outline-none focus:border-[#3D8062] text-sm bg-white cursor-pointer">
                <option>30 days (Default)</option>
                <option>90 days (Clinical Standard)</option>
                <option>1 year (Research Audit)</option>
                <option>Permanent Archive</option>
              </select>
            </div>
            <div className="pt-4 flex flex-wrap gap-4 border-t border-[#DDE7E1]">
              <button
                type="button"
                onClick={handleExportData}
                className="border border-[#3D8062] text-[#3D8062] hover:bg-[#EEF4F0] px-4 py-2 rounded-[10px] flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                <Download className="w-4 h-4" /> Export Configuration JSON
              </button>
              <button
                type="button"
                onClick={handleClearDatabase}
                className="border border-red-500 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-[10px] flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" /> Wipe SQLite Database
              </button>
              <button
                type="button"
                onClick={handleClearData}
                className="border border-[#DDE7E1] text-[#78858A] hover:bg-[#F4F8F5] px-4 py-2 rounded-[10px] flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Reset Preferences
              </button>
            </div>
          </div>
        </div>

        {/* About System */}
        <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)]">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#3D8062]" /> Telemetry & Model Engine
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[#78858A] mb-1 text-xs uppercase tracking-wider">Platform Release</p>
              <p className="font-bold">v3.0.4-PRO</p>
            </div>
            <div>
              <p className="text-[#78858A] mb-1 text-xs uppercase tracking-wider">Alzheimer Architecture</p>
              <p className="font-bold">EfficientNet-B0 (Exp 10)</p>
            </div>
            <div>
              <p className="text-[#78858A] mb-1 text-xs uppercase tracking-wider">Parkinson Architecture</p>
              <p className="font-bold">EfficientNet-B0 (Exp 06)</p>
            </div>
            <div>
              <p className="text-[#78858A] mb-1 text-xs uppercase tracking-wider">Explainability Engine</p>
              <p className="font-bold">Grad-CAM (features[-1])</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
