# DESIGN IMPROVEMENT PLAN — MODERN ENTERPRISE DASHBOARD
**Aplikasi: SMART ATTENDANCE — Face Recognition Attendance & Monitoring System**

Berdasarkan hasil audit Phase 1, rencana perbaikan UI/UX dirancang dengan standar **Modern Professional Enterprise Dashboard** (Clean, Formal, Elegant, Structured, Calm, dan Efficient).

---

## 1. Arsitektur Layout Utama
```
┌────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (260px / 72px)  │ TOPBAR (h-16)            🔔  [Avatar Admin ▼]│
│ ─────────────────────── ├──────────────────────────────────────────────┤
│ SMART ATTENDANCE        │ Breadcrumbs / Judul Halaman & Deskripsi      │
│ Face Recognition System │                                              │
│                         ├──────────────────────────────────────────────┤
│ [Menu Items with icons] │                                              │
│ • Dashboard             │              MAIN CONTENT                    │
│ • Absensi               │        (Spacious whitespace, structured      │
│ • Data Karyawan         │         cards, tables, and workflows)        │
│ • Registrasi Wajah      │                                              │
│ • Riwayat Absensi       │                                              │
│ • Laporan               │                                              │
│ • Pengujian Recognition │                                              │
│ • Pengaturan            │                                              │
│                         │                                              │
│ ─────────────────────── │                                              │
│ Help & Version v2.4     │                                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Rincian Modul yang Akan Di-refactor

### A. Phase 3: Global Design System & Reusable Components
1. **Design Tokens & Typography:**
   - Font: *Plus Jakarta Sans* untuk UI/prose, *JetBrains Mono* untuk ID, waktu, status numerik, dan parameter threshold $\tau$.
   - Warna: Netral *Slate* (50–900), Primary *Slate-900 / Emerald-600*, Success *Emerald-600*, Warning *Amber-600*, Danger *Rose-600*.
2. **Reusable UI Elements (`/src/components/ui/`):**
   - `ConfirmModal.tsx`: Dialog konfirmasi untuk Logout dan aksi destruktif (nonaktifkan pegawai, reset uji).
   - `Toast.tsx`: Notifikasi umpan balik sukses/error/peringatan yang konsisten dan elegan.
   - `Badge.tsx`, `Button.tsx`, `Skeleton.tsx`: Komponen atomik untuk konsistensi di seluruh halaman.

### B. Phase 4: Refactor Layout (Sidebar, Topbar, Profile & Auth Guard)
1. **Enforce Auth Guard & Dedicated Login Screen (`LoginPage.tsx`):**
   - Jika pengguna belum terautentikasi (`token === null`), tampilkan Halaman Login Enterprise penuh (bukan sekadar popup).
   - Mendukung input username, input password dengan tombol intip (👁 / password toggle), pesan error *"Username atau password salah"*, dan tombol preset uji coba cepat (*Admin* / *User*).
   - Pengalihan otomatis: Jika belum login, rute terproteksi akan memblokir dan mengarahkan ke Login.
2. **Topbar Component (`Topbar.tsx`):**
   - Kiri: Judul Halaman yang dinamis (*Page Title*) dan sub-judul deskripsi formal.
   - Kanan: Lonceng notifikasi & **Profile Dropdown** di pojok kanan atas (Avatar + Nama + Role + Chevron).
   - Menu Dropdown: Profil, Pengaturan, dan Keluar.
   - Mengklik **Keluar** akan memunculkan dialog modal konfirmasi:
     *"Keluar dari sistem? Apakah Anda yakin ingin keluar dari akun Anda? [Batal] [Keluar]"*.
3. **Sidebar Component (`Sidebar.tsx`):**
   - Logo formal: *SMART ATTENDANCE — Face Recognition System*.
   - Menu Terstruktur:
     1. **Dashboard** (`dashboard`)
     2. **Absensi** (`attendance_kiosk`)
     3. **Data Karyawan** (`employees`)
     4. **Registrasi Wajah** (`face_registration`)
     5. **Riwayat Absensi** (`attendance_history`)
     6. **Laporan** (`reports`)
     7. **Pengujian Recognition** (`research`)
     8. **Pengaturan** (`settings`)
   - Bagian bawah: Tautan *Bantuan (Help)* dan informasi versi *Version 2.4.0 (Enterprise)*.
   - Kemampuan collapsible (260px $\leftrightarrow$ 72px) dengan tooltip apung (*floating tooltip*) saat posisi ciut, serta laci *mobile drawer* yang responsif.

### C. Phase 5: Refactor Dashboard (`DashboardOverview.tsx`)
- Header: **Dashboard** — *"Monitor aktivitas absensi karyawan hari ini."*
- 4 Kartu Ringkasan Esensial:
  1. **Total Karyawan**
  2. **Hadir** (Tepat Waktu)
  3. **Terlambat**
  4. **Belum Absen**
- **Quick Actions Panel:**
  - `[ + Tambah Karyawan ]` $\rightarrow$ membuka modal penambahan karyawan baru.
  - `[ 📷 Registrasi Wajah ]` $\rightarrow$ membuka modul registrasi biometrik 5 pose.
  - `[ ✓ Absensi ]` $\rightarrow$ langsung mengarahkan ke kamera absensi.
- **Tabel Absensi Hari Ini** terintegrasi langsung di dashboard monitoring dengan status badge yang rapi.

### D. Phase 6: Refactor Attendance Page (`AttendancePage.tsx`)
- Header: **Absensi** — *"Verifikasi identitas Anda menggunakan Face Recognition."*
- UI Kiosk Enterprise (bukan demo AI laboratorium):
  - Area kamera utama dengan panduan oval elegan.
  - State mesin yang jelas dan manusiawi:
    - `READY` (*"Silakan posisikan wajah di dalam frame."*)
    - `DETECTING` (*"Mendeteksi wajah..."*)
    - `VERIFYING` (*"Memverifikasi identitas..."*)
    - `SUCCESS` (*"Identitas berhasil diverifikasi."*)
    - `UNKNOWN` (*"Wajah tidak dikenali. Pastikan Anda sudah terdaftar dalam sistem."*)
    - `MULTIPLE FACE` (*"Lebih dari satu wajah terdeteksi. Pastikan hanya satu orang berada di depan kamera."*)
    - `LIVENESS FAILED` (*"Verifikasi gagal. Silakan ulangi."*)
  - Kartu Konfirmasi Sukses: Avatar/Centang hijau, Nama Pegawai, Employee ID, Waktu Check-In / Check-Out, Status (Hadir / Terlambat), dan tombol **[ Kembali ke Dashboard ]**.

### E. Phase 7: Refactor Employee Management & Face Registration Flow
- **Data Karyawan (`EmployeeManagement.tsx`):**
  - Header: **Data Karyawan** — *"Cari dan kelola data karyawan."*
  - Tombol Primer: `[ + Tambah Karyawan ]`.
  - Filter interaktif: Pencarian real-time nama/ID, filter Departemen, dan filter Status Aktif/Nonaktif.
  - Kolom Tabel: Foto/Avatar, Employee ID, Nama, Jabatan, Departemen, Status Biometrik, Status Keaktifan, dan Aksi (*View, Edit, Nonaktifkan* dengan konfirmasi modal aman).
- **Registrasi Wajah (`FaceRegistrationWizard.tsx`):**
  - Wizard 5 tahap terstruktur:
    - *01 Data Karyawan* $\rightarrow$ *02 Kamera Siap* $\rightarrow$ *03 Pengambilan Sampel (1/5 sampai 5/5)* $\rightarrow$ *04 Verifikasi Vektor 128-D* $\rightarrow$ *05 Selesai*.
  - Petunjuk pose yang jelas (Frontal normal, Senyum, Toleh Kiri 15°, Toleh Kanan 15°, Angkat Dagu sedikit).

### F. Phase 8: Refactor History, Reports & Research Testing
- **Riwayat Absensi (`AttendanceHistoryView.tsx`):**
  - Filter lengkap: Rentang Tanggal, Departemen, Karyawan, dan Status Kehadiran dengan fitur pencarian dan paginasi yang nyaman.
- **Laporan Absensi (`ReportsView.tsx`):**
  - Header: **Laporan Absensi** — *"Audit histori presensi lengkap dengan filter multidimensi."*
  - Kartu Agregat: Total Hadir, Total Terlambat, Total Tidak Hadir.
  - Aksi Unduh: **Ekspor Excel / CSV**.
- **Pengujian Recognition (`ResearchView.tsx`):**
  - Antarmuka pengujian empiris Bab IV Skripsi (Confusion Matrix aktual, FAR, FRR, Akurasi, Presisi, Recall, dan Titik Kurva ROC) tanpa angka dummy.

### G. Phase 9: Settings View Ekstraksi
- Ekstraksi konfigurasi jam kerja dan ambang batas $\tau$ menjadi komponen bersih `SettingsView.tsx` dengan slider presisi dan umpan balik tersimpan.

---

## 3. Eksekusi Bertahap
Implementasi akan dijalankan secara terstruktur dari fondasi komponen atomik, navigasi layout, halaman autentikasi, dashboard, kiosk absensi, data karyawan, hingga pengujian.
