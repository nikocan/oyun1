// Oyun akışı: koşu (run) durumu, el oynama, değişim, çarşı.
import { BOSSES, BOSS_BY_ID, CHARMS, CHARM_BY_ID, type CharmInst, type Effect, MAX_CHARMS, type ScoreInfo } from './content';
import {
  type Evaluation,
  HAND_ORDER,
  type HandType,
  MASA_COUNT,
  STAGE_REWARD,
  type Tile,
  evaluate,
  handValue,
  interest,
  makeBag,
  shuffle,
  targetFor,
} from './rules';

export interface RoundState {
  target: number;
  score: number;
  playsLeft: number;
  discardsLeft: number;
  handSize: number;
  draw: Tile[];
  hand: Tile[];
}

export type Offer =
  | { kind: 'charm'; id: string; price: number; sold: boolean }
  | { kind: 'book'; hand: HandType; price: number; sold: boolean }
  | { kind: 'wild'; price: number; sold: boolean };

export interface RewardLine {
  key: 'reward' | 'handsLeft' | 'interest' | 'charms';
  amount: number;
}

export interface RunState {
  v: 1;
  masa: number;
  stage: number; // 0 Çırak, 1 Kalfa, 2 Usta (patron)
  gold: number;
  charms: CharmInst[];
  levels: Record<HandType, number>;
  wilds: number;
  bossId: string;
  phase: 'play' | 'reward' | 'shop' | 'over' | 'won';
  round: RoundState | null;
  shop: { offers: Offer[]; rerollCost: number } | null;
  reward: { lines: RewardLine[]; total: number } | null;
  stats: { hands: number; bestHand: number; bestType: HandType | null };
}

const BASE = { handSize: 8, plays: 4, discards: 3 };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function newRun(): RunState {
  const levels = Object.fromEntries(HAND_ORDER.map((h) => [h, 1])) as Record<HandType, number>;
  const run: RunState = {
    v: 1,
    masa: 1,
    stage: 0,
    gold: 4,
    charms: [],
    levels,
    wilds: 2,
    bossId: pick(BOSSES).id,
    phase: 'play',
    round: null,
    shop: null,
    reward: null,
    stats: { hands: 0, bestHand: 0, bestType: null },
  };
  startRound(run);
  return run;
}

export function isBoss(run: RunState) {
  return run.stage === 2;
}

export function activeBoss(run: RunState) {
  return isBoss(run) ? BOSS_BY_ID[run.bossId] : null;
}

function mods(run: RunState) {
  const m = { ...BASE };
  for (const c of run.charms) {
    const d = CHARM_BY_ID[c.id].mods;
    if (!d) continue;
    m.handSize += d.handSize ?? 0;
    m.plays += d.plays ?? 0;
    m.discards += d.discards ?? 0;
  }
  const b = activeBoss(run)?.mods;
  if (b) {
    m.handSize += b.handSize ?? 0;
    m.plays += b.plays ?? 0;
    m.discards += b.discards ?? 0;
  }
  m.handSize = Math.max(5, m.handSize);
  m.plays = Math.max(1, m.plays);
  m.discards = Math.max(0, m.discards);
  return m;
}

export function startRound(run: RunState) {
  const m = mods(run);
  const round: RoundState = {
    target: targetFor(run.masa, run.stage),
    score: 0,
    playsLeft: m.plays,
    discardsLeft: m.discards,
    handSize: m.handSize,
    draw: shuffle(makeBag(run.wilds)),
    hand: [],
  };
  refill(round);
  run.round = round;
  run.phase = 'play';
  run.reward = null;
  run.shop = null;
}

function refill(r: RoundState) {
  while (r.hand.length < r.handSize && r.draw.length) r.hand.push(r.draw.pop()!);
}

// ---------------------------------------------------------------- puanlama

export interface Step {
  target: { kind: 'tile'; id: number } | { kind: 'charm'; idx: number } | { kind: 'hand' };
  text: string;
  tone: 'chips' | 'mult' | 'xmult' | 'gold' | 'ban';
  chips: number;
  mult: number;
}

export interface PlayResult {
  ev: Evaluation;
  played: Tile[];
  baseChips: number;
  baseMult: number;
  steps: Step[];
  total: number;
  gold: number;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''));

