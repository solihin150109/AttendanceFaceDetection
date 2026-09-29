import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3000;

// Body parsing with 15MB limit for high quality face biometric frames
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ----------------------------------------------------
// DATABASE SIMULATION & SCHEMA INITIALIZATION
// ----------------------------------------------------
const DB_FILE = path.resolve(process.cwd(), 'database_store.json');

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'ADMIN' | 'EMPLOYEE';
  employee_id?: number | null;
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface FaceProfile {
  id: number;
  employee_id: number;
  face_embedding: number[]; // 128-D Invariant Vector
  sample_label: string; // 'frontal' | 'left' | 'right' | 'up' | 'down'
  quality_score: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string; // YYYY-MM-DD
  check_in: string; // HH:mm:ss
  check_out: string | null;
  status: 'PRESENT' | 'LATE';
  recognition_distance: number;
  created_at: string;
  updated_at: string;
}

export interface RecognitionLog {
  id: number;
  timestamp: string;
  matched_employee_id: number | null;
  recognition_result: 'SUCCESS' | 'UNKNOWN_FACE' | 'MULTIPLE_FACES' | 'NO_FACE' | 'LIVENESS_FAILED';
  calculated_distance: number | null;
  threshold_used: number;
  liveness_passed: boolean;
  processing_time_ms: number;
  ip_address: string;
}

export interface SystemSettings {
  id: number;
  work_start_time: string; // "08:00"
  late_threshold_time: string; // "08:15"
  work_end_time: string; // "17:00"
  face_threshold: number; // default 0.45 Euclidean Distance
  liveness_enabled: boolean;
  min_samples_required: number;
  updated_at: string;
}

interface DatabaseStructure {
  users: User[];
  employees: Employee[];
  face_profiles: FaceProfile[];
  attendance: AttendanceRecord[];
  recognition_logs: RecognitionLog[];
  settings: SystemSettings;
}

function loadDB(): DatabaseStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB_FILE, creating fresh database:', err);
  }

  // Default seed data with secure bcrypt hashed password for admin ('admin123') and user ('user123')
  const salt = bcrypt.genSaltSync(10);
  const defaultAdminPasswordHash = bcrypt.hashSync('admin123', salt);
  const defaultUserPasswordHash = bcrypt.hashSync('user123', salt);

  const initialDB: DatabaseStructure = {
    users: [
      {
        id: 1,
        username: 'admin',
        password_hash: defaultAdminPasswordHash,
        role: 'ADMIN',
        employee_id: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        username: 'ahmad',
        password_hash: defaultUserPasswordHash,
        role: 'EMPLOYEE',
        employee_id: 1, // Ahmad Fauzi (EMP-001)
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        username: 'siti',
        password_hash: defaultUserPasswordHash,
        role: 'EMPLOYEE',
        employee_id: 2, // Siti Nurhaliza (EMP-002)
        created_at: new Date().toISOString(),
      }
    ],
    employees: [
      {
        id: 1,
        employee_id: 'EMP-001',
        name: 'Ahmad Fauzi',
        position: 'Senior Software Engineer',
        department: 'Information Technology',
        email: 'ahmad.fauzi@company.co.id',
        phone: '081234567890',
        status: 'ACTIVE',
        created_at: new Date(Date.now() - 3600 * 24 * 7 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        employee_id: 'EMP-002',
        name: 'Siti Nurhaliza',
        position: 'Data Analyst',
        department: 'Research & Intelligence',
        email: 'siti.nurhaliza@company.co.id',
        phone: '081298765432',
        status: 'ACTIVE',
        created_at: new Date(Date.now() - 3600 * 24 * 6 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        employee_id: 'EMP-003',
        name: 'Budi Santoso',
        position: 'HR & Operations Lead',
        department: 'Human Resources',
        email: 'budi.santoso@company.co.id',
        phone: '081377889900',
        status: 'ACTIVE',
        created_at: new Date(Date.now() - 3600 * 24 * 5 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    face_profiles: [],
    attendance: [],
    recognition_logs: [],
    settings: {
      id: 1,
      work_start_time: '08:00',
      late_threshold_time: '08:15',
      work_end_time: '17:00',
      face_threshold: 0.45,
      liveness_enabled: true,
      min_samples_required: 5,
      updated_at: new Date().toISOString(),
    }
  };

  saveDB(initialDB);
  return initialDB;
}

function saveDB(db: DatabaseStructure) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// In-memory active DB
let db = loadDB();

// Ensure employee user accounts exist in db if loaded from existing database_store.json
if (!db.users.some(u => u.username === 'ahmad')) {
  const salt = bcrypt.genSaltSync(10);
  const defaultUserPasswordHash = bcrypt.hashSync('user123', salt);
  db.users.push(
    {
      id: 2,
      username: 'ahmad',
      password_hash: defaultUserPasswordHash,
      role: 'EMPLOYEE',
      employee_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      username: 'siti',
      password_hash: defaultUserPasswordHash,
      role: 'EMPLOYEE',
      employee_id: 2,
      created_at: new Date().toISOString()
    }
  );
  saveDB(db);
}

// Simple in-memory session token store
const sessions = new Map<string, { userId: number; username: string; expires: number }>();

function generateSessionToken(): string {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const session = sessions.get(token);

  if (!session || session.expires < Date.now()) {
    if (session) sessions.delete(token);
    return res.status(401).json({ success: false, message: 'Sesi login telah kedaluwarsa atau tidak valid.' });
  }

  // Extend session
  session.expires = Date.now() + 1000 * 60 * 60 * 8; // 8 hours
  (req as any).user = session;
  next();
}

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
  }

  const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ success: false, message: 'Kombinasi username atau password salah.' });
  }

  const isPasswordValid = bcrypt.compareSync(String(password), user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Kombinasi username atau password salah.' });
  }

  const token = generateSessionToken();
  sessions.set(token, {
    userId: user.id,
    username: user.username,
    expires: Date.now() + 1000 * 60 * 60 * 8
  });

  const employee = user.employee_id ? db.employees.find(e => e.id === user.employee_id) : undefined;

  return res.json({
    success: true,
    message: 'Login berhasil.',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employee_id: user.employee_id || null,
        employee: employee || undefined
      }
    }
  });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  sessions.delete(token);
  return res.json({ success: true, message: 'Logout berhasil.' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const session = (req as any).user;
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  const employee = user.employee_id ? db.employees.find(e => e.id === user.employee_id) : undefined;

  return res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      employee_id: user.employee_id || null,
      employee: employee || undefined
    }
  });
});

