// Türkçe / İngilizce metinler.
import type { Text } from './content';
import type { HandType } from './rules';

export type Lang = 'tr' | 'en';

const S = {
  tagline: ['Okey taşlarıyla oynanan roguelike', 'A roguelike played with okey tiles'],
  newRun: ['Yeni oyun', 'New run'],
  continue: ['Devam et', 'Continue'],
  howTo: ['Nasıl oynanır', 'How to play'],
  whatsNew: ['Yenilikler', "What's new"],
  settings: ['Ayarlar', 'Settings'],
  back: ['Geri', 'Back'],
  language: ['Dil', 'Language'],
  speed: ['Animasyon hızı', 'Animation speed'],
  speedNormal: ['Normal', 'Normal'],
  speedFast: ['Hızlı', 'Fast'],
  vibration: ['Titreşim', 'Vibration'],
  on: ['Açık', 'On'],
  off: ['Kapalı', 'Off'],
  version: ['Sürüm', 'Version'],
  table: ['Masa', 'Table'],
  stage0: ['Çırak', 'Apprentice'],
  stage1: ['Kalfa', 'Journeyman'],
  stage2: ['Usta', 'Master'],
  target: ['Hedef', 'Target'],
  score: ['Skor', 'Score'],
  plays: ['El', 'Hands'],
  discards: ['Değişim', 'Swaps'],
  gold: ['Altın', 'Gold'],
  bag: ['Torba', 'Bag'],
  play: ['Oyna', 'Play'],
  discard: ['Değiştir', 'Swap'],
  sortNum: ['Sayıya diz', 'Sort by number'],
  sortColor: ['Renge diz', 'Sort by color'],
  selectHint: ['En fazla 5 taş seç', 'Select up to 5 tiles'],
  noHand: ['Geçerli el yok', 'No valid hand'],
  level: ['Sv.', 'Lv.'],
  charms: ['Tılsımlar', 'Charms'],
  emptySlot: ['Boş', 'Empty'],
  roundWon: ['Masayı kazandın!', 'Table cleared!'],
  reward: ['Masa ödülü', 'Table reward'],
  handsLeft: ['Kalan eller', 'Hands left'],
  interest: ['Faiz (her 5 altına 1)', 'Interest (1 per 5 gold)'],
  charmsGold: ['Tılsımlar', 'Charms'],
  toShop: ['Çarşıya git', 'Go to the bazaar'],
  shop: ['Çarşı', 'Bazaar'],
  books: ['Usta defterleri', "Master's notebooks"],
  bookName: ['{hand} defteri', '{hand} notebook'],
  bookDesc: ['{hand} eli +1 seviye ({lv} → {next})', '{hand} hand +1 level ({lv} → {next})'],
  wildName: ['Okey taşı', 'Wild tile'],
  wildDesc: ['Torbana 1 okey taşı ekler. Her taşın yerine geçer.', 'Adds 1 wild tile to your bag. It stands in for any tile.'],
  reroll: ['Yenile', 'Reroll'],
  buy: ['Al', 'Buy'],
  sell: ['Sat', 'Sell'],
  sold: ['Satıldı', 'Sold'],
  nextTable: ['Sonraki masa', 'Next table'],
  slotsFull: ['Tılsım yerin dolu (en fazla 5). Önce birini sat.', 'Charm slots are full (max 5). Sell one first.'],
  noGold: ['Yeterli altının yok.', 'Not enough gold.'],
  nextBoss: ['Usta masasının kuralı', "Master table's rule"],
  bossRule: ['Usta kuralı', 'Master rule'],
  gameOver: ['Oyun bitti', 'Game over'],
  reached: ['Ulaştığın yer', 'You reached'],
  bestHand: ['En iyi el', 'Best hand'],
  handsPlayed: ['Oynanan el', 'Hands played'],
  victory: ['Taş Ustası oldun!', 'You are a Tile Master!'],
  victoryText: ['8 masanın hepsini kazandın.', 'You cleared all 8 tables.'],
  mainMenu: ['Ana menü', 'Main menu'],
  tryAgain: ['Tekrar dene', 'Try again'],
  abandonTitle: ['Yeni oyun başlasın mı?', 'Start a new run?'],
  abandonText: ['Devam eden oyunun silinecek.', 'Your current run will be lost.'],
  yes: ['Evet', 'Yes'],
  cancel: ['Vazgeç', 'Cancel'],
  close: ['Kapat', 'Close'],
  handTypes: ['El türleri', 'Hands'],
  chipsWord: ['puan', 'chips'],
  multWord: ['çarpan', 'mult'],
  price: ['Fiyat', 'Price'],
  sellFor: ['{n} altına sat', 'Sell for {n} gold'],
  statsRuns: ['Oynanan oyun', 'Runs played'],
  statsBest: ['En yüksek masa', 'Best table'],
  statsWins: ['Kazanılan', 'Wins'],
  newBadge: ['YENİ', 'NEW'],
  menu: ['Menü', 'Menu'],
  resume: ['Oyuna dön', 'Resume'],
  quitToMenu: ['Ana menüye çık (oyun kaydedilir)', 'Quit to menu (run is saved)'],
} as const;

