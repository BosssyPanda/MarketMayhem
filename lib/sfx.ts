// Tiny synthesized sound effects (no asset files) for farm actions. Built on
// the Web Audio API so they're cheap, mute-aware, and gesture-safe: the context
// is primed on the Run click, then harvest/plant/complete fire in sync with the
// animated frames. Persisted mute lives in localStorage.

const MUTE_KEY = "fwr_sfx_muted";

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let muted = loadMuted();

function loadMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Create + resume the AudioContext within a user gesture (the Run click). */
export function primeSfx(): void {
  if (muted) return;
  audio();
}

export function isSfxMuted(): boolean {
  return muted;
}

export function setSfxMuted(value: boolean): void {
  muted = value;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }
}

interface ToneOpts {
  freq: number;
  type?: OscillatorType;
  dur?: number;
  gain?: number;
  slideTo?: number;
  delay?: number;
}

function tone(c: AudioContext, { freq, type = "sine", dur = 0.15, gain = 0.2, slideTo, delay = 0 }: ToneOpts): void {
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noiseBurst(c: AudioContext, { dur = 0.12, gain = 0.14, freq = 1900, q = 0.8 }: { dur?: number; gain?: number; freq?: number; q?: number }): void {
  const t0 = c.currentTime;
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n); // decaying noise
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/** A quick "snip" of cut stalks. */
export function sfxHarvest(): void {
  if (muted) return;
  const c = audio();
  if (!c) return;
  noiseBurst(c, { dur: 0.1, gain: 0.12, freq: 2100, q: 0.9 });
  tone(c, { freq: 520, slideTo: 240, type: "triangle", dur: 0.1, gain: 0.13 });
}

/** A soft "plop" as a seed goes in. */
export function sfxPlant(): void {
  if (muted) return;
  const c = audio();
  if (!c) return;
  tone(c, { freq: 300, slideTo: 150, type: "sine", dur: 0.12, gain: 0.16 });
}

/** A small rising chime when an objective is complete. */
export function sfxComplete(): void {
  if (muted) return;
  const c = audio();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
  notes.forEach((freq, i) => tone(c, { freq, type: "triangle", dur: 0.22, gain: 0.16, delay: i * 0.09 }));
}
