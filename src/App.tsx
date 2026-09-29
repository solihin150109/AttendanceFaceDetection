import React, { useState, useEffect, useCallback } from 'react';
import { User, Employee, SystemSettings, AttendanceRecord, DashboardStats } from './types';
import { Sidebar, TabType } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LoginPage } from './components/LoginPage';
import { DashboardOverview } from './components/DashboardOverview';
import { UserDashboard } from './components/UserDashboard';
import { AttendancePage } from './components/AttendancePage';
import { EmployeeManagement } from './components/EmployeeManagement';
import { FaceRegistrationWizard } from './components/FaceRegistrationWizard';
import { AttendanceHistoryView } from './components/AttendanceHistoryView';
import { ReportsView } from './components/ReportsView';
import { ResearchView } from './components/ResearchView';
import { SettingsView } from './components/SettingsView';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { HelpModal } from './components/ui/HelpModal';

export default function App() {
  // Session Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('smart_attendance_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Sidebar Layout States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals & Action States
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [registeringEmployee, setRegisteringEmployee] = useState<Employee | null>(null);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);

  // Global Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState<boolean>(false);

  // Authenticate Current Session
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setCurrentUser(data.data);
          }
        })
        .catch(() => {
          setToken(null);
          setCurrentUser(null);
          localStorage.removeItem('smart_attendance_token');
        });
    }
  }, [token]);

  // Load Today Attendance
  const fetchTodayAttendance = useCallback(async () => {
    if (!token) return;
    setIsLoadingAttendance(true);
    try {
      const res = await fetch('/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTodayAttendance(data.data);
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [token]);

  // Load Dashboard Statistics
  const fetchDashboardStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, [token]);

  // Load Employees and Settings
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      const empRes = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const empData = await empRes.json();
      if (empData.success) {
        setEmployees(empData.data);
      }

      const setRes = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const setData = await setRes.json();
      if (setData.success) {
        setSettings(setData.data);
      }

      fetchTodayAttendance();
      fetchDashboardStats();
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, [token, fetchTodayAttendance, fetchDashboardStats]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // Login handler
  const handleLoginSuccess = (newToken: string, user: User) => {
    setToken(newToken);
    localStorage.setItem('smart_attendance_token', newToken);
    setCurrentUser(user);
    setActiveTab('dashboard');
    addToast('success', 'Login Berhasil', `Selamat datang, ${user.employee?.name || user.username}.`);
  };

  // Logout handler with confirmation
  const handleConfirmLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        // ignore
      }
    }
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('smart_attendance_token');
    setIsLogoutModalOpen(false);
    setActiveTab('dashboard');
    addToast('info', 'Sesi Berakhir', 'Anda telah keluar dari akun.');
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  // Dynamic Title and Subtitle for Topbar
  const getHeaderInfo = (): { title: string; description: string } => {
    switch (activeTab) {
      case 'dashboard':
        return isAdmin
          ? {
              title: 'Dashboard Monitoring Admin',
              description: 'Pemantauan komprehensif kehadiran seluruh pegawai hari ini.'
            }
          : {
              title: 'Dashboard Pegawai',
              description: 'Ringkasan status kehadiran dan data presensi pribadi Anda.'
            };
      case 'attendance_kiosk':
        return {
          title: 'Absensi Wajah',
          description: 'Verifikasi identitas Anda menggunakan Face Recognition.'
        };
      case 'employees':
        return {
          title: 'Data Karyawan',
          description: 'Cari dan kelola master data seluruh karyawan.'
        };
      case 'face_registration':
        return {
          title: 'Registrasi Wajah',
          description: 'Pengambilan 5 variasi sampel biometrik wajah karyawan.'
        };
      case 'attendance_history':
        return isAdmin
          ? {
              title: 'Riwayat Absensi Seluruh Pegawai',
              description: 'Log transaksi kehadiran dan waktu pulang seluruh pegawai perusahaan.'
            }
          : {
              title: 'Riwayat Absensi Saya',
              description: 'Catatan historis kehadiran dan kepulangan pribadi Anda.'
            };
      case 'reports':
        return {
          title: 'Laporan Absensi',
          description: 'Audit histori presensi lengkap dengan filter multidimensi dan ekspor data.'
        };
      case 'research':
        return {
          title: 'Pengujian Recognition',
          description: 'Evaluasi empiris akurasi, FAR, FRR, dan kurva ROC untuk Bab IV Skripsi.'
        };
      case 'settings':
        return {
          title: 'Pengaturan Sistem',
          description: 'Konfigurasi jadwal kerja, batas toleransi, dan parameter biometrik.'
        };
      default:
        return {
          title: 'Smart Attendance',
          description: 'Face Recognition Attendance & Monitoring System'
        };
    }
  };

  // AUTHENTICATION GUARD: If no active token, render dedicated LoginPage
  if (!token) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  // Session verification loading state
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center animate-pulse text-emerald-400">
          <span className="font-bold text-lg font-mono">SA</span>
        </div>
        <div className="text-xs font-medium text-slate-400">Memverifikasi sesi pengguna...</div>
      </div>
    );
  }

  const { title: pageTitle, description: pageDescription } = getHeaderInfo();

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex font-sans selection:bg-slate-900 selection:text-white">
      {/* Desktop Collapsible Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentUser={currentUser}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          todayCount={todayAttendance.length}
          employeeCount={employees.length}
          onOpenHelp={() => setIsHelpModalOpen(true)}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 md:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          currentUser={currentUser}
          isCollapsed={false}
          onToggleCollapse={() => setIsMobileSidebarOpen(false)}
          todayCount={todayAttendance.length}
          employeeCount={employees.length}
          onOpenHelp={() => {
            setIsMobileSidebarOpen(false);
            setIsHelpModalOpen(true);
          }}
        />
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar with Page Title & Right Profile Dropdown */}
        <Topbar
          title={pageTitle}
          description={pageDescription}
          currentUser={currentUser}
          onOpenProfile={() => setActiveTab(isAdmin ? 'dashboard' : 'dashboard')}
          onOpenSettings={() => setActiveTab('settings')}
          onRequestLogout={() => setIsLogoutModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* TAB 1: DASHBOARD (DIFFERENTIATED FOR ADMIN & USER) */}
          {activeTab === 'dashboard' &&
            (isAdmin ? (
              <DashboardOverview
                stats={dashboardStats}
                todayRecords={todayAttendance}
                onQuickAddEmployee={() => {
                  setActiveTab('employees');
                  setIsQuickAddModalOpen(true);
                }}
                onQuickRegisterFace={() => {
                  setActiveTab('face_registration');
                }}
                onViewAllAttendance={() => {
                  setActiveTab('attendance_history');
                }}
                onViewSettings={() => {
                  setActiveTab('settings');
                }}
              />
            ) : (
              <UserDashboard
                user={currentUser!}
                token={token}
                onNavigateToAttendance={() => setActiveTab('attendance_kiosk')}
                onViewHistory={() => setActiveTab('attendance_history')}
              />
            ))}

          {/* TAB 2: ABSENSI (ONLY EMPLOYEES/USERS) */}
          {activeTab === 'attendance_kiosk' && !isAdmin && (
            <AttendancePage onBackToDashboard={() => setActiveTab('dashboard')} />
          )}

          {/* TAB 3: DATA KARYAWAN (ADMIN ONLY) */}
          {activeTab === 'employees' && isAdmin && (
            <EmployeeManagement
              token={token}
              employees={employees}
              onRefresh={fetchData}
              onOpenFaceRegistration={(emp) => setRegisteringEmployee(emp)}
              isAddModalOpenInitially={isQuickAddModalOpen}
              onCloseInitialModal={() => setIsQuickAddModalOpen(false)}
            />
          )}

          {/* TAB 4: REGISTRASI WAJAH (ADMIN ONLY) */}
          {activeTab === 'face_registration' && isAdmin && (
            <FaceRegistrationWizard
              token={token}
              employees={employees}
              initialSelectedEmployee={registeringEmployee}
              onClose={() => {
                setRegisteringEmployee(null);
                setActiveTab('employees');
              }}
              onRegisteredSuccess={() => {
                fetchData();
                addToast('success', 'Registrasi Berhasil', 'Profil biometrik 5 sampel berhasil tersimpan.');
              }}
            />
          )}

          {/* TAB 5: RIWAYAT ABSENSI (DIFFERENTIATED FOR ADMIN & USER) */}
          {activeTab === 'attendance_history' && (
            <AttendanceHistoryView
              token={token}
              currentUser={currentUser}
              onRefreshParent={fetchTodayAttendance}
            />
          )}

          {/* TAB 6: LAPORAN (ADMIN ONLY) */}
          {activeTab === 'reports' && isAdmin && (
            <ReportsView token={token} employees={employees} />
          )}

          {/* TAB 7: PENGUJIAN RECOGNITION / BAB IV (ADMIN ONLY) */}
          {activeTab === 'research' && isAdmin && (
            <ResearchView token={token} employees={employees} />
          )}

          {/* TAB 8: PENGATURAN SISTEM (ADMIN ONLY) */}
          {activeTab === 'settings' && isAdmin && (
            <SettingsView token={token} settings={settings} onRefresh={fetchData} />
          )}
        </main>

        {/* Global Clean Enterprise Footer */}
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
          Smart Attendance System &middot; Face Recognition & Biometric Liveness Verification &middot; Tugas Akhir
        </footer>
      </div>

      {/* Confirmation Modal for Logout */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Keluar dari sistem?"
        message="Apakah Anda yakin ingin keluar dari akun Anda?"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {/* Help & Documentation Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        userRole={currentUser?.role}
      />

      {/* Face Registration Modal when triggered directly from employee table */}
      {registeringEmployee && activeTab !== 'face_registration' && (
        <FaceRegistrationWizard
          token={token}
          employees={employees}
          initialSelectedEmployee={registeringEmployee}
          onClose={() => setRegisteringEmployee(null)}
          onRegisteredSuccess={() => {
            fetchData();
            addToast('success', 'Registrasi Berhasil', 'Profil biometrik 5 sampel berhasil tersimpan.');
          }}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
