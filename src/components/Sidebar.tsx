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
  ShieldCheck,
  FileText
} from 'lucide-react';
import { User as UserType } from '../types';

export type TabType =
  | 'dashboard'
  | 'attendance_kiosk'
  | 'employees'
  | 'face_registration'
  | 'attendance_history'
  | 'leave_management'
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
  pendingLeaveCount?: number;
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
  pendingLeaveCount = 0,
  onOpenHelp
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isEmployee = currentUser?.role === 'EMPLOYEE';

  // Strict enterprise menu list:
  // Admin: Dashboard, Data Karyawan, Registrasi Wajah, Riwayat Absensi, Izin & Cuti, Laporan, Pengujian Recognition, Pengaturan
  // Employee: Dashboard, Absensi, Riwayat Absensi, Pengajuan Izin/Cuti
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
      id: 'leave_management' as TabType,
      label: isAdmin ? 'Izin & Cuti' : 'Pengajuan Izin / Cuti',
      icon: FileText,
      visible: true,
      badge: pendingLeaveCount > 0 ? (isAdmin ? `${pendingLeaveCount} Baru` : `${pendingLeaveCount}`) : null,
      badgeColor: 'amber'
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
      className={`h-full flex flex-col justify-between bg-slate-900 text-white border-r border-slate-800 select-none overflow-hidden transition-all duration-200 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand & Logo Header with integrated Collapse/Expand Controls */}
      <div className="shrink-0 border-b border-slate-800/90">
        <div
          className={`h-16 flex items-center transition-all ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner"
              title="SMART ATTENDANCE"
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

          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60 shrink-0"
              title="Ciutkan Sidebar"
              aria-label="Ciutkan Sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dedicated expand button when collapsed */}
        {isCollapsed && (
          <div className="px-2 py-1 flex justify-center border-t border-slate-800/60 bg-slate-900/60">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-9 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/50"
              title="Perluas Sidebar"
              aria-label="Perluas Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation List - overflow-y-auto with clean no-scrollbar */}
      <nav className={`flex-1 overflow-y-auto no-scrollbar py-3 space-y-1.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
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
                  type="button"
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
                        item.badgeColor === 'amber'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : item.id === 'research'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Small notification dot when collapsed and has badge */}
                  {isCollapsed && item.badge && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="fixed left-20 ml-2 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800 invisible opacity-0 group-hover:visible group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* Bottom Area: Help & Version */}
      <div className={`shrink-0 border-t border-slate-800 text-xs text-slate-400 space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
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
            <div className="fixed left-20 ml-2 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800 invisible opacity-0 group-hover:visible group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
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