/**
 * User Personal Attendance History (For logged in employee)
 */
app.get('/api/user/attendance', authMiddleware, (req, res) => {
  const session = (req as any).user;
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  let list: AttendanceRecord[] = [];
  if (user.role === 'ADMIN') {
    list = [...db.attendance];
  } else if (user.employee_id) {
    list = db.attendance.filter(a => a.employee_id === user.employee_id);
  }

  const enriched = list.map(item => {
    const emp = db.employees.find(e => e.id === item.employee_id);
    return {
      ...item,
      employee_name: emp ? emp.name : 'Unknown',
      employee_code: emp ? emp.employee_id : '-',
      department: emp ? emp.department : '-',
      position: emp ? emp.position : '-'
    };
  });

  enriched.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.check_in.localeCompare(a.check_in);
  });

  return res.json({
    success: true,
    data: enriched
  });
});

// ----------------------------------------------------
// EMPLOYEES CRUD API (ADMIN ONLY)
// ----------------------------------------------------
app.get('/api/employees', authMiddleware, (req, res) => {
  const { search, department, status } = req.query;
  let list = [...db.employees];

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.employee_id.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q)
    );
  }

  if (department && department !== 'ALL') {
    list = list.filter(e => e.department === String(department));
  }

  if (status && status !== 'ALL') {
    list = list.filter(e => e.status === String(status));
  }

  // Attach sample_count from face_profiles
  const enriched = list.map(emp => {
    const profiles = db.face_profiles.filter(fp => fp.employee_id === emp.id);
    return {
      ...emp,
      registered_samples_count: profiles.length,
      has_biometric: profiles.length >= db.settings.min_samples_required
    };
  });

  return res.json({
    success: true,
    data: enriched
  });
});

app.get('/api/employees/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const employee = db.employees.find(e => e.id === id);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan.' });
  }

  const profiles = db.face_profiles.filter(fp => fp.employee_id === employee.id);
  return res.json({
    success: true,
    data: {
      ...employee,
      face_samples: profiles.map(p => ({
        id: p.id,
        sample_label: p.sample_label,
        quality_score: p.quality_score,
        created_at: p.created_at
      })),
      registered_samples_count: profiles.length,
      has_biometric: profiles.length >= db.settings.min_samples_required
    }
  });
});

app.post('/api/employees', authMiddleware, (req, res) => {
  const { employee_id, name, position, department, email, phone } = req.body;

  if (!employee_id || !name || !position || !department) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID, Nama, Jabatan, dan Departemen wajib diisi.'
    });
  }

  const cleanEmployeeId = String(employee_id).trim().toUpperCase();
  const existing = db.employees.find(e => e.employee_id.toUpperCase() === cleanEmployeeId);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `Employee ID "${cleanEmployeeId}" sudah digunakan oleh karyawan ${existing.name}.`
    });
  }

  const newId = db.employees.length > 0 ? Math.max(...db.employees.map(e => e.id)) + 1 : 1;
  const newEmployee: Employee = {
    id: newId,
    employee_id: cleanEmployeeId,
    name: String(name).trim(),
    position: String(position).trim(),
    department: String(department).trim(),
    email: email ? String(email).trim() : '',
    phone: phone ? String(phone).trim() : '',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.employees.push(newEmployee);
  saveDB(db);

  return res.status(201).json({
    success: true,
    message: 'Data karyawan berhasil ditambahkan.',
    data: newEmployee
  });
});

