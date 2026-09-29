# SMART ATTENDANCE — FACE RECOGNITION SYSTEM
### Aplikasi Monitoring Presensi Karyawan Berbasis Web dengan Face Recognition & Anti-Spoofing Liveness

Aplikasi ini dibangun untuk tugas akhir:
**"PERANCANGAN APLIKASI BERBASIS WEB GUNA MEMPERMUDAH DALAM MEMONITORING ABSENSI KARYAWAN DENGAN MENGGUNAKAN METODE FACE RECOGNITION"**

Aplikasi dirancang untuk lingkungan kerja nyata dengan prinsip utama:
**ONE PERSON = ONE VERIFIED IDENTITY**

---

## 1. Arsitektur & Teknologi
- **Front-end:** React 19 + TypeScript + Tailwind CSS (Formal, clean, domain-native responsive UI).
- **Back-end:** Node.js Express + TSX Server dengan arsitektur REST API modular.
- **Computer Vision & Biometrics:**
  - WebRTC Video Stream via `navigator.mediaDevices.getUserMedia()`.
  - Fast Skin Segmentation & Connected Component Spatial Face Localization.
  - Facial Landmark Estimation (Mata kiri/kanan, Hidung, Sudut Bibir, Estimasi Yaw/Pitch).
  - Ekstraksi Fitur: **128-D Invariant Deep Representation Vector** (Spatial Texture Moments & Directional Gradients pada grid 4×4).
  - Normalisasi: **L2 Norm Normalization** ($\|v\|_2 = 1.0$).
  - Komparasi Biometrik: **Open-Set Euclidean Distance** dengan configurable threshold $\tau$.
  - Basic Liveness Verification: Active Challenge-Response (Refleks Kedipan Mata & Rotasi Kepala).
- **Keamanan:**
  - Password Hash: **Bcrypt** dengan salt generation satu arah.
  - Sesi Login: Bearer Token dengan timeout 8 jam.
  - Zero-Client-Trust: Front-end kiosk tidak pernah mengirim `employee_id` saat absensi.
  - Biometric Privacy: Citra foto mentah tidak disimpan permanen, hanya 128 float values.

---

## 2. Struktur Modul & Folder
- `/server.ts` : Backend REST API, database persistence, session auth, matching engine, attendance rules, report query, dan evaluasi riset.
- `/src/services/FaceVisionPipeline.ts` : Engine pengolahan citra wajah, isolasi subjek tunggal, estimasi landmark, perhitungan kualitas pencahayaan, ekstraksi vektor 128-D, dan jarak Euclidean.
- `/src/services/LivenessService.ts` : Engine verifikasi keaslian subjek hidup (Active Blink & Yaw Angle shift detection).
- `/src/components/AttendanceKiosk.tsx` : Halaman kiosk mandiri presensi karyawan dengan panduan oval, status visual, tantangan liveness, dan telemetri biometrik.
- `/src/components/EmployeeManagement.tsx` : Panel CRUD master data karyawan, soft-status `ACTIVE`/`INACTIVE`, dan status registrasi biometrik.
- `/src/components/FaceRegistrationModal.tsx` : Wizard registrasi 5 sampel wajah per karyawan (Frontal netral, senyum, kiri 15°, kanan 15°, atas 15°).
- `/src/components/DashboardOverview.tsx` : Dashboard monitoring formal dengan 5 KPI cards (Aktif, Hadir, Terlambat, Belum Absen, Pulang), progress bar rasio kehadiran, dan parameter shift.
- `/src/components/AttendanceList.tsx` : Tabel presensi real-time hari ini dengan filter departemen dan status keterlambatan.
- `/src/components/ReportsView.tsx` : Laporan riwayat presensi dengan filter tanggal, departemen, status, dan fitur **Ekspor CSV**.
- `/src/components/ResearchView.tsx` : Modul pengujian ilmiah tugas akhir (Bab IV) dengan Interactive Test Harness, Confusion Matrix riil (TP, FP, TN, FN), FAR, FRR, Akurasi, Presisi, Recall, dan Titik Kurva ROC.

---

## 3. Akun Default & Kredensial Administrator
- **Username:** `admin`
- **Password:** `admin123`
*(Password tersimpan dalam basis data dengan enkripsi Bcrypt).*

---

## 4. Panduan Menjalankan Sistem
1. Akses halaman web aplikasi.
2. Pada bagian atas (navbar):
   - Klik **"Kiosk Presensi"** untuk mode absensi mandiri karyawan di pintu masuk/kamera kantor.
   - Klik **"Login Admin"** untuk masuk ke portal administrator dengan akun `admin` / `admin123`.
3. Di dalam Portal Admin:
   - Buka tab **"Data Karyawan & Biometrik"** untuk mendaftarkan karyawan baru atau klik **"Registrasi Wajah"** untuk mengambil 5 sampel wajah karyawan melalui webcam.
   - Buka tab **"Ringkasan Monitoring"** untuk memantau status kehadiran hari ini secara real-time.
   - Buka tab **"Presensi Hari Ini"** untuk melihat detail waktu masuk, waktu pulang, dan status (Tepat Waktu / Terlambat).
   - Buka tab **"Laporan & Export CSV"** untuk memfilter data historis dan mengunduh berkas laporan dalam format `.csv`.
   - Buka tab **"Research Mode (Bab IV)"** untuk melakukan pengujian ilmiah (Genuine, Impostor, Unknown, Multiple Face, Spoof) dan melihat Confusion Matrix serta titik Kurva ROC untuk lampiran skripsi tugas akhir.
   - Buka tab **"Konfigurasi Shift & Threshold"** untuk menyesuaikan jam masuk kerja (default: 08:00), batas toleransi keterlambatan (default: 08:15), jam pulang kerja (default: 17:00), serta nilai ambang batas biometrik $\tau$ (default: 0.45).

---

## 5. Prosedur Pengujian Ilmiah untuk Skripsi (Bab IV)
1. **Pengujian Genuine (True Accept):**
   Pilih target karyawan terdaftar, arahkan wajah karyawan ke kamera, klik *"Eksekusi Percobaan Ini"*. Catat jarak Euclidean ($d$) dan verifikasi status `SUCCESS`.
2. **Pengujian Impostor (False Accept Guard):**
   Pilih skenario *"Impostor"*, hadapkan wajah orang lain yang bukan target. Verifikasi bahwa sistem menolak klaim identitas palsu dan jarak $d > \tau$.
3. **Pengujian Unknown Face:**
   Gunakan subjek yang belum pernah didaftarkan. Sistem wajib mengembalikan status `UNKNOWN_FACE`.
4. **Pengujian Multiple Face:**
   Hadirkan 2 orang dalam frame kamera. Sistem langsung menghentikan absensi dengan pesan penolakan: *"Terdeteksi lebih dari satu wajah"*.
5. **Pengujian Spoof (Liveness):**
   Tampilkan foto wajah cetak/layar HP. Sistem mendeteksi ketiadaan variasi kedipan/gerakan kepala dan menolak dengan status `LIVENESS_FAILED`.
6. Buka bagian **Confusion Matrix** dan **ROC Points Table** untuk menyalin data hasil uji nyata langsung ke Bab IV Tugas Akhir.
