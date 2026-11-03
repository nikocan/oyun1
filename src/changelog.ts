// Oyun içindeki "Yenilikler" ekranında görünen sürüm notları.
// Her çalışma oturumundan sonra en üste yeni bir kayıt eklenir.
import type { Text } from './content';

export interface Release {
  version: string;
  date: string; // YYYY-AA-GG
  title: Text;
  items: Text[];
}

export const CHANGELOG: Release[] = [
  {
    version: '0.2.0',
    date: '2026-11-03',
    title: { tr: 'Ses, tam sürüm ve mobil hazırlık', en: 'Sound, full version and mobile prep' },
    items: [
      { tr: 'Ses efektleri: taş tıkı, puan sayımı, kazanma ve altın sesleri. Ayarlar’dan kapatılabilir.', en: 'Sound effects: tile clicks, score ticks, win and coin sounds. Can be turned off in Settings.' },
      { tr: 'Demo ve tam sürüm: ilk 3 masa ücretsiz, devamı tek seferlik ödemeyle açılıyor (şimdilik test modu, ödeme alınmıyor).', en: 'Demo and full version: the first 3 tables are free, the rest unlock with a one-time purchase (test mode for now, no payment taken).' },
      { tr: '“Satın alımı geri yükle” düğmesi ve Ayarlar’da sürüm türü (Demo / Tam).', en: '“Restore purchase” button and edition (Demo / Full) in Settings.' },
      { tr: 'Zorluk dengesi: sonraki masaların hedefleri düşürüldü, iyi bir oyuncu artık 8. masayı geçebilir.', en: 'Balance: later table targets lowered so a good player can now clear table 8.' },
      { tr: 'Android ve iOS uygulama projeleri, uygulama ikonu ve açılış ekranı hazırlandı. Oyun dikey ekrana kilitli.', en: 'Android and iOS app projects, app icon and splash screen created. The game is locked to portrait.' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-11-03',
    title: { tr: 'İlk oynanabilir sürüm', en: 'First playable build' },
    items: [
      { tr: '106 taşlık okey torbası: 4 renk, 1–13 arası sayılar ve 2 okey taşı.', en: '106-tile okey bag: 4 colors, numbers 1–13 and 2 wild tiles.' },
      { tr: '8 el türü: Tek Taş, Çift, İki Çift, Seri, Per, Dörtlü Seri, Dörtlü Per, Okey Serisi.', en: '8 hand types: High Tile, Pair, Two Pair, Run, Set, Run of Four, Set of Four, Grand Run.' },
      { tr: '8 masa × 3 bölüm (Çırak, Kalfa, Usta). Usta masalarında 7 farklı özel kural.', en: '8 tables × 3 rounds (Apprentice, Journeyman, Master). 7 different Master rules.' },
      { tr: 'Çarşı: 22 tılsım, el seviyesi yükselten usta defterleri ve okey taşı satın alma.', en: 'Bazaar: 22 charms, notebooks that level up hands, and wild tiles.' },
      { tr: 'Puanların taş taş sayıldığı animasyonlu hesap.', en: 'Animated scoring that counts up tile by tile.' },
      { tr: 'Türkçe ve İngilizce dil desteği.', en: 'Turkish and English language support.' },
      { tr: 'Otomatik kayıt: oyunu kapatıp kaldığın yerden devam edebilirsin.', en: 'Autosave: close the game and continue where you left off.' },
      { tr: 'Bu “Yenilikler” ekranı: her güncellemede eklenenleri burada göreceksin.', en: "This “What's new” screen: every update will be listed here." },
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;
