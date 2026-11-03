import '@fontsource/alfa-slab-one/latin-400.css';
import '@fontsource/alfa-slab-one/latin-ext-400.css';
import '@fontsource-variable/bricolage-grotesque/index.css';
import './style.css';

import { CHANGELOG, CURRENT_VERSION } from './changelog';
import { BOSS_BY_ID, CHARM_BY_ID, MAX_CHARMS } from './content';
import {
  type Offer,
  type PlayResult,
  type RunState,
  type Step,
  activeBoss,
  buy,
  discard,
  newRun,
  nextRound,
  openShop,
  play,
  preview,
  reroll,
  sell,
  sellValue,
  settle,
} from './engine';
import { COLOR_NAMES, HAND_DESC, HAND_NAMES, HOW_TO, type Key, setLang, t, tx } from './i18n';
import { HAND_ORDER, MASA_COUNT, MAX_SELECT, type Tile, handValue, sortTiles } from './rules';
import { DEMO_MASA, PRICE, STORE_CONNECTED, buyFullVersion, isLocked, isUnlocked, restorePurchases } from './purchase';
import { sClick, sCoin, sLose, sTick, sTotal, sWin, setSoundEnabled } from './sound';
import { loadMeta, loadRun, loadSettings, saveMeta, saveRun, saveSettings } from './storage';

// ---------------------------------------------------------------- durum

type Screen = 'menu' | 'game' | 'howto' | 'news' | 'settings';
type Modal =
  | null
  | { kind: 'confirmNew' }
  | { kind: 'charm'; idx: number }
  | { kind: 'offer'; idx: number }
  | { kind: 'hands' }
  | { kind: 'pause' }
  | { kind: 'unlock' };

const app = document.getElementById('app')!;
const settings = loadSettings();
const meta = loadMeta();
let run: RunState | null = loadRun();
let screen: Screen = 'menu';
let backTo: Screen = 'menu';
let modal: Modal = null;
let selected = new Set<number>();
let busy = false;
let lastPlay: PlayResult | null = null;
let sortMode: 'num' | 'color' | null = null;

setLang(settings.lang);
setSoundEnabled(settings.sound);

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, settings.fast ? ms * 0.45 : ms));
const fmtNum = (n: number) => Math.floor(n).toLocaleString(settings.lang === 'tr' ? 'tr-TR' : 'en-US');
const fmtMult = (n: number) => (Number.isInteger(n) ? fmtNum(n) : n.toFixed(1).replace('.', settings.lang === 'tr' ? ',' : '.'));

function buzz(ms = 8) {
  if (!settings.vibrate) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* desteklenmiyor */
  }
}

function persist() {
  saveRun(run && (run.phase === 'over' || run.phase === 'won') ? null : run);
}

function stageName(stage: number) {
  return t(`stage${stage}` as Key);
}

// ---------------------------------------------------------------- parçalar

function tileHTML(tile: Tile, opts: { sel?: boolean; act?: boolean; dim?: boolean; label?: string } = {}) {
  const cls = ['tile', tile.wild ? 'wild' : `c${tile.color}`, opts.sel ? 'sel' : '', opts.dim ? 'dim' : ''].join(' ');
  const label = tile.wild ? t('wildName') : `${tile.num} ${tx(COLOR_NAMES[tile.color])}`;
  const inner = `<span class="num">${tile.wild ? '★' : tile.num}</span><span class="pip"></span>`;
  return opts.act
    ? `<button class="${cls}" data-act="tile" data-id="${tile.id}" aria-pressed="${!!opts.sel}" aria-label="${esc(label)}">${inner}</button>`
    : `<div class="${cls}" data-tid="${tile.id}" aria-label="${esc(label)}">${inner}</div>`;
}

function charmsRow(r: RunState) {
  const slots: string[] = [];
  for (let i = 0; i < MAX_CHARMS; i++) {
    const inst = r.charms[i];
    if (inst) {
      const d = CHARM_BY_ID[inst.id];
      slots.push(
        `<button class="charm r${d.rarity}" data-act="charm" data-idx="${i}" data-cidx="${i}"><span class="charm-name">${esc(tx(d.name))}</span></button>`,
      );
    } else slots.push(`<div class="charm empty"><span>${t('emptySlot')}</span></div>`);
  }
  return `<section class="charms" aria-label="${t('charms')}">${slots.join('')}</section>`;
}

