import React, { useState } from 'react';
import { Plus, Search, Edit2, UserX, UserCheck, Camera, ShieldCheck, AlertCircle, X, Eye, KeyRound, Copy, CheckCircle2 } from 'lucide-react';
import { Employee } from '../types';
import { ConfirmModal } from './ui/ConfirmModal';

interface EmployeeManagementProps {
  token: string;
  employees: Employee[];
  onRefresh: () => void;
  onOpenFaceRegistration: (employee: Employee) => void;
  isAddModalOpenInitially?: boolean;
  onCloseInitialModal?: () => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  token,
  employees,
  onRefresh,
  onOpenFaceRegistration,
  isAddModalOpenInitially = false,
  onCloseInitialModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Destructive Action Modal
  const [deactivatingEmployee, setDeactivatingEmployee] = useState<Employee | null>(null);
  const [isDeactivatingLoading, setIsDeactivatingLoading] = useState(false);

  // View Details Modal
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Reset Password State
  const [resettingEmployee, setResettingEmployee] = useState<Employee | null>(null);
  const [isResettingLoading, setIsResettingLoading] = useState(false);

  // New Account Created Notification Modal
  const [createdAccountInfo, setCreatedAccountInfo] = useState<{
    name: string;
    employee_id: string;
    username: string;
    initial_password: string;
    is_reset?: boolean;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    position: '',
    department: 'Information Technology',
    email: '',
    phone: '',
    avatar_url: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    'Information Technology',
    'Research & Intelligence',
    'Human Resources',
    'Finance & Accounting',
    'Operations'
  ];

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80'
  ];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      employee_id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      name: '',
      position: '',
      department: 'Information Technology',
      email: '',
      phone: '',
      avatar_url: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employee_id: emp.employee_id,
      name: emp.name,
      position: emp.position,
      department: emp.department,
      email: emp.email || '',
      phone: emp.phone || '',
      avatar_url: emp.avatar_url || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!resettingEmployee) return;
    setIsResettingLoading(true);

    try {
      const res = await fetch(`/api/employees/${resettingEmployee.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Gagal mereset kata sandi.');
        return;
      }

      onRefresh();
      setCreatedAccountInfo({
        name: resettingEmployee.name,
        employee_id: resettingEmployee.employee_id,
        username: data.data.username,
        initial_password: data.data.initial_password,
        is_reset: true
      });
      setResettingEmployee(null);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mereset kata sandi.');
    } finally {
      setIsResettingLoading(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!deactivatingEmployee) return;
    setIsDeactivatingLoading(true);

    const newStatus = deactivatingEmployee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const res = await fetch(`/api/employees/${deactivatingEmployee.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Gagal mengubah status');
        return;
      }
      onRefresh();
      setDeactivatingEmployee(null);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status');
    } finally {
      setIsDeactivatingLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
    const method = editingEmployee ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan data karyawan.');
      }

      setIsModalOpen(false);
      if (onCloseInitialModal) onCloseInitialModal();
      onRefresh();

      if (!editingEmployee && data.data?.account) {
        setCreatedAccountInfo({
          name: data.data.name,
          employee_id: data.data.employee_id,
          username: data.data.account.username,
          initial_password: data.data.account.initial_password
        });
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Data Karyawan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cari dan kelola data karyawan.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau Employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors placeholder:text-slate-400 font-medium"
          />
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 bg-white font-medium"
          >
            <option value="ALL">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 bg-white font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Status Aktif</option>
            <option value="INACTIVE">Status Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Foto</th>
                <th className="py-3 px-5">Employee ID</th>
                <th className="py-3 px-5">Nama Karyawan</th>
                <th className="py-3 px-5">Jabatan & Dept</th>
                <th className="py-3 px-5">Akun Login</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="font-bold text-slate-700 text-sm">Belum ada data karyawan</div>
                      <p className="text-xs text-slate-500">
                        Tambahkan karyawan baru untuk mulai menggunakan sistem absensi.
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Karyawan</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const sampleCount = emp.registered_samples_count || 0;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Avatar / Foto Profil */}
                      <td className="py-3.5 px-5">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden border border-slate-200">
                          {emp.avatar_url ? (
                            <img src={emp.avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{emp.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3.5 px-5 font-mono font-medium text-slate-900">
                        {emp.employee_id}
                      </td>

                      {/* Nama */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal truncate max-w-44">
                          {emp.email || emp.phone || '-'}
                        </div>
                      </td>

                      {/* Jabatan & Departemen */}
                      <td className="py-3.5 px-5">
                        <div className="text-slate-900 font-medium">{emp.position}</div>
                        <div className="text-[11px] text-slate-400">{emp.department}</div>
                      </td>

                      {/* Status Akun Login Pengguna */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {emp.account_username || emp.employee_id.toLowerCase().replace(/[^a-z0-9]/g, '')}
                            </span>
                          </div>
                          {emp.must_change_password ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                              Wajib Ganti Password
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Akun Aktif
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Kepegawaian */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md text-[11px] border ${
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {emp.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Actions: View, Reset Password, Wajah, Edit, Nonaktifkan */}
                      <td className="py-3.5 px-5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          title="Lihat Detail Profil"
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setResettingEmployee(emp)}
                          title="Reset Password Otomatis"
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-amber-200"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenFaceRegistration(emp)}
                          title="Registrasi Biometrik Wajah"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold border border-slate-200 hover:border-slate-800 rounded-lg bg-white text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-slate-600" />
                          <span>Wajah ({sampleCount}/5)</span>
                        </button>

                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Data Karyawan & Foto"
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeactivatingEmployee(emp)}
                          title={emp.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${
                            emp.status === 'ACTIVE'
                              ? 'text-slate-400 hover:text-rose-600'
                              : 'text-slate-400 hover:text-emerald-600'
                          }`}
                        >
                          {emp.status === 'ACTIVE' ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {editingEmployee ? `Edit Data: ${editingEmployee.employee_id}` : 'Tambah Karyawan Baru'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Lengkapi master data identitas pegawai dan foto profil
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  if (onCloseInitialModal) onCloseInitialModal();
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Security info for newly added employee */}
              {!editingEmployee && (
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <strong className="text-indigo-900 font-bold block">Pembuatan Akun Otomatis</strong>
                    <span className="text-[11px] text-indigo-800">
                      Sistem akan membuatkan akun pengguna dengan kata sandi acak otomatis. Pengguna akan <strong>diwajibkan mengganti kata sandi</strong> saat pertama kali masuk ke sistem.
                    </span>
                  </div>
                </div>
              )}

              {/* Foto Profil Karyawan */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Foto Profil Karyawan (Opsional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs overflow-hidden shrink-0 border-2 border-white ring-2 ring-slate-200">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span>{formData.name ? formData.name.charAt(0).toUpperCase() : 'EMP'}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-2xs">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Unggah Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  avatar_url: event.target?.result as string
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {formData.avatar_url && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, avatar_url: '' }))}
                          className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    {/* Preset Avatars for 1-click select */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Atau pilih:</span>
                      {presetAvatars.slice(0, 4).map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, avatar_url: url }))}
                          className={`w-6 h-6 rounded-md overflow-hidden border cursor-pointer ${
                            formData.avatar_url === url ? 'ring-2 ring-indigo-600 border-indigo-600' : 'border-slate-300'
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    placeholder="Contoh: EMP-004"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-mono font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama lengkap"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Jabatan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Contoh: Software Engineer"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Departemen *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 bg-white font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@company.co.id"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812xxxxxxx"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onCloseInitialModal) onCloseInitialModal();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : editingEmployee ? 'Simpan Perubahan' : 'Buat Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Detail Karyawan */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Detail Profil Karyawan</h3>
              <button
                onClick={() => setViewingEmployee(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {viewingEmployee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{viewingEmployee.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{viewingEmployee.employee_id}</div>
                </div>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Jabatan:</span>
                  <strong className="text-slate-900">{viewingEmployee.position}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Departemen:</span>
                  <strong className="text-slate-900">{viewingEmployee.department}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-900">{viewingEmployee.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telepon:</span>
                  <span className="text-slate-900">{viewingEmployee.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Akun:</span>
                  <span className="font-semibold text-emerald-700">{viewingEmployee.status}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-400">Sampel Wajah:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {viewingEmployee.registered_samples_count || 0} / 5 Sampel
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Akun Login Karyawan Baru / Reset Password Berhasil Dibuat */}
      {createdAccountInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {createdAccountInfo.is_reset ? 'Password Berhasil Direset Otomatis!' : 'Akun Karyawan Berhasil Dibuat!'}
                </h3>
                <p className="text-xs text-slate-500">
                  {createdAccountInfo.is_reset
                    ? 'Kata sandi baru otomatis berhasil dibuat oleh sistem.'
                    : 'Kredensial login otomatis telah dibuat oleh sistem.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Nama Karyawan:</span>
                <strong className="text-slate-900">{createdAccountInfo.name}</strong>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Username Login:</span>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {createdAccountInfo.username}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Password Otomatis:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {createdAccountInfo.initial_password}
                </span>
              </div>
              <div className="pt-1 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Keamanan:</strong> Karyawan akan <strong>dipaksa mengganti kata sandi</strong> saat pertama kali melakukan login ke dalam sistem.
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Kredensial Akun Smart Attendance:\nNama: ${createdAccountInfo.name}\nUsername: ${createdAccountInfo.username}\nPassword Sementara: ${createdAccountInfo.initial_password}\n(Catatan: Wajib ganti password saat login pertama kali)`
                  );
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 3000);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Kredensial'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedAccountInfo(null);
                  setIsCopied(false);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting Employee Password */}
      <ConfirmModal
        isOpen={!!resettingEmployee}
        title="Reset Password Karyawan?"
        message={`Sistem akan menghasilkan kata sandi otomatis baru untuk akun "${resettingEmployee?.name}". Karyawan akan dipaksa mengganti kata sandi saat login berikutnya.`}
        confirmLabel="Reset Password Otomatis"
        cancelLabel="Batal"
        isLoading={isResettingLoading}
        onConfirm={handleConfirmResetPassword}
        onCancel={() => setResettingEmployee(null)}
      />

      {/* Confirmation Modal for Deactivating / Activating Employee */}
      <ConfirmModal
        isOpen={!!deactivatingEmployee}
        title={
          deactivatingEmployee?.status === 'ACTIVE'
            ? 'Nonaktifkan Karyawan?'
            : 'Aktifkan Kembali Karyawan?'
        }
        message={
          deactivatingEmployee?.status === 'ACTIVE'
            ? `Karyawan "${deactivatingEmployee?.name}" tidak dapat melakukan absensi saat berstatus nonaktif. Riwayat kehadiran tetap tersimpan aman.`
            : `Karyawan "${deactivatingEmployee?.name}" akan dapat kembali melakukan absensi di sistem.`
        }
        confirmLabel={deactivatingEmployee?.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
        isDestructive={deactivatingEmployee?.status === 'ACTIVE'}
        isLoading={isDeactivatingLoading}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setDeactivatingEmployee(null)}
      />
    </div>
  );
};