/** Seçili taşların değerini hesaplar. state'i değiştirmez (zar gibi rastgele tılsımlar hariç). */
export function scorePlay(run: RunState, selected: Tile[], opts: { isLastPlay: boolean; discardsLeft: number }): PlayResult | null {
  const ev = evaluate(selected);
  if (!ev) return null;
  const boss = activeBoss(run);
  const hv = handValue(ev.type, run.levels[ev.type]);
  let chips = hv.chips;
  let mult = boss?.handMult ? boss.handMult(ev.type, hv.mult) : hv.mult;
  const baseChips = chips;
  const baseMult = mult;
  const steps: Step[] = [];
  let gold = 0;
  const info: ScoreInfo = {
    type: ev.type,
    scoring: ev.scoring,
    playedCount: selected.length,
    isLastPlay: opts.isLastPlay,
    discardsLeft: opts.discardsLeft,
  };

  const apply = (e: Effect | null, target: Step['target']) => {
    if (!e) return;
    if (e.chips) {
      chips += e.chips;
      steps.push({ target, text: `+${fmt(e.chips)}`, tone: 'chips', chips, mult });
    }
    if (e.mult) {
      mult += e.mult;
      steps.push({ target, text: `+${fmt(e.mult)}`, tone: 'mult', chips, mult });
    }
    if (e.xmult) {
      mult *= e.xmult;
      steps.push({ target, text: `×${fmt(e.xmult)}`, tone: 'xmult', chips, mult });
    }
    if (e.gold) {
      gold += e.gold;
      steps.push({ target, text: `+${e.gold}`, tone: 'gold', chips, mult });
    }
  };

  for (const r of ev.scoring) {
    const target = { kind: 'tile' as const, id: r.tile.id };
    if (boss?.bans?.(r)) {
      steps.push({ target, text: '✕', tone: 'ban', chips, mult });
      continue;
    }
    apply({ chips: r.num }, target);
    run.charms.forEach((inst, idx) => {
      const d = CHARM_BY_ID[inst.id];
      if (d.onTile) apply(d.onTile(r, info, inst), { kind: 'charm', idx });
    });
  }
  run.charms.forEach((inst, idx) => {
    const d = CHARM_BY_ID[inst.id];
    if (d.onHand) apply(d.onHand(info, inst), { kind: 'charm', idx });
  });

  let total = Math.floor(chips * mult);
  if (boss?.handZero?.(ev.type)) {
    total = 0;
    steps.push({ target: { kind: 'hand' }, text: '0', tone: 'ban', chips: 0, mult: 0 });
  }
  return { ev, played: selected, baseChips, baseMult, steps, total, gold };
}

/** Sadece önizleme: el türü ve taban değerler. */
export function preview(run: RunState, selected: Tile[]) {
  const ev = evaluate(selected);
  if (!ev) return null;
  const hv = handValue(ev.type, run.levels[ev.type]);
  const boss = activeBoss(run);
  return { ev, chips: hv.chips, mult: boss?.handMult ? boss.handMult(ev.type, hv.mult) : hv.mult, level: run.levels[ev.type] };
}

function takeFromHand(r: RoundState, ids: number[]): Tile[] {
  const set = new Set(ids);
  const taken = r.hand.filter((t) => set.has(t.id));
  r.hand = r.hand.filter((t) => !set.has(t.id));
  return taken;
}

/** Eli oynar: taşları ıstakadan alır, puanı ekler. Sonrasında settle() çağrılmalı. */
export function play(run: RunState, ids: number[]): PlayResult | null {
  const r = run.round;
  if (!r || run.phase !== 'play' || !ids.length || r.playsLeft <= 0) return null;
  const selected = r.hand.filter((t) => ids.includes(t.id));
  const res = scorePlay(run, selected, { isLastPlay: r.playsLeft === 1, discardsLeft: r.discardsLeft });
  if (!res) return null;
  takeFromHand(r, ids);
  r.playsLeft--;
  r.score += res.total;
  run.gold += res.gold;
  const info: ScoreInfo = {
    type: res.ev.type,
    scoring: res.ev.scoring,
    playedCount: selected.length,
    isLastPlay: false,
    discardsLeft: r.discardsLeft,
  };
  for (const inst of run.charms) CHARM_BY_ID[inst.id].afterHand?.(info, inst);
  run.stats.hands++;
  if (res.total > run.stats.bestHand) {
    run.stats.bestHand = res.total;
    run.stats.bestType = res.ev.type;
  }
  return res;
}

