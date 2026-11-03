// Tılsımlar (kalıcı güçlendirmeler) ve patron masaları.
import { type Color, type HandType, type Resolved, isGroupType, isPairType, isRunType } from './rules';

export type Text = { tr: string; en: string };

export interface Effect {
  chips?: number;
  mult?: number;
  xmult?: number;
  gold?: number;
}

export interface ScoreInfo {
  type: HandType;
  scoring: Resolved[];
  playedCount: number;
  isLastPlay: boolean;
  discardsLeft: number;
}

export interface CharmInst {
  id: string;
  counter: number; // biriken değer (ör. Birikim)
}

export interface CharmDef {
  id: string;
  price: number;
  rarity: 1 | 2 | 3;
  name: Text;
  desc: Text;
  onTile?: (r: Resolved, info: ScoreInfo, inst: CharmInst) => Effect | null;
  onHand?: (info: ScoreInfo, inst: CharmInst) => Effect | null;
  /** El oynandıktan sonra (sayaç güncellemek için). */
  afterHand?: (info: ScoreInfo, inst: CharmInst) => void;
  onRoundEnd?: (ctx: { discardsLeft: number; gold: number }, inst: CharmInst) => number;
  mods?: { handSize?: number; plays?: number; discards?: number };
  /** Açıklamada gösterilecek canlı değer. */
  live?: (inst: CharmInst) => Text;
}

const colorIs = (c: Color) => (r: Resolved) => r.color === c;

