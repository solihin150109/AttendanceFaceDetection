import React, { useState } from 'react';
import { Download, Filter, Search, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';
import { AttendanceRecord, Employee } from '../types';

interface ReportsViewProps {
  token: string;
  employees: Employee[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ token, employees }) => {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 3600 * 24 * 30 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL');

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    onTimeCount: 0,
    lateCount: 0,
    completedCheckoutCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const departments = [
    'Information Technology',
    'Research & Intelligence',
    'Human Resources',
    'Finance & Accounting',
    'Operations'
  ];

  const executeQuery = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        department: selectedDept,
        status: selectedStatus,
        employee_id: selectedEmployeeId
      });

      const res = await fetch(`/api/reports/query?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    executeQuery();
  }, [startDate, endDate, selectedDept, selectedStatus, selectedEmployeeId]);

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      department: selectedDept,
      status: selectedStatus
    });
    window.location.href = `/api/reports/export-csv?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Absensi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit histori presensi lengkap dengan filter multidimensi dan ekspor data resmi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Kriteria Filter Laporan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Departemen</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 font-medium"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Karyawan</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 font-medium"
            >
              <option value="ALL">Semua Karyawan</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_id} - {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900 font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="PRESENT">Hadir</option>
              <option value="LATE">Terlambat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Rekaman Kehadiran</div>
          <div className="text-3xl font-bold font-mono text-slate-900 pt-1">{summary.totalRecords}</div>
          <div className="text-xs text-slate-400">Log kehadiran terverifikasi</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100/90 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Hadir (Tepat Waktu)</div>
          <div className="text-3xl font-bold font-mono text-emerald-700 pt-1">{summary.onTimeCount}</div>
          <div className="text-xs text-emerald-700/80 font-medium">Memenuhi jam masuk operasional</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100/90 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Total Terlambat</div>
          <div className="text-3xl font-bold font-mono text-amber-700 pt-1">{summary.lateCount}</div>
          <div className="text-xs text-amber-700/80 font-medium">Melebihi batas toleransi jam kerja</div>
        </div>
      </div>

      {/* Report Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5">Employee ID</th>
                <th className="py-3 px-5">Nama Pegawai</th>
                <th className="py-3 px-5">Departemen</th>
                <th className="py-3 px-5">Jam Masuk</th>
                <th className="py-3 px-5">Jam Pulang</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Distance (d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Memuat data riwayat presensi...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada catatan absensi yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-medium text-slate-900">{r.date}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-600 font-medium">{r.employee_code}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{r.employee_name}</td>
                    <td className="py-3.5 px-5 text-slate-600">{r.department}</td>
                    <td className="py-3.5 px-5 font-mono font-semibold text-emerald-700">{r.check_in}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">
                      {r.check_out || <span className="text-slate-400 italic">Belum Pulang</span>}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded-md text-[11px] border ${
                          r.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {r.status === 'PRESENT' ? 'Hadir' : 'Terlambat'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-500">{r.recognition_distance}</td>
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
