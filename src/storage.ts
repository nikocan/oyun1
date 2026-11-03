// Cihazda kayıt. Tarayıcı depolaması kapalıysa oyun yine çalışır, sadece kayıt tutmaz.
import type { RunState } from './engine';
import type { Lang } from './i18n';
import { reserveIds } from './rules';

const KEY_RUN = 'tasustasi.run.v1';
const KEY_SETTINGS = 'tasustasi.settings.v1';
const KEY_META = 'tasustasi.meta.v1';

export interface Settings {
  lang: Lang;
  fast: boolean;
  vibrate: boolean;
}

export interface Meta {
  runs: number;
  wins: number;
  bestMasa: number;
  seenVersion: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* depolama yok: sessizce geç */
  }
}

export function loadRun(): RunState | null {
  const run = read<RunState>(KEY_RUN);
  if (!run || run.v !== 1) return null;
  const r = run.round;
  if (r) reserveIds(Math.max(0, ...r.hand.map((t) => t.id), ...r.draw.map((t) => t.id)));
  return run;
}

export const saveRun = (run: RunState | null) => write(KEY_RUN, run);

export function loadSettings(): Settings {
  const s = read<Partial<Settings>>(KEY_SETTINGS) ?? {};
  let lang: Lang = 'en';
  try {
    if (navigator.language.toLowerCase().startsWith('tr')) lang = 'tr';
  } catch {
    /* yok */
  }
  return { lang: s.lang ?? lang, fast: s.fast ?? false, vibrate: s.vibrate ?? true };
}

export const saveSettings = (s: Settings) => write(KEY_SETTINGS, s);

export function loadMeta(): Meta {
  return { runs: 0, wins: 0, bestMasa: 0, seenVersion: '', ...(read<Partial<Meta>>(KEY_META) ?? {}) };
}

export const saveMeta = (m: Meta) => write(KEY_META, m);
