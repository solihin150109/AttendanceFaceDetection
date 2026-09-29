/**
 * Liveness Verification Service
 * Basic Liveness Detection using active challenge response:
 * 1. Blink Detection (Eye Aspect Ratio / luminance shift around eye sockets)
 * 2. Head Yaw Rotation (Head Turn Left / Right)
 * 3. Spatial Micro-movement temporal consistency (detects static printed photo / screen attack)
 */

export type LivenessChallenge = 'blink' | 'turn_left' | 'turn_right' | 'smile';

export interface LivenessChallengeConfig {
  type: LivenessChallenge;
  instruction: string;
  durationMs: number;
}

export const LIVENESS_CHALLENGES: LivenessChallengeConfig[] = [
  {
    type: 'blink',
    instruction: 'Silakan KEDIPKAN MATA Anda secara perlahan',
    durationMs: 4000
  },
  {
    type: 'turn_left',
    instruction: 'Silakan TOLEHKAN KEPALA sedikit ke KIRI',
    durationMs: 4000
  },
  {
    type: 'turn_right',
    instruction: 'Silakan TOLEHKAN KEPALA sedikit ke KANAN',
    durationMs: 4000
  }
];

export interface LivenessFrameData {
  timestamp: number;
  faceDetected: boolean;
  box: { x: number; y: number; width: number; height: number };
  yawEstimate: number;
  pitchEstimate: number;
  eyeLuminanceDiff: number;
}

export class LivenessService {
  /**
   * Evaluates if a sequence of frames recorded during a challenge fulfills liveness criteria.
   */
  static evaluateChallenge(
    challenge: LivenessChallenge,
    frameHistory: LivenessFrameData[]
  ): {
    passed: boolean;
    confidence: number;
    reason: string;
  } {
    if (frameHistory.length < 5) {
      return {
        passed: false,
        confidence: 0,
        reason: 'Jumlah frame tidak mencukupi untuk analisis liveness.'
      };
    }

    // 1. Verify face presence across frames (anti-drop)
    const validFrames = frameHistory.filter((f) => f.faceDetected);
    if (validFrames.length / frameHistory.length < 0.8) {
      return {
        passed: false,
        confidence: 0.1,
        reason: 'Wajah hilang dari frame selama proses verifikasi.'
      };
    }

    // 2. Anti-Static Photo Test: Static photo has zero temporal variance in position or eye aspect
    let totalPosDelta = 0;
    for (let i = 1; i < validFrames.length; i++) {
      const prev = validFrames[i - 1];
      const curr = validFrames[i];
      const dx = Math.abs(curr.box.x - prev.box.x);
      const dy = Math.abs(curr.box.y - prev.box.y);
      totalPosDelta += dx + dy;
    }

    // If pos delta is practically 0 over 2-3 seconds, suspect static photograph holder
    if (totalPosDelta < 1.0 && challenge !== 'blink') {
      return {
        passed: false,
        confidence: 0.2,
        reason: 'Tidak ada pergerakan alami terdeteksi (dugaan foto statis).'
      };
    }

    // 3. Challenge-specific evaluation
    if (challenge === 'turn_left') {
      // User must exhibit negative yaw shift relative to initial position
      const initialYaw = validFrames[0].yawEstimate;
      const minYaw = Math.min(...validFrames.map((f) => f.yawEstimate));
      const deltaYaw = initialYaw - minYaw;

      if (deltaYaw >= 6.0) {
        return {
          passed: true,
          confidence: Math.min(0.95, 0.7 + (deltaYaw / 20) * 0.25),
          reason: 'Gerakan toleh kiri terverifikasi.'
        };
      }
      return {
        passed: false,
        confidence: 0.3,
        reason: 'Gerakan toleh kiri tidak terdeteksi secara memadai.'
      };
    }

    if (challenge === 'turn_right') {
      // User must exhibit positive yaw shift relative to initial position
      const initialYaw = validFrames[0].yawEstimate;
      const maxYaw = Math.max(...validFrames.map((f) => f.yawEstimate));
      const deltaYaw = maxYaw - initialYaw;

      if (deltaYaw >= 6.0) {
        return {
          passed: true,
          confidence: Math.min(0.95, 0.7 + (deltaYaw / 20) * 0.25),
          reason: 'Gerakan toleh kanan terverifikasi.'
        };
      }
      return {
        passed: false,
        confidence: 0.3,
        reason: 'Gerakan toleh kanan tidak terdeteksi secara memadai.'
      };
    }

    if (challenge === 'blink') {
      // Blink detection: detect dip in eye luminance / feature variation
      const eyeDiffs = validFrames.map((f) => f.eyeLuminanceDiff);
      const maxDiff = Math.max(...eyeDiffs);
      const minDiff = Math.min(...eyeDiffs);
      const variance = maxDiff - minDiff;

      // When eyelids close, the high contrast iris/sclera boundary vanishes temporarily
      if (variance >= 4.0 || totalPosDelta >= 3.0) {
        return {
          passed: true,
          confidence: 0.85,
          reason: 'Aktivitas kedipan / refleks mata terverifikasi.'
        };
      }
      return {
        passed: false,
        confidence: 0.35,
        reason: 'Kedipan mata tidak terdeteksi secara jelas.'
      };
    }

    return {
      passed: true,
      confidence: 0.8,
      reason: 'Liveness terverifikasi.'
    };
  }
}
