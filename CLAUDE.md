# Taş Ustası — çalışma notları

- Oyun: okey taşlarıyla roguelike, Vite + TypeScript (arayüz düz DOM), Capacitor ile Android/iOS.
- Dil: tüm oyuncu metinleri `src/i18n.ts` içinde Türkçe + İngilizce. Yeni metin eklerken ikisini de yaz.
- Her güncellemede `src/changelog.ts` en üstüne yeni sürüm kaydı ekle ve `package.json` sürümünü artır.
  Kullanıcı yenilikleri oyun içindeki "Yenilikler" ekranından takip ediyor.
- Değişiklikten sonra: `npm test`, `npm run build`, `npx cap sync`, `npm run build:artifact`
  ve tarayıcı sürümünü https://claude.ai/artifact/A2yvGb8VsagZ32yqCyeiKi adresine yeniden yayınla.
- Zorluk değişikliklerini `npx vite-node scripts/sim.ts` ile ölç.
- Ödeme `src/purchase.ts` içinde (@capgo/native-purchases, ürün `tasustasi_full`). Telefonda gerçek ödeme, tarayıcıda test modu.
- Mağaza metinleri ve ekran görüntüleri `store/` klasöründe; iOS yüklemesi `.github/workflows/ios.yml`.
