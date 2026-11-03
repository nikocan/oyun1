// Taş Ustası — saf oyun kuralları (arayüzden bağımsız, test edilebilir).

export type Color = 0 | 1 | 2 | 3; // 0 kırmızı, 1 sarı, 2 mavi, 3 siyah
export const COLORS: Color[] = [0, 1, 2, 3];

export interface Tile {
  id: number;
  color: Color;
  num: number; // 1..13
  wild: boolean; // okey taşı: her taşın yerine geçer
}

/** Okey taşının çözümlenmiş hâli: hangi sayı/renk yerine geçtiği. */
export interface Resolved {
  tile: Tile;
  num: number;
  color: Color;
}

export type HandType = 'tek' | 'cift' | 'ikiCift' | 'seri3' | 'per3' | 'seri4' | 'per4' | 'seri5';

/** Güçlüden zayıfa. */
export const HAND_ORDER: HandType[] = ['seri5', 'per4', 'seri4', 'per3', 'seri3', 'ikiCift', 'cift', 'tek'];

export const HAND_BASE: Record<HandType, { chips: number; mult: number; lvChips: number; lvMult: number }> = {
  tek: { chips: 5, mult: 1, lvChips: 10, lvMult: 1 },
  cift: { chips: 10, mult: 2, lvChips: 15, lvMult: 1 },
  ikiCift: { chips: 20, mult: 2, lvChips: 20, lvMult: 1 },
  seri3: { chips: 30, mult: 3, lvChips: 20, lvMult: 2 },
  per3: { chips: 35, mult: 3, lvChips: 20, lvMult: 2 },
  seri4: { chips: 50, mult: 4, lvChips: 25, lvMult: 2 },
  per4: { chips: 70, mult: 5, lvChips: 30, lvMult: 3 },
  seri5: { chips: 90, mult: 6, lvChips: 35, lvMult: 3 },
};

export function handValue(type: HandType, level: number) {
  const b = HAND_BASE[type];
  return { chips: b.chips + (level - 1) * b.lvChips, mult: b.mult + (level - 1) * b.lvMult };
}

export const MAX_SELECT = 5;

let nextId = 1;
/** Kayıttan yüklenen taşlarla id çakışmasın diye. */
export function reserveIds(maxUsed: number) {
  if (nextId <= maxUsed) nextId = maxUsed + 1;
}
export function makeTile(color: Color, num: number, wild = false): Tile {
  return { id: nextId++, color, num, wild };
}

