import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Calendar, Filter, User } from 'lucide-react';
import { AttendanceRecord, User as UserType } from '../types';

interface AttendanceHistoryViewProps {
  token: string;
  currentUser: UserType | null;
  onRefreshParent: () => void;
}

export const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({
  token,
  currentUser,
  onRefreshParent
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/attendance/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleManualRefresh = () => {
    fetchHistory();
    onRefreshParent();
  };

  const filtered = records.filter((rec) => {
    const matchDept = filterDepartment === 'ALL' || rec.department === filterDepartment;
    const matchStatus = filterStatus === 'ALL' || rec.status === filterStatus;
    const matchDate = !dateFilter || rec.date === dateFilter;
    const matchSearch =
      !searchQuery ||
      (rec.employee_name && rec.employee_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.employee_code && rec.employee_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.department && rec.department.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchDept && matchStatus && matchDate && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const departments = Array.from(new Set(records.map((r) => r.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? 'Riwayat Absensi Seluruh Pegawai' : 'Riwayat Absensi Saya'}
            </h2>
            <span
              className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-md border font-semibold ${
                isAdmin
                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {isAdmin ? 'Mode Admin / Seluruh Departemen' : 'Mode Pegawai / Catatan Pribadi'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Daftar audit lengkap seluruh transaksi kehadiran pegawai yang tercatat pada basis data.'
              : `Daftar rekam kehadiran dan kepulangan resmi atas nama ${currentUser?.employee?.name || currentUser?.username}.`}
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {isAdmin && (
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pegawai atau ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors placeholder:text-slate-400 font-medium"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 bg-white font-medium"
          />

          {isAdmin && (
            <select
              value={filterDepartment}
              onChange={(e) => {
                setFilterDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 font-medium"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="PRESENT">Hadir</option>
            <option value="LATE">Terlambat</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Tanggal</th>
                {isAdmin && <th className="py-3 px-5">Nama Pegawai</th>}
                {isAdmin && <th className="py-3 px-5">Employee ID</th>}
                {isAdmin && <th className="py-3 px-5">Departemen</th>}
                <th className="py-3 px-5">Jam Masuk</th>
                <th className="py-3 px-5">Jam Pulang</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Distance (d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 5} className="py-12 text-center text-slate-400">
                    Belum ada riwayat absensi yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-medium text-slate-900">{item.date}</td>
                    {isAdmin && (
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{item.employee_name}</div>
                        <div className="text-[11px] text-slate-400">{item.position}</div>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="py-3.5 px-5 font-mono text-slate-600 font-medium">
                        {item.employee_code}
                      </td>
                    )}
                    {isAdmin && <td className="py-3.5 px-5 text-slate-600">{item.department}</td>}
                    <td className="py-3.5 px-5 font-mono font-semibold text-emerald-700">
                      {item.check_in}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">
                      {item.check_out || <span className="text-slate-400 italic">Belum Pulang</span>}
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
                    <td className="py-3.5 px-5 text-right font-mono text-slate-500">
                      {item.recognition_distance}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} transaksi
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Sebelumnya
            </button>
            <span className="font-mono font-medium text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
