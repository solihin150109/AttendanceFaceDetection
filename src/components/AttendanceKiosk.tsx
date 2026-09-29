import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Eye,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { FaceVisionPipeline, DetectedFace } from '../services/FaceVisionPipeline';
import {
  LivenessService,
  LivenessChallenge,
  LIVENESS_CHALLENGES,
  LivenessFrameData
} from '../services/LivenessService';

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

export const AttendanceKiosk: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // System states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Kiosk Flow State: 'IDLE' | 'LIVENESS_CHALLENGE' | 'VERIFYING_SERVER' | 'RESULT'
  const [flowState, setFlowState] = useState<'IDLE' | 'LIVENESS_CHALLENGE' | 'VERIFYING_SERVER' | 'RESULT'>('IDLE');

  // Liveness verification
  const [activeChallenge, setActiveChallenge] = useState<LivenessChallenge>('blink');
  const [challengeInstruction, setChallengeInstruction] = useState<string>('');
  const challengeFramesRef = useRef<LivenessFrameData[]>([]);
  const [livenessCountdown, setLivenessCountdown] = useState<number>(3);

  // Current frame recognition telemetry
  const [currentFace, setCurrentFace] = useState<DetectedFace | null>(null);
  const [faceCountInFrame, setFaceCountInFrame] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Posisikan wajah Anda tegak lurus di dalam bingkai oval');

  // Final Server Result
  const [serverResult, setServerResult] = useState<RecognitionResultPayload | null>(null);

  // Database count of registered embeddings
  const [registeredEmbeddingsCount, setRegisteredEmbeddingsCount] = useState<number>(0);
  const [systemThreshold, setSystemThreshold] = useState<number>(0.45);

  // Fetch count of enrolled profiles
  const fetchEnrollmentInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/face/registered-embeddings-count');
      const data = await res.json();
      if (data.success) {
        setRegisteredEmbeddingsCount(data.total_embeddings);
        setSystemThreshold(data.threshold);
      }
    } catch (err) {
      console.error('Error fetching enrollment info:', err);
    }
  }, []);

  useEffect(() => {
    fetchEnrollmentInfo();
  }, [fetchEnrollmentInfo]);

  // Camera initialization
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
          stream.getTracks().forEach(t => t.stop());
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
            ? 'Izin kamera ditolak. Mohon aktifkan izin kamera pada browser.'
            : 'Gagal mendeteksi kamera webcam: ' + err.message
        );
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Main Computer Vision Animation Loop
  useEffect(() => {
    let animId: number;

    const processLoop = () => {
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

            // Bounding box visualization
            ctx.strokeStyle = '#10b981'; // emerald-500
            ctx.lineWidth = 2.5;
            ctx.strokeRect(face.box.x, face.box.y, face.box.width, face.box.height);

            // Subtle corner accents
            const cornerSize = 14;
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 3.5;
            // Top Left
            ctx.beginPath();
            ctx.moveTo(face.box.x, face.box.y + cornerSize);
            ctx.lineTo(face.box.x, face.box.y);
            ctx.lineTo(face.box.x + cornerSize, face.box.y);
            ctx.stroke();

            // Top Right
            ctx.beginPath();
            ctx.moveTo(face.box.x + face.box.width - cornerSize, face.box.y);
            ctx.lineTo(face.box.x + face.box.width, face.box.y);
            ctx.lineTo(face.box.x + face.box.width, face.box.y + cornerSize);
            ctx.stroke();

            // Landmarks
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(face.landmarks.leftEye.x, face.landmarks.leftEye.y, 3, 0, 2 * Math.PI);
            ctx.arc(face.landmarks.rightEye.x, face.landmarks.rightEye.y, 3, 0, 2 * Math.PI);
            ctx.fill();

            // Collect liveness telemetry frames if in LIVENESS_CHALLENGE state
            if (flowState === 'LIVENESS_CHALLENGE') {
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

            if (flowState === 'IDLE') {
              setFeedbackMessage('Posisi wajah optimal. Siap untuk proses verifikasi presensi.');
            }
          } else if (result.faceCount > 1) {
            setCurrentFace(null);
            setFeedbackMessage('Peringatan: Terdeteksi lebih dari satu wajah. Harap pastikan hanya 1 orang.');
          } else {
            setCurrentFace(null);
            if (flowState === 'IDLE') {
              setFeedbackMessage('Posisikan wajah Anda tepat di dalam bingkai panduan.');
            }
          }
        }
      }

      animId = requestAnimationFrame(processLoop);
    };

    if (cameraActive) {
      animId = requestAnimationFrame(processLoop);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraActive, flowState]);

  // Initiate Attendance & Liveness Verification
  const startAttendanceProcess = () => {
    if (!currentFace || faceCountInFrame !== 1) {
      alert('Posisikan wajah Anda di depan kamera terlebih dahulu.');
      return;
    }

    if (registeredEmbeddingsCount === 0) {
      alert('Belum ada data biometrik karyawan yang terdaftar. Hubungi Admin untuk registrasi wajah terlebih dahulu.');
      return;
    }

    // Pick a challenge (Blink or Turn Left/Right)
    const challenges: LivenessChallenge[] = ['blink', 'turn_left', 'turn_right'];
    const chosen = challenges[Math.floor(Math.random() * challenges.length)];
    const config = LIVENESS_CHALLENGES.find(c => c.type === chosen) || LIVENESS_CHALLENGES[0];

    setActiveChallenge(chosen);
    setChallengeInstruction(config.instruction);
    challengeFramesRef.current = [];
    setLivenessCountdown(3);
    setFlowState('LIVENESS_CHALLENGE');

    // Start 3 second countdown for active challenge
    let countdown = 3;
    const interval = setInterval(() => {
      countdown -= 1;
      setLivenessCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(interval);
        finalizeLivenessAndVerify(chosen);
      }
    }, 1000);
  };

  // Finalize liveness evaluation and dispatch to server
  const finalizeLivenessAndVerify = async (challenge: LivenessChallenge) => {
    setFlowState('VERIFYING_SERVER');
    setFeedbackMessage('Menganalisis biometrik dan mencocokkan identitas pada server...');

    const livenessResult = LivenessService.evaluateChallenge(challenge, challengeFramesRef.current);

    if (!livenessResult.passed) {
      setServerResult({
        success: false,
        error_code: 'LIVENESS_FAILED',
        message: `Verifikasi Liveness Gagal: ${livenessResult.reason}`
      });
      setFlowState('RESULT');
      return;
    }

    if (!videoRef.current) return;

    // Extract current fresh embedding
    const frameAnalysis = FaceVisionPipeline.processFrame(videoRef.current);
    if (frameAnalysis.faceCount !== 1 || frameAnalysis.faces.length === 0) {
      setServerResult({
        success: false,
        error_code: 'FACE_LOST',
        message: 'Wajah tidak terdeteksi pada frame akhir verifikasi.'
      });
      setFlowState('RESULT');
      return;
    }

    const faceEmbedding = frameAnalysis.faces[0].embedding;

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
    } catch (err: any) {
      setServerResult({
        success: false,
        error_code: 'NETWORK_ERROR',
        message: 'Gagal terhubung dengan server pengenal wajah: ' + err.message
      });
    } finally {
      setFlowState('RESULT');
    }
  };

  const handleResetKiosk = () => {
    setFlowState('IDLE');
    setServerResult(null);
    setFeedbackMessage('Posisikan wajah Anda tegak lurus di dalam bingkai oval');
    fetchEnrollmentInfo();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Kiosk Presensi Wajah Mandiri</h1>
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              One Person = One Identity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verifikasi biometrik mandiri satu arah dengan pencocokan vektor 128-D dan proteksi anti-spoofing.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg">
            <span className="text-slate-500">Profil Terdaftar: </span>
            <strong className="text-slate-900 text-sm">{registeredEmbeddingsCount}</strong>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg">
            <span className="text-slate-500">Ambang Batas (τ): </span>
            <strong className="text-slate-900 text-sm">{systemThreshold.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Main Kiosk Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Camera Viewport (7 Cols) */}
        <div className="md:col-span-7 bg-white border border-slate-200/80 p-5 rounded-xl shadow-xs flex flex-col items-center">
          <div className="relative w-full aspect-4/3 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
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

                {/* Target oval visual guide with smooth transitions */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-52 h-72 rounded-[50%] border-2 transition-all duration-300 ${
                      flowState === 'LIVENESS_CHALLENGE'
                        ? 'border-amber-400/90 bg-amber-500/10 scale-105'
                        : currentFace && faceCountInFrame === 1
                        ? 'border-emerald-400/80 bg-emerald-500/5'
                        : 'border-slate-500/40 border-dashed'
                    }`}
                  />
                </div>

                {/* Challenge instruction overlay banner */}
                {flowState === 'LIVENESS_CHALLENGE' && (
                  <div className="absolute inset-x-0 bottom-4 mx-4 bg-slate-900/95 border border-amber-400/80 p-3.5 rounded-lg text-center text-white backdrop-blur-md shadow-lg animate-pulse">
                    <div className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold">
                      Uji Liveness Keaslian Wajah ({livenessCountdown}s)
                    </div>
                    <div className="text-sm font-bold mt-1 text-white">{challengeInstruction}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Real-time Status Message Bar */}
          <div
            className={`w-full mt-4 p-3.5 text-xs rounded-lg border flex items-center gap-2.5 transition-colors ${
              faceCountInFrame > 1
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : currentFace
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {faceCountInFrame > 1 ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : currentFace ? (
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <Camera className="w-4 h-4 shrink-0 text-slate-400" />
            )}
            <div className="flex-1 font-medium">{feedbackMessage}</div>
          </div>
        </div>

        {/* Action Panel & Identification Output (5 Cols) */}
        <div className="md:col-span-5 bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Verifikasi Presensi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Sistem memvalidasi identitas murni dari fitur wajah</p>
            </div>

            {/* FLOW STATE: IDLE */}
            {flowState === 'IDLE' && (
              <div className="space-y-5">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600 space-y-2.5">
                  <div className="font-semibold text-slate-800">Petunjuk Prosedur:</div>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed">
                    <li>Posisikan wajah tepat di tengah bingkai oval kamera.</li>
                    <li>Pastikan hanya 1 orang berada di dalam sudut pandang lensa.</li>
                    <li>Sistem akan meminta satu kali refleks alami (kedip/toleh) untuk memastikan keaslian.</li>
                  </ul>
                </div>

                <button
                  onClick={startAttendanceProcess}
                  disabled={!currentFace || faceCountInFrame !== 1}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 group"
                >
                  <Camera className="w-4 h-4 group-hover:scale-105 transition-transform" />
                  Mulai Verifikasi Presensi
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

            {/* FLOW STATE: LIVENESS */}
            {flowState === 'LIVENESS_CHALLENGE' && (
              <div className="space-y-4 text-center py-6">
                <div className="w-14 h-14 mx-auto bg-amber-50 text-amber-600 rounded-xl border border-amber-200 flex items-center justify-center">
                  <Eye className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Uji Keaslian Subjek Hidup
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{challengeInstruction}</div>
                  <div className="text-3xl font-mono font-bold text-amber-600 mt-3">{livenessCountdown}s</div>
                </div>
              </div>
            )}

            {/* FLOW STATE: VERIFYING_SERVER */}
            {flowState === 'VERIFYING_SERVER' && (
              <div className="space-y-4 text-center py-10">
                <RefreshCw className="w-8 h-8 mx-auto text-slate-900 animate-spin" />
                <div className="text-xs font-semibold text-slate-800">Mencocokkan Biometrik ke Basis Data...</div>
                <div className="text-[11px] text-slate-500">Menghitung jarak Euclidean vektor 128-D</div>
              </div>
            )}

            {/* FLOW STATE: RESULT */}
            {flowState === 'RESULT' && serverResult && (
              <div className="space-y-4">
                {serverResult.success && serverResult.data ? (
                  <div className="border border-emerald-200 bg-emerald-50/70 p-5 rounded-lg space-y-3.5">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Identitas Terverifikasi
                    </div>

                    <div className="border-t border-emerald-200/80 pt-3 space-y-1 text-xs">
                      <div className="text-slate-500 text-[11px]">Nama Karyawan:</div>
                      <div className="font-bold text-slate-900 text-base">{serverResult.data.employee.name}</div>
                      <div className="font-mono text-slate-600 text-xs">
                        ID: {serverResult.data.employee.employee_id} &middot; {serverResult.data.employee.department}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-md border border-emerald-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tipe Transaksi:</span>
                        <strong className="text-slate-900 font-mono">{serverResult.action}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Waktu Masuk:</span>
                        <strong className="text-slate-900 font-mono">
                          {serverResult.data.attendance?.check_in || '-'}
                        </strong>
                      </div>
                      {serverResult.data.attendance?.check_out && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Waktu Pulang:</span>
                          <strong className="text-slate-900 font-mono">
                            {serverResult.data.attendance.check_out}
                          </strong>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status Kehadiran:</span>
                        <span
                          className={`font-semibold ${
                            serverResult.data.attendance?.status === 'PRESENT' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {serverResult.data.attendance?.status === 'PRESENT' ? 'TEPAT WAKTU' : 'TERLAMBAT'}
                        </span>
                      </div>
                    </div>

                    {/* Biometric Telemetry */}
                    <div className="text-[10px] text-slate-500 font-mono bg-white/80 p-2.5 rounded-md border border-emerald-100">
                      <div>Jarak Euclidean (d): {serverResult.data.metrics.distance} (Threshold: &le; {serverResult.data.metrics.threshold})</div>
                      <div>Waktu Komputasi: {serverResult.data.metrics.processing_time_ms} ms</div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-rose-200 bg-rose-50/70 p-5 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs uppercase tracking-wider">
                      <UserX className="w-4 h-4 text-rose-600" />
                      Presensi Ditolak
                    </div>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">{serverResult.message}</p>
                    {serverResult.distance !== undefined && (
                      <div className="text-[11px] font-mono text-rose-800 bg-white p-2.5 rounded-md border border-rose-200">
                        Jarak Terdekat: {serverResult.distance} &gt; {serverResult.threshold} (Melebihi Ambang Batas)
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleResetKiosk}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Presensi Karyawan Berikutnya
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Open-Set Biometric Verification Engine &middot; L2 Invariant Norm
          </div>
        </div>
      </div>
    </div>
  );
};