export type Key = keyof typeof S;

let lang: Lang = 'tr';
export const getLang = () => lang;
export const setLang = (l: Lang) => {
  lang = l;
  document.documentElement.lang = l;
};

export function t(key: Key, params: Record<string, string | number> = {}): string {
  let s: string = S[key][lang === 'tr' ? 0 : 1];
  for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export const tx = (x: Text) => x[lang];

export const HAND_NAMES: Record<HandType, Text> = {
  tek: { tr: 'Tek Taş', en: 'High Tile' },
  cift: { tr: 'Çift', en: 'Pair' },
  ikiCift: { tr: 'İki Çift', en: 'Two Pair' },
  seri3: { tr: 'Seri', en: 'Run' },
  per3: { tr: 'Per', en: 'Set' },
  seri4: { tr: 'Dörtlü Seri', en: 'Run of Four' },
  per4: { tr: 'Dörtlü Per', en: 'Set of Four' },
  seri5: { tr: 'Okey Serisi', en: 'Grand Run' },
};

export const HAND_DESC: Record<HandType, Text> = {
  tek: { tr: 'En yüksek tek taş', en: 'Your highest single tile' },
  cift: { tr: 'Aynı sayıdan 2 taş', en: '2 tiles of the same number' },
  ikiCift: { tr: 'İki ayrı çift', en: 'Two different pairs' },
  seri3: { tr: 'Aynı renk, art arda 3 sayı (4-5-6)', en: '3 consecutive numbers of one color (4-5-6)' },
  per3: { tr: 'Aynı sayı, 3 farklı renk', en: 'Same number in 3 different colors' },
  seri4: { tr: 'Aynı renk, art arda 4 sayı', en: '4 consecutive numbers of one color' },
  per4: { tr: 'Aynı sayı, 4 rengin hepsi', en: 'Same number in all 4 colors' },
  seri5: { tr: 'Aynı renk, art arda 5 sayı', en: '5 consecutive numbers of one color' },
};

export const COLOR_NAMES: Text[] = [
  { tr: 'kırmızı', en: 'red' },
  { tr: 'sarı', en: 'yellow' },
  { tr: 'mavi', en: 'blue' },
  { tr: 'siyah', en: 'black' },
];

export const HOW_TO: Text[] = [
  {
    tr: 'Her masada bir hedef puan var. Istakandaki taşlardan en fazla 5 tanesini seçip “Oyna” ile el açarsın. Elin puanı hedefe ulaşınca masayı kazanırsın.',
    en: 'Every table has a target score. Pick up to 5 tiles from your rack and press “Play”. Reach the target to clear the table.',
  },
  {
    tr: 'Puan = (el puanı + taşların sayıları) × çarpan. Seriler ve perler en çok puanı getirir.',
    en: 'Score = (hand chips + tile numbers) × mult. Runs and sets score the most.',
  },
  {
    tr: 'İstemediğin taşları “Değiştir” ile torbaya atıp yenilerini çekebilirsin. El ve değişim hakların sınırlı.',
    en: 'Use “Swap” to throw away tiles you don’t want and draw new ones. Hands and swaps are limited.',
  },
  {
    tr: 'Yıldızlı okey taşı her taşın yerine geçer.',
    en: 'The starred wild tile stands in for any tile.',
  },
  {
    tr: 'Her masa üç bölümden oluşur: Çırak, Kalfa ve Usta. Usta masasının özel bir kuralı vardır. 8 masayı da geç, Taş Ustası ol.',
    en: 'Each table has three rounds: Apprentice, Journeyman and Master. The Master round has a special rule. Clear all 8 tables to become a Tile Master.',
  },
  {
    tr: 'Kazandığın altınla çarşıdan tılsım (kalıcı güç), usta defteri (el seviyesi) ve okey taşı al.',
    en: 'Spend your gold at the bazaar on charms (permanent boosts), notebooks (hand levels) and wild tiles.',
  },
];
