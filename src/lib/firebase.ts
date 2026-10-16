import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';

function getFirebaseOptions(): FirebaseOptions {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !appId || !projectId) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env and fill the Firebase client settings.',
    );
  }

  return {
    apiKey,
    appId,
    projectId,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };
}

export function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseOptions());
}
