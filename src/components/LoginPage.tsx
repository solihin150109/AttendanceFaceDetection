import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Enforce safe generic error without exposing fields
        throw new Error('Username atau password salah.');
      }

      onLoginSuccess(data.data.token, data.data.user);
    } catch (err: any) {
      setError(err.message || 'Username atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-slate-800 selection:text-white">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-800/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="p-8 pb-6 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="w-13 h-13 mx-auto rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-md mb-4 border border-slate-800">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SMART ATTENDANCE</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Face Recognition Attendance & Monitoring System
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors placeholder:text-slate-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 transition-colors"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
          >
            {isLoading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <span>MASUK</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          {/* Quick preset selector for testing in research venue */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[11px] text-slate-400 text-center font-medium">
              Akses Cepat Pengujian:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white text-left transition-all group"
              >
                <div className="font-bold text-slate-900 group-hover:text-indigo-600">Akun Admin</div>
                <div className="text-[10px] text-slate-500 font-mono">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ahmad', 'user123')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white text-left transition-all group"
              >
                <div className="font-bold text-slate-900 group-hover:text-emerald-600">Akun Karyawan</div>
                <div className="text-[10px] text-slate-500 font-mono">ahmad / user123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('budi', 'Pass@1234')}
                className="col-span-2 p-2.5 rounded-xl border border-amber-200 hover:border-amber-400 bg-amber-50/70 hover:bg-amber-50 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-900 group-hover:text-amber-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Uji Akun Baru (Wajib Ganti Password Pertama Kali)</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-100/80 px-1.5 py-0.5 rounded">budi / Pass@1234</span>
                </div>
                <div className="text-[10px] text-amber-800/80 mt-1">
                  Karyawan yang didaftarkan Admin dengan password otomatis — akan langsung dipaksa mengganti kata sandi.
                </div>
              </button>
            </div>
          </div>
        </form>

        <div className="py-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Sistem Autentikasi Internal Perusahaan &middot; Sidang Tugas Akhir
        </div>
      </div>
    </div>
  );
};
