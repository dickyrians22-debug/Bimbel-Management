/**
 * Utility for QR scanner audio feedback and haptic vibration
 * Uses Web Audio API so no external sound files are required.
 */

export function playBeepSound(type: 'success' | 'warning' | 'error' = 'success'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      // Pleasant high double chime: 880Hz -> 1320Hz
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'warning') {
      // Lower double beep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.setValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      // Error low buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Ignore audio policy restrictions if browser blocks without gesture
  }
}

export function triggerHaptic(type: 'success' | 'warning' = 'success'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'success') {
        navigator.vibrate([60, 40, 60]);
      } else {
        navigator.vibrate([150, 80, 150]);
      }
    } catch {
      // Ignore vibration errors
    }
  }
}

export function extractStudentCodeFromQR(decodedText: string): string {
  const trimmed = decodedText.trim();
  if (trimmed.startsWith('SIGMA:STUDENT:')) {
    return trimmed.replace('SIGMA:STUDENT:', '').trim();
  }
  if (trimmed.startsWith('std:')) {
    return trimmed.replace('std:', '').trim();
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.code) return String(parsed.code).trim();
    if (parsed.studentCode) return String(parsed.studentCode).trim();
    if (parsed.id) return String(parsed.id).trim();
  } catch {
    // Not JSON
  }
  return trimmed;
}
