'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Brain } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('doctor@neurodiagnosis.ai');
  const [password, setPassword] = useState('neuro@123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = '/dashboard';
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[0_8px_24px_rgba(36,51,59,.055)] border border-border p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-soft p-3 rounded-full mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy">NeuroDiagnosis</h1>
          <p className="text-muted text-sm mt-1">Clinical Intelligence Platform</p>
        </div>

        <form onSubmit={handleSubmit} action="/dashboard" method="GET" className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-muted" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-slate"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white rounded-[10px] h-12 font-semibold transition-colors mt-2"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-muted">
          Authorized medical professionals only
        </div>
      </div>
    </main>
  );
}
