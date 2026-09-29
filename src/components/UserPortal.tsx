import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { User as UserType, AttendanceRecord } from '../types';

interface UserPortalProps {
  user: UserType | null;
  token: string;
  onNavigateToKiosk: () => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({ user, token, onNavigateToKiosk }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPersonalAttendance() {
      try {
        const res = await fetch('/api/user/attendance', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setRecords(data.data);
        }
      } catch (err) {
        console.error('Error fetching personal attendance:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      fetchPersonalAttendance();
    }
  }, [token]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = records.find(r => r.date === todayStr);

  const totalPresent = records.filter(r => r.status === 'PRESENT').length;
  const totalLate = records.filter(r => r.status === 'LATE').length;

  const displayName = user?.employee?.name || user?.username || 'Karyawan';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
            {displayInitial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Halo, {displayName}
              </h1>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-semibold">
                Karyawan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.employee?.position || 'Staf Operasional'} &middot; {user?.employee?.department || 'Departemen Perusahaan'}
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToKiosk}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs group cursor-pointer"
        >
          <span>Buka Kiosk Absensi Wajah</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Status Presensi Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status Hari Ini</div>
          {todayRecord ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-900 text-base">Sudah Melakukan Absensi</span>
              </div>
              <div className="text-xs space-y-1 text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>Jam Masuk:</span>
                  <strong className="font-mono text-emerald-700">{todayRecord.check_in}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Jam Pulang:</span>
                  <strong className="font-mono text-slate-800">
                    {todayRecord.check_out || <span className="text-slate-400 font-normal italic">Belum Pulang</span>}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <strong className={todayRecord.status === 'PRESENT' ? 'text-emerald-700' : 'text-amber-700'}>
                    {todayRecord.status === 'PRESENT' ? 'TEPAT WAKTU' : 'TERLAMBAT'}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="font-semibold text-slate-700 text-sm">Belum Ada Presensi Hari Ini</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Silakan lakukan pemindaian wajah mandiri melalui kamera Kiosk Presensi di gerbang kantor.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-xs space-y-2">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Kehadiran Tepat Waktu</div>
          <div className="text-3xl font-bold font-mono text-emerald-700">{totalPresent} Hari</div>
          <div className="text-xs text-slate-500">Berdasarkan log historis presensi Anda</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-xs space-y-2">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Keterlambatan</div>
          <div className="text-3xl font-bold font-mono text-amber-700">{totalLate} Hari</div>
          <div className="text-xs text-slate-500">Melebihi batas toleransi jam masuk</div>
        </div>
      </div>

      {/* Profil Karyawan & Biometrik Detail */}
      {user?.employee && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            Informasi Profil Pegawai
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-slate-400 text-[11px]">Nomor Induk Pegawai</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">{user.employee.employee_id}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-slate-400 text-[11px]">Email Perusahaan</span>
              <div className="font-medium text-slate-900 mt-0.5 truncate">{user.employee.email || '-'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-slate-400 text-[11px]">Nomor Kontak</span>
              <div className="font-mono text-slate-900 mt-0.5">{user.employee.phone || '-'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-slate-400 text-[11px]">Status Biometrik Wajah</span>
              <div className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Terdaftar (128-D Vector)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Histori Presensi Pribadi */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs space-y-3">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Riwayat Presensi Mandiri
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Catatan log kehadiran dan waktu pulang terverifikasi</p>
          </div>
          <span className="text-xs font-mono text-slate-500">Total: {records.length} Hari</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5">Jam Masuk</th>
                <th className="py-3 px-5">Jam Pulang</th>
                <th className="py-3 px-5">Status Kehadiran</th>
                <th className="py-3 px-5 text-right">Distance (d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Memuat riwayat kehadiran...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada rekaman presensi pada akun Anda.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-medium text-slate-900">{r.date}</td>
                    <td className="py-3.5 px-5 font-mono font-semibold text-emerald-700">{r.check_in}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">
                      {r.check_out || <span className="text-slate-400 italic">Belum Pulang</span>}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`font-semibold ${
                          r.status === 'PRESENT' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {r.status === 'PRESENT' ? 'TEPAT WAKTU' : 'TERLAMBAT'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-500">
                      {r.recognition_distance}
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
