import { PetSpecies } from '../types';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration = 0.11,
  type: OscillatorType = 'sine',
  gainVal = 0.08,
  delay = 0
) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export const soundFX = {
  pop(enabled: boolean) {
    if (!enabled) return;
    playTone(520, 0.08, 'sine', 0.08, 0);
    playTone(720, 0.09, 'sine', 0.06, 0.04);
  },
  heart(enabled: boolean) {
    if (!enabled) return;
    playTone(587, 0.1, 'triangle', 0.08, 0);
    playTone(784, 0.12, 'triangle', 0.08, 0.07);
  },
  petVoice(enabled: boolean, species: PetSpecies) {
    if (!enabled) return;
    if (species === 'rabbit') {
      // Soft cute high chirp-chirp
      playTone(780, 0.07, 'sine', 0.07, 0);
      playTone(980, 0.09, 'sine', 0.07, 0.07);
      playTone(1080, 0.08, 'sine', 0.06, 0.15);
      return;
    }
    if (species === 'dog') {
      // Cheerful bouncy woof-woof
      playTone(340, 0.08, 'triangle', 0.09, 0);
      playTone(470, 0.09, 'triangle', 0.08, 0.06);
      playTone(390, 0.08, 'triangle', 0.09, 0.17);
      playTone(530, 0.11, 'triangle', 0.08, 0.23);
      return;
    }
    // Piggy playful oink-oink
    playTone(230, 0.09, 'triangle', 0.09, 0);
    playTone(310, 0.09, 'triangle', 0.08, 0.05);
    playTone(250, 0.09, 'triangle', 0.08, 0.16);
    playTone(340, 0.1, 'triangle', 0.08, 0.21);
  },
  chew(enabled: boolean) {
    if (!enabled) return;
    playTone(360, 0.08, 'triangle', 0.08, 0);
    playTone(440, 0.08, 'triangle', 0.08, 0.11);
    playTone(520, 0.1, 'triangle', 0.07, 0.22);
  },
  miss(enabled: boolean) {
    if (!enabled) return;
    playTone(240, 0.11, 'sawtooth', 0.05, 0);
    playTone(170, 0.14, 'sawtooth', 0.05, 0.09);
  },
  bubble(enabled: boolean) {
    if (!enabled) return;
    playTone(460, 0.07, 'sine', 0.06, 0);
    playTone(620, 0.08, 'sine', 0.06, 0.08);
    playTone(860, 0.1, 'sine', 0.06, 0.16);
  },
  levelUp(enabled: boolean) {
    if (!enabled) return;
    playTone(523.25, 0.12, 'triangle', 0.09, 0);
    playTone(659.25, 0.12, 'triangle', 0.09, 0.11);
    playTone(783.99, 0.14, 'triangle', 0.09, 0.22);
    playTone(1046.5, 0.25, 'triangle', 0.1, 0.34);
  },
  hatch(enabled: boolean) {
    if (!enabled) return;
    playTone(440, 0.1, 'sine', 0.08, 0);
    playTone(554, 0.1, 'sine', 0.08, 0.1);
    playTone(659, 0.12, 'sine', 0.08, 0.2);
    playTone(880, 0.24, 'triangle', 0.09, 0.32);
  },
  scrub(enabled: boolean) {
    if (!enabled) return;
    playTone(340, 0.05, 'sine', 0.05, 0);
    playTone(460, 0.06, 'sine', 0.04, 0.03);
  },
  splash(enabled: boolean) {
    if (!enabled) return;
    playTone(580, 0.06, 'triangle', 0.06, 0);
    playTone(760, 0.07, 'sine', 0.05, 0.04);
    playTone(920, 0.08, 'sine', 0.04, 0.08);
  },
  rhythmBeat(enabled: boolean, pitchStep = 0) {
    if (!enabled) return;
    const scale = [392.0, 440.0, 493.88, 523.25, 587.33, 659.25];
    const freq = scale[Math.abs(pitchStep) % scale.length];
    playTone(freq, 0.09, 'sine', 0.045, 0);
  },
  rhythmPerfect(enabled: boolean) {
    if (!enabled) return;
    playTone(659.25, 0.08, 'triangle', 0.08, 0);
    playTone(880.0, 0.12, 'triangle', 0.08, 0.05);
  },
  rhythmGood(enabled: boolean) {
    if (!enabled) return;
    playTone(523.25, 0.09, 'sine', 0.07, 0);
    playTone(659.25, 0.09, 'sine', 0.06, 0.05);
  },
  dash(enabled: boolean) {
    if (!enabled) return;
    playTone(480, 0.06, 'triangle', 0.07, 0);
    playTone(760, 0.08, 'triangle', 0.07, 0.03);
  },
  combo(enabled: boolean, streak: number) {
    if (!enabled) return;
    const base = 523.25 + Math.min(6, Math.max(0, streak - 1)) * 55;
    playTone(base, 0.08, 'triangle', 0.075, 0);
    playTone(base * 1.25, 0.11, 'triangle', 0.08, 0.05);
  },
};

export function triggerHaptic(durationMs = 15): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
  } catch {
    // Gracefully ignore on unsupported mobile browsers
  }
}