function goldChip(r: RunState) {
  return `<div class="goldchip" id="gold"><span class="coin" aria-hidden="true"></span><span id="goldval">${r.gold}</span><span class="sr">${t('gold')}</span></div>`;
}

// ---------------------------------------------------------------- ekranlar

function menuHTML() {
  const canContinue = run && (run.phase === 'play' || run.phase === 'reward' || run.phase === 'shop');
  const isNew = meta.seenVersion !== CURRENT_VERSION;
  const demo: Tile[] = [
    { id: -1, color: 0, num: 7, wild: false },
    { id: -2, color: 0, num: 8, wild: false },
    { id: -3, color: 0, num: 0, wild: true },
    { id: -4, color: 2, num: 13, wild: false },
  ];
  return `
  <main class="menu">
    <div class="logo-tiles" aria-hidden="true">${demo.map((d) => tileHTML(d)).join('')}</div>
    <h1 class="logo">Taş Ustası</h1>
    <p class="tagline">${t('tagline')}</p>
    <nav class="menu-buttons">
      ${canContinue ? `<button class="btn primary" data-act="continue">${t('continue')} <small>${t('table')} ${run!.masa} · ${stageName(run!.stage)}</small></button>` : ''}
      <button class="btn ${canContinue ? '' : 'primary'}" data-act="newRun">${t('newRun')}</button>
      <button class="btn" data-act="goto" data-to="howto">${t('howTo')}</button>
      <button class="btn" data-act="goto" data-to="news">${t('whatsNew')}${isNew ? `<span class="badge">${t('newBadge')}</span>` : ''}</button>
      <button class="btn" data-act="goto" data-to="settings">${t('settings')}</button>
    </nav>
    <footer class="menu-foot">${t('version')} ${CURRENT_VERSION} · ${isUnlocked() ? t('editionFull') : t('editionDemo')}</footer>
  </main>`;
}

function pageHTML(title: string, body: string) {
  return `
  <main class="page">
    <header class="page-head">
      <button class="icon-btn" data-act="back" aria-label="${t('back')}">‹</button>
      <h2>${title}</h2>
    </header>
    <div class="page-body">${body}</div>
  </main>`;
}

function handTable() {
  const rows = HAND_ORDER.slice()
    .reverse()
    .map((h) => {
      const lv = run?.levels[h] ?? 1;
      const v = handValue(h, lv);
      return `<tr><td><b>${tx(HAND_NAMES[h])}</b><small>${tx(HAND_DESC[h])}</small></td><td class="lv">${t('level')}${lv}</td><td class="cm"><span class="chips">${v.chips}</span>×<span class="mult">${v.mult}</span></td></tr>`;
    })
    .join('');
  return `<table class="hands"><tbody>${rows}</tbody></table>`;
}

function howtoHTML() {
  return pageHTML(
    t('howTo'),
    `<ol class="howto">${HOW_TO.map((p) => `<li>${esc(tx(p))}</li>`).join('')}</ol>
     <h3>${t('handTypes')}</h3>${handTable()}`,
  );
}

function newsHTML() {
  const body = CHANGELOG.map(
    (r) => `
    <article class="release">
      <header><span class="ver">v${r.version}</span><time datetime="${r.date}">${r.date}</time></header>
      <h3>${esc(tx(r.title))}</h3>
      <ul>${r.items.map((i) => `<li>${esc(tx(i))}</li>`).join('')}</ul>
    </article>`,
  ).join('');
  return pageHTML(t('whatsNew'), body);
}