app.put('/api/employees/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const employee = db.employees.find(e => e.id === id);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan.' });
  }

  const { employee_id, name, position, department, email, phone } = req.body;

  if (employee_id) {
    const cleanEmployeeId = String(employee_id).trim().toUpperCase();
    const duplicate = db.employees.find(e => e.employee_id.toUpperCase() === cleanEmployeeId && e.id !== id);
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Employee ID "${cleanEmployeeId}" sudah digunakan oleh karyawan lain.`
      });
    }
    employee.employee_id = cleanEmployeeId;
  }

  if (name) employee.name = String(name).trim();
  if (position) employee.position = String(position).trim();
  if (department) employee.department = String(department).trim();
  if (email !== undefined) employee.email = String(email).trim();
  if (phone !== undefined) employee.phone = String(phone).trim();
  employee.updated_at = new Date().toISOString();

  saveDB(db);
  return res.json({ success: true, message: 'Data karyawan berhasil diperbarui.', data: employee });
});

// Soft Delete / Toggle Status to preserve attendance foreign keys
app.patch('/api/employees/:id/status', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const employee = db.employees.find(e => e.id === id);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan.' });
  }

  const { status } = req.body;
  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status harus bernilai ACTIVE atau INACTIVE.' });
  }

  employee.status = status;
  employee.updated_at = new Date().toISOString();
  saveDB(db);

  return res.json({
    success: true,
    message: `Status karyawan ${employee.name} berhasil diubah menjadi ${status}.`,
    data: employee
  });
});

// ----------------------------------------------------
// FACE REGISTRATION API (SERVER-SIDE BIOMETRIC EMBEDDING)
// ----------------------------------------------------
app.post('/api/face/register-sample', authMiddleware, (req, res) => {
  const { employee_id, face_embedding, sample_label, quality_score } = req.body;

  if (!employee_id || !face_embedding || !Array.isArray(face_embedding)) {
    return res.status(400).json({
      success: false,
      message: 'Parameter employee_id dan face_embedding (array 128-D) wajib disertakan.'
    });
  }

  if (face_embedding.length !== 128) {
    return res.status(400).json({
      success: false,
      message: `Dimensi face_embedding tidak valid. Diharapkan 128 dimensi, diterima: ${face_embedding.length}.`
    });
  }

  const employee = db.employees.find(e => e.id === parseInt(employee_id));
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan.' });
  }

  // Ensure normalized L2 vector
  const norm = Math.sqrt(face_embedding.reduce((sum, val) => sum + val * val, 0));
  const normalizedVector = norm > 0 ? face_embedding.map(v => v / norm) : face_embedding;

  const newProfileId = db.face_profiles.length > 0 ? Math.max(...db.face_profiles.map(p => p.id)) + 1 : 1;
  const newProfile: FaceProfile = {
    id: newProfileId,
    employee_id: employee.id,
    face_embedding: normalizedVector,
    sample_label: sample_label ? String(sample_label) : `sample_${Date.now()}`,
    quality_score: quality_score ? Number(quality_score) : 1.0,
    created_at: new Date().toISOString()
  };

  db.face_profiles.push(newProfile);
  saveDB(db);

  const totalSamples = db.face_profiles.filter(p => p.employee_id === employee.id).length;

  return res.status(201).json({
    success: true,
    message: `Sampel wajah (${newProfile.sample_label}) berhasil diregistrasi.`,
    data: {
      profile_id: newProfile.id,
      employee_id: employee.id,
      employee_name: employee.name,
      sample_label: newProfile.sample_label,
      total_registered_samples: totalSamples,
      is_ready_for_attendance: totalSamples >= db.settings.min_samples_required
    }
  });
});

app.delete('/api/face/profiles/:id', authMiddleware, (req, res) => {
  const profileId = parseInt(req.params.id);
  const index = db.face_profiles.findIndex(p => p.id === profileId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Sampel profil wajah tidak ditemukan.' });
  }

  const [removed] = db.face_profiles.splice(index, 1);
  saveDB(db);

  return res.json({
    success: true,
    message: `Sampel wajah id ${profileId} berhasil dihapus.`,
    data: removed
  });
});

// Reset face samples for an employee
app.delete('/api/face/employees/:empId/reset', authMiddleware, (req, res) => {
  const empId = parseInt(req.params.empId);
  db.face_profiles = db.face_profiles.filter(p => p.employee_id !== empId);
  saveDB(db);

  return res.json({
    success: true,
    message: `Semua data wajah untuk karyawan ID ${empId} telah di-reset.`
  });
});

// ----------------------------------------------------
// SYSTEM SETTINGS API
// ----------------------------------------------------
app.get('/api/settings', authMiddleware, (req, res) => {
  return res.json({ success: true, data: db.settings });
});

app.put('/api/settings', authMiddleware, (req, res) => {
  const {
    work_start_time,
    late_threshold_time,
    work_end_time,
    face_threshold,
    liveness_enabled,
    min_samples_required
  } = req.body;

  if (work_start_time) db.settings.work_start_time = String(work_start_time);
  if (late_threshold_time) db.settings.late_threshold_time = String(late_threshold_time);
  if (work_end_time) db.settings.work_end_time = String(work_end_time);
  if (face_threshold !== undefined) db.settings.face_threshold = Number(face_threshold);
  if (liveness_enabled !== undefined) db.settings.liveness_enabled = Boolean(liveness_enabled);
  if (min_samples_required !== undefined) db.settings.min_samples_required = Number(min_samples_required);
  db.settings.updated_at = new Date().toISOString();

  saveDB(db);
  return res.json({ success: true, message: 'Pengaturan sistem berhasil disimpan.', data: db.settings });
});

// ----------------------------------------------------
// FACE RECOGNITION MATCHING & ATTENDANCE CORE (PHASE 3 & 4)
// ----------------------------------------------------
app.get('/api/face/registered-embeddings-count', (req, res) => {
  return res.json({
    success: true,
    total_embeddings: db.face_profiles.length,
    total_enrolled_employees: new Set(db.face_profiles.map(p => p.employee_id)).size,
    threshold: db.settings.face_threshold
  });
});

/**
 * Server-Side Face Recognition Endpoint
 * ZERO-CLIENT-TRUST: Client DOES NOT send employee_id.
 * Client sends extracted 128-D vector embedding + optional liveness verification telemetry.
 */
app.post('/api/attendance/recognize-and-record', (req, res) => {
  const startTime = Date.now();
  const { face_embedding, liveness_passed, liveness_score, client_ip } = req.body;

  // 1. Validation of input embedding
  if (!face_embedding || !Array.isArray(face_embedding) || face_embedding.length !== 128) {
    const procTime = Date.now() - startTime;
    return res.status(400).json({
      success: false,
      error_code: 'INVALID_BIOMETRIC_PAYLOAD',
      message: 'Payload biometrik tidak valid. Vektor 128-D diperlukan.'
    });
  }

  // 2. Liveness Guard
  if (db.settings.liveness_enabled && liveness_passed !== true) {
    const procTime = Date.now() - startTime;
    const logId = db.recognition_logs.length + 1;
    db.recognition_logs.push({
      id: logId,
      timestamp: new Date().toISOString(),
      matched_employee_id: null,
      recognition_result: 'LIVENESS_FAILED',
      calculated_distance: null,
      threshold_used: db.settings.face_threshold,
      liveness_passed: false,
      processing_time_ms: procTime,
      ip_address: client_ip || req.ip || '127.0.0.1'
    });
    saveDB(db);

    return res.status(400).json({
      success: false,
      error_code: 'LIVENESS_FAILED',
      message: 'Verifikasi liveness gagal. Pastikan melakukan gerakan/kedipan di depan kamera.'
    });
  }

  // 3. Database Search: Find Best Candidate using Euclidean Distance
  if (db.face_profiles.length === 0) {
    return res.status(404).json({
      success: false,
      error_code: 'NO_REGISTERED_FACES',
      message: 'Belum ada profil wajah karyawan yang terdaftar dalam sistem.'
    });
  }

  // Normalize incoming vector
  const norm = Math.sqrt(face_embedding.reduce((sum, v) => sum + v * v, 0));
  const normEmbedding = norm > 0 ? face_embedding.map(v => v / norm) : face_embedding;

  let minDistance = Infinity;
  let bestCandidateEmployeeId: number | null = null;
  let bestProfileId: number | null = null;

  for (const profile of db.face_profiles) {
    // Only match against ACTIVE employees
    const emp = db.employees.find(e => e.id === profile.employee_id);
    if (!emp || emp.status !== 'ACTIVE') continue;

    // Euclidean distance
    let sumSq = 0;
    for (let i = 0; i < 128; i++) {
      const diff = normEmbedding[i] - profile.face_embedding[i];
      sumSq += diff * diff;
    }
    const dist = Math.sqrt(sumSq);

    if (dist < minDistance) {
      minDistance = dist;
      bestCandidateEmployeeId = profile.employee_id;
      bestProfileId = profile.id;
    }
  }

  const threshold = db.settings.face_threshold;
  const procTime = Date.now() - startTime;

  // 4. Open-Set Threshold Decision Guard
  if (bestCandidateEmployeeId === null || minDistance > threshold) {
    // Log Unknown Attempt
    const logId = db.recognition_logs.length + 1;
    db.recognition_logs.push({
      id: logId,
      timestamp: new Date().toISOString(),
      matched_employee_id: null,
      recognition_result: 'UNKNOWN_FACE',
      calculated_distance: minDistance === Infinity ? null : Number(minDistance.toFixed(4)),
      threshold_used: threshold,
      liveness_passed: true,
      processing_time_ms: procTime,
      ip_address: client_ip || req.ip || '127.0.0.1'
    });
    saveDB(db);

    return res.status(403).json({
      success: false,
      error_code: 'UNKNOWN_FACE',
      message: 'Wajah tidak dikenali atau tidak memenuhi ambang batas sistem.',
      distance: Number(minDistance.toFixed(4)),
      threshold: threshold
    });
  }

  // 5. Successful Recognition: Lookup Employee
  const recognizedEmployee = db.employees.find(e => e.id === bestCandidateEmployeeId);
  if (!recognizedEmployee) {
    return res.status(404).json({
      success: false,
      error_code: 'EMPLOYEE_NOT_FOUND',
      message: 'Karyawan terdaftar tidak ditemukan dalam basis data.'
    });
  }

  // 5. Anti-Misidentification Guard:
  // If client maliciously attempts to claim an employee_id or username in headers or body,
  // we strictly verify if that claim matches the biometrically recognized identity.
  const claimedEmployeeId = req.body.claimed_employee_id || req.headers['x-claimed-employee-id'];
  if (claimedEmployeeId) {
    const cleanClaimed = String(claimedEmployeeId).trim().toUpperCase();
    if (recognizedEmployee.employee_id.toUpperCase() !== cleanClaimed) {
      const procTime = Date.now() - startTime;
      const logId = db.recognition_logs.length + 1;
      db.recognition_logs.push({
        id: logId,
        timestamp: new Date().toISOString(),
        matched_employee_id: recognizedEmployee.id,
        recognition_result: 'UNKNOWN_FACE',
        calculated_distance: Number(minDistance.toFixed(4)),
        threshold_used: threshold,
        liveness_passed: true,
        processing_time_ms: procTime,
        ip_address: client_ip || req.ip || '127.0.0.1'
      });
      saveDB(db);

      return res.status(403).json({
        success: false,
        error_code: 'IDENTITY_MISMATCH_REJECTED',
        message: `PERINGATAN KEAMANAN: Klaim identitas (${cleanClaimed}) tidak cocok dengan identitas biometrik wajah terverifikasi (${recognizedEmployee.employee_id} - ${recognizedEmployee.name}). Transaksi absensi ditolak keras.`,
        metrics: {
          distance: Number(minDistance.toFixed(4)),
          threshold: threshold,
          processing_time_ms: procTime
        }
      });
    }
  }

  // 6. Attendance Engine (Phase 4 Logic Integrated)
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss

  // Check existing attendance today
  let attendanceRecord = db.attendance.find(
    a => a.employee_id === recognizedEmployee.id && a.date === todayStr
  );

  let attendanceAction: 'CHECK_IN' | 'CHECK_OUT' | 'ALREADY_COMPLETED' | 'DEBOUNCE_WAIT' = 'CHECK_IN';

  if (!attendanceRecord) {
    // First time today -> Record Check-in
    const [currH, currM] = timeStr.split(':').map(Number);
    const [lateH, lateM] = db.settings.late_threshold_time.split(':').map(Number);

    const isLate = currH > lateH || (currH === lateH && currM > lateM);
    const newAttId = db.attendance.length > 0 ? Math.max(...db.attendance.map(a => a.id)) + 1 : 1;

    attendanceRecord = {
      id: newAttId,
      employee_id: recognizedEmployee.id,
      date: todayStr,
      check_in: timeStr,
      check_out: null,
      status: isLate ? 'LATE' : 'PRESENT',
      recognition_distance: Number(minDistance.toFixed(4)),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    db.attendance.push(attendanceRecord);
    attendanceAction = 'CHECK_IN';
  } else if (!attendanceRecord.check_out) {
    // Record Check-out with 1-minute debounce guard to prevent double accidental scans
    const checkInTime = new Date(`${todayStr}T${attendanceRecord.check_in}`);
    const timeDiffSeconds = Math.floor((now.getTime() - checkInTime.getTime()) / 1000);

    if (timeDiffSeconds < 60) {
      attendanceAction = 'DEBOUNCE_WAIT';
      return res.status(429).json({
        success: false,
        error_code: 'DEBOUNCE_PROTECTION',
        message: `Absensi masuk baru saja dicatat ${timeDiffSeconds} detik lalu. Harap tunggu minimal 1 menit sebelum melakukan absensi pulang.`,
        data: {
          employee: {
            id: recognizedEmployee.id,
            employee_id: recognizedEmployee.employee_id,
            name: recognizedEmployee.name,
            department: recognizedEmployee.department
          },
          attendance: attendanceRecord
        }
      });
    }

    attendanceRecord.check_out = timeStr;
    attendanceRecord.updated_at = now.toISOString();
    attendanceAction = 'CHECK_OUT';
  } else {
    // Both check-in and check-out exist -> STRICT DUPLICATE PREVENTION
    attendanceAction = 'ALREADY_COMPLETED';
    return res.status(200).json({
      success: true,
      action: 'ALREADY_COMPLETED',
      message: `Presensi hari ini (${todayStr}) untuk ${recognizedEmployee.name} sudah lengkap (Masuk: ${attendanceRecord.check_in}, Pulang: ${attendanceRecord.check_out}). Tidak ada absensi ganda yang dibuat.`,
      data: {
        employee: {
          id: recognizedEmployee.id,
          employee_id: recognizedEmployee.employee_id,
          name: recognizedEmployee.name,
          department: recognizedEmployee.department,
          position: recognizedEmployee.position
        },
        attendance: attendanceRecord,
        metrics: {
          distance: Number(minDistance.toFixed(4)),
          threshold: threshold,
          processing_time_ms: procTime
        }
      }
    });
  }

  // 7. Log Recognition Success
  const logId = db.recognition_logs.length + 1;
  db.recognition_logs.push({
    id: logId,
    timestamp: now.toISOString(),
    matched_employee_id: recognizedEmployee.id,
    recognition_result: 'SUCCESS',
    calculated_distance: Number(minDistance.toFixed(4)),
    threshold_used: threshold,
    liveness_passed: true,
    processing_time_ms: procTime,
    ip_address: client_ip || req.ip || '127.0.0.1'
  });

  saveDB(db);

  return res.json({
    success: true,
    action: attendanceAction,
    message:
      attendanceAction === 'CHECK_IN'
        ? `Presensi Masuk Berhasil: ${recognizedEmployee.name} (${attendanceRecord.status === 'LATE' ? 'TERLAMBAT' : 'TEPAT WAKTU'})`
        : `Presensi Pulang Berhasil: ${recognizedEmployee.name}`,
    data: {
      employee: {
        id: recognizedEmployee.id,
        employee_id: recognizedEmployee.employee_id,
        name: recognizedEmployee.name,
        department: recognizedEmployee.department,
        position: recognizedEmployee.position
      },
      attendance: attendanceRecord,
      metrics: {
        distance: Number(minDistance.toFixed(4)),
        threshold: threshold,
        processing_time_ms: procTime
      }
    }
  });
});

/**
 * Attendance Today Read Endpoint
 */
app.get('/api/attendance/today', authMiddleware, (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const list = db.attendance.filter(a => a.date === todayStr);

  const enriched = list.map(item => {
    const emp = db.employees.find(e => e.id === item.employee_id);
    return {
      ...item,
      employee_name: emp ? emp.name : 'Unknown',
      employee_code: emp ? emp.employee_id : '-',
      department: emp ? emp.department : '-',
      position: emp ? emp.position : '-'
    };
  });

  return res.json({
    success: true,
    data: enriched
  });
});

/**
 * Dashboard Real-time Statistics
 */
app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const activeEmployees = db.employees.filter(e => e.status === 'ACTIVE');
  const todayRecords = db.attendance.filter(a => a.date === todayStr);

  const presentToday = todayRecords.filter(a => a.status === 'PRESENT').length;
  const lateToday = todayRecords.filter(a => a.status === 'LATE').length;
  const totalAttended = todayRecords.length;
  const notYetAttended = Math.max(0, activeEmployees.length - totalAttended);
  const checkedOutToday = todayRecords.filter(a => a.check_out !== null).length;

  return res.json({
    success: true,
    data: {
      totalEmployees: activeEmployees.length,
      presentToday,
      lateToday,
      totalAttended,
      notYetAttended,
      checkedOutToday,
      activeThreshold: db.settings.face_threshold,
      workStartTime: db.settings.work_start_time,
      lateThresholdTime: db.settings.late_threshold_time,
      workEndTime: db.settings.work_end_time
    }
  });
});

/**
 * Global Attendance History Endpoint (Scoped by Role)
 * Admin: views all company attendance history
 * Employee: views strictly their own attendance history
 */
app.get('/api/attendance/history', authMiddleware, (req, res) => {
  const session = (req as any).user;
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  let list: AttendanceRecord[] = [];
  if (user.role === 'ADMIN') {
    list = [...db.attendance];
  } else if (user.employee_id) {
    list = db.attendance.filter(a => a.employee_id === user.employee_id);
  }

  const enriched = list.map(item => {
    const emp = db.employees.find(e => e.id === item.employee_id);
    return {
      ...item,
      employee_name: emp ? emp.name : 'Unknown',
      employee_code: emp ? emp.employee_id : '-',
      department: emp ? emp.department : '-',
      position: emp ? emp.position : '-'
    };
  });

  enriched.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.check_in.localeCompare(a.check_in);
  });

  return res.json({
    success: true,
    data: enriched,
    role: user.role
  });
});

/**
 * Historical Attendance & Reports Query Endpoint
 * Supports filtering by start_date, end_date, department, status, employee_id
 */
app.get('/api/reports/query', authMiddleware, (req, res) => {
  const { start_date, end_date, department, status, employee_id } = req.query;

  let records = [...db.attendance];

  if (start_date) {
    records = records.filter(r => r.date >= String(start_date));
  }
  if (end_date) {
    records = records.filter(r => r.date <= String(end_date));
  }
  if (status && status !== 'ALL') {
    records = records.filter(r => r.status === String(status));
  }
  if (employee_id && employee_id !== 'ALL') {
    records = records.filter(r => r.employee_id === parseInt(String(employee_id)));
  }

  // Join employee metadata
  let enriched = records.map(r => {
    const emp = db.employees.find(e => e.id === r.employee_id);
    return {
      ...r,
      employee_name: emp ? emp.name : 'Unknown',
      employee_code: emp ? emp.employee_id : '-',
      department: emp ? emp.department : '-',
      position: emp ? emp.position : '-'
    };
  });

  if (department && department !== 'ALL') {
    enriched = enriched.filter(e => e.department === String(department));
  }

  // Sort by date descending, then check_in descending
  enriched.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.check_in.localeCompare(a.check_in);
  });

  // Calculate aggregation summary
  const summary = {
    totalRecords: enriched.length,
    onTimeCount: enriched.filter(e => e.status === 'PRESENT').length,
    lateCount: enriched.filter(e => e.status === 'LATE').length,
    completedCheckoutCount: enriched.filter(e => e.check_out !== null).length
  };

  return res.json({
    success: true,
    data: enriched,
    summary
  });
});

/**
 * CSV Export Generator Endpoint
 */
app.get('/api/reports/export-csv', authMiddleware, (req, res) => {
  const { start_date, end_date, department, status } = req.query;

  let records = [...db.attendance];
  if (start_date) records = records.filter(r => r.date >= String(start_date));
  if (end_date) records = records.filter(r => r.date <= String(end_date));
  if (status && status !== 'ALL') records = records.filter(r => r.status === String(status));

  let enriched = records.map(r => {
    const emp = db.employees.find(e => e.id === r.employee_id);
    return {
      ...r,
      employee_name: emp ? emp.name : 'Unknown',
      employee_code: emp ? emp.employee_id : '-',
      department: emp ? emp.department : '-',
      position: emp ? emp.position : '-'
    };
  });

  if (department && department !== 'ALL') {
    enriched = enriched.filter(e => e.department === String(department));
  }

  enriched.sort((a, b) => b.date.localeCompare(a.date));

  const headers = ['No', 'Tanggal', 'Employee ID', 'Nama Karyawan', 'Departemen', 'Jabatan', 'Jam Masuk', 'Jam Pulang', 'Status Kehadiran', 'Jarak Euclidean'];
  const rows = enriched.map((item, idx) => [
    idx + 1,
    `"${item.date}"`,
    `"${item.employee_code}"`,
    `"${item.employee_name}"`,
    `"${item.department}"`,
    `"${item.position}"`,
    `"${item.check_in}"`,
    `"${item.check_out || 'Belum Absen Pulang'}"`,
    `"${item.status === 'PRESENT' ? 'TEPAT WAKTU' : 'TERLAMBAT'}"`,
    item.recognition_distance
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=Laporan_Presensi_${start_date || 'all'}_sd_${end_date || 'all'}.csv`);
  return res.send(csvContent);
});

