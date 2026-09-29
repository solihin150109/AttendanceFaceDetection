import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Calendar,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  FileCheck,
  User,
  Building,
  Briefcase,
  ExternalLink,
  Edit3,
  Sparkles,
  Info,
  Check,
  X
} from 'lucide-react';
import { User as UserType, Employee, LeaveRequest, LeaveType, LeaveQuota, LeaveSummary } from '../types';

interface LeaveManagementViewProps {
  token: string;
  currentUser: UserType | null;
  employees: Employee[];
  onRefresh?: () => void;
  onToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

const LEAVE_TYPE_LABELS: Record<LeaveType, { label: string; color: string; bg: string; border: string }> = {
  CUTI_TAHUNAN: {
    label: 'Cuti Tahunan',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200'
  },
  CUTI_SAKIT: {
    label: 'Cuti Sakit',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200'
  },
  IZIN_KEPERLUAN: {
    label: 'Izin Keperluan',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  IZIN_DUKA: {
    label: 'Izin Duka / Keluarga',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  },
  CUTI_MELAHIRKAN: {
    label: 'Cuti Melahirkan',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200'
  },
  LAINNYA: {
    label: 'Izin Lainnya',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300'
  }
};

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  token,
  currentUser,
  employees,
  onRefresh,
  onToast
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const notify = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    if (onToast) {
      onToast(type, title, message);
    }
  };

  // State
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [summary, setSummary] = useState<LeaveSummary | null>(null);
  const [userQuota, setUserQuota] = useState<LeaveQuota | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'REQUESTS' | 'QUOTA' | 'ARCHIVE'>('REQUESTS');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<LeaveRequest | null>(null);
  const [previewingDocument, setPreviewingDocument] = useState<LeaveRequest | null>(null);
  const [editingQuotaEmployee, setEditingQuotaEmployee] = useState<Employee | null>(null);
  const [newQuotaValue, setNewQuotaValue] = useState<number>(12);
  const [deletingRequestId, setDeletingRequestId] = useState<number | null>(null);

