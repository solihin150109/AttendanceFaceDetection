import React from 'react';
import {
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  ShieldCheck,
  CalendarCheck,
  ScanFace,
  ArrowRight,
  FileText,
  Camera,
  Lock
} from 'lucide-react';
import { User as UserType, AttendanceRecord } from '../types';

interface UserDashboardProps {
  user: UserType | null;
  token: string;
  onNavigateToAttendance: () => void;
  onViewHistory: () => void;
  onNavigateToLeave?: () => void;
  onOpenProfilePhoto?: () => void;
  onOpenChangePassword?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  token,
  onNavigateToAttendance,
  onViewHistory,
  onNavigateToLeave,
  onOpenProfilePhoto,
  onOpenChangePassword
}) => {
  const [personalRecords, setPersonalRecords] = React.useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchPersonal() {
      try {
        const res = await fetch('/api/user/attendance', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setPersonalRecords(data.data);
        }
      } catch (err) {
        console.error('Error fetching user attendance:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (token) {
      fetchPersonal();
    }
  }, [token]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = personalRecords.find((r) => r.date === todayStr);

  const totalPresent = personalRecords.filter((r) => r.status === 'PRESENT').length;
  const totalLate = personalRecords.filter((r) => r.status === 'LATE').length;

  const displayName = user?.employee?.name || user?.username || 'Karyawan';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const avatarUrl = user?.avatar_url || user?.employee?.avatar_url;

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayInitial
              )}
            </div>
            {onOpenProfilePhoto && (
              <button
                type="button"
                onClick={onOpenProfilePhoto}
                className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs border border-white cursor-pointer transition-transform hover:scale-110"
                title="Ganti Foto Profil"
              >
                <Camera className="w-3 h-3" />
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Selamat Datang, {displayName}
              </h2>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-semibold">
                Karyawan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {user?.employee?.position || 'Pegawai Operasional'} &middot; {user?.employee?.department || 'Departemen Perusahaan'} (NIP: {user?.employee?.employee_id || '-'})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onOpenChangePassword && (
            <button
              type="button"
              onClick={onOpenChangePassword}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs border border-slate-200 cursor-pointer"
              title="Ganti Kata Sandi"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Ganti Password</span>
            </button>
          )}

          {onNavigateToLeave && (
            <button
              type="button"
              onClick={onNavigateToLeave}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-2xs border border-indigo-200 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Izin / Cuti</span>
            </button>
          )}

          <button
            onClick={onNavigateToAttendance}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer group"
          >
            <ScanFace className="w-4 h-4" />
            <span>Lakukan Absensi Wajah</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 3 Status KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Status Absensi Hari Ini */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Status Presensi Hari Ini
          </div>

          {todayRecord ? (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">Sudah Melakukan Absensi</span>
              </div>
              <div className="text-xs space-y-1.5 text-slate-600 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Jam Masuk:</span>
                  <strong className="font-mono text-emerald-700">{todayRecord.check_in}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Jam Pulang:</span>
                  <strong className="font-mono text-slate-900">
                    {todayRecord.check_out || <span className="text-slate-400 font-normal italic">Belum Pulang</span>}
                  </strong>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md text-[11px] border ${
                      todayRecord.status === 'PRESENT'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {todayRecord.status === 'PRESENT' ? 'Hadir' : 'Terlambat'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="font-bold text-slate-800 text-sm">Belum Absen Hari Ini</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Silakan buka menu <strong>Absensi</strong> untuk memindai wajah Anda di depan kamera.
              </p>
            </div>
          )}
        </div>

        {/* Kehadiran Tepat Waktu */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Total Hadir Tepat Waktu
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700 pt-1">
            {totalPresent} Hari
          </div>
          <div className="text-xs text-slate-500">&le; Toleransi batas jam masuk kerja</div>
        </div>

        {/* Keterlambatan */}
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            Total Terlambat
          </div>
          <div className="text-3xl font-bold font-mono text-amber-700 pt-1">
            {totalLate} Hari
          </div>
          <div className="text-xs text-slate-500">&gt; Jam batas masuk kerja</div>
        </div>
      </div>

      {/* Profil Pegawai & Status Biometrik */}
      {user?.employee && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <span>Informasi Identitas Pegawai</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[11px]">Employee ID (NIP)</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">{user.employee.employee_id}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[11px]">Email Perusahaan</span>
              <div className="font-medium text-slate-900 mt-0.5 truncate">{user.employee.email || '-'}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[11px]">Nomor Telepon</span>
              <div className="font-mono text-slate-900 mt-0.5">{user.employee.phone || '-'}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[11px]">Status Biometrik Wajah</span>
              <div className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Terdaftar (128-D)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabel 5 Transaksi Terakhir Pegawai */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Aktivitas Absensi Terbaru
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Catatan kehadiran dan kepulangan pribadi Anda</p>
          </div>

          <button
            onClick={onViewHistory}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Buka Riwayat Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
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
              ) : personalRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada rekaman presensi pada akun Anda.
                  </td>
                </tr>
              ) : (
                personalRecords.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-medium text-slate-900">{r.date}</td>
                    <td className="py-3.5 px-5 font-mono font-semibold text-emerald-700">{r.check_in}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">
                      {r.check_out || <span className="text-slate-400 italic">Belum Pulang</span>}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md text-[11px] border ${
                          r.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {r.status === 'PRESENT' ? 'Hadir' : 'Terlambat'}
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
