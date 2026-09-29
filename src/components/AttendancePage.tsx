import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  UserX,
  RotateCcw,
  ArrowRight,
  Eye
} from 'lucide-react';
import { FaceVisionPipeline, DetectedFace } from '../services/FaceVisionPipeline';
import {
  LivenessService,
  LivenessChallenge,
  LIVENESS_CHALLENGES,
  LivenessFrameData
} from '../services/LivenessService';

export type AttendanceFlowState =
  | 'READY'
  | 'DETECTING'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'UNKNOWN'
  | 'MULTIPLE_FACE'
  | 'LIVENESS_FAILED';

export interface RecognitionResultPayload {
  success: boolean;
  action?: 'CHECK_IN' | 'CHECK_OUT' | 'ALREADY_COMPLETED';
  message: string;
  data?: {
    employee: {
      id: number;
      employee_id: string;
      name: string;
      department: string;
      position: string;
    };
    attendance: any;
    metrics: {
      distance: number;
      threshold: number;
      processing_time_ms: number;
    };
  };
  distance?: number;
  threshold?: number;
  error_code?: string;
}

interface AttendancePageProps {
  onBackToDashboard: () => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onBackToDashboard }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // System states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Primary Attendance State Machine matching strict user request:
  // READY | DETECTING | VERIFYING | SUCCESS | UNKNOWN | MULTIPLE_FACE | LIVENESS_FAILED
  const [flowState, setFlowState] = useState<AttendanceFlowState>('READY');

  // Liveness challenge
  const [activeChallenge, setActiveChallenge] = useState<LivenessChallenge>('blink');
  const [challengeInstruction, setChallengeInstruction] = useState<string>('');
  const challengeFramesRef = useRef<LivenessFrameData[]>([]);
  const [livenessCountdown, setLivenessCountdown] = useState<number>(3);

  // Vision detection
  const [currentFace, setCurrentFace] = useState<DetectedFace | null>(null);
  const [faceCountInFrame, setFaceCountInFrame] = useState<number>(0);

  // Server Result
  const [serverResult, setServerResult] = useState<RecognitionResultPayload | null>(null);

  // Database info
  const [registeredEmbeddingsCount, setRegisteredEmbeddingsCount] = useState<number>(0);
  const [systemThreshold, setSystemThreshold] = useState<number>(0.45);

  const fetchEnrollmentInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/face/registered-embeddings-count');
      const data = await res.json();
      if (data.success) {
        setRegisteredEmbeddingsCount(data.total_embeddings);
        setSystemThreshold(data.threshold);
      }
    } catch (err) {
      console.error('Error fetching enrollment count:', err);
    }
  }, []);

  useEffect(() => {
    fetchEnrollmentInfo();
  }, [fetchEnrollmentInfo]);

  // Webcam initialization
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraActive(true);
          };
        }
      } catch (err: any) {
        if (!isMounted) return;
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Izin kamera ditolak browser. Mohon izinkan akses webcam.'
            : 'Gagal mendeteksi kamera webcam: ' + err.message
        );
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const result = FaceVisionPipeline.processFrame(video, canvas);

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setFaceCountInFrame(result.faceCount);

          if (result.faceCount === 1 && result.faces.length > 0) {
            const face = result.faces[0];
            setCurrentFace(face);

            // Draw bounding box
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(face.box.x, face.box.y, face.box.width, face.box.height);

            // Draw landmarks
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(face.landmarks.leftEye.x, face.landmarks.leftEye.y, 3, 0, 2 * Math.PI);
            ctx.arc(face.landmarks.rightEye.x, face.landmarks.rightEye.y, 3, 0, 2 * Math.PI);
            ctx.fill();

            // Collect liveness frames if actively verifying
            if (flowState === 'DETECTING') {
              const eyeLum = FaceVisionPipeline.calculateEyeLuminance(video, face.landmarks.leftEye);
              challengeFramesRef.current.push({
                timestamp: Date.now(),
                faceDetected: true,
                box: face.box,
                yawEstimate: face.yawEstimate,
                pitchEstimate: face.pitchEstimate,
                eyeLuminanceDiff: eyeLum
              });
            }
          } else if (result.faceCount > 1) {
            setCurrentFace(null);
            if (flowState === 'DETECTING') {
              setFlowState('MULTIPLE_FACE');
            }
          } else {
            setCurrentFace(null);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    if (cameraActive) {
      animId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraActive, flowState]);

  // Initiate Attendance Flow
  const startAttendance = () => {
    if (!currentFace || faceCountInFrame !== 1) {
      if (faceCountInFrame > 1) {
        setFlowState('MULTIPLE_FACE');
      }
      return;
    }

    if (registeredEmbeddingsCount === 0) {
      alert('Belum ada biometrik karyawan yang terdaftar. Daftarkan sampel wajah melalui menu Registrasi Wajah.');
      return;
    }

    // Pick active liveness challenge
    const challenges: LivenessChallenge[] = ['blink', 'turn_left', 'turn_right'];
    const chosen = challenges[Math.floor(Math.random() * challenges.length)];
    const config = LIVENESS_CHALLENGES.find((c) => c.type === chosen) || LIVENESS_CHALLENGES[0];

    setActiveChallenge(chosen);
    setChallengeInstruction(config.instruction);
    challengeFramesRef.current = [];
    setLivenessCountdown(3);
    setFlowState('DETECTING');

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setLivenessCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        finalizeVerification(chosen);
      }
    }, 1000);
  };

  // Finalize liveness and send vector to backend
  const finalizeVerification = async (challenge: LivenessChallenge) => {
    setFlowState('VERIFYING');

    // 1. Evaluate liveness
    const livenessResult = LivenessService.evaluateChallenge(challenge, challengeFramesRef.current);
    if (!livenessResult.passed) {
      setFlowState('LIVENESS_FAILED');
      return;
    }

    if (!videoRef.current) return;

    // 2. Extract final vector
    const frameResult = FaceVisionPipeline.processFrame(videoRef.current);
    if (frameResult.faceCount !== 1 || frameResult.faces.length === 0) {
      if (frameResult.faceCount > 1) {
        setFlowState('MULTIPLE_FACE');
      } else {
        setFlowState('LIVENESS_FAILED');
      }
      return;
    }

    const faceEmbedding = frameResult.faces[0].embedding;

    try {
      const res = await fetch('/api/attendance/recognize-and-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          face_embedding: faceEmbedding,
          liveness_passed: true,
          liveness_score: livenessResult.confidence
        })
      });

      const data: RecognitionResultPayload = await res.json();
      setServerResult(data);

      if (data.success && data.data) {
        setFlowState('SUCCESS');
      } else if (data.error_code === 'UNKNOWN_FACE' || data.distance! > data.threshold!) {
        setFlowState('UNKNOWN');
      } else if (data.error_code === 'MULTIPLE_FACES_REJECTED') {
        setFlowState('MULTIPLE_FACE');
      } else {
        setFlowState('LIVENESS_FAILED');
      }
    } catch (err) {
      setFlowState('UNKNOWN');
    }
  };

  const handleResetKiosk = () => {
    setFlowState('READY');
    setServerResult(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Absensi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifikasi identitas Anda menggunakan Face Recognition.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
            <span className="text-slate-400">Ambang Batas (τ): </span>
            <strong className="text-slate-900 font-bold">{systemThreshold.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Main Kiosk Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Camera Primary Content (7 Cols) */}
        <div className="md:col-span-7 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs flex flex-col items-center">
          <div className="relative w-full aspect-4/3 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
                <span>{cameraError}</span>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Target oval guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-52 h-72 rounded-[50%] border-2 transition-all duration-200 ${
                      flowState === 'DETECTING'
                        ? 'border-amber-400/90 bg-amber-500/10'
                        : currentFace && faceCountInFrame === 1
                        ? 'border-emerald-400/80 bg-emerald-500/5'
                        : 'border-slate-500/40 border-dashed'
                    }`}
                  />
                </div>

                {/* Challenge instruction banner */}
                {flowState === 'DETECTING' && (
                  <div className="absolute inset-x-0 bottom-4 mx-4 bg-slate-900/90 border border-amber-400/80 p-3 rounded-xl text-center text-white backdrop-blur-md shadow-lg animate-pulse">
                    <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                      Uji Keaslian Subjek ({livenessCountdown}s)
                    </div>
                    <div className="text-sm font-bold mt-0.5 text-white">{challengeInstruction}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status Message Strip */}
          <div
            className={`w-full mt-4 p-3.5 rounded-xl text-xs border flex items-center gap-3 transition-colors ${
              flowState === 'MULTIPLE_FACE'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : flowState === 'SUCCESS'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : currentFace
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {flowState === 'MULTIPLE_FACE' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : flowState === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : currentFace ? (
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <Camera className="w-4 h-4 shrink-0 text-slate-400" />
            )}

            <div className="font-semibold">
              {flowState === 'READY' &&
                (currentFace
                  ? 'Wajah terdeteksi. Silakan tekan tombol Mulai Absensi.'
                  : 'Silakan posisikan wajah di dalam frame.')}
              {flowState === 'DETECTING' && 'Mendeteksi wajah dan keaslian subjek...'}
              {flowState === 'VERIFYING' && 'Memverifikasi identitas biometrik pada basis data...'}
              {flowState === 'SUCCESS' && 'Identitas berhasil diverifikasi.'}
              {flowState === 'UNKNOWN' && 'Wajah tidak dikenali.'}
              {flowState === 'MULTIPLE_FACE' && 'Lebih dari satu wajah terdeteksi.'}
              {flowState === 'LIVENESS_FAILED' && 'Verifikasi gagal. Silakan ulangi.'}
            </div>
          </div>
        </div>

        {/* Verification Status & Details Panel (5 Cols) */}
        <div className="md:col-span-5 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Status Verifikasi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfirmasi transaksi kehadiran resmi pegawai
              </p>
            </div>

            {/* STATE 1: READY */}
            {flowState === 'READY' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-slate-900">Petunjuk Verifikasi:</div>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed">
                    <li>Posisikan wajah tegak tepat di tengah lingkaran oval.</li>
                    <li>Pastikan hanya 1 orang berada di depan kamera.</li>
                    <li>Ikuti tantangan refleks alami (kedip/gerakan kepala).</li>
                  </ul>
                </div>

                <button
                  onClick={startAttendance}
                  disabled={!currentFace || faceCountInFrame !== 1}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Mulai Absensi</span>
                </button>
              </div>
            )}

            {/* STATE 2: DETECTING (Liveness) */}
            {flowState === 'DETECTING' && (
              <div className="space-y-4 text-center py-6">
                <div className="w-14 h-14 mx-auto bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 flex items-center justify-center">
                  <Eye className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Mendeteksi Wajah...
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{challengeInstruction}</div>
                  <div className="text-3xl font-mono font-bold text-amber-600 mt-2">
                    {livenessCountdown}s
                  </div>
                </div>
              </div>
            )}

            {/* STATE 3: VERIFYING */}
            {flowState === 'VERIFYING' && (
              <div className="space-y-4 text-center py-10">
                <RefreshCw className="w-8 h-8 mx-auto text-slate-900 animate-spin" />
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Memverifikasi Identitas...
                </div>
                <div className="text-xs text-slate-500">Mencocokkan representasi biometrik 128-D</div>
              </div>
            )}

            {/* STATE 4: SUCCESS */}
            {flowState === 'SUCCESS' && serverResult?.data && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="border border-emerald-200 bg-emerald-50/70 p-5 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>
                      {serverResult.action === 'CHECK_OUT'
                        ? 'Presensi Pulang Berhasil'
                        : serverResult.action === 'CHECK_IN'
                        ? 'Presensi Masuk Berhasil'
                        : 'Absensi Berhasil'}
                    </span>
                  </div>

                  <div className="border-t border-emerald-200/80 pt-3 space-y-1">
                    <div className="text-slate-500 text-[11px] font-medium">Nama Pegawai:</div>
                    <div className="font-bold text-slate-900 text-base">
                      {serverResult.data.employee.name}
                    </div>
                    <div className="font-mono text-slate-600 text-xs">
                      {serverResult.data.employee.employee_id} &middot; {serverResult.data.employee.department}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Waktu Check-in:</span>
                      <strong className="font-mono text-emerald-700 text-sm">
                        {serverResult.data.attendance?.check_in || '-'}
                      </strong>
                    </div>

                    {serverResult.data.attendance?.check_out && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Waktu Check-out:</span>
                        <strong className="font-mono text-slate-900 text-sm">
                          {serverResult.data.attendance.check_out}
                        </strong>
                      </div>
                    )}

                    <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                      <span className="text-slate-500 font-medium">Status Kehadiran:</span>
                      <span
                        className={`font-bold ${
                          serverResult.data.attendance?.status === 'PRESENT'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {serverResult.data.attendance?.status === 'PRESENT' ? 'Hadir' : 'Terlambat'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={onBackToDashboard}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Kembali ke Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleResetKiosk}
                    className="w-full py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    Presensi Pegawai Berikutnya
                  </button>
                </div>
              </div>
            )}

            {/* STATE 5: UNKNOWN */}
            {flowState === 'UNKNOWN' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border border-amber-200 bg-amber-50/70 p-5 rounded-2xl space-y-2.5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-amber-900 text-sm">Wajah Tidak Dikenali</div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Pastikan Anda sudah terdaftar dalam sistem.
                  </p>
                </div>

                <button
                  onClick={handleResetKiosk}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>
              </div>
            )}

            {/* STATE 6: MULTIPLE FACE */}
            {flowState === 'MULTIPLE_FACE' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border border-rose-200 bg-rose-50/70 p-5 rounded-2xl space-y-2.5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-rose-900 text-sm">
                    Lebih dari satu wajah terdeteksi.
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Pastikan hanya satu orang berada di depan kamera.
                  </p>
                </div>

                <button
                  onClick={handleResetKiosk}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>
              </div>
            )}

            {/* STATE 7: LIVENESS FAILED */}
            {flowState === 'LIVENESS_FAILED' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border border-rose-200 bg-rose-50/70 p-5 rounded-2xl space-y-2.5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-rose-900 text-sm">Verifikasi Gagal</div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Gerakan wajah tidak sesuai tantangan keaslian. Silakan ulangi.
                  </p>
                </div>

                <button
                  onClick={handleResetKiosk}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center font-mono">
            Open-Set L2 Invariant Biometric Pipeline
          </div>
        </div>
      </div>
    </div>
  );
};
