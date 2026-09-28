'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FilePlus, 
  Users, 
  Clock, 
  FileText, 
  UserCircle, 
  Settings, 
  Info, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/new-assessment', label: 'New Assessment', icon: FilePlus },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/history', label: 'Assessment History', icon: Clock },
  { href: '/dashboard/report', label: 'Clinical Report', icon: FileText },
  { href: '/dashboard/doctor', label: 'Doctor Profile', icon: UserCircle },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/about', label: 'About', icon: Info },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/new-assessment': 'New Assessment',
  '/dashboard/patients': 'Patients',
  '/dashboard/history': 'Assessment History',
  '/dashboard/report': 'Clinical Report',
  '/dashboard/doctor': 'Doctor Profile',
  '/dashboard/settings': 'Settings',
  '/dashboard/about': 'About',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useSettings();

  const title = pageTitles[pathname] || 'Dashboard';

  return (
    <div className="flex h-screen bg-bg">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-card border-r border-border flex flex-col z-20">
        {/* Brand */}
        <div 
          onClick={() => router.push('/dashboard')}
          className="h-20 flex items-center px-6 border-b border-border cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold mr-3 shrink-0 shadow-sm">
            N
          </div>
          <span className="text-xl font-extrabold text-navy tracking-tight">NeuroDiagnosis</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-[10px] text-sm transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-soft text-primary font-semibold shadow-xs' 
                    : 'text-muted hover:bg-soft hover:text-slate'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-[10px] text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer font-medium"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[260px] flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 shrink-0 z-10">
          <div>
            <div className="text-xs text-muted font-medium uppercase tracking-wider mb-0.5">Clinical workspace</div>
            <h1 className="text-xl font-bold text-navy">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Quick Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border text-muted hover:text-slate hover:bg-soft transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title={theme === 'dark' ? 'Switch to Light Clinical Theme' : 'Switch to Dark Diagnostic Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate" />
                  <span className="hidden md:inline">Dark</span>
                </>
              )}
            </button>

            <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block"></div>

            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-navy">Dr. Ananya Rao</div>
              <div className="text-xs text-muted">Neurology &middot; DR-0148</div>
            </div>
            <div 
              onClick={() => router.push('/dashboard/doctor')}
              className="w-10 h-10 rounded-full bg-green-bg text-primary font-bold flex items-center justify-center border border-border cursor-pointer hover:opacity-90 transition-opacity"
              title="View Doctor Profile"
            >
              AR
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
