import React, { useRef, useState, useEffect } from 'react';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldAlert, Check } from 'lucide-react';
import { Employee } from '../types';
import { FaceVisionPipeline } from '../services/FaceVisionPipeline';

interface FaceRegistrationModalProps {
  token: string;
  employee: Employee;
  onClose: () => void;
  onRegisteredSuccess: () => void;
}

interface SampleStep {
  label: string;
  instruction: string;
  captured: boolean;
  quality: number;
}

export const FaceRegistrationModal: React.FC<FaceRegistrationModalProps> = ({
  token,
  employee,
  onClose,
  onRegisteredSuccess
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [steps, setSteps] = useState<SampleStep[]>([
    { label: 'frontal_1', instruction: 'Hadap lurus ke kamera dengan pandangan wajar', captured: false, quality: 0 },
    { label: 'frontal_2', instruction: 'Tetap lurus ke kamera, tersenyum sedikit', captured: false, quality: 0 },
    { label: 'slightly_left', instruction: 'Tolehkan wajah sedikit ke kiri (kira-kira 15 derajat)', captured: false, quality: 0 },
    { label: 'slightly_right', instruction: 'Tolehkan wajah sedikit ke kanan (kira-kira 15 derajat)', captured: false, quality: 0 },
    { label: 'slightly_up', instruction: 'Angkat dagu sedikit ke atas', captured: false, quality: 0 },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [detectionStatus, setDetectionStatus] = useState<{
    faceCount: number;
    message: string;
    isGood: boolean;
    confidence: number;
  }>({
    faceCount: 0,
    message: 'Menginisialisasi kamera...',
    isGood: false,
    confidence: 0
  });

  const [isProcessingSample, setIsProcessingSample] = useState(false);
  const [completedAll, setCompletedAll] = useState(false);

  // Initialize webcam stream
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
            ? 'Akses webcam ditolak oleh browser. Mohon izinkan izin kamera.'
            : 'Tidak dapat mengakses perangkat kamera webcam: ' + err.message
        );
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Continuous Face Tracking on Video Frame
  useEffect(() => {
    let animId: number;

    const trackFace = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && canvasRef.current) {
        const result = FaceVisionPipeline.processFrame(videoRef.current, canvasRef.current);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (result.faceCount === 1 && result.faces.length > 0) {
            const face = result.faces[0];
            // Draw face bounding box
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(face.box.x, face.box.y, face.box.width, face.box.height);

            // Draw eye landmarks
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(face.landmarks.leftEye.x, face.landmarks.leftEye.y, 3, 0, 2 * Math.PI);
            ctx.arc(face.landmarks.rightEye.x, face.landmarks.rightEye.y, 3, 0, 2 * Math.PI);
            ctx.fill();

            setDetectionStatus({
              faceCount: 1,
              message: 'Wajah terdeteksi dengan baik. Siap mengambil sampel.',
              isGood: true,
              confidence: face.confidence
            });
          } else if (result.faceCount > 1) {
            setDetectionStatus({
              faceCount: result.faceCount,
              message: 'Terdeteksi lebih dari satu wajah! Pastikan hanya 1 orang.',
              isGood: false,
              confidence: 0
            });
          } else {
            setDetectionStatus({
              faceCount: 0,
              message: result.error || 'Posisikan wajah di dalam bingkai kamera.',
              isGood: false,
              confidence: 0
            });
          }
        }
      }
      animId = requestAnimationFrame(trackFace);
    };

    if (cameraActive) {
      animId = requestAnimationFrame(trackFace);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraActive]);

  // Capture current sample step
  const handleCaptureSample = async () => {
    if (!videoRef.current || !detectionStatus.isGood || isProcessingSample) return;

    setIsProcessingSample(true);

    try {
      const result = FaceVisionPipeline.processFrame(videoRef.current);
      if (result.faceCount !== 1 || result.faces.length === 0) {
        throw new Error('Gagal mendeteksi wajah tunggal saat pengambilan sampel.');
      }

      const face = result.faces[0];
      const currentStep = steps[currentStepIndex];

      const res = await fetch('/api/face/register-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: employee.id,
          face_embedding: face.embedding,
          sample_label: currentStep.label,
          quality_score: face.qualityScore
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan profil biometrik.');
      }

      const updatedSteps = [...steps];
      updatedSteps[currentStepIndex] = {
        ...currentStep,
        captured: true,
        quality: face.qualityScore
      };
      setSteps(updatedSteps);

      if (currentStepIndex + 1 < steps.length) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        setCompletedAll(true);
        onRegisteredSuccess();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengambil sampel.');
    } finally {
      setIsProcessingSample(false);
    }
  };

  const handleResetRegistration = async () => {
    if (!confirm('Hapus seluruh sampel biometrik yang sudah tersimpan untuk karyawan ini?')) return;
    try {
      await fetch(`/api/face/employees/${employee.id}/reset`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSteps(steps.map((s) => ({ ...s, captured: false, quality: 0 })));
      setCurrentStepIndex(0);
      setCompletedAll(false);
      onRegisteredSuccess();
    } catch (err: any) {
      alert('Gagal me-reset sampel biometrik');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Registrasi Biometrik Wajah</h2>
              <p className="text-xs text-slate-400">
                Karyawan: <strong className="text-white">{employee.name}</strong> ({employee.employee_id}) &middot; {employee.department}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto">
          {/* Camera Viewport (7 Cols) */}
          <div className="md:col-span-7 flex flex-col items-center">
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

                  {/* Face oval guide frame */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div
                      className={`w-48 h-64 rounded-[50%] border-2 transition-colors ${
                        detectionStatus.isGood ? 'border-emerald-400/80 bg-emerald-500/5' : 'border-slate-500/40 border-dashed'
                      }`}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Live Camera State Indicator */}
            <div
              className={`w-full mt-3.5 p-3 rounded-lg text-xs border flex items-center gap-2.5 transition-colors ${
                detectionStatus.isGood
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : detectionStatus.faceCount > 1
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {detectionStatus.isGood ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              )}
              <div className="flex-1 font-medium">{detectionStatus.message}</div>
            </div>
          </div>

          {/* Registration Step Sequence (5 Cols) */}
          <div className="md:col-span-5 flex flex-col justify-between border-l border-slate-100 pl-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Prosedur 5 Sudut Pose ({steps.filter((s) => s.captured).length}/{steps.length})
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ambil minimal 5 variasi sudut pose untuk memastikan ketahanan identifikasi pencahayaan dan rotasi.
                </p>
              </div>

              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex && !completedAll;
                  return (
                    <div
                      key={step.label}
                      className={`p-3 text-xs rounded-lg border transition-all ${
                        step.captured
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : isCurrent
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>
                          Sampel {idx + 1}: {step.label}
                        </span>
                        {step.captured ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <Check className="w-3.5 h-3.5" /> Tersimpan
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-mono">Aktif</span>
                        ) : null}
                      </div>
                      <div
                        className={`mt-1 text-[11px] leading-relaxed ${
                          isCurrent ? 'text-slate-300' : step.captured ? 'text-emerald-800' : 'text-slate-500'
                        }`}
                      >
                        {step.instruction}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              {completedAll ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Profil biometrik 5 sampel berhasil dibuat dan siap digunakan untuk absensi.</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleCaptureSample}
                    disabled={!detectionStatus.isGood || isProcessingSample}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    {isProcessingSample ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mengekstrak Vektor 128-D...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Ambil Sampel ({currentStepIndex + 1}/{steps.length})
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <button
                      onClick={handleResetRegistration}
                      type="button"
                      className="text-rose-600 hover:text-rose-700 underline"
                    >
                      Reset Ulang Sampel
                    </button>
                    <span className="font-mono text-[10px]">128-D Invariant Vector</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