function settingsHTML() {
  const seg = (act: string, opts: [string, string, boolean][]) =>
    `<div class="seg">${opts.map(([v, label, on]) => `<button data-act="${act}" data-v="${v}" class="${on ? 'on' : ''}" aria-pressed="${on}">${label}</button>`).join('')}</div>`;
  return pageHTML(
    t('settings'),
    `<div class="setting"><span>${t('language')}</span>${seg('lang', [
      ['tr', 'Türkçe', settings.lang === 'tr'],
      ['en', 'English', settings.lang === 'en'],
    ])}</div>
    <div class="setting"><span>${t('speed')}</span>${seg('speed', [
      ['normal', t('speedNormal'), !settings.fast],
      ['fast', t('speedFast'), settings.fast],
    ])}</div>
    <div class="setting"><span>${t('sound')}</span>${seg('sound', [
      ['on', t('on'), settings.sound],
      ['off', t('off'), !settings.sound],
    ])}</div>
    <div class="setting"><span>${t('vibration')}</span>${seg('vibrate', [
      ['on', t('on'), settings.vibrate],
      ['off', t('off'), !settings.vibrate],
    ])}</div>
    <dl class="stats">
      <div><dt>${t('statsRuns')}</dt><dd>${meta.runs}</dd></div>
      <div><dt>${t('statsBest')}</dt><dd>${meta.bestMasa}/${MASA_COUNT}</dd></div>
      <div><dt>${t('statsWins')}</dt><dd>${meta.wins}</dd></div>
    </dl>
    <div class="setting"><span>${t('edition')}</span><b>${isUnlocked() ? t('editionFull') : t('editionDemo')}</b></div>
    ${isUnlocked() ? '' : `<button class="btn primary" data-act="openUnlock">${t('unlockCta', { price: tx(PRICE) })}</button>`}
    <button class="btn" data-act="restore">${t('restore')}</button>
    <p class="muted">${t('version')} ${CURRENT_VERSION}</p>`,
  );
}

function hudHTML(r: RunState) {
  return `
  <header class="hud">
    <button class="icon-btn" data-act="pause" aria-label="${t('menu')}">☰</button>
    <div class="where"><span class="eyebrow">${t('table')} ${r.masa}/${MASA_COUNT}</span><strong>${stageName(r.stage)}</strong></div>
    ${goldChip(r)}
  </header>`;
}

function tableHTML(r: RunState) {
  const rd = r.round!;
  const pct = Math.min(100, (rd.score / rd.target) * 100);
  const boss = activeBoss(r);
  const sel = rd.hand.filter((x) => selected.has(x.id));
  const pv = lastPlay ? null : preview(r, sel);
  const calcName = lastPlay
    ? `${tx(HAND_NAMES[lastPlay.ev.type])} <small>${t('level')}${r.levels[lastPlay.ev.type]}</small>`
    : pv
      ? `${tx(HAND_NAMES[pv.ev.type])} <small>${t('level')}${pv.level}</small>`
      : `<span class="muted">${sel.length ? t('noHand') : t('selectHint')}</span>`;
  const chips = lastPlay ? lastPlay.baseChips : (pv?.chips ?? 0);
  const mult = lastPlay ? lastPlay.baseMult : (pv?.mult ?? 0);
  const scoringIds = new Set(lastPlay?.ev.scoring.map((s) => s.tile.id) ?? []);
  const played = lastPlay ? lastPlay.played.map((p) => tileHTML(p, { dim: !scoringIds.has(p.id) })).join('') : '';
  const hand = sortMode ? sortTiles(rd.hand, sortMode) : rd.hand;
  const cols = Math.max(4, Math.ceil(hand.length / 2));
  return `
  <main class="game">
    ${hudHTML(r)}
    <section class="board">
      <div class="target-row">
        <div><span class="label">${t('target')}</span><b>${fmtNum(rd.target)}</b></div>
        <div class="right"><span class="label">${t('score')}</span><b id="score">${fmtNum(rd.score)}</b></div>
      </div>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${rd.target}" aria-valuenow="${rd.score}"><i id="bar" style="width:${pct}%"></i></div>
      <div class="counters">
        <span><b>${rd.playsLeft}</b> ${t('plays')}</span>
        <span><b>${rd.discardsLeft}</b> ${t('discards')}</span>
        <span><b>${rd.draw.length}</b> ${t('bag')}</span>
        <button class="link" data-act="hands">${t('handTypes')}</button>
      </div>
      ${boss ? `<div class="boss"><b>${t('bossRule')}: ${esc(tx(boss.name))}</b> ${esc(tx(boss.desc))}</div>` : ''}
    </section>
    ${charmsRow(r)}
    <section class="felt">
      <div class="calc ${lastPlay ? 'live' : ''}">
        <div class="hand-name" id="handname">${calcName}</div>
        <div class="cm"><span class="chips" id="chips">${fmtNum(chips)}</span><span class="x">×</span><span class="mult" id="mult">${fmtMult(mult)}</span></div>
      </div>
      <div class="played" id="played">${played}</div>
    </section>
    <section class="rack" style="--cols:${cols}">
      ${hand.map((x) => tileHTML(x, { act: true, sel: selected.has(x.id) })).join('')}
    </section>
    <footer class="actions">
      <button class="btn small" data-act="sort" data-v="num">${t('sortNum')}</button>
      <button class="btn small" data-act="sort" data-v="color">${t('sortColor')}</button>
      <button class="btn swap" data-act="discard" ${!sel.length || rd.discardsLeft <= 0 || busy ? 'disabled' : ''}>${t('discard')}</button>
      <button class="btn primary" data-act="play" ${!pv || busy ? 'disabled' : ''}>${t('play')}</button>
    </footer>
    ${r.phase === 'reward' ? rewardHTML(r) : ''}
  </main>`;
}

