import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
  ShieldCheck,
  Menu
} from 'lucide-react';
import { User as UserType } from '../types';

interface TopbarProps {
  title: string;
  description: string;
  currentUser: UserType | null;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onRequestLogout: () => void;
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  description,
  currentUser,
  onOpenProfile,
  onOpenSettings,
  onRequestLogout,
  onToggleMobileSidebar
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = currentUser?.employee?.name || currentUser?.username || 'Pengguna';
  const roleLabel = currentUser?.role === 'ADMIN' ? 'Administrator' : 'Karyawan';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile Toggle & Page Title with Subtitle */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          <p className="text-xs text-slate-500 truncate hidden sm:block">
            {description}
          </p>
        </div>
      </div>

      {/* Right: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Profile Dropdown (POJOK KANAN ATAS) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 pl-2.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer focus:outline-hidden"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-32">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">{roleLabel}</div>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150 z-30">
              {/* User Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{displayName}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{roleLabel}</div>
              </div>

              {/* Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Profil</span>
                </button>

                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Pengaturan</span>
                  </button>
                )}
              </div>

              {/* Logout Item */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onRequestLogout();
                  }}
                  className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
