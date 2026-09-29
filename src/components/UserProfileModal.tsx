import React, { useState, useRef } from 'react';
import {
  X,
  Lock,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  User as UserIcon,
  ShieldAlert,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { User as UserType } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  token: string;
  onUserUpdated: (updatedUser: UserType) => void;
  onToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
  initialTab?: 'PHOTO' | 'PASSWORD';
  forcePasswordChange?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  token,
  onUserUpdated,
  onToast,
  initialTab = 'PHOTO',
  forcePasswordChange = false
}) => {
  const [activeTab, setActiveTab] = useState<'PHOTO' | 'PASSWORD'>(
    forcePasswordChange ? 'PASSWORD' : initialTab
  );

  // Synchronize activeTab when forced mode or initialTab changes
  React.useEffect(() => {
    if (forcePasswordChange) {
      setActiveTab('PASSWORD');
    } else {
      setActiveTab(initialTab);
    }
  }, [forcePasswordChange, initialTab]);

  // Photo state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentUser?.avatar_url || currentUser?.employee?.avatar_url || null
  );

  React.useEffect(() => {
    setAvatarPreview(currentUser?.avatar_url || currentUser?.employee?.avatar_url || null);
  }, [currentUser]);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset Avatar collection (clean professional avatars encoded as clean SVGs)
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80'
  ];

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!isOpen && !forcePasswordChange) return null;

  // Handle Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('error', 'Format Berkas Salah', 'Harap unggah berkas gambar (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onToast('error', 'Ukuran Terlalu Besar', 'Batas maksimal ukuran foto adalah 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Photo update
  const handleSavePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      const res = await fetch('/api/user/profile-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: avatarPreview || '' })
      });

      const data = await res.json();
      if (data.success) {
        const updated = data.data?.user || data.data;
        onUserUpdated(updated);
        onToast('success', 'Foto Berhasil Diperbarui', 'Foto profil Anda berhasil tersimpan.');
        if (!forcePasswordChange) {
          onClose();
        }
      } else {
        onToast('error', 'Gagal Memperbarui Foto', data.message || 'Terjadi kesalahan');
      }
    } catch (err: any) {
      onToast('error', 'Kesalahan Sistem', err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Submit Password update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!forcePasswordChange && !currentUser?.must_change_password && !currentPassword) {
      setPasswordError('Kata sandi saat ini wajib diisi.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword || undefined,
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (data.success) {
        const updated = data.data?.user || data.data;
        onUserUpdated(updated);
        onToast(
          'success',
          'Kata Sandi Berhasil Diperbarui',
          'Kata sandi Anda telah berhasil diubah. Akun Anda kini siap digunakan.'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setPasswordError(data.message || 'Gagal mengubah kata sandi.');
        onToast('error', 'Gagal Mengubah Password', data.message);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Terjadi kesalahan sistem.');
      onToast('error', 'Kesalahan Sistem', err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const displayName = currentUser?.employee?.name || currentUser?.username || 'Pengguna';
  const displayAvatar = avatarPreview || currentUser?.avatar_url || currentUser?.employee?.avatar_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                forcePasswordChange
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}
            >
              {forcePasswordChange ? <KeyRound className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {forcePasswordChange ? 'Ganti Password Wajib (Login Pertama)' : 'Pengaturan Profil Pengguna'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {forcePasswordChange
                  ? 'Anda harus mengatur kata sandi baru untuk melanjutkan'
                  : 'Kelola foto profil dan kata sandi akun Anda'}
              </p>
            </div>
          </div>

          {!forcePasswordChange && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Selection (Hidden in forced mode) */}
        {!forcePasswordChange && (
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('PHOTO')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                activeTab === 'PHOTO'
                  ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl border-t border-x border-slate-200 -mb-px'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Update Foto Profil</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PASSWORD')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                activeTab === 'PASSWORD'
                  ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl border-t border-x border-slate-200 -mb-px'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Ganti Kata Sandi</span>
            </button>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: UPDATE FOTO PROFIL */}
          {activeTab === 'PHOTO' && !forcePasswordChange && (
            <div className="space-y-5">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-900 text-white flex items-center justify-center font-bold text-3xl shadow-md border-2 border-white ring-2 ring-slate-200">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg border-2 border-white cursor-pointer transition-transform hover:scale-110"
                    title="Pilih Foto Baru"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center">
                  <div className="font-bold text-slate-900 text-sm">{displayName}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {currentUser?.employee?.employee_id || currentUser?.username} &middot;{' '}
                    {currentUser?.role === 'ADMIN' ? 'Administrator' : 'Karyawan'}
                  </div>
                </div>

                {displayAvatar && (
                  <button
                    type="button"
                    onClick={() => setAvatarPreview(null)}
                    className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Hapus / Gunakan Inisial Default
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Pilih Berkas Foto Baru</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Format didukung: JPG, PNG, WEBP. Maksimal 5MB.
                </p>

                {/* Preset Avatars for 1-click select */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-600 mb-2">
                    Atau Pilih Avatar Siap Pakai:
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {presetAvatars.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarPreview(url)}
                        className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                          avatarPreview === url
                            ? 'border-indigo-600 ring-2 ring-indigo-200'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={`Pilih Avatar ${idx + 1}`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GANTI KATA SANDI */}
          {(activeTab === 'PASSWORD' || forcePasswordChange) && (
            <form id="password-change-form" onSubmit={handleChangePassword} className="space-y-4">
              {forcePasswordChange && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Keamanan Akun Wajib</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Akun Anda baru saja dibuat oleh Administrator dengan kata sandi bawaan. Demi privasi, silakan buat kata sandi baru pribadi Anda sekarang.
                  </p>
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current Password (only needed if NOT forced first login) */}
              {!forcePasswordChange && !currentUser?.must_change_password && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan kata sandi saat ini"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Ketik ulang kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 focus:outline-hidden font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">Persyaratan Kata Sandi:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                  <li>Panjang minimal 6 karakter</li>
                  <li>Kombinasi huruf dan angka disarankan</li>
                </ul>
              </div>
            </form>
          )}
        </div>

        {/* Sticky / Always-Visible Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5 shrink-0">
          {!forcePasswordChange && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
          )}

          {activeTab === 'PHOTO' && !forcePasswordChange ? (
            <button
              type="button"
              disabled={isUploadingPhoto || !avatarPreview}
              onClick={handleSavePhoto}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isUploadingPhoto ? 'Menyimpan...' : 'Simpan Foto Profil'}
            </button>
          ) : (
            <button
              type="submit"
              form="password-change-form"
              disabled={isChangingPassword}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isChangingPassword ? 'Menyimpan...' : forcePasswordChange ? 'Simpan & Masuk ke Sistem' : 'Perbarui Kata Sandi'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