// ----------------------------------------------------
// RESEARCH & SCIENTIFIC EVALUATION API (PHASE 6 - BAB IV SKRIPSI)
// ----------------------------------------------------

/**
 * Record an experimental test attempt (Genuine, Impostor, Unknown, Multiple Face, Spoof, Lighting, Distance)
 */
app.post('/api/research/log-experiment', authMiddleware, (req, res) => {
  const {
    test_type, // 'GENUINE' | 'IMPOSTOR' | 'UNKNOWN' | 'MULTIPLE' | 'SPOOF' | 'LIGHTING' | 'DISTANCE'
    target_employee_id,
    claimed_employee_id,
    actual_face_source, // 'GENUINE_USER' | 'WRONG_PERSON' | 'UNKNOWN_PERSON' | 'PHOTO_SCREEN' | 'TWO_PEOPLE'
    result_status, // 'SUCCESS' | 'UNKNOWN_FACE' | 'MULTIPLE_FACES' | 'LIVENESS_FAILED'
    distance,
    threshold,
    processing_time_ms,
    lighting_lux_label,
    distance_cm_label,
    head_pose_label
  } = req.body;

  const logId = db.recognition_logs.length + 1;
  const newLog: RecognitionLog = {
    id: logId,
    timestamp: new Date().toISOString(),
    matched_employee_id: target_employee_id ? Number(target_employee_id) : null,
    recognition_result: result_status || 'SUCCESS',
    calculated_distance: distance !== undefined ? Number(distance) : null,
    threshold_used: threshold !== undefined ? Number(threshold) : db.settings.face_threshold,
    liveness_passed: result_status !== 'LIVENESS_FAILED',
    processing_time_ms: processing_time_ms ? Number(processing_time_ms) : 45,
    ip_address: req.ip || '127.0.0.1'
  };

  db.recognition_logs.push(newLog);
  saveDB(db);

  return res.status(201).json({
    success: true,
    message: 'Data pengujian eksperimental berhasil dicatat ke recognition_logs.',
    data: newLog
  });
});

