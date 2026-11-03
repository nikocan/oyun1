// Tam sürüm kilidi. Model: ilk 3 masa ücretsiz, tam sürüm tek seferlik uygulama içi satın alma.
// - Telefonda (iOS/Android): gerçek App Store / Google Play ödemesi.
// - Tarayıcı sürümünde: test modu, düğme kilidi ücretsiz açar.
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

const KEY = 'tasustasi.full.v1';

/** App Store Connect ve Google Play Console'da aynı kimlikle tanımlanacak ürün. */
export const PRODUCT_ID = 'tasustasi_full';
export const DEMO_MASA = 3;
export const STORE_CONNECTED = Capacitor.isNativePlatform();

const DEFAULT_PRICE = { tr: '4,99 $', en: '$4.99' };
let storePrice: string | null = null;

export function priceLabel(lang: 'tr' | 'en') {
  return storePrice ?? DEFAULT_PRICE[lang];
}

export function isUnlocked(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function setUnlocked() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* depolama yok */
  }
}

async function ownsFullVersion(): Promise<boolean> {
  const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP, onlyCurrentEntitlements: true });
  return purchases.some(
    (p) => p.productIdentifier === PRODUCT_ID && (Capacitor.getPlatform() !== 'android' || p.purchaseState === '1'),
  );
}

/** Uygulama açılışında: mağaza fiyatını al, daha önce satın alındıysa kilidi aç. */
export async function initPurchases(): Promise<void> {
  if (!STORE_CONNECTED) return;
  try {
    const { product } = await NativePurchases.getProduct({ productIdentifier: PRODUCT_ID, productType: PURCHASE_TYPE.INAPP });
    if (product?.priceString) storePrice = product.priceString;
  } catch {
    /* ürün henüz mağazada tanımlı değil ya da internet yok */
  }
  try {
    if (!isUnlocked() && (await ownsFullVersion())) setUnlocked();
  } catch {
    /* sessizce geç: kullanıcı “geri yükle” ile tekrar deneyebilir */
  }
}

export type BuyResult = 'ok' | 'cancelled' | 'error';

export async function buyFullVersion(): Promise<BuyResult> {
  if (!STORE_CONNECTED) {
    setUnlocked();
    return 'ok';
  }
  try {
    const tx = await NativePurchases.purchaseProduct({ productIdentifier: PRODUCT_ID, productType: PURCHASE_TYPE.INAPP });
    if (tx?.productIdentifier === PRODUCT_ID) {
      setUnlocked();
      return 'ok';
    }
    return 'error';
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).toLowerCase();
    return msg.includes('cancel') ? 'cancelled' : 'error';
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!STORE_CONNECTED) return isUnlocked();
  try {
    await NativePurchases.restorePurchases();
    if (await ownsFullVersion()) setUnlocked();
  } catch {
    /* geri yükleme başarısız */
  }
  return isUnlocked();
}

/** Bu masa demo sınırının ötesinde mi? */
export function isLocked(masa: number) {
  return masa > DEMO_MASA && !isUnlocked();
}