  // Form State for New Application
  const [formEmployeeId, setFormEmployeeId] = useState<string>(
    currentUser?.employee_id ? String(currentUser.employee_id) : (employees[0]?.id ? String(employees[0].id) : '')
  );
  const [formType, setFormType] = useState<LeaveType>('CUTI_TAHUNAN');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>(
    new Date(Date.now() + 3600 * 24 * 1000).toISOString().split('T')[0]
  );
  const [formEndDate, setFormEndDate] = useState<string>(
    new Date(Date.now() + 3600 * 24 * 1000).toISOString().split('T')[0]
  );
  const [formReason, setFormReason] = useState<string>('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string>('');
  const [formAttachmentName, setFormAttachmentName] = useState<string>('');
  const [formAttachmentType, setFormAttachmentType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Review Form State
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Calculated Days for form
  const calculatedDays = useMemo(() => {
    if (!formStartDate || !formEndDate) return 1;
    const start = new Date(formStartDate).getTime();
    const end = new Date(formEndDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 1;
    return Math.round((end - start) / (1000 * 3600 * 24)) + 1;
  }, [formStartDate, formEndDate]);

  // Fetch Requests
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leave-requests?status=${statusFilter}&type=${typeFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, statusFilter, typeFilter]);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/leave-requests/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, [token]);

  // Fetch Personal Quota if employee
  const fetchUserQuota = useCallback(async (empId: number) => {
    try {
      const res = await fetch(`/api/leave-requests/quota/${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserQuota(data.data);
      }
    } catch (err) {
      console.error('Error fetching user quota:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
    fetchSummary();
  }, [fetchRequests, fetchSummary]);

  useEffect(() => {
    const targetEmpId = currentUser?.employee_id || (isAdmin && employees[0]?.id ? employees[0].id : null);
    if (targetEmpId) {
      fetchUserQuota(targetEmpId);
    }
  }, [currentUser, isAdmin, employees, fetchUserQuota]);

  // Handle File Upload for Attachment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setFormError('Ukuran berkas melebihi batas maksimal 8MB.');
      notify('error', 'Ukuran Berkas Terlalu Besar', 'Batas maksimal ukuran surat adalah 8MB.');
      return;
    }

    setFormAttachmentName(file.name);
    setFormAttachmentType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormAttachmentUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formStartDate || !formEndDate) {
      setFormError('Harap tentukan tanggal mulai dan tanggal selesai.');
      return;
    }

    if (formStartDate > formEndDate) {
      setFormError('Tanggal mulai tidak boleh melebihi tanggal selesai.');
      return;
    }

    if (!formReason.trim()) {
      setFormError('Alasan izin atau cuti wajib dicantumkan.');
      return;
    }

    // Quota check
    if (formType === 'CUTI_TAHUNAN' && userQuota) {
      if (calculatedDays > userQuota.remaining_quota) {
        setFormError(
          `Sisa kuota cuti tahunan Anda tidak mencukupi. Tersisa ${userQuota.remaining_quota} hari, permohonan Anda: ${calculatedDays} hari.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: isAdmin ? Number(formEmployeeId) : undefined,
          type: formType,
          title: formTitle || `Pengajuan ${LEAVE_TYPE_LABELS[formType].label}`,
          start_date: formStartDate,
          end_date: formEndDate,
          total_days: calculatedDays,
          reason: formReason,
          attachment_url: formAttachmentUrl || undefined,
          attachment_name: formAttachmentName || undefined,
          attachment_type: formAttachmentType || undefined
        })
      });

      const data = await res.json();
      if (!data.success) {
        setFormError(data.message || 'Gagal mengajukan izin/cuti.');
        notify('error', 'Gagal Mengajukan Permohonan', data.message);
      } else {
        setIsApplyModalOpen(false);
        // Reset form
        setFormTitle('');
        setFormReason('');
        setFormAttachmentUrl('');
        setFormAttachmentName('');
        setFormAttachmentType('');
        fetchRequests();
        fetchSummary();
        if (currentUser?.employee_id) fetchUserQuota(currentUser.employee_id);
        if (onRefresh) onRefresh();
        notify('success', 'Permohonan Terkirim', 'Pengajuan izin/cuti Anda berhasil dicatat dan menunggu tinjauan.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.');
      notify('error', 'Kesalahan Sistem', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Review (Approve/Reject)
  const handleSubmitReview = async () => {
    if (!reviewingRequest) return;
    setIsReviewing(true);

    try {
      const res = await fetch(`/api/leave-requests/${reviewingRequest.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          reviewer_notes: reviewerNotes
        })
      });

      const data = await res.json();
      if (data.success) {
        setReviewingRequest(null);
        setReviewerNotes('');
        fetchRequests();
        fetchSummary();
        if (onRefresh) onRefresh();
        notify('success', 'Tinjauan Berhasil', `Permohonan telah di-${reviewStatus === 'APPROVED' ? 'setujui' : 'tolak'}.`);
      } else {
        notify('error', 'Gagal Menyimpan Persetujuan', data.message);
      }
    } catch (err: any) {
      notify('error', 'Terjadi Kesalahan', err.message);
    } finally {
      setIsReviewing(false);
    }
  };

  // Cancel / Delete request execution
  const executeDeleteRequest = async (id: number) => {
    try {
      const res = await fetch(`/api/leave-requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
        fetchSummary();
        if (currentUser?.employee_id) fetchUserQuota(currentUser.employee_id);
        if (onRefresh) onRefresh();
        notify('info', 'Permohonan Dihapus', 'Data permohonan izin/cuti berhasil dibatalkan.');
      } else {
        notify('error', 'Gagal Membatalkan', data.message);
      }
    } catch (err: any) {
      notify('error', 'Terjadi Kesalahan', err.message);
    } finally {
      setDeletingRequestId(null);
    }
  };

  // Save Quota Edit
  const handleSaveQuota = async () => {
    if (!editingQuotaEmployee) return;

    try {
      const res = await fetch(`/api/employees/${editingQuotaEmployee.id}/leave-quota`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          total_leave_quota: newQuotaValue
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditingQuotaEmployee(null);
        if (onRefresh) onRefresh();
        notify('success', 'Kuota Diperbarui', `Jatah cuti ${editingQuotaEmployee.name} berhasil diubah menjadi ${newQuotaValue} hari.`);
      } else {
        notify('error', 'Gagal Memperbarui Kuota', data.message);
      }
    } catch (err: any) {
      notify('error', 'Terjadi Kesalahan', err.message);
    }
  };

  // Filtered requests by search
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter(
      (r) =>
        (r.employee_name && r.employee_name.toLowerCase().includes(q)) ||
        (r.employee_code && r.employee_code.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q))
    );
  }, [requests, searchQuery]);

