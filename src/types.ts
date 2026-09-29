export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'EMPLOYEE';
  employee_id?: number | null;
  employee?: Employee;
}

export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  registered_samples_count?: number;
  has_biometric?: boolean;
  face_samples?: Array<{
    id: number;
    sample_label: string;
    quality_score: number;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  department?: string;
  position?: string;
  date: string;
  check_in: string;
  check_out: string | null;
  status: 'PRESENT' | 'LATE';
  recognition_distance: number;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: number;
  work_start_time: string;
  late_threshold_time: string;
  work_end_time: string;
  face_threshold: number;
  liveness_enabled: boolean;
  min_samples_required: number;
  updated_at: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  notYetAttended: number;
  checkedOutToday: number;
  activeThreshold: number;
  workStartTime?: string;
  lateThresholdTime?: string;
  workEndTime?: string;
}
