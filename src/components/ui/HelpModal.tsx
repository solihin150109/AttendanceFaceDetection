import React from 'react';
import {
  HelpCircle,
  X,
  ScanFace,
  UserCheck,
  ShieldCheck,
  Camera,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, userRole = 'EMPLOYEE' }) => {
  if (!isOpen) return null;

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Pusat Bantuan & Petunjuk Sistem</h3>
              <p className="text-[11px] text-slate-400">
                Panduan Operasional SMART ATTENDANCE (Face Recognition System)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Section 1: Cara Melakukan Absensi Wajah */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <ScanFace className="w-4 h-4 text-emerald-600" />
              <span>1. Prosedur Absensi Wajah (Karyawan)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900">A. Posisi Wajah</div>
                <p className="text-slate-500 leading-relaxed">
                  Posisikan wajah tepat di tengah lingkaran oval panduan pada jarak sekitar 40–60 cm dari kamera.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900">B. Liveness Challenge</div>
                <p className="text-slate-500 leading-relaxed">
                  Ikuti instruksi uji keaslian yang muncul di layar (kedipan mata atau gerakan toleh kepala 15°).
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900">C. Konfirmasi Otomatis</div>
                <p className="text-slate-500 leading-relaxed">
                  Sistem otomatis mencatat Jam Masuk atau Jam Pulang saat jarak Euclidean d &le; &tau; (0.45).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Panduan Khusus Administrator */}
          {isAdmin && (
            <div className="space-y-3">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>2. Panduan Pengelolaan & Operator Admin</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                  <Camera className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Registrasi 5 Sampel Wajah:</strong>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      Setiap pegawai baru wajib didaftarkan dengan 5 sudut pose (Normal, Senyum, Toleh Kiri 15°, Toleh Kanan 15°, Angkat Dagu) agar sistem mengenali wajah dalam berbagai ekspresi dan sudut.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                  <Sliders className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Pengaturan Ambang Batas (&tau;):</strong>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      Nilai rekomendasi adalah 0.45. Nilai lebih rendah (&lt; 0.40) membuat pencocokan sangat ketat (rendah False Accept), sedangkan nilai lebih tinggi (&gt; 0.50) lebih toleran.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Mengatasi Kendala Umum */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>3. Pemecahan Masalah (Troubleshooting)</span>
            </div>
            <ul className="space-y-2 text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                <strong className="text-slate-800">"Wajah Tidak Dikenali":</strong> Pastikan pencahayaan di depan wajah merata dan pegawai telah menyelesaikan registrasi 5 sampel wajah.
              </li>
              <li>
                <strong className="text-slate-800">"Lebih dari satu wajah terdeteksi":</strong> Pastikan rekan kerja di belakang Anda tidak masuk ke dalam frame kamera absensi.
              </li>
              <li>
                <strong className="text-slate-800">Kamera tidak menyala:</strong> Periksa izin akses webcam pada browser (ikon gembok di sebelah URL bar) dan pastikan diizinkan (*Allow*).
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            Smart Attendance &middot; Sidang Tugas Akhir
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