/** Okey torbası: 4 renk × 13 sayı × 2 kopya + okey taşları. */
export function makeBag(wilds: number): Tile[] {
  const bag: Tile[] = [];
  for (let copy = 0; copy < 2; copy++)
    for (const c of COLORS) for (let n = 1; n <= 13; n++) bag.push(makeTile(c, n));
  for (let i = 0; i < wilds; i++) bag.push(makeTile(0, 13, true));
  return bag;
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------- el tanıma

function pairOf(a: Tile, b: Tile): Resolved[] | null {
  if (a.wild && b.wild) return [{ tile: a, num: 13, color: 0 }, { tile: b, num: 13, color: 1 }];
  if (a.wild) return [{ tile: a, num: b.num, color: b.color }, { tile: b, num: b.num, color: b.color }];
  if (b.wild) return [{ tile: a, num: a.num, color: a.color }, { tile: b, num: a.num, color: a.color }];
  if (a.num === b.num) return [{ tile: a, num: a.num, color: a.color }, { tile: b, num: b.num, color: b.color }];
  return null;
}

/** Per: aynı sayı, hepsi farklı renk (3 veya 4 taş). */
function asGroup(ts: Tile[]): Resolved[] | null {
  if (ts.length < 3 || ts.length > 4) return null;
  const nat = ts.filter((t) => !t.wild);
  const num = nat.length ? nat[0].num : 13;
  if (nat.some((t) => t.num !== num)) return null;
  const used = new Set(nat.map((t) => t.color));
  if (used.size !== nat.length) return null;
  const free = COLORS.filter((c) => !used.has(c));
  let fi = 0;
  return ts.map((t) => (t.wild ? { tile: t, num, color: free[fi++] } : { tile: t, num: t.num, color: t.color }));
}

/** Seri: aynı renk, ardışık sayılar (3+ taş). Okey taşları boşlukları doldurur, sonra yukarı uzatır. */
function asRun(ts: Tile[]): Resolved[] | null {
  const n = ts.length;
  if (n < 3) return null;
  const nat = ts.filter((t) => !t.wild);
  const color: Color = nat.length ? nat[0].color : 0;
  if (nat.some((t) => t.color !== color)) return null;
  const nums = nat.map((t) => t.num).sort((a, b) => a - b);
  if (new Set(nums).size !== nums.length) return null;
  let lo: number, hi: number;
  if (!nums.length) {
    hi = 13;
    lo = 13 - n + 1;
  } else {
    const span = nums[nums.length - 1] - nums[0] + 1;
    if (span > n) return null;
    const extra = n - span;
    hi = Math.min(13, nums[nums.length - 1] + extra);
    lo = nums[0] - (extra - (hi - nums[nums.length - 1]));
    if (lo < 1) return null;
  }
  const have = new Set(nums);
  const missing: number[] = [];
  for (let v = lo; v <= hi; v++) if (!have.has(v)) missing.push(v);
  let mi = 0;
  const res = ts.map((t) => (t.wild ? { tile: t, num: missing[mi++], color } : { tile: t, num: t.num, color: t.color }));
  return res.sort((a, b) => a.num - b.num);
}

function classifyExact(ts: Tile[]): { type: HandType; res: Resolved[] } | null {
  const n = ts.length;
  if (n === 1) {
    const t = ts[0];
    return { type: 'tek', res: [{ tile: t, num: t.wild ? 13 : t.num, color: t.color }] };
  }
  if (n === 2) {
    const p = pairOf(ts[0], ts[1]);
    return p ? { type: 'cift', res: p } : null;
  }
  if (n === 5) {
    const r = asRun(ts);
    return r ? { type: 'seri5', res: r } : null;
  }
  const g = asGroup(ts);
  if (g) return { type: n === 4 ? 'per4' : 'per3', res: g };
  const r = asRun(ts);
  if (r) return { type: n === 4 ? 'seri4' : 'seri3', res: r };
  if (n === 4) {
    const parts: [number, number, number, number][] = [
      [0, 1, 2, 3],
      [0, 2, 1, 3],
      [0, 3, 1, 2],
    ];
    for (const [a, b, c, d] of parts) {
      const p1 = pairOf(ts[a], ts[b]);
      const p2 = pairOf(ts[c], ts[d]);
      if (p1 && p2) return { type: 'ikiCift', res: [...p1, ...p2] };
    }
  }
  return null;
}

export interface Evaluation {
  type: HandType;
  scoring: Resolved[];
}

/** Seçili taşlardaki en güçlü eli bulur. Ele dahil olmayan taşlar puan vermez. */
export function evaluate(selected: Tile[]): Evaluation | null {
  if (!selected.length || selected.length > MAX_SELECT) return null;
  let best: Evaluation | null = null;
  let bestRank = Infinity;
  let bestSum = -1;
  const n = selected.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const sub = selected.filter((_, i) => mask & (1 << i));
    const c = classifyExact(sub);
    if (!c) continue;
    const rank = HAND_ORDER.indexOf(c.type);
    const sum = c.res.reduce((s, r) => s + r.num, 0);
    if (rank < bestRank || (rank === bestRank && sum > bestSum)) {
      best = { type: c.type, scoring: c.res };
      bestRank = rank;
      bestSum = sum;
    }
  }
  return best;
}

export function isRunType(t: HandType) {
  return t === 'seri3' || t === 'seri4' || t === 'seri5';
}
export function isGroupType(t: HandType) {
  return t === 'per3' || t === 'per4';
}
export function isPairType(t: HandType) {
  return t === 'cift' || t === 'ikiCift';
}

// ---------------------------------------------------------------- ilerleme

export const MASA_COUNT = 8;
const MASA_BASE = [200, 450, 900, 1700, 3000, 5000, 8000, 12000];
const STAGE_MULT = [1, 1.5, 2];
export const STAGE_REWARD = [3, 4, 5];

export function targetFor(masa: number, stage: number) {
  return Math.round(MASA_BASE[masa - 1] * STAGE_MULT[stage]);
}

export function interest(gold: number) {
  return Math.min(5, Math.floor(gold / 5));
}

export function sortTiles(tiles: Tile[], by: 'num' | 'color'): Tile[] {
  return [...tiles].sort((a, b) => {
    if (a.wild !== b.wild) return a.wild ? 1 : -1;
    return by === 'num' ? a.num - b.num || a.color - b.color : a.color - b.color || a.num - b.num;
  });
}