  // Archived documents list
  const archivedDocuments = useMemo(() => {
    return requests.filter((r) => !!r.attachment_name || !!r.attachment_url);
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? 'Manajemen Izin & Cuti Perusahaan' : 'Pengajuan Izin & Cuti Pegawai'}
            </h1>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md border border-emerald-200 uppercase font-mono">
              {isAdmin ? 'HR & Admin' : 'Portal Pegawai'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {isAdmin
              ? 'Kelola persetujuan izin dan cuti, verifikasi surat pengantar / surat dokter, serta atur kuota tahunan karyawan secara terintegrasi.'
              : 'Ajukan permohonan cuti tahunan, cuti sakit, atau izin keperluan khusus dengan melampirkan berkas surat resmi.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setIsApplyModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ajukan Izin / Cuti
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Sisa Kuota (User) OR Menunggu Review (Admin) */}
        {isAdmin ? (
          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Menunggu Persetujuan
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {summary?.pendingCount || 0}
            </div>
            <div className="mt-1 text-[11px] text-amber-600/90 font-medium">Permohonan perlu ditinjau</div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                Sisa Kuota Cuti Tahunan
              </span>
              <Calendar className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-indigo-600">
              {userQuota?.remaining_quota ?? 12}{' '}
              <span className="text-xs text-slate-400 font-sans font-normal">/ {userQuota?.total_quota ?? 12} Hari</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              Terpakai: {userQuota?.used_quota ?? 0} hari
            </div>
          </div>
        )}

        {/* Card 2: Sedang Cuti Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              {isAdmin ? 'Pegawai Cuti Hari Ini' : 'Cuti Sakit Terpakai'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {isAdmin ? summary?.onLeaveToday || 0 : `${userQuota?.sick_leave_count ?? 0} Hari`}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {isAdmin ? 'Aktif dalam rentang izin' : 'Surat keterangan dokter terlampir'}
          </div>
        </div>

        {/* Card 3: Cuti Disetujui Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Disetujui Bulan Ini' : 'Izin Keperluan Terpakai'}
            </span>
            <CalendarDays className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {isAdmin ? summary?.approvedThisMonth || 0 : `${userQuota?.permission_count ?? 0} Hari`}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {isAdmin ? 'Total permohonan selesai' : 'Izin pribadi & keluarga'}
          </div>
        </div>

        {/* Card 4: Arsip Surat / Dokumen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Arsip Surat & Berkas
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {isAdmin ? summary?.totalAttachments || 0 : archivedDocuments.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Surat dokter & permohonan</div>
        </div>
      </div>

      {/* Admin Subtabs (Requests vs Quota Management vs Archives) */}
      {isAdmin && (
        <div className="flex border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAdminActiveSubTab('REQUESTS')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              adminActiveSubTab === 'REQUESTS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Daftar Pengajuan ({requests.length})
            {summary && summary.pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono">
                {summary.pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAdminActiveSubTab('QUOTA')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              adminActiveSubTab === 'QUOTA'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Kelola Kuota Cuti Karyawan
          </button>

          <button
            type="button"
            onClick={() => setAdminActiveSubTab('ARCHIVE')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              adminActiveSubTab === 'ARCHIVE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Arsip Surat & Dokumen ({archivedDocuments.length})
          </button>
        </div>
      )}

      {/* SUBTAB 1: REQUESTS LIST (For both Admin & User) */}
      {(!isAdmin || adminActiveSubTab === 'REQUESTS') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, ID, atau alasan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-indigo-600 transition-all w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Menunggu Persetujuan</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="CUTI_TAHUNAN">Cuti Tahunan</option>
                <option value="CUTI_SAKIT">Cuti Sakit</option>
                <option value="IZIN_KEPERLUAN">Izin Keperluan</option>
                <option value="IZIN_DUKA">Izin Duka</option>
                <option value="CUTI_MELAHIRKAN">Cuti Melahirkan</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono self-center">
              Menampilkan {filteredRequests.length} dari {requests.length} data
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Pegawai</th>
                  <th className="py-3 px-4">Jenis Permohonan</th>
                  <th className="py-3 px-4">Rentang Tanggal</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Surat / Lampiran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <div>Tidak ada data permohonan izin/cuti yang sesuai filter.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((item) => {
                    const badge = LEAVE_TYPE_LABELS[item.type] || LEAVE_TYPE_LABELS.LAINNYA;
                    const isPending = item.status === 'PENDING';
                    const isApproved = item.status === 'APPROVED';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{item.employee_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.employee_code} &middot; {item.department}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${badge.bg} ${badge.color} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs" title={item.reason}>
                            {item.title}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div>
                            {item.start_date} <span className="text-slate-400">s/d</span> {item.end_date}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {item.total_days} Hari
                        </td>

                        <td className="py-3 px-4">
                          {item.attachment_name ? (
                            <button
                              type="button"
                              onClick={() => setPreviewingDocument(item)}
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
                              title="Lihat Berkas Lampiran"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[140px]">{item.attachment_name}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Tidak ada berkas</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-500" />
                              Menunggu Review
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Disetujui
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-500" />
                              Ditolak
                            </span>
                          )}
                          {item.reviewer_notes && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-xs" title={item.reviewer_notes}>
                              Catatan: "{item.reviewer_notes}"
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin && isPending && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewingRequest(item);
                                  setReviewStatus('APPROVED');
                                  setReviewerNotes('');
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                              >
                                Tinjau
                              </button>
                            )}

                            {item.attachment_name && (
                              <button
                                type="button"
                                onClick={() => setPreviewingDocument(item)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Pratinjau Surat"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {(isAdmin || isPending) && (
                              <button
                                type="button"
                                onClick={() => setDeletingRequestId(item.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Batalkan / Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: QUOTA MANAGEMENT (Admin Only) */}
      {isAdmin && adminActiveSubTab === 'QUOTA' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                Daftar & Penyesuaian Kuota Cuti Karyawan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap karyawan berhak atas jatah cuti tahunan (default 12 hari/tahun). Admin dapat mengubah kuota per
                karyawan.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Nama Pegawai</th>
                  <th className="py-3 px-4">Departemen / Jabatan</th>
                  <th className="py-3 px-4">Total Kuota Tahunan</th>
                  <th className="py-3 px-4">Cuti Terpakai</th>
                  <th className="py-3 px-4">Sisa Kuota</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {employees.map((emp) => {
                  const totalQuota = emp.total_leave_quota ?? 12;
                  const usedQuota = requests
                    .filter((r) => r.employee_id === emp.id && r.type === 'CUTI_TAHUNAN' && r.status === 'APPROVED')
                    .reduce((sum, r) => sum + r.total_days, 0);
                  const remainingQuota = Math.max(0, totalQuota - usedQuota);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp.employee_id}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{emp.department}</div>
                        <div className="text-[10px] text-slate-400">{emp.position}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {totalQuota} Hari / Tahun
                      </td>

                      <td className="py-3 px-4 font-mono text-amber-600 font-semibold">
                        {usedQuota} Hari
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {remainingQuota} Hari
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuotaEmployee(emp);
                            setNewQuotaValue(totalQuota);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Ubah Kuota
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DOCUMENT ARCHIVE GALLERY (Admin Only) */}
      {isAdmin && adminActiveSubTab === 'ARCHIVE' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                Arsip Digital Berkas & Surat Keterangan Karyawan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Koleksi surat keterangan dokter, surat izin dispensasi, dan dokumen bukti permohonan.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Total {archivedDocuments.length} Berkas</span>
          </div>

          {archivedDocuments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Belum ada dokumen surat yang diunggah.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <div>
                    <div className="font-semibold text-xs text-slate-900 truncate" title={doc.attachment_name}>
                      {doc.attachment_name || 'Berkas Lampiran'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Oleh: <strong>{doc.employee_name}</strong> ({doc.employee_code})
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Rentang: {doc.start_date} s/d {doc.end_date} ({doc.total_days} hari)
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPreviewingDocument(doc)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Pratinjau Surat
                    </button>
                    {doc.attachment_url && (
                      <a
                        href={doc.attachment_url}
                        download={doc.attachment_name || 'surat_izin.pdf'}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Unduh Berkas"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: AJUKAN PERMOHONAN IZIN / CUTI */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Form Pengajuan Izin / Cuti</h3>
                  <p className="text-[11px] text-slate-500">Lengkapi detail permohonan dan lampirkan surat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="leave-apply-form" onSubmit={handleSubmitApplication} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Employee selector (if Admin submitting) */}
              {isAdmin && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Pilih Pegawai
                  </label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => {
                      setFormEmployeeId(e.target.value);
                      fetchUserQuota(Number(e.target.value));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-600 focus:outline-hidden"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_id} - {emp.name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Leave Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Jenis Permohonan
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-600 focus:outline-hidden"
                >
                  <option value="CUTI_TAHUNAN">Cuti Tahunan (Potong Kuota)</option>
                  <option value="CUTI_SAKIT">Cuti Sakit (Wajib Lampirkan Surat Dokter)</option>
                  <option value="IZIN_KEPERLUAN">Izin Keperluan Khusus / Pribadi</option>
                  <option value="IZIN_DUKA">Izin Duka / Musibah Keluarga</option>
                  <option value="CUTI_MELAHIRKAN">Cuti Melahirkan / Bersalin</option>
                  <option value="LAINNYA">Lain-lain</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Total Duration Info */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Estimasi Durasi:</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">{calculatedDays} Hari</span>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Judul Ringkas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Izin Sakit Demam, Cuti Pulang Kampung"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Alasan Lengkap
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan keterangan mendetail terkait alasan permohonan..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              {/* Upload Surat / Dokumen */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Upload Surat Pengantar / Surat Dokter</span>
                  <span className="text-[10px] text-slate-400 font-normal">PDF, JPG, PNG (Maks 8MB)</span>
                </label>

                {formAttachmentName ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-emerald-900 truncate">{formAttachmentName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormAttachmentName('');
                        setFormAttachmentUrl('');
                        setFormAttachmentType('');
                      }}
                      className="p-1 text-emerald-700 hover:text-emerald-900 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs text-slate-600 font-medium mt-1">Pilih berkas surat izin / dokter</span>
                    <span className="text-[10px] text-slate-400">Klik untuk menjelajahi komputer</span>
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>
            </form>

            {/* Sticky / Always-Visible Footer Action Buttons */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="leave-apply-form"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Permohonan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REVIEW & APPROVAL (Admin Only) */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Persetujuan Permohonan Izin / Cuti</h3>
              <button
                type="button"
                onClick={() => setReviewingRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">Data Pegawai</div>
                <div className="font-bold text-slate-900 text-sm">{reviewingRequest.employee_name}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {reviewingRequest.employee_code} &middot; {reviewingRequest.department}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[9px] text-slate-400 uppercase">Jenis</div>
                  <div className="font-bold text-indigo-700">
                    {LEAVE_TYPE_LABELS[reviewingRequest.type]?.label || reviewingRequest.type}
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[9px] text-slate-400 uppercase">Durasi</div>
                  <div className="font-bold text-slate-900">{reviewingRequest.total_days} Hari</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Alasan Permohonan</div>
                <p className="mt-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                  {reviewingRequest.reason}
                </p>
              </div>

              {reviewingRequest.attachment_name && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Dokumen Lampiran</div>
                  <button
                    type="button"
                    onClick={() => setPreviewingDocument(reviewingRequest)}
                    className="mt-1 w-full p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200 text-indigo-700 flex items-center justify-between font-semibold cursor-pointer hover:bg-indigo-100 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 shrink-0" />
                      <span className="truncate">{reviewingRequest.attachment_name}</span>
                    </span>
                    <Eye className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              )}

              {/* Review Decision Buttons */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Keputusan Review
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('APPROVED')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      reviewStatus === 'APPROVED'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    Setujui (Approve)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('REJECTED')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      reviewStatus === 'REJECTED'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    Tolak (Reject)
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Catatan untuk Pegawai (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Disetujui, harap menjaga kesehatan..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Sticky / Always-Visible Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setReviewingRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isReviewing}
                onClick={handleSubmitReview}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isReviewing ? 'Menyimpan...' : 'Simpan Keputusan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW DOKUMEN / SURAT */}
      {previewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 truncate">
                <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold text-sm text-slate-900 truncate">
                  {previewingDocument.attachment_name || 'Pratinjau Dokumen'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {previewingDocument.attachment_url && (
                  <a
                    href={previewingDocument.attachment_url}
                    download={previewingDocument.attachment_name || 'surat.pdf'}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Unduh Berkas"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewingDocument(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-100/50">
              {previewingDocument.attachment_url ? (
                previewingDocument.attachment_type?.startsWith('image/') ||
                previewingDocument.attachment_url.startsWith('data:image/') ? (
                  <img
                    src={previewingDocument.attachment_url}
                    alt="Pratinjau Surat"
                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-96 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <FileText className="w-12 h-12 text-indigo-600" />
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {previewingDocument.attachment_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Dokumen Resmi PDF / Surat Digital</div>
                    </div>
                    <a
                      href={previewingDocument.attachment_url}
                      download={previewingDocument.attachment_name || 'surat.pdf'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      Unduh & Buka Berkas Surat
                    </a>
                  </div>
                )
              ) : (
                <div className="text-xs text-slate-400">Tidak ada konten berkas yang dapat ditampilkan.</div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Pengirim: <strong>{previewingDocument.employee_name}</strong> ({previewingDocument.employee_code})
              </span>
              <button
                type="button"
                onClick={() => setPreviewingDocument(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT KUOTA (Admin Only) */}
      {editingQuotaEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden space-y-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Ubah Kuota Cuti Karyawan</h3>
              <button
                type="button"
                onClick={() => setEditingQuotaEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 space-y-3 pb-6 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{editingQuotaEmployee.name}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {editingQuotaEmployee.employee_id} &middot; {editingQuotaEmployee.department}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Total Jatah Kuota Cuti (Hari/Tahun)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={newQuotaValue}
                  onChange={(e) => setNewQuotaValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuotaEmployee(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuota}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 5: KONFIRMASI HAPUS PERMOHONAN */}
      {deletingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Batalkan Permohonan?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan/menghapus data permohonan izin/cuti ini?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingRequestId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeDeleteRequest(deletingRequestId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
