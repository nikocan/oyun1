# Taş Ustası

Okey taşlarıyla oynanan, tek seferlik ödemeli mobil roguelike (iOS + Android). Türkçe / İngilizce.

## Komutlar
- `npm run dev` — geliştirme sunucusu
- `npm test` — kural testleri
- `npm run build` — mobil paket için web derlemesi (`dist/`)
- `npm run build:artifact` — tarayıcıda paylaşılabilir tek dosya (`dist-artifact/tas-ustasi.html`)
- `npx vite-node scripts/sim.ts` — bot ile zorluk dengesi simülasyonu

## Yapı
- `src/rules.ts` — taşlar, el türleri, puan tabloları
- `src/content.ts` — tılsımlar ve Usta masası kuralları
- `src/engine.ts` — oyun akışı, çarşı
- `src/main.ts` — arayüz
- `src/changelog.ts` — oyun içi "Yenilikler" ekranı (her güncellemede güncellenir)