function rewardHTML(r: RunState) {
  const rw = r.reward!;
  const labels: Record<string, Key> = { reward: 'reward', handsLeft: 'handsLeft', interest: 'interest', charms: 'charmsGold' };
  return `
  <div class="overlay"><div class="sheet reward" role="dialog" aria-labelledby="rw-title">
    <h2 id="rw-title">${t('roundWon')}</h2>
    <dl class="lines">${rw.lines.map((l) => `<div><dt>${t(labels[l.key])}</dt><dd>+${l.amount}</dd></div>`).join('')}
      <div class="sum"><dt>${t('gold')}</dt><dd>+${rw.total}</dd></div></dl>
    <button class="btn primary" data-act="toShop">${t('toShop')}</button>
  </div></div>`;
}

function offerTitle(o: Offer) {
  if (o.kind === 'charm') return tx(CHARM_BY_ID[o.id].name);
  if (o.kind === 'book') return t('bookName', { hand: tx(HAND_NAMES[o.hand]) });
  return t('wildName');
}

function offerDesc(o: Offer, r: RunState) {
  if (o.kind === 'charm') return tx(CHARM_BY_ID[o.id].desc);
  if (o.kind === 'book') return t('bookDesc', { hand: tx(HAND_NAMES[o.hand]), lv: r.levels[o.hand], next: r.levels[o.hand] + 1 });
  return t('wildDesc');
}

function shopHTML(r: RunState) {
  const s = r.shop!;
  const nextMasa = r.stage < 2 ? r.masa : r.masa + 1;
  const nextStage = r.stage < 2 ? r.stage + 1 : 0;
  const nextBoss = nextStage === 2 ? BOSS_BY_ID[r.bossId] : null;
  const card = (o: Offer, i: number) => `
    <article class="offer k-${o.kind} ${o.sold ? 'sold' : ''} ${o.kind === 'charm' ? 'r' + CHARM_BY_ID[o.id].rarity : ''}">
      <button class="offer-body" data-act="offerInfo" data-idx="${i}">
        <span class="kind">${o.kind === 'charm' ? t('charms') : o.kind === 'book' ? t('books') : t('bag')}</span>
        <h3>${esc(offerTitle(o))}</h3>
        <p>${esc(offerDesc(o, r))}</p>
      </button>
      <button class="btn buy" data-act="buy" data-idx="${i}" ${o.sold ? 'disabled' : ''}>
        ${o.sold ? t('sold') : `${t('buy')} <span class="price"><span class="coin"></span>${o.price}</span>`}
      </button>
    </article>`;
  return `
  <main class="game shop">
    ${hudHTML(r)}
    <section class="shop-head">
      <h2>${t('shop')}</h2>
      <p class="next">${t('nextTable')}: <b>${t('table')} ${nextMasa} · ${stageName(nextStage)}</b>
      ${r.stage === 2 && isLocked(r.masa + 1) ? `<br><span class="lock-note">${t('demoEndsHere')}</span>` : ''}
      ${nextBoss ? `<br><span class="boss-inline">${t('nextBoss')}: <b>${esc(tx(nextBoss.name))}</b> — ${esc(tx(nextBoss.desc))}</span>` : ''}</p>
    </section>
    ${charmsRow(r)}
    <section class="offers">${s.offers.map(card).join('')}</section>
    <footer class="actions two">
      <button class="btn" data-act="reroll" ${r.gold < s.rerollCost ? 'disabled' : ''}>${t('reroll')} <span class="price"><span class="coin"></span>${s.rerollCost}</span></button>
      <button class="btn primary" data-act="nextRound">${t('nextTable')}</button>
    </footer>
  </main>`;
}

