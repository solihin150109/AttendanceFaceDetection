import React from 'react';
import {
  LayoutDashboard,
  ScanFace,
  Users,
  Camera,
  CalendarCheck,
  FileBarChart,
  FlaskConical,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { User as UserType } from '../types';

export type TabType =
  | 'dashboard'
  | 'attendance_kiosk'
  | 'employees'
  | 'face_registration'
  | 'attendance_history'
  | 'reports'
  | 'research'
  | 'settings'
  | 'profile';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: UserType | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  todayCount: number;
  employeeCount: number;
  onOpenHelp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  isCollapsed,
  onToggleCollapse,
  todayCount,
  employeeCount,
  onOpenHelp
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isEmployee = currentUser?.role === 'EMPLOYEE';

  // Strict enterprise menu list:
  // Admin: Dashboard, Data Karyawan, Registrasi Wajah, Riwayat Absensi, Laporan, Pengujian Recognition, Pengaturan
  // Employee: Dashboard, Absensi, Riwayat Absensi
  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: true,
      badge: null
    },
    {
      id: 'attendance_kiosk' as TabType,
      label: 'Absensi',
      icon: ScanFace,
      visible: isEmployee,
      badge: null
    },
    {
      id: 'employees' as TabType,
      label: 'Data Karyawan',
      icon: Users,
      visible: isAdmin,
      badge: employeeCount > 0 ? String(employeeCount) : null
    },
    {
      id: 'face_registration' as TabType,
      label: 'Registrasi Wajah',
      icon: Camera,
      visible: isAdmin,
      badge: null
    },
    {
      id: 'attendance_history' as TabType,
      label: 'Riwayat Absensi',
      icon: CalendarCheck,
      visible: true,
      badge: todayCount > 0 && isAdmin ? String(todayCount) : null
    },
    {
      id: 'reports' as TabType,
      label: 'Laporan',
      icon: FileBarChart,
      visible: isAdmin,
      badge: null
    },
    {
      id: 'research' as TabType,
      label: 'Pengujian Recognition',
      icon: FlaskConical,
      visible: isAdmin,
      badge: 'Bab IV'
    },
    {
      id: 'settings' as TabType,
      label: 'Pengaturan',
      icon: Settings,
      visible: isAdmin,
      badge: null
    }
  ];

  return (
    <aside
      className={`bg-slate-900 text-white flex flex-col justify-between shrink-0 border-r border-slate-800 transition-all duration-200 z-30 sticky top-0 h-screen select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand & Toggle Header */}
      <div>
        <div
          className={`h-16 flex items-center border-b border-slate-800 transition-all ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner"
              title={isCollapsed ? 'SMART ATTENDANCE' : undefined}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>

            {!isCollapsed && (
              <div className="truncate">
                <div className="font-bold text-sm tracking-tight text-white leading-tight">
                  SMART ATTENDANCE
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">
                  Face Recognition System
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:flex items-center justify-center cursor-pointer ${
              isCollapsed ? 'ml-0 mt-0 absolute top-3 right-1 w-6 h-6 bg-slate-800/80 rounded-md border border-slate-700' : ''
            }`}
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className={`space-y-1.5 overflow-y-auto max-h-[calc(100vh-12rem)] ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {!isCollapsed ? (
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Navigasi Utama</span>
              <span className="text-[9px] font-mono text-slate-400">
                {isAdmin ? 'ADMIN' : 'PEGAWAI'}
              </span>
            </div>
          ) : (
            <div className="w-8 h-px bg-slate-800 mx-auto my-1" />
          )}

          {menuItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isCollapsed
                        ? 'justify-center p-2.5 h-11'
                        : 'gap-3.5 px-3.5 py-2.5'
                    } ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-xs border border-slate-700/80'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          item.id === 'research'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>
      </div>

      {/* Bottom Area: Help & Version */}
      <div className={`border-t border-slate-800 text-xs text-slate-400 space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className="relative group">
          <button
            type="button"
            onClick={onOpenHelp}
            className={`w-full flex items-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
              isCollapsed
                ? 'justify-center p-2.5 h-11'
                : 'gap-2.5 p-2.5'
            }`}
            title={isCollapsed ? 'Pusat Bantuan & Petunjuk' : undefined}
          >
            <HelpCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            {!isCollapsed && <span className="font-medium text-xs">Pusat Bantuan</span>}
          </button>

          {/* Tooltip when collapsed */}
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Pusat Bantuan
            </div>
          )}
        </div>

        {!isCollapsed ? (
          <div className="text-[11px] text-slate-500 font-mono px-2 pt-1 border-t border-slate-800/60">
            Versi 2.4.0 (Enterprise)
          </div>
        ) : (
          <div
            className="text-[10px] text-center text-slate-500 font-mono pt-1 cursor-default"
            title="Versi 2.4.0 (Enterprise)"
          >
            v2.4
          </div>
        )}
      </div>
    </aside>
  );
};
