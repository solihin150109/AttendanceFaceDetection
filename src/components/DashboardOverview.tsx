import React from 'react';
import {
  Users,
  UserCheck,
  AlertCircle,
  Clock,
  Plus,
  Camera,
  ArrowRight,
  TrendingUp,
  Sliders,
  ShieldCheck,
  FileText,
  CalendarCheck
} from 'lucide-react';
import { DashboardStats, AttendanceRecord } from '../types';

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  todayRecords: AttendanceRecord[];
  onQuickAddEmployee: () => void;
  onQuickRegisterFace: () => void;
  onViewAllAttendance: () => void;
  onViewSettings: () => void;
  onNavigateToLeave?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  todayRecords,
  onQuickAddEmployee,
  onQuickRegisterFace,
  onViewAllAttendance,
  onViewSettings,
  onNavigateToLeave
}) => {
  if (!stats) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
        Memuat data monitoring operasional...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Essential Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Karyawan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Karyawan
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight pt-1">
            {stats.totalEmployees}
          </div>
          <div className="text-xs text-slate-400">Pegawai terdaftar aktif</div>
        </div>

        {/* Hadir (Tepat Waktu) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Hadir
            </span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-700 font-mono tracking-tight pt-1">
            {stats.presentToday}
          </div>
          <div className="text-xs text-emerald-700/80 font-medium">Tepat waktu (&le; toleransi)</div>
        </div>

        {/* Terlambat */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Terlambat
            </span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-700 font-mono tracking-tight pt-1">
            {stats.lateToday}
          </div>
          <div className="text-xs text-amber-700/80 font-medium">&gt; Jam batas masuk</div>
        </div>

        {/* Cuti & Izin Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-100/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Cuti / Izin
            </span>
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-indigo-700 font-mono tracking-tight pt-1">
            {stats.onLeaveToday ?? 0}
          </div>
          <div className="text-xs text-indigo-700/80 font-medium">Izin sah terverifikasi</div>
        </div>

        {/* Belum Absen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Belum Absen
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-700 font-mono tracking-tight pt-1">
            {stats.notYetAttended}
          </div>
          <div className="text-xs text-slate-400">Belum ada transaksi hari ini</div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Aksi Manajemen Cepat (Quick Actions)
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onQuickAddEmployee}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-200" />
            <span>Tambah Karyawan Baru</span>
          </button>

          {onNavigateToLeave && (
            <button
              onClick={onNavigateToLeave}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-800 hover:text-indigo-700 text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Kelola Izin & Cuti</span>
              {stats.pendingLeaveRequests !== undefined && stats.pendingLeaveRequests > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
                  {stats.pendingLeaveRequests}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onQuickRegisterFace}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            <span>Registrasi Wajah Pegawai</span>
          </button>

          <button
            onClick={onViewSettings}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-600" />
            <span>Atur Shift & Threshold (τ)</span>
          </button>
        </div>
      </div>

      {/* Absensi Hari Ini Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Absensi Seluruh Pegawai Hari Ini
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar kehadiran pegawai yang terverifikasi biometrik pada hari ini
            </p>
          </div>

          <button
            onClick={onViewAllAttendance}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Buka Riwayat Seluruh Pegawai</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Nama Pegawai</th>
                <th className="py-3 px-5">Employee ID</th>
                <th className="py-3 px-5">Departemen</th>
                <th className="py-3 px-5">Jam Masuk</th>
                <th className="py-3 px-5">Jam Pulang</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {todayRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Belum ada data presensi yang masuk pada hari ini.
                  </td>
                </tr>
              ) : (
                todayRecords.slice(0, 7).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{item.employee_name}</div>
                      <div className="text-[11px] text-slate-400">{item.position}</div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-600 font-medium">
                      {item.employee_code}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">{item.department}</td>
                    <td className="py-3.5 px-5 font-mono font-semibold text-emerald-700">
                      {item.check_in}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">
                      {item.check_out || <span className="text-slate-400 italic font-normal">Belum Pulang</span>}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded-md text-[11px] border ${
                          item.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.status === 'PRESENT' ? 'Hadir' : 'Terlambat'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