function endHTML(r: RunState) {
  const won = r.phase === 'won';
  return `
  <main class="page end ${won ? 'won' : 'lost'}">
    <div class="end-body">
      <h1>${won ? t('victory') : t('gameOver')}</h1>
      ${won ? `<p>${t('victoryText')}</p>` : ''}
      <dl class="stats">
        <div><dt>${t('reached')}</dt><dd>${t('table')} ${r.masa} · ${stageName(r.stage)}</dd></div>
        <div><dt>${t('bestHand')}</dt><dd>${fmtNum(r.stats.bestHand)}${r.stats.bestType ? ` <small>${tx(HAND_NAMES[r.stats.bestType])}</small>` : ''}</dd></div>
        <div><dt>${t('handsPlayed')}</dt><dd>${r.stats.hands}</dd></div>
      </dl>
      <button class="btn primary" data-act="startRun">${t('tryAgain')}</button>
      <button class="btn" data-act="toMenu">${t('mainMenu')}</button>
    </div>
  </main>`;
}

function modalHTML(): string {
  if (!modal) return '';
  let inner = '';
  if (modal.kind === 'confirmNew') {
    inner = `<h2>${t('abandonTitle')}</h2><p>${t('abandonText')}</p>
      <div class="row"><button class="btn" data-act="closeModal">${t('cancel')}</button><button class="btn primary" data-act="startRun">${t('yes')}</button></div>`;
  } else if (modal.kind === 'charm' && run) {
    const inst = run.charms[modal.idx];
    if (!inst) return '';
    const d = CHARM_BY_ID[inst.id];
    inner = `<h2>${esc(tx(d.name))}</h2><p>${esc(tx(d.desc))}</p>${d.live ? `<p class="live">${esc(tx(d.live(inst)))}</p>` : ''}
      <div class="row"><button class="btn" data-act="closeModal">${t('close')}</button>
      <button class="btn danger" data-act="sell" data-idx="${modal.idx}" ${busy ? 'disabled' : ''}>${t('sellFor', { n: sellValue(inst) })}</button></div>`;
  } else if (modal.kind === 'offer' && run?.shop) {
    const o = run.shop.offers[modal.idx];
    inner = `<h2>${esc(offerTitle(o))}</h2><p>${esc(offerDesc(o, run))}</p>
      <div class="row"><button class="btn" data-act="closeModal">${t('close')}</button>
      <button class="btn primary" data-act="buy" data-idx="${modal.idx}" ${o.sold ? 'disabled' : ''}>${t('buy')} <span class="price"><span class="coin"></span>${o.price}</span></button></div>`;
  } else if (modal.kind === 'hands') {
    inner = `<h2>${t('handTypes')}</h2>${handTable()}<div class="row"><button class="btn" data-act="closeModal">${t('close')}</button></div>`;
  } else if (modal.kind === 'pause') {
    inner = `<h2>${t('menu')}</h2><div class="col">
      <button class="btn primary" data-act="closeModal">${t('resume')}</button>
      <button class="btn" data-act="goto" data-to="howto">${t('howTo')}</button>
      <button class="btn" data-act="goto" data-to="settings">${t('settings')}</button>
      <button class="btn" data-act="toMenu">${t('quitToMenu')}</button></div>`;
  }
  if (modal.kind === 'unlock') {
    inner = `<h2>${t('unlockTitle')}</h2><p>${t('unlockText', { n: DEMO_MASA })}</p>
      <ul class="perks"><li>${t('perk1')}</li><li>${t('perk2')}</li><li>${t('perk3')}</li></ul>
      ${STORE_CONNECTED ? '' : `<p class="test-note">${t('testMode')}</p>`}
      <button class="btn primary" data-act="unlockBuy">${t('unlockCta', { price: tx(PRICE) })}</button>
      <div class="row"><button class="btn" data-act="restore">${t('restore')}</button><button class="btn" data-act="closeModal">${t('later')}</button></div>`;
  }
  return `<div class="overlay" data-act="closeModalBg"><div class="sheet" role="dialog">${inner}</div></div>`;
}

