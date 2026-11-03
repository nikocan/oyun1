# App Store kayıt bilgileri — Taş Ustası

Bu dosyadaki metinleri App Store Connect'te ilgili alanlara kopyala.

## Genel

| Alan | Değer |
|---|---|
| Bundle ID | `com.tasustasi.game` |
| SKU | `tasustasi` |
| Ana dil | Türkçe (ek yerelleştirme: English (U.S.)) |
| Kategori | Oyunlar → Masa Oyunu (Board), ikincil: Strateji |
| Fiyat | Ücretsiz (uygulama içi satın alma ile tam sürüm) |
| Yaş sınırı | 4+ (tüm sorulara "Yok / None"; bahis veya gerçek para kumarı yok) |
| Uygulama gizliliği | "Veri toplanmıyor" (Data Not Collected) |
| Şifreleme | Info.plist'te `ITSAppUsesNonExemptEncryption = NO` olarak ayarlı |
| Cihaz | Yalnızca iPhone |

## Türkçe

**Ad (30):** Taş Ustası
**Alt başlık (30):** Okey taşlarıyla roguelike
**Tanıtım metni (170):** Okey taşlarıyla seri ve per aç, tılsımlarla puanını katla, 8 masayı geç. Reklam yok, internetsiz oynanır.
**Anahtar kelimeler (100):** okey,taş,roguelike,strateji,bulmaca,tavla,101,kart,tek kişilik,çevrimdışı,reklamsız

**Açıklama:**
Taş Ustası, okey taşlarıyla oynanan bir roguelike strateji oyunu.

Istakandan en fazla 5 taş seç, seri ve per aç, masanın hedef puanına ulaş. Her el taş taş sayılır: taşların değeri, el türünün puanı ve tılsımlarının çarpanları birleşir.

• 8 masa, her masada Çırak, Kalfa ve Usta bölümleri
• Usta masalarında oyunu değiştiren özel kurallar
• Çarşıda 22 tılsım: Nazar Boncuğu, Tavla Zarı, Uğurlu Yedi, Çay Ocağı ve daha fazlası
• El türlerini usta defterleriyle geliştir, torbana okey taşı ekle
• Her oyun farklı: aynı tılsım dizilimi bir daha gelmez
• Reklam yok, internet gerekmez, otomatik kayıt

İlk 3 masa ücretsiz. Tam sürüm tek seferlik ödemeyle 8 masanın hepsini açar. Abonelik yok.

Türkçe ve İngilizce.

## English (U.S.)

**Name (30):** Taş Ustası
**Subtitle (30):** A rummy tile roguelike
**Promotional text (170):** Build runs and sets with okey tiles, stack charms to multiply your score and clear all 8 tables. No ads, plays offline.
**Keywords (100):** okey,rummy,tiles,roguelike,deckbuilder,strategy,puzzle,offline,no ads,board,solo

**Description:**
Taş Ustası ("Tile Master") is a roguelike strategy game played with okey tiles, the classic Turkish rummy tiles.

Pick up to 5 tiles from your rack, play runs and sets, and reach each table's target score. Every hand is counted tile by tile: tile values, hand chips and your charms' multipliers all add up.

• 8 tables, each with Apprentice, Journeyman and Master rounds
• Master rounds bring special rules that change how you play
• 22 charms in the bazaar: Evil Eye Bead, Backgammon Dice, Lucky Seven, Tea House and more
• Level up hands with notebooks and add wild tiles to your bag
• Every run is different
• No ads, no internet needed, autosave

The first 3 tables are free. The full version unlocks all 8 tables with a one-time purchase. No subscription.

Turkish and English.

## Uygulama içi satın alma

| Alan | Değer |
|---|---|
| Tür | Tüketilemeyen (Non-Consumable) |
| Referans adı | Full Version |
| Ürün kimliği | `tasustasi_full` (kodla aynı olmalı) |
| Fiyat | 4,99 USD |
| TR görünen ad / açıklama | Tam Sürüm / 8 masanın hepsini açar, tek ödeme |
| EN görünen ad / açıklama | Full Version / Unlocks all 8 tables, pay once |
| İnceleme görüntüsü | `store/screenshots/tr/iap-review.png` |

**İnceleme notu (App Review Information → Notes):**
Tables 1–3 are free. The full version (tasustasi_full) unlocks tables 4–8. To reach the purchase screen quickly: Main menu → Settings → "Get the full game". "Restore purchase" is in the same screen. No account or login is needed.

## Ekran görüntüleri (6,9" iPhone, 1320×2868)

`store/screenshots/tr/` ve `store/screenshots/en/` içindeki 1–5 numaralı dosyalar. Yeniden üretmek için: `npm run build:artifact && node scripts/screenshots.cjs`.