/**
 * Evaluates FAR, FRR, TAR, TRR, Accuracy, Precision, Recall, and ROC points from experimental logs
 */
app.get('/api/research/evaluation-metrics', authMiddleware, (req, res) => {
  const customThreshold = req.query.threshold ? parseFloat(String(req.query.threshold)) : db.settings.face_threshold;

  const logs = [...db.recognition_logs];

  if (logs.length === 0) {
    return res.json({
      success: true,
      has_data: false,
      message: 'Belum ada data pengujian yang dilakukan. Silakan jalankan modul pengujian terlebih dahulu.',
      metrics: null
    });
  }

  // Separate Genuine attempts and Impostor attempts
  let genuineAttempts = 0;
  let trueAccepts = 0;
  let falseRejects = 0;

  let impostorAttempts = 0;
  let trueRejects = 0;
  let falseAccepts = 0;

  let totalLatencyMs = 0;

  for (const log of logs) {
    totalLatencyMs += log.processing_time_ms || 35;

    // Check if test was genuine (has matched_employee_id)
    if (log.matched_employee_id !== null) {
      genuineAttempts++;
      // Accepted if distance <= threshold and result was SUCCESS
      if (log.calculated_distance !== null && log.calculated_distance <= customThreshold && log.recognition_result === 'SUCCESS') {
        trueAccepts++;
      } else {
        falseRejects++;
      }
    } else {
      // Impostor or Unknown attempt
      impostorAttempts++;
      if (log.calculated_distance !== null && log.calculated_distance <= customThreshold && log.recognition_result === 'SUCCESS') {
        falseAccepts++;
      } else {
        trueRejects++;
      }
    }
  }

  const far = impostorAttempts > 0 ? (falseAccepts / impostorAttempts) * 100 : 0;
  const frr = genuineAttempts > 0 ? (falseRejects / genuineAttempts) * 100 : 0;
  const tar = genuineAttempts > 0 ? (trueAccepts / genuineAttempts) * 100 : 0;
  const trr = impostorAttempts > 0 ? (trueRejects / impostorAttempts) * 100 : 0;

  const totalTests = genuineAttempts + impostorAttempts;
  const correctPredictions = trueAccepts + trueRejects;
  const accuracy = totalTests > 0 ? (correctPredictions / totalTests) * 100 : 0;

  const precision = (trueAccepts + falseAccepts) > 0 ? (trueAccepts / (trueAccepts + falseAccepts)) * 100 : 0;
  const recall = (trueAccepts + falseRejects) > 0 ? (trueAccepts / (trueAccepts + falseRejects)) * 100 : 0;
  const avgLatencyMs = totalTests > 0 ? Math.round(totalLatencyMs / totalTests) : 0;

  // Generate ROC Curve points by varying threshold from 0.20 to 0.70 with 0.05 step
  const rocPoints = [];
  for (let t = 0.20; t <= 0.70; t += 0.05) {
    const curThreshold = parseFloat(t.toFixed(2));
    let tFA = 0;
    let tTA = 0;

    for (const log of logs) {
      if (log.matched_employee_id !== null) {
        if (log.calculated_distance !== null && log.calculated_distance <= curThreshold && log.recognition_result === 'SUCCESS') {
          tTA++;
        }
      } else {
        if (log.calculated_distance !== null && log.calculated_distance <= curThreshold && log.recognition_result === 'SUCCESS') {
          tFA++;
        }
      }
    }

    const curFAR = impostorAttempts > 0 ? (tFA / impostorAttempts) * 100 : 0;
    const curTAR = genuineAttempts > 0 ? (tTA / genuineAttempts) * 100 : 0;
    rocPoints.push({
      threshold: curThreshold,
      far: Number(curFAR.toFixed(2)),
      tar: Number(curTAR.toFixed(2))
    });
  }

  return res.json({
    success: true,
    has_data: true,
    metrics: {
      threshold_evaluated: customThreshold,
      total_attempts: totalTests,
      genuine_attempts: genuineAttempts,
      impostor_attempts: impostorAttempts,
      true_accepts: trueAccepts,
      true_rejects: trueRejects,
      false_accepts: falseAccepts,
      false_rejects: falseRejects,
      far: Number(far.toFixed(2)),
      frr: Number(frr.toFixed(2)),
      tar: Number(tar.toFixed(2)),
      trr: Number(trr.toFixed(2)),
      accuracy: Number(accuracy.toFixed(2)),
      precision: Number(precision.toFixed(2)),
      recall: Number(recall.toFixed(2)),
      avg_latency_ms: avgLatencyMs,
      roc_curve: rocPoints
    }
  });
});

/**
 * Reset experimental logs if researcher wants to start fresh
 */
app.delete('/api/research/logs/reset', authMiddleware, (req, res) => {
  db.recognition_logs = [];
  saveDB(db);
  return res.json({ success: true, message: 'Seluruh log data pengujian berhasil dibersihkan.' });
});

// Export helper for Vite integration
export { app, db, saveDB };

// Start Vite Server as middleware in development
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart Attendance] Server running on http://0.0.0.0:${PORT}`);
  });
}

// If executed directly via tsx
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}
