// Basit bot ile zorluk dengesi simülasyonu: npx vite-node scripts/sim.ts
import { buy, discard, newRun, nextRound, openShop, play, reroll, scorePlay, settle } from '../src/engine';
import { CHARM_BY_ID } from '../src/content';
import type { Tile } from '../src/rules';

function combos(arr: Tile[], k: number, start = 0, cur: Tile[] = [], out: Tile[][] = []) {
  if (cur.length && cur.length <= k) out.push([...cur]);
  if (cur.length === k) return out;
  for (let i = start; i < arr.length; i++) { cur.push(arr[i]); combos(arr, k, i + 1, cur, out); cur.pop(); }
  return out;
}
const N = 300; const reached: number[] = []; let wins = 0;
for (let g = 0; g < N; g++) {
  const run = newRun();
  while (run.phase !== 'over' && run.phase !== 'won') {
    if (run.phase === 'play') {
      const r = run.round!;
      let best: Tile[] = []; let bestScore = -1; let bestType = '';
      for (const c of combos(r.hand, 5)) {
        const res = scorePlay(run, c, { isLastPlay: r.playsLeft === 1, discardsLeft: r.discardsLeft });
        if (res && res.total > bestScore) { bestScore = res.total; best = c; bestType = res.ev.type; }
      }
      const weak = ['tek', 'cift'].includes(bestType);
      if (weak && r.discardsLeft > 0 && r.target - r.score > bestScore) {
        const keep = new Set(best.map((t) => t.id));
        const toss = r.hand.filter((t) => !keep.has(t.id)).slice(0, 5).map((t) => t.id);
        if (toss.length) { discard(run, toss); continue; }
      }
      play(run, best.map((t) => t.id)); settle(run);
    } else if (run.phase === 'reward') openShop(run);
    else if (run.phase === 'shop') {
      // "iyi oyuncu": önce nadir tılsımlar, sonra seri/per defterleri, sonra kalanlar
      const score = (o: any) => o.kind === 'charm' ? 10 + CHARM_BY_ID[o.id].rarity * 5 : o.kind === 'book' ? (/seri|per/.test(o.hand) ? 14 : 2) : 6;
      for (let pass = 0; pass < 3; pass++) {
        const order = run.shop!.offers.map((o, i) => [score(o), i] as const).sort((a, b) => b[0] - a[0]);
        for (const [, i] of order) buy(run, i);
        if (run.gold >= run.shop!.rerollCost + 6) reroll(run); else break;
      }
      nextRound(run);
    }
  }
  if (run.phase === 'won') wins++;
  reached.push((run.masa - 1) * 3 + run.stage + (run.phase === 'won' ? 1 : 0));
}
const hist: Record<number, number> = {};
for (const r of reached) hist[Math.floor(r / 3) + 1] = (hist[Math.floor(r / 3) + 1] ?? 0) + 1;
console.log('ortalama masa:', (reached.reduce((a, b) => a + b, 0) / N / 3 + 1).toFixed(2), 'kazanma:', wins, '/', N);
console.log('ulaşılan masa dağılımı:', hist);
