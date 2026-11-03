// Ses efektleri: dosya yok, hepsi Web Audio ile anında üretiliyor (paket küçük kalır).
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, delay = 0) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

/** Taşa dokunma: kısa, tok bir ahşap “tık”. */
export function sClick() {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * 0.04);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1800;
  f.Q.value = 3;
  const g = a.createGain();
  g.gain.value = 0.5;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

/** Puan sayımı: her adımda biraz daha tiz. */
export function sTick(step: number, kind: 'chips' | 'mult' | 'xmult' | 'gold' | 'ban') {
  if (kind === 'ban') return tone(140, 0.12, 'square', 0.06);
  const base = kind === 'chips' ? 440 : kind === 'gold' ? 1320 : 560;
  tone(base * Math.pow(1.06, Math.min(step, 20)), 0.09, kind === 'xmult' ? 'sawtooth' : 'triangle', kind === 'xmult' ? 0.07 : 0.12);
}

export function sCoin() {
  tone(1320, 0.08, 'triangle', 0.1);
  tone(1760, 0.14, 'triangle', 0.1, 0.07);
}

export function sWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.13, i * 0.09));
}

export function sLose() {
  [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'sine', 0.13, i * 0.14));
}

export function sTotal() {
  tone(784, 0.18, 'triangle', 0.12);
  tone(1175, 0.24, 'triangle', 0.1, 0.06);
}