function render() {
  let html = '';
  if (screen === 'menu') html = menuHTML();
  else if (screen === 'howto') html = howtoHTML();
  else if (screen === 'news') html = newsHTML();
  else if (screen === 'settings') html = settingsHTML();
  else if (run) {
    if (run.phase === 'shop') html = shopHTML(run);
    else if (run.phase === 'over' || run.phase === 'won') html = endHTML(run);
    else html = tableHTML(run);
  }
  app.innerHTML = html + modalHTML() + '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
}

let toastTimer = 0;
function toast(msg: string) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------------------------------------------------------------- animasyonlu el

function pop(el: Element | null, text: string, tone: Step['tone']) {
  if (!el) return;
  const p = document.createElement('span');
  p.className = `pop ${tone}`;
  p.textContent = text;
  el.appendChild(p);
  el.classList.remove('hit');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('hit');
  setTimeout(() => p.remove(), 900);
}

async function doPlay() {
  if (!run?.round || busy) return;
  const ids = [...selected];
  const before = run.round.score;
  const res = play(run, ids);
  if (!res) {
    toast(t('noHand'));
    return;
  }
  busy = true;
  selected = new Set();
  lastPlay = res;
  render();
  buzz(12);
  await sleep(350);
  const chipsEl = document.getElementById('chips');
  const multEl = document.getElementById('mult');
  const stepDelay = res.steps.length > 14 ? 200 : 300;
  let stepNo = 0;
  for (const s of res.steps) {
    sTick(stepNo++, s.tone);
    const target =
      s.target.kind === 'tile'
        ? document.querySelector(`#played [data-tid="${s.target.id}"]`)
        : s.target.kind === 'charm'
          ? document.querySelector(`.charms [data-cidx="${s.target.idx}"]`)
          : document.getElementById('handname');
    pop(target, s.text, s.tone);
    if (chipsEl) chipsEl.textContent = fmtNum(s.chips);
    if (multEl) multEl.textContent = fmtMult(s.mult);
    if (s.tone === 'gold') {
      const g = document.getElementById('goldval');
      if (g) g.textContent = String(run.gold);
    }
    buzz(4);
    await sleep(stepDelay);
  }
  // toplamı skora say
  const hn = document.getElementById('handname');
  if (hn) hn.innerHTML = `<span class="total">= ${fmtNum(res.total)}</span>`;
  sTotal();
  const scoreEl = document.getElementById('score');
  const bar = document.getElementById('bar');
  const target = run.round.target;
  const frames = 18;
  for (let i = 1; i <= frames; i++) {
    const v = before + (res.total * i) / frames;
    if (scoreEl) scoreEl.textContent = fmtNum(v);
    if (bar) bar.style.width = `${Math.min(100, (v / target) * 100)}%`;
    await sleep(22);
  }
  await sleep(380);
  const outcome = settle(run);
  lastPlay = null;
  busy = false;
  if (outcome !== 'continue') recordEnd();
  if (outcome === 'won') {
    buzz(30);
    sWin();
  } else if (outcome === 'lost') sLose();
  persist();
  render();
}

function recordEnd() {
  if (!run) return;
  meta.bestMasa = Math.max(meta.bestMasa, run.masa);
  if (run.phase === 'won') meta.wins++;
  saveMeta(meta);
}

// ---------------------------------------------------------------- olaylar