export const CHARMS: CharmDef[] = [
  {
    id: 'cayOcagi',
    price: 3,
    rarity: 1,
    name: { tr: 'Çay Ocağı', en: 'Tea House' },
    desc: { tr: 'Her ele +4 çarpan.', en: '+4 mult on every hand.' },
    onHand: () => ({ mult: 4 }),
  },
  {
    id: 'kirmiziGul',
    price: 5,
    rarity: 1,
    name: { tr: 'Kırmızı Gül', en: 'Red Rose' },
    desc: { tr: 'Puan veren her kırmızı taş +3 çarpan.', en: 'Each scoring red tile gives +3 mult.' },
    onTile: (r) => (colorIs(0)(r) ? { mult: 3 } : null),
  },
  {
    id: 'altinBilezik',
    price: 5,
    rarity: 1,
    name: { tr: 'Altın Bilezik', en: 'Gold Bangle' },
    desc: { tr: 'Puan veren her sarı taş +1 altın.', en: 'Each scoring yellow tile earns 1 gold.' },
    onTile: (r) => (colorIs(1)(r) ? { gold: 1 } : null),
  },
  {
    id: 'nazarBoncugu',
    price: 5,
    rarity: 1,
    name: { tr: 'Nazar Boncuğu', en: 'Evil Eye Bead' },
    desc: { tr: 'Puan veren her mavi taş +20 puan.', en: 'Each scoring blue tile gives +20 chips.' },
    onTile: (r) => (colorIs(2)(r) ? { chips: 20 } : null),
  },
  {
    id: 'karaTas',
    price: 7,
    rarity: 2,
    name: { tr: 'Kara Taş', en: 'Black Stone' },
    desc: { tr: 'Puan veren her siyah taş ×1,25 çarpan.', en: 'Each scoring black tile gives ×1.25 mult.' },
    onTile: (r) => (colorIs(3)(r) ? { xmult: 1.25 } : null),
  },
  {
    id: 'merdiven',
    price: 6,
    rarity: 1,
    name: { tr: 'Merdiven', en: 'Ladder' },
    desc: { tr: 'Seri ellerine +8 çarpan.', en: 'Runs get +8 mult.' },
    onHand: (i) => (isRunType(i.type) ? { mult: 8 } : null),
  },
  {
    id: 'kardesler',
    price: 6,
    rarity: 1,
    name: { tr: 'Kardeşler', en: 'Siblings' },
    desc: { tr: 'Çift ve İki Çift ellerine +7 çarpan.', en: 'Pairs and Two Pairs get +7 mult.' },
    onHand: (i) => (isPairType(i.type) ? { mult: 7 } : null),
  },
  {
    id: 'dortKose',
    price: 8,
    rarity: 2,
    name: { tr: 'Dört Köşe', en: 'Four Corners' },
    desc: { tr: 'Per ellerine ×2 çarpan.', en: 'Sets get ×2 mult.' },
    onHand: (i) => (isGroupType(i.type) ? { xmult: 2 } : null),
  },
  {
    id: 'tavlaZari',
    price: 5,
    rarity: 1,
    name: { tr: 'Tavla Zarı', en: 'Backgammon Dice' },
    desc: { tr: 'Her ele iki zar atılır: toplamı kadar çarpan (2–12).', en: 'Rolls two dice every hand: + their total as mult (2–12).' },
    onHand: () => ({ mult: 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) }),
  },
  {
    id: 'sonSoz',
    price: 8,
    rarity: 2,
    name: { tr: 'Son Söz', en: 'Last Word' },
    desc: { tr: 'Masadaki son elin ×3 çarpan.', en: 'The last hand of a table gets ×3 mult.' },
    onHand: (i) => (i.isLastPlay ? { xmult: 3 } : null),
  },
  {
    id: 'azOlsunOz',
    price: 5,
    rarity: 1,
    name: { tr: 'Az Olsun Öz Olsun', en: 'Less Is More' },
    desc: { tr: 'Tam 3 taş oynarsan +60 puan.', en: '+60 chips if exactly 3 tiles are played.' },
    onHand: (i) => (i.playedCount === 3 ? { chips: 60 } : null),
  },
  {
    id: 'genisIstaka',
    price: 7,
    rarity: 2,
    name: { tr: 'Geniş Istaka', en: 'Wide Rack' },
    desc: { tr: 'Istakana +1 taş sığar.', en: '+1 hand size.' },
    mods: { handSize: 1 },
  },
  {
    id: 'uzunMasa',
    price: 8,
    rarity: 2,
    name: { tr: 'Uzun Masa', en: 'Long Table' },
    desc: { tr: 'Her masada +1 el.', en: '+1 hand every table.' },
    mods: { plays: 1 },
  },
  {
    id: 'torbaci',
    price: 5,
    rarity: 1,
    name: { tr: 'Torbacı', en: 'Bag Keeper' },
    desc: { tr: 'Her masada +2 değişim.', en: '+2 swaps every table.' },
    mods: { discards: 2 },
  },
  {
    id: 'kumbara',
    price: 5,
    rarity: 1,
    name: { tr: 'Kumbara', en: 'Piggy Bank' },
    desc: { tr: 'Masa sonunda kalan her değişim için +1 altın.', en: '+1 gold per unused swap at the end of a table.' },
    onRoundEnd: (c) => c.discardsLeft,
  },
  {
    id: 'esnaf',
    price: 6,
    rarity: 2,
    name: { tr: 'Esnaf', en: 'Shopkeeper' },
    desc: { tr: 'Masa sonunda +3 altın.', en: '+3 gold at the end of every table.' },
    onRoundEnd: () => 3,
  },
  {
    id: 'ugurluYedi',
    price: 7,
    rarity: 2,
    name: { tr: 'Uğurlu Yedi', en: 'Lucky Seven' },
    desc: { tr: 'Puan veren her 7 ×1,5 çarpan.', en: 'Each scoring 7 gives ×1.5 mult.' },
    onTile: (r) => (r.num === 7 ? { xmult: 1.5 } : null),
  },
  {
    id: 'okeyAvcisi',
    price: 6,
    rarity: 2,
    name: { tr: 'Okey Avcısı', en: 'Wild Hunter' },
    desc: { tr: 'Puan veren her okey taşı +50 puan ve +5 çarpan.', en: 'Each scoring wild tile gives +50 chips and +5 mult.' },
    onTile: (r) => (r.tile.wild ? { chips: 50, mult: 5 } : null),
  },
  {
    id: 'buyukTaslar',
    price: 5,
    rarity: 1,
    name: { tr: 'Büyük Taşlar', en: 'Big Tiles' },
    desc: { tr: 'Puan veren her 10 ve üstü taş +12 puan.', en: 'Each scoring tile of 10+ gives +12 chips.' },
    onTile: (r) => (r.num >= 10 ? { chips: 12 } : null),
  },
  {
    id: 'kucukler',
    price: 5,
    rarity: 1,
    name: { tr: 'Küçükler', en: 'Little Ones' },
    desc: { tr: 'Puan veren her 5 ve altı taş +4 çarpan.', en: 'Each scoring tile of 5 or less gives +4 mult.' },
    onTile: (r) => (r.num <= 5 ? { mult: 4 } : null),
  },
  {
    id: 'birikim',
    price: 7,
    rarity: 3,
    name: { tr: 'Birikim', en: 'Momentum' },
    desc: { tr: 'Her Seri oynadığında kalıcı olarak +2 çarpan kazanır.', en: 'Gains +2 mult permanently every time you play a Run.' },
    onHand: (_i, inst) => (inst.counter > 0 ? { mult: inst.counter } : null),
    afterHand: (i, inst) => {
      if (isRunType(i.type)) inst.counter += 2;
    },
    live: (inst) => ({ tr: `Şu an: +${inst.counter} çarpan`, en: `Currently: +${inst.counter} mult` }),
  },
  {
    id: 'ustaninEli',
    price: 9,
    rarity: 3,
    name: { tr: 'Ustanın Eli', en: "Master's Touch" },
    desc: { tr: 'Hiç değişim hakkı kalmadıysa ×2,5 çarpan.', en: '×2.5 mult when you have no swaps left.' },
    onHand: (i) => (i.discardsLeft === 0 ? { xmult: 2.5 } : null),
  },
];