/** Oynanan elden sonra: masa kazanıldı mı, kaybedildi mi, yoksa taş çek. */
export function settle(run: RunState): 'won' | 'lost' | 'continue' {
  const r = run.round!;
  if (r.score >= r.target) {
    finishRound(run);
    return 'won';
  }
  if (r.playsLeft <= 0) {
    run.phase = 'over';
    return 'lost';
  }
  refill(r);
  if (!r.hand.length) {
    run.phase = 'over';
    return 'lost';
  }
  return 'continue';
}

export function discard(run: RunState, ids: number[]): boolean {
  const r = run.round;
  if (!r || run.phase !== 'play' || !ids.length || r.discardsLeft <= 0) return false;
  takeFromHand(r, ids);
  r.discardsLeft--;
  refill(r);
  return true;
}

function finishRound(run: RunState) {
  const r = run.round!;
  const lines: RewardLine[] = [{ key: 'reward', amount: STAGE_REWARD[run.stage] }];
  if (r.playsLeft > 0) lines.push({ key: 'handsLeft', amount: r.playsLeft });
  const intr = interest(run.gold);
  if (intr > 0) lines.push({ key: 'interest', amount: intr });
  let charmGold = 0;
  for (const inst of run.charms) {
    const d = CHARM_BY_ID[inst.id];
    if (d.onRoundEnd) charmGold += d.onRoundEnd({ discardsLeft: r.discardsLeft, gold: run.gold }, inst);
  }
  if (charmGold > 0) lines.push({ key: 'charms', amount: charmGold });
  const total = lines.reduce((s, l) => s + l.amount, 0);
  run.gold += total;
  run.reward = { lines, total };
  const finalWin = run.masa === MASA_COUNT && run.stage === 2;
  run.phase = finalWin ? 'won' : 'reward';
}

// ---------------------------------------------------------------- çarşı

function rollOffers(run: RunState): Offer[] {
  const owned = new Set(run.charms.map((c) => c.id));
  const pool = CHARMS.filter((c) => !owned.has(c.id));
  const weighted: string[] = [];
  for (const c of pool) for (let i = 0; i < (c.rarity === 1 ? 6 : c.rarity === 2 ? 3 : 1); i++) weighted.push(c.id);
  const charms: Offer[] = [];
  while (charms.length < 3 && weighted.length) {
    const id = pick(weighted);
    for (let i = weighted.length - 1; i >= 0; i--) if (weighted[i] === id) weighted.splice(i, 1);
    charms.push({ kind: 'charm', id, price: CHARM_BY_ID[id].price, sold: false });
  }
  const hands = shuffle([...HAND_ORDER]).slice(0, 2);
  const books: Offer[] = hands.map((h) => ({ kind: 'book', hand: h, price: 3 + Math.floor(run.levels[h] / 2), sold: false }));
  const extra: Offer[] = run.wilds < 6 ? [{ kind: 'wild', price: 6, sold: false }] : [];
  return [...charms, ...books, ...extra];
}

export function openShop(run: RunState) {
  run.shop = { offers: rollOffers(run), rerollCost: 3 };
  run.phase = 'shop';
}

export type BuyError = 'gold' | 'slots' | 'sold';

export function buy(run: RunState, idx: number): BuyError | null {
  const o = run.shop?.offers[idx];
  if (!o || o.sold) return 'sold';
  if (run.gold < o.price) return 'gold';
  if (o.kind === 'charm') {
    if (run.charms.length >= MAX_CHARMS) return 'slots';
    run.charms.push({ id: o.id, counter: 0 });
  } else if (o.kind === 'book') {
    run.levels[o.hand]++;
  } else {
    run.wilds++;
  }
  run.gold -= o.price;
  o.sold = true;
  return null;
}

export function sellValue(inst: CharmInst) {
  return Math.max(1, Math.floor(CHARM_BY_ID[inst.id].price / 2));
}

export function sell(run: RunState, idx: number) {
  const inst = run.charms[idx];
  if (!inst) return;
  run.gold += sellValue(inst);
  run.charms.splice(idx, 1);
}

export function reroll(run: RunState): boolean {
  if (!run.shop || run.gold < run.shop.rerollCost) return false;
  run.gold -= run.shop.rerollCost;
  run.shop.offers = rollOffers(run);
  run.shop.rerollCost++;
  return true;
}

export function nextRound(run: RunState) {
  if (run.stage < 2) run.stage++;
  else {
    run.masa++;
    run.stage = 0;
    run.bossId = pick(BOSSES).id;
  }
  startRound(run);
}