function startNewRun() {
  run = newRun();
  meta.runs++;
  saveMeta(meta);
  selected = new Set();
  lastPlay = null;
  sortMode = null;
  modal = null;
  screen = 'game';
  persist();
  render();
}

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!el) return;
  const act = el.dataset.act!;
  if (act === 'closeModalBg') {
    if (e.target === el) {
      modal = null;
      render();
    }
    return;
  }
  const idx = Number(el.dataset.idx);
  switch (act) {
    case 'continue':
      screen = 'game';
      break;
    case 'newRun':
      if (run && run.phase !== 'over' && run.phase !== 'won') modal = { kind: 'confirmNew' };
      else return startNewRun();
      break;
    case 'startRun':
      return startNewRun();
    case 'goto': {
      const to = el.dataset.to as Screen;
      backTo = screen === 'game' ? 'game' : 'menu';
      modal = null;
      screen = to;
      if (to === 'news') {
        meta.seenVersion = CURRENT_VERSION;
        saveMeta(meta);
      }
      break;
    }
    case 'back':
      screen = backTo;
      backTo = 'menu';
      break;
    case 'toMenu':
      modal = null;
      screen = 'menu';
      break;
    case 'pause':
      modal = { kind: 'pause' };
      break;
    case 'closeModal':
      modal = null;
      break;
    case 'hands':
      modal = { kind: 'hands' };
      break;
    case 'lang':
      settings.lang = el.dataset.v === 'en' ? 'en' : 'tr';
      setLang(settings.lang);
      saveSettings(settings);
      break;
    case 'speed':
      settings.fast = el.dataset.v === 'fast';
      saveSettings(settings);
      break;
    case 'sound':
      settings.sound = el.dataset.v === 'on';
      setSoundEnabled(settings.sound);
      saveSettings(settings);
      if (settings.sound) sCoin();
      break;
    case 'openUnlock':
      modal = { kind: 'unlock' };
      break;
    case 'unlockBuy':
      void buyFullVersion().then((ok) => {
        if (ok) {
          modal = null;
          sWin();
          render();
          toast(STORE_CONNECTED ? t('unlocked') : t('unlockedTest'));
        }
      });
      return;
    case 'restore':
      void restorePurchases().then((ok) => {
        if (ok) modal = null;
        render();
        toast(ok ? t('restored') : t('nothingToRestore'));
      });
      return;
    case 'vibrate':
      settings.vibrate = el.dataset.v === 'on';
      saveSettings(settings);
      break;
    case 'tile': {
      if (busy || !run?.round) return;
      const id = Number(el.dataset.id);
      if (selected.has(id)) selected.delete(id);
      else if (selected.size < MAX_SELECT) selected.add(id);
      else {
        toast(t('selectHint'));
        return;
      }
      buzz(6);
      sClick();
      break;
    }
    case 'sort':
      if (busy) return;
      sortMode = el.dataset.v === 'color' ? 'color' : 'num';
      if (run?.round) run.round.hand = sortTiles(run.round.hand, sortMode);
      persist();
      break;
    case 'play':
      void doPlay();
      return;
    case 'discard':
      if (busy || !run) return;
      if (discard(run, [...selected])) {
        selected = new Set();
        buzz(10);
        if (sortMode && run.round) run.round.hand = sortTiles(run.round.hand, sortMode);
        persist();
      }
      break;
    case 'charm':
      modal = { kind: 'charm', idx };
      break;
    case 'sell':
      if (busy || !run) return;
      sell(run, idx);
      modal = null;
      persist();
      break;
    case 'toShop':
      if (!run) return;
      openShop(run);
      persist();
      break;
    case 'offerInfo':
      modal = { kind: 'offer', idx };
      break;
    case 'buy': {
      if (!run) return;
      const err = buy(run, idx);
      if (err === 'gold') toast(t('noGold'));
      else if (err === 'slots') toast(t('slotsFull'));
      else if (!err) {
        buzz(15);
        sCoin();
        modal = null;
        persist();
      }
      if (err) return;
      break;
    }
    case 'reroll':
      if (run && reroll(run)) persist();
      break;
    case 'nextRound':
      if (!run) return;
      if (run.stage === 2 && isLocked(run.masa + 1)) {
        modal = { kind: 'unlock' };
        break;
      }
      nextRound(run);
      selected = new Set();
      if (sortMode && run.round) run.round.hand = sortTiles(run.round.hand, sortMode);
      persist();
      break;
  }
  render();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal) {
    modal = null;
    render();
  }
});

render();
