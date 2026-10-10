'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
  Moon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useSettings();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const title = pageTitles[pathname] || 'Dashboard';

  const navigate = (href: string) => {
    router.push(href);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">

      {/* =========================================================
          MOBILE OVERLAY
      ========================================================== */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* =========================================================
          SIDEBAR
      ========================================================== */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0
          bg-card border-r border-border
          flex flex-col z-50
          transition-all duration-300 ease-in-out

          w-[260px]

          ${sidebarCollapsed ? 'md:w-[76px]' : 'md:w-[260px]'}

          ${
            mobileSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
          }
        `}
      >

        {/* =====================================================
            BRAND
        ====================================================== */}
        <div
          onClick={() => navigate('/dashboard')}
          className={`
            h-20 flex items-center
            border-b border-border
            cursor-pointer shrink-0
            transition-all duration-300

            ${sidebarCollapsed ? 'md:justify-center md:px-0' : 'px-6'}
          `}
        >
          <div
            className="
              w-8 h-8 rounded-full
              bg-primary
              flex items-center justify-center
              text-white font-bold
              shrink-0 shadow-sm
            "
          >
            N
          </div>

          <span
            className={`
              text-xl font-extrabold
              text-navy tracking-tight
              ml-3 whitespace-nowrap
              transition-all duration-200

              ${sidebarCollapsed ? 'md:hidden' : ''}
            `}
          >
            NeuroDiagnosis
          </span>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSidebarOpen(false);
            }}
            className="
              ml-auto
              p-2 rounded-lg
              text-muted
              hover:bg-soft
              hover:text-slate
              transition-colors
              md:hidden
            "
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =====================================================
            NAVIGATION
        ====================================================== */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                title={sidebarCollapsed ? link.label : undefined}
                className={`
                  w-full
                  flex items-center
                  rounded-[10px]
                  text-sm
                  transition-all duration-200
                  cursor-pointer

                  ${
                    sidebarCollapsed
                      ? 'md:justify-center md:px-0'
                      : 'space-x-3 px-3'
                  }

                  px-3 py-2.5

                  ${
                    isActive
                      ? 'bg-soft text-primary font-semibold shadow-xs'
                      : 'text-muted hover:bg-soft hover:text-slate'
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />

                <span
                  className={`
                    whitespace-nowrap
                    transition-all duration-200

                    ${sidebarCollapsed ? 'md:hidden' : ''}
                  `}
                >
                  {link.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* =====================================================
            LOGOUT
        ====================================================== */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => navigate('/')}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className={`
              w-full
              flex items-center
              px-3 py-2.5
              rounded-[10px]
              text-sm
              text-red-500
              hover:bg-red-50
              dark:hover:bg-red-950/30
              transition-all
              cursor-pointer
              font-medium

              ${
                sidebarCollapsed
                  ? 'md:justify-center md:px-0'
                  : 'space-x-3'
              }
            `}
          >
            <LogOut className="w-5 h-5 shrink-0" />

            <span
              className={`
                whitespace-nowrap
                ${sidebarCollapsed ? 'md:hidden' : ''}
              `}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <main
        className={`
          flex-1
          flex flex-col
          h-full
          overflow-hidden
          ml-0
          transition-all duration-300 ease-in-out

          ${
            sidebarCollapsed
              ? 'md:ml-[76px]'
              : 'md:ml-[260px]'
          }
        `}
      >

        {/* =====================================================
            HEADER
        ====================================================== */}
        <header
          className="
            h-20
            bg-card
            border-b border-border
            flex items-center
            justify-between
            px-4 sm:px-6 md:px-8
            shrink-0
            z-10
          "
        >

          {/* LEFT SIDE */}
          <div className="flex items-center min-w-0">

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="
                p-2
                mr-3
                rounded-lg
                text-muted
                hover:bg-soft
                hover:text-slate
                transition-colors
                md:hidden
              "
              aria-label="Open navigation"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop collapse button */}
            <button
              type="button"
              onClick={() =>
                setSidebarCollapsed((prev) => !prev)
              }
              className="
                hidden md:flex
                p-2
                mr-3
                rounded-lg
                border border-border
                text-muted
                hover:bg-soft
                hover:text-slate
                transition-all
                items-center
                justify-center
              "
              title={
                sidebarCollapsed
                  ? 'Expand Sidebar'
                  : 'Collapse Sidebar'
              }
              aria-label={
                sidebarCollapsed
                  ? 'Expand Sidebar'
                  : 'Collapse Sidebar'
              }
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            <div className="min-w-0">
              <div
                className="
                  text-xs
                  text-muted
                  font-medium
                  uppercase
                  tracking-wider
                  mb-0.5
                "
              >
                Clinical workspace
              </div>

              <h1 className="text-xl font-bold text-navy truncate">
                {title}
              </h1>
            </div>
          </div>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="
                p-2
                rounded-xl
                border border-border
                text-muted
                hover:text-slate
                hover:bg-soft
                transition-all
                cursor-pointer
                flex items-center
                gap-1.5
                text-xs
                font-semibold
              "
              title={
                theme === 'dark'
                  ? 'Switch to Light Clinical Theme'
                  : 'Switch to Dark Diagnostic Theme'
              }
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline">
                    Light
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate" />
                  <span className="hidden lg:inline">
                    Dark
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            <div
              className="
                h-6
                w-[1px]
                bg-border
                mx-1
                hidden sm:block
              "
            />

            {/* Doctor Info */}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-navy">
                Dr. Ananya Rao
              </div>

              <div className="text-xs text-muted">
                Neurology &middot; DR-0148
              </div>
            </div>

            {/* Doctor Avatar */}
            <div
              onClick={() => navigate('/dashboard/doctor')}
              className="
                w-10 h-10
                rounded-full
                bg-green-bg
                text-primary
                font-bold
                flex items-center
                justify-center
                border border-border
                cursor-pointer
                hover:opacity-90
                transition-opacity
                shrink-0
              "
              title="View Doctor Profile"
            >
              AR
            </div>
          </div>
        </header>

        {/* =====================================================
            PAGE CONTENT
        ====================================================== */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}