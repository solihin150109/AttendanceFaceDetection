import React, { useState } from 'react';
import { Sliders, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsViewProps {
  token: string;
  settings: SystemSettings | null;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ token, settings, onRefresh }) => {
  const [form, setForm] = useState({
    work_start_time: settings?.work_start_time || '08:00',
    late_threshold_time: settings?.late_threshold_time || '08:15',
    work_end_time: settings?.work_end_time || '17:00',
    face_threshold: settings?.face_threshold || 0.45,
    liveness_enabled: settings?.liveness_enabled ?? true
  });

  const [savedAlert, setSavedAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSavedAlert(true);
        setTimeout(() => setSavedAlert(false), 3000);
        onRefresh();
      }
    } catch (err) {
      alert('Gagal menyimpan konfigurasi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Konfigurasi jadwal kerja, batas toleransi keterlambatan, dan parameter biometrik wajah.
        </p>
      </div>

      {savedAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">Konfigurasi operasional dan biometrik berhasil diperbarui.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Jadwal Shift Kerja */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Jadwal Jam Kerja & Keterlambatan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Jam Masuk Standar
              </label>
              <input
                type="time"
                value={form.work_start_time}
                onChange={(e) => setForm({ ...form, work_start_time: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-mono font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Batas Toleransi Terlambat
              </label>
              <input
                type="time"
                value={form.late_threshold_time}
                onChange={(e) => setForm({ ...form, late_threshold_time: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-mono font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Jam Pulang Standar
              </label>
              <input
                type="time"
                value={form.work_end_time}
                onChange={(e) => setForm({ ...form, work_end_time: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-mono font-medium"
              />
            </div>
          </div>
        </div>

        {/* Biometrik Parameter */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Parameter Biometrik & Ambang Batas Decision Threshold (τ)</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900">
                  Ambang Batas Jarak Euclidean (τ = {form.face_threshold.toFixed(2)})
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jarak maksimum antara vektor wajah masukan dan basis data agar diakui sebagai subjek yang sama.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                {form.face_threshold.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min="0.25"
              max="0.65"
              step="0.01"
              value={form.face_threshold}
              onChange={(e) => setForm({ ...form, face_threshold: parseFloat(e.target.value) })}
              className="w-full cursor-pointer accent-slate-900"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0.25 (Sangat Ketat / Rendah FAR)</span>
              <span className="text-slate-700 font-bold">0.45 (Optimal Default)</span>
              <span>0.65 (Toleran / Rendah FRR)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
};
