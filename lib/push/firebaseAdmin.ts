import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

let initFailed = false;

/** FIREBASE_SERVICE_ACCOUNT_JSON 으로 Admin SDK 초기화 (서버 전용) */
export function getFirebaseMessaging(): Messaging | null {
  if (initFailed) return null;
  if (getApps().length > 0) {
    return getMessaging();
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  try {
    const serviceAccount = JSON.parse(raw) as ServiceAccount;
    initializeApp({
      credential: cert(serviceAccount),
    });
    return getMessaging();
  } catch (err) {
    initFailed = true;
    console.error('[FCM] FIREBASE_SERVICE_ACCOUNT_JSON 파싱/초기화 실패', err);
    return null;
  }
}
