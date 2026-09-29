import React, { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface AttendanceListProps {
  records: AttendanceRecord[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  records,
  onRefresh,
  isLoading
}) => {
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = records.filter((rec) => {
    const matchDept = filterDepartment === 'ALL' || rec.department === filterDepartment;
    const matchStatus = filterStatus === 'ALL' || rec.status === filterStatus;
    const matchSearch =
      !searchQuery ||
      (rec.employee_name && rec.employee_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.employee_code && rec.employee_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.department && rec.department.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchDept && matchStatus && matchSearch;
  });

  const departments = Array.from(new Set(records.map((r) => r.department).filter(Boolean)));

  const onTimeCount = records.filter(r => r.status === 'PRESENT').length;
  const lateCount = records.filter(r => r.status === 'LATE').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Presensi Hari Ini</h1>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar presensi masuk dan pulang karyawan yang terverifikasi biometrik wajah secara real-time.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900"
          >
            <option value="ALL">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900"
          >
            <option value="ALL">Semua Status</option>
            <option value="PRESENT">Tepat Waktu ({onTimeCount})</option>
            <option value="LATE">Terlambat ({lateCount})</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono self-center px-2">
          Total: <strong className="text-slate-900">{filtered.length}</strong>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-slate-400">No</th>
                <th className="py-3.5 px-4">Nama Karyawan</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Departemen</th>
                <th className="py-3.5 px-4">Jam Masuk</th>
                <th className="py-3.5 px-4">Jam Pulang</th>
                <th className="py-3.5 px-4">Status Kehadiran</th>
                <th className="py-3.5 px-4 text-right">Distance (d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada catatan presensi yang sesuai dengan kriteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.employee_name}</div>
                      <div className="text-[11px] text-slate-400">{item.position}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">{item.employee_code}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.department}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">{item.check_in}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {item.check_out ? (
                        <span className="font-semibold">{item.check_out}</span>
                      ) : (
                        <span className="text-slate-400 italic">Belum Pulang</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          item.status === 'PRESENT' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {item.status === 'PRESENT' ? 'TEPAT WAKTU' : 'TERLAMBAT'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {item.recognition_distance}
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
