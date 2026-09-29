export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'EMPLOYEE';
  employee_id?: number | null;
  must_change_password?: boolean;
  avatar_url?: string;
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
  total_leave_quota?: number;
  avatar_url?: string;
  registered_samples_count?: number;
  has_biometric?: boolean;
  has_account?: boolean;
  account_username?: string;
  must_change_password?: boolean;
  face_samples?: Array<{
    id: number;
    sample_label: string;
    quality_score: number;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export type LeaveType =
  | 'CUTI_TAHUNAN'
  | 'CUTI_SAKIT'
  | 'IZIN_KEPERLUAN'
  | 'IZIN_DUKA'
  | 'CUTI_MELAHIRKAN'
  | 'LAINNYA';

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  department?: string;
  position?: string;
  type: LeaveType;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  total_days: number;
  reason: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string | null;
  approved_at?: string | null;
  reviewer_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveQuota {
  employee_id: number;
  total_quota: number;
  used_quota: number;
  pending_quota: number;
  remaining_quota: number;
  sick_leave_count: number;
  permission_count: number;
}

export interface LeaveSummary {
  pendingCount: number;
  approvedThisMonth: number;
  onLeaveToday: number;
  totalAttachments: number;
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
  status: 'PRESENT' | 'LATE' | 'ON_LEAVE' | 'PERMISSION';
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
  onLeaveToday?: number;
  pendingLeaveRequests?: number;
  activeThreshold: number;
  workStartTime?: string;
  lateThresholdTime?: string;
  workEndTime?: string;
}

export interface ResearchLog {
  id: number;
  timestamp: string;
  test_type?: 'GENUINE' | 'IMPOSTOR' | 'UNKNOWN' | 'MULTIPLE' | 'SPOOF' | 'LIGHTING' | 'DISTANCE';
  is_genuine?: boolean;
  matched_employee_id: number | null;
  target_employee_name?: string;
  recognition_result: 'SUCCESS' | 'UNKNOWN_FACE' | 'MULTIPLE_FACES' | 'NO_FACE' | 'LIVENESS_FAILED';
  calculated_distance: number | null;
  threshold_used: number;
  liveness_passed: boolean;
  processing_time_ms: number;
  ip_address: string;
  notes?: string;
}

export interface RocPoint {
  threshold: number;
  far: number;
  tar: number;
  frr: number;
}

export interface ResearchMetrics {
  threshold_evaluated: number;
  total_attempts: number;
  genuine_attempts: number;
  impostor_attempts: number;
  true_accepts: number;
  true_rejects: number;
  false_accepts: number;
  false_rejects: number;
  far: number;
  frr: number;
  tar: number;
  trr: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  avg_latency_ms: number;
  equal_error_rate: {
    threshold: number;
    eer: number;
  };
  roc_curve: RocPoint[];
}

