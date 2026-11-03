// Tam sürüm kilidi. Model: ilk 3 masa ücretsiz, tam sürüm tek seferlik ödeme.
// ŞU AN TEST MODU: mağaza bağlantısı (App Store / Google Play) henüz yok,
// “satın al” kilidi doğrudan açar. Mağaza entegrasyonu bir sonraki adımda eklenecek.
const KEY = 'tasustasi.full.v1';

export const DEMO_MASA = 3;
export const PRICE = { tr: '4,99 $', en: '$4.99' };
export const STORE_CONNECTED = false;

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

export async function buyFullVersion(): Promise<boolean> {
  setUnlocked();
  return true;
}

export async function restorePurchases(): Promise<boolean> {
  return isUnlocked();
}

/** Bu masa demo sınırının ötesinde mi? */
export function isLocked(masa: number) {
  return masa > DEMO_MASA && !isUnlocked();
}
