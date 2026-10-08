'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
// @ts-ignore - shared workspace package
import { CLASSROOM_SCOPES } from 'shared';

declare global {
  var __FIREBASE_EMULATOR_CONNECTED__: boolean | undefined;
}

// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDa5rMyVXsu55ZAAP0vnOANfgoKF4F1DGk",
  authDomain: "attendance-tracker-43b43.firebaseapp.com",
  projectId: "attendance-tracker-43b43",
  storageBucket: "attendance-tracker-43b43.firebasestorage.app",
  messagingSenderId: "766790398568",
  appId: "1:766790398568:web:a95e6ca68a89e6896ac1dd",
  measurementId: "G-FW3BE0C53N"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Emulators are disabled to connect to the actual Firebase project.
// if (process.env.NODE_ENV === 'development') {
//   // Prevent connecting multiple times during HMR
//   if (!global.__FIREBASE_EMULATOR_CONNECTED__) {
//     connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
//     connectFirestoreEmulator(db, '127.0.0.1', 8080);
//     global.__FIREBASE_EMULATOR_CONNECTED__ = true;
//   }
// }

const googleProvider = new GoogleAuthProvider();

// Request Classroom scopes explicitly so Google returns an access token
// that is authorized for the Classroom API endpoints.
CLASSROOM_SCOPES.forEach((scope) => googleProvider.addScope(scope));
// Keep the Google session so re-authentication for a fresh token is seamless.
googleProvider.setCustomParameters({ prompt: 'select_account' });

const TOKEN_KEY = 'classroomToken';
const TOKEN_EXPIRY_KEY = 'classroomTokenExpiry';
// Google access tokens last ~3600s. Treat them as expired a bit early to be safe.
const TOKEN_TTL_MS = 55 * 60 * 1000;

function storeAccessToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_TTL_MS));
}

function readValidStoredToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = Number(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || 0);
  if (token && Date.now() < expiry) return token;
  return null;
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      storeAccessToken(credential.accessToken);
    }
    return result;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

/**
 * Returns a valid Google OAuth access token for the Classroom API.
 *
 * Google access tokens expire after ~1 hour and Firebase does not refresh
 * them, so the token captured at sign-in is frequently stale by the time the
 * user clicks "Sync Classroom". When the stored token is missing or expired we
 * transparently re-run the Google popup to mint a fresh one.
 */
export const getClassroomToken = async (): Promise<string> => {
  const existing = readValidStoredToken();
  if (existing) return existing;

  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  if (!accessToken) {
    throw new Error('Google did not return a Classroom access token.');
  }
  storeAccessToken(accessToken);
  return accessToken;
};

export const logOut = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  return signOut(auth);
};

export { app, auth, db };