export const CHARM_BY_ID = Object.fromEntries(CHARMS.map((c) => [c.id, c])) as Record<string, CharmDef>;
export const MAX_CHARMS = 5;

// ---------------------------------------------------------------- patronlar

export interface BossDef {
  id: string;
  name: Text;
  desc: Text;
  mods?: { handSize?: number; plays?: number; discards?: number };
  /** Bu taş puan vermez mi? */
  bans?: (r: Resolved) => boolean;
  handMult?: (t: HandType, mult: number) => number;
  handZero?: (t: HandType) => boolean;
}

export const BOSSES: BossDef[] = [
  {
    id: 'kirmiziYasak',
    name: { tr: 'Kırmızı Yasak', en: 'Red Ban' },
    desc: { tr: 'Kırmızı taşlar puan vermez.', en: 'Red tiles do not score.' },
    bans: (r) => r.color === 0 && !r.tile.wild,
  },
  {
    id: 'karaGun',
    name: { tr: 'Kara Gün', en: 'Dark Day' },
    desc: { tr: 'Siyah taşlar puan vermez.', en: 'Black tiles do not score.' },
    bans: (r) => r.color === 3 && !r.tile.wild,
  },
  {
    id: 'darIstaka',
    name: { tr: 'Dar Istaka', en: 'Narrow Rack' },
    desc: { tr: 'Istakaya 1 taş eksik sığar.', en: '-1 hand size.' },
    mods: { handSize: -1 },
  },
  {
    id: 'degisimYok',
    name: { tr: 'Değişim Yok', en: 'No Swaps' },
    desc: { tr: 'Bu masada taş değiştiremezsin.', en: 'You cannot swap tiles at this table.' },
    mods: { discards: -99 },
  },
  {
    id: 'kisaGun',
    name: { tr: 'Kısa Gün', en: 'Short Day' },
    desc: { tr: '1 el eksik oynarsın.', en: 'You get 1 fewer hand.' },
    mods: { plays: -1 },
  },
  {
    id: 'yarimMerdiven',
    name: { tr: 'Yarım Merdiven', en: 'Broken Ladder' },
    desc: { tr: 'Seri ellerinin çarpanı yarıya iner.', en: 'Runs have their base mult halved.' },
    handMult: (t, m) => (isRunType(t) ? Math.ceil(m / 2) : m),
  },
  {
    id: 'tekGecmez',
    name: { tr: 'Tek Taş Geçmez', en: 'No Singles' },
    desc: { tr: 'Tek Taş eli 0 puan verir.', en: 'High Tile hands score nothing.' },
    handZero: (t) => t === 'tek',
  },
];

export const BOSS_BY_ID = Object.fromEntries(BOSSES.map((b) => [b.id, b])) as Record<string, BossDef>;
