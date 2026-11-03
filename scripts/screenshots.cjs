// App Store ekran görüntüleri: node scripts/screenshots.cjs  (önce npm run build:artifact)
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('dist-artifact/index.html');

function state(o) {
  let id = 1000;
  const T = (color, num, wild = false) => ({ id: id++, color, num, wild });
  const draw = [];
  for (let c = 0; c < 4; c++) for (let n = 1; n <= 13; n++) draw.push(T(c, n));
  const levels = { tek: 1, cift: 1, ikiCift: 1, seri3: 2, per3: 1, seri4: 1, per4: 1, seri5: 1 };
  return {
    v: 1, masa: o.masa, stage: o.stage, gold: o.gold, wilds: 2, bossId: o.boss || 'kirmiziYasak',
    charms: o.charms.map((c) => ({ id: c, counter: c === 'birikim' ? 6 : 0 })), levels,
    phase: o.phase || 'play', shop: o.shop || null, reward: null,
    stats: { hands: 9, bestHand: 2140, bestType: 'seri4' },
    round: { target: o.target, score: o.score, playsLeft: 3, discardsLeft: 2, handSize: 8, draw, hand: o.hand.map(([c, n, w]) => T(c, n, !!w)) },
  };
}

(async () => {
  const b = await chromium.launch();
  for (const lang of ['tr', 'en']) {
    const dir = `store/screenshots/${lang}`;
    require('fs').mkdirSync(dir, { recursive: true });
    const ctx = await b.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, locale: lang === 'tr' ? 'tr-TR' : 'en-US' });
    const p = await ctx.newPage();
    const setup = async (s) => {
      await p.goto(FILE);
      await p.evaluate(([s, lang]) => {
        localStorage.setItem('tasustasi.run.v1', JSON.stringify(s));
        localStorage.setItem('tasustasi.settings.v1', JSON.stringify({ lang, fast: false, vibrate: false, sound: false }));
        localStorage.setItem('tasustasi.meta.v1', JSON.stringify({ runs: 3, wins: 0, bestMasa: 3, seenVersion: 'x' }));
      }, [s, lang]);
      await p.reload();
    };
    const shot = (n) => p.screenshot({ path: `${dir}/${n}.png` });

    // 1 — Menü
    await setup(state({ masa: 2, stage: 1, gold: 9, target: 675, score: 0, charms: [], hand: [[0, 1]] }));
    await p.evaluate(() => localStorage.removeItem('tasustasi.run.v1'));
    await p.reload(); await p.waitForTimeout(300); await shot('1-menu');

    // 2 — Okey Serisi seçili
    const hand = [[0, 9], [0, 10], [0, 11], [0, 12], [0, 13], [2, 4], [1, 7], [0, 0, 1]];
    await setup(state({ masa: 2, stage: 1, gold: 11, target: 675, score: 240, charms: ['merdiven', 'nazarBoncugu', 'tavlaZari', 'birikim'], hand }));
    await p.click('[data-act=continue]');
    for (let i = 0; i < 5; i++) await p.locator('.rack .tile').nth(i).click();
    await p.waitForTimeout(250); await shot('2-select');

    // 3 — Puan sayımı
    await p.click('[data-act=play]');
    await p.waitForTimeout(2300); await shot('3-scoring');

    // 4 — Usta masası kuralı
    await setup(state({ masa: 5, stage: 2, gold: 14, boss: 'karaGun', target: 6000, score: 3880, charms: ['dortKose', 'karaTas', 'ugurluYedi', 'sonSoz', 'esnaf'], hand: [[0, 7], [1, 7], [2, 7], [3, 7], [3, 2], [1, 11], [2, 12], [0, 5]] }));
    await p.click('[data-act=continue]');
    for (let i = 0; i < 4; i++) await p.locator('.rack .tile').nth(i).click();
    await p.waitForTimeout(250); await shot('4-master');

    // 5 — Çarşı
    const shop = { rerollCost: 3, offers: [
      { kind: 'charm', id: 'sonSoz', price: 8, sold: false }, { kind: 'charm', id: 'okeyAvcisi', price: 6, sold: false },
      { kind: 'charm', id: 'kirmiziGul', price: 5, sold: true }, { kind: 'book', hand: 'seri4', price: 3, sold: false },
      { kind: 'book', hand: 'per3', price: 3, sold: false }, { kind: 'wild', price: 6, sold: false } ] };
    await setup(state({ masa: 3, stage: 0, gold: 17, phase: 'shop', shop, target: 900, score: 0, charms: ['kirmiziGul', 'merdiven', 'cayOcagi'], hand: [[0, 1]] }));
    await p.click('[data-act=continue]'); await p.waitForTimeout(250); await shot('5-shop');

    // IAP inceleme görüntüsü — tam sürüm penceresi
    await p.click('[data-act=goto][data-to=settings]').catch(() => {});
    await setup(state({ masa: 3, stage: 2, gold: 12, phase: 'shop', shop, target: 1800, score: 0, charms: [], hand: [[0, 1]] }));
    await p.click('[data-act=continue]'); await p.click('[data-act=nextRound]');
    await p.waitForTimeout(500); await shot('iap-review');
    await ctx.close();
  }
  await b.close();
  console.log('ok');
})();
