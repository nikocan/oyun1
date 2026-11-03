import { describe, expect, it } from 'vitest';
import { buy, discard, newRun, openShop, play, settle } from '../src/engine';
import { type Color, evaluate, makeBag, makeTile } from '../src/rules';

const T = (color: Color, num: number) => makeTile(color, num);
const W = () => makeTile(0, 13, true);

describe('el tanıma', () => {
  it('tek taş', () => expect(evaluate([T(0, 9)])?.type).toBe('tek'));
  it('çift (aynı sayı, farklı renk)', () => expect(evaluate([T(0, 9), T(2, 9)])?.type).toBe('cift'));
  it('seri', () => expect(evaluate([T(1, 4), T(1, 5), T(1, 6)])?.type).toBe('seri3'));
  it('farklı renk seri değildir', () => expect(evaluate([T(1, 4), T(2, 5), T(1, 6)])?.type).toBe('tek'));
  it('per', () => expect(evaluate([T(0, 7), T(1, 7), T(2, 7)])?.type).toBe('per3'));
  it('aynı renk tekrar eden per değildir → çift', () => expect(evaluate([T(0, 7), T(0, 7), T(2, 7)])?.type).toBe('cift'));
  it('dörtlü per', () => expect(evaluate([T(0, 7), T(1, 7), T(2, 7), T(3, 7)])?.type).toBe('per4'));
  it('iki çift', () => expect(evaluate([T(0, 3), T(1, 3), T(2, 9), T(3, 9)])?.type).toBe('ikiCift'));
  it('okey serisi (5)', () => expect(evaluate([T(3, 9), T(3, 10), T(3, 11), T(3, 12), T(3, 13)])?.type).toBe('seri5'));
  it('okey taşı boşluğu doldurur', () => {
    const ev = evaluate([T(2, 4), W(), T(2, 6)]);
    expect(ev?.type).toBe('seri3');
    expect(ev?.scoring.map((r) => r.num)).toEqual([4, 5, 6]);
  });
  it('okey taşı seriyi yukarı uzatır, 13 üstüne çıkmaz', () => {
    const ev = evaluate([T(2, 12), T(2, 13), W()]);
    expect(ev?.scoring.map((r) => r.num)).toEqual([11, 12, 13]);
  });
  it('okey taşıyla per', () => expect(evaluate([T(0, 11), T(3, 11), W(), W()])?.type).toBe('per4'));
  it('5 taşlık karışık seçimde en iyi alt eli bulur', () => {
    const ev = evaluate([T(0, 7), T(1, 7), T(2, 7), T(3, 1), T(1, 2)]);
    expect(ev?.type).toBe('per3');
    expect(ev?.scoring).toHaveLength(3);
  });
  it('torba 104 + okey', () => expect(makeBag(2)).toHaveLength(106));
});

describe('oyun akışı', () => {
  it('yeni oyun 8 taşla başlar', () => {
    const run = newRun();
    expect(run.round!.hand).toHaveLength(8);
    expect(run.round!.playsLeft).toBe(4);
  });
  it('el oynamak puan ekler ve taş çeker', () => {
    const run = newRun();
    const r = run.round!;
    const res = play(run, [r.hand[0].id]);
    expect(res!.total).toBeGreaterThan(0);
    expect(r.playsLeft).toBe(3);
    expect(settle(run)).toBe('continue');
    expect(r.hand).toHaveLength(8);
  });
  it('değişim hakkı azalır', () => {
    const run = newRun();
    const r = run.round!;
    expect(discard(run, [r.hand[0].id, r.hand[1].id])).toBe(true);
    expect(r.discardsLeft).toBe(2);
    expect(r.hand).toHaveLength(8);
  });
  it('hedefe ulaşınca masa kazanılır ve altın verilir', () => {
    const run = newRun();
    run.round!.target = 1;
    const gold = run.gold;
    play(run, [run.round!.hand[0].id]);
    expect(settle(run)).toBe('won');
    expect(run.phase).toBe('reward');
    expect(run.gold).toBeGreaterThan(gold);
  });
  it('eller bitince oyun biter', () => {
    const run = newRun();
    run.round!.target = 1e9;
    for (let i = 0; i < 4; i++) {
      play(run, [run.round!.hand[0].id]);
      settle(run);
    }
    expect(run.phase).toBe('over');
  });
  it('çarşıdan alışveriş', () => {
    const run = newRun();
    run.gold = 100;
    openShop(run);
    const i = run.shop!.offers.findIndex((o) => o.kind === 'charm');
    expect(buy(run, i)).toBeNull();
    expect(run.charms).toHaveLength(1);
    expect(buy(run, i)).toBe('sold');
  });
});
