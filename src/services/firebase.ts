import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import { BeneficiaryProfile } from '../types';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  role?: 'beneficiary' | 'admin';
  /** true when the user was created by the offline/local fallback and has no real Firebase session */
  isLocal?: boolean;
}

// Admin accounts. This is only used to decide what the UI shows;
// the real enforcement is in firestore.rules (same email list).
export const ADMIN_EMAILS = ['ayushgupt640@gmail.com'];

export const isAdminEmail = (email?: string | null): boolean =>
  Boolean(email) && ADMIN_EMAILS.includes(String(email).trim().toLowerCase());

/** Admin only when signed in through real Firebase Auth (never from the local fallback). */
export const isAdminUser = (user?: AppUser | null): boolean =>
  Boolean(user) && !user!.isLocal && isAdminEmail(user!.email);

const env = (import.meta.env || {}) as Record<string, string | undefined>;

// Web API keys are public identifiers for Firebase; access is controlled by Auth + firestore.rules.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCR_ubCbU3OHM2eM9_JCDkLzPnpEgH47ww',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'linear-ellipse-455407-b3.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'linear-ellipse-455407-b3',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'linear-ellipse-455407-b3.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '599888155980',
  appId: env.VITE_FIREBASE_APP_ID || '1:599888155980:web:8a879438d1ad2cf1586be9'
};

// The Firestore database provisioned for this project is a *named* database
// (see firebase-applet-config.json). getFirestore(app) alone would point at "(default)".
const FIRESTORE_DATABASE_ID =
  env.VITE_FIRESTORE_DATABASE_ID || 'ai-studio-e27aa460-fbb8-4c34-baae-a64c76d70446';

export const isRealFirebaseConfigured = true;

const LOCAL_USER_KEY = 'jeevika_auth_user_v1';
const DEVICE_UID_KEY = 'jeevika_device_uid_v1';

let cachedApp: any = null;
let cachedDb: any = null;

function getFirebaseApp() {
  if (!cachedApp) {
    cachedApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return cachedApp;
}

function getDb() {
  if (!cachedDb) {
    cachedDb = getFirestore(getFirebaseApp(), FIRESTORE_DATABASE_ID);
  }
  return cachedDb;
}

/** Firestore rejects `undefined` values; drop them (and keep the data JSON-safe). */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

class AuthService {
  private listeners: ((user: AppUser | null) => void)[] = [];
  private currentUser: AppUser | null = null;
  private auth: any = null;
  private authReady: Promise<void>;
  private resolveReady: () => void = () => {};

  constructor() {
    this.authReady = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });
    this.init();
  }

  private toAppUser(fbUser: FirebaseUser): AppUser {
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      isAnonymous: fbUser.isAnonymous,
      role: isAdminEmail(fbUser.email) ? 'admin' : 'beneficiary'
    };
  }

  private init() {
    if (typeof window === 'undefined') {
      this.resolveReady();
      return;
    }

    // Restore a previously created *local* (offline) user only. Real sessions come from Firebase below,
    // and an admin role is never restored from localStorage.
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppUser;
        if (parsed && parsed.isLocal) {
          this.currentUser = { ...parsed, role: 'beneficiary' };
        } else {
          localStorage.removeItem(LOCAL_USER_KEY);
        }
      }
    } catch (e) {}

    if (isRealFirebaseConfigured) {
      try {
        this.auth = getAuth(getFirebaseApp());

        onAuthStateChanged(this.auth, (fbUser: FirebaseUser | null) => {
          if (fbUser) {
            this.currentUser = this.toAppUser(fbUser);
          } else if (!this.currentUser?.isLocal) {
            this.currentUser = null;
          }
          this.resolveReady();
          this.notifyListeners();
        });
      } catch (err) {
        console.warn('Firebase init error, using local-only mode:', err);
        this.resolveReady();
      }
    } else {
      this.resolveReady();
    }
  }

  public subscribe(callback: (user: AppUser | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    try {
      if (this.currentUser?.isLocal) {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(LOCAL_USER_KEY);
      }
    } catch (e) {}
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  public getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  /**
   * Returns the uid of a real Firebase user, signing in anonymously when nobody is signed in.
   * Resolves to null when Firebase Auth is unavailable (offline, Anonymous sign-in disabled, ...).
   * Anonymous sign-in is what lets guests save progress without creating an account.
   */
  public async ensureCloudUid(): Promise<string | null> {
    if (!this.auth) return null;
    try {
      await this.authReady;
      if (this.auth.currentUser) return this.auth.currentUser.uid;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
      const res = await signInAnonymously(this.auth);
      return res.user.uid;
    } catch (e: any) {
      console.warn('Anonymous Firebase sign-in unavailable, keeping data on device:', e?.code || e?.message || e);
      return null;
    }
  }

  public async loginWithEmail(email: string, pass: string): Promise<AppUser> {
    const cleanEmail = email.trim().toLowerCase();
    const adminAttempt = isAdminEmail(cleanEmail);

    if (isRealFirebaseConfigured && this.auth) {
      try {
        const res = await signInWithEmailAndPassword(this.auth, cleanEmail, pass);
        const user = this.toAppUser(res.user);
        this.currentUser = user;
        this.notifyListeners();
        return user;
      } catch (err: any) {
        const code: string = err?.code || '';
        if (adminAttempt) {
          if (code === 'auth/network-request-failed') {
            throw new Error('इंटरनेट कनेक्शन उपलब्ध नहीं है। (Network error — admin login needs internet)');
          }
          if (code === 'auth/operation-not-allowed') {
            throw new Error('Firebase Console में Email/Password sign-in चालू करें। (Enable Email/Password in Firebase Authentication)');
          }
          throw new Error('गलत ईमेल या पासवर्ड। (Invalid admin email or password)');
        }
        console.warn('Firebase signIn failed, attempting local fallback:', err?.message);
      }
    } else if (adminAttempt) {
      throw new Error('एडमिन लॉगिन के लिए इंटरनेट आवश्यक है। (Admin login requires an online Firebase connection)');
    }

    // Local simulated auth: beneficiary only, never admin.
    const user: AppUser = {
      uid: 'user_' + Math.abs(cleanEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      isAnonymous: false,
      role: 'beneficiary',
      isLocal: true
    };
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  /** Google sign-in. Google accounts always have a verified email, which firestore.rules require for admin. */
  public async loginWithGoogle(): Promise<AppUser> {
    if (!this.auth) {
      throw new Error('Google लॉगिन के लिए इंटरनेट आवश्यक है। (Google sign-in needs an online Firebase connection)');
    }
    try {
      const res = await signInWithPopup(this.auth, new GoogleAuthProvider());
      const user = this.toAppUser(res.user);
      this.currentUser = user;
      this.notifyListeners();
      return user;
    } catch (err: any) {
      const code: string = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        throw new Error('Google विंडो बंद कर दी गई। (Sign-in cancelled)');
      }
      if (code === 'auth/unauthorized-domain') {
        throw new Error('यह वेबसाइट Firebase Authorized domains में नहीं है। (Add this domain in Firebase Authentication → Settings → Authorized domains)');
      }
      if (code === 'auth/operation-not-allowed') {
        throw new Error('Firebase Console में Google sign-in चालू करें। (Enable Google provider in Firebase Authentication)');
      }
      throw new Error('Google लॉगिन विफल रहा। (Google sign-in failed)');
    }
  }

  public async registerWithEmail(email: string, pass: string, name?: string): Promise<AppUser> {
    if (isRealFirebaseConfigured && this.auth) {
      const res = await createUserWithEmailAndPassword(this.auth, email.trim(), pass);
      const user: AppUser = { ...this.toAppUser(res.user), displayName: name || res.user.displayName };
      this.currentUser = user;
      this.notifyListeners();
      return user;
    }

    const user: AppUser = {
      uid: 'user_' + Date.now(),
      email,
      displayName: name || email.split('@')[0],
      isAnonymous: false,
      role: 'beneficiary',
      isLocal: true
    };
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  public async loginAsGuest(): Promise<AppUser> {
    if (isRealFirebaseConfigured && this.auth) {
      try {
        const res = await signInAnonymously(this.auth);
        const user: AppUser = { ...this.toAppUser(res.user), displayName: 'Guest Beneficiary' };
        this.currentUser = user;
        this.notifyListeners();
        return user;
      } catch (e) {
        console.warn('Anonymous sign-in failed, using local guest:', e);
      }
    }

    const user: AppUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: null,
      displayName: 'Guest Beneficiary',
      isAnonymous: true,
      role: 'beneficiary',
      isLocal: true
    };
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  public async logout(): Promise<void> {
    if (isRealFirebaseConfigured && this.auth) {
      await fbSignOut(this.auth);
    }
    this.currentUser = null;
    this.notifyListeners();
  }

  public async deleteAccount(): Promise<void> {
    if (isRealFirebaseConfigured && this.auth && this.auth.currentUser) {
      await this.auth.currentUser.delete();
    }
    this.currentUser = null;
    this.notifyListeners();
  }
}

export const authService = new AuthService();

function deviceUid(): string {
  try {
    const stored = localStorage.getItem(DEVICE_UID_KEY);
    if (stored) return stored;
    const uid = 'device_user_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem(DEVICE_UID_KEY, uid);
    return uid;
  } catch {
    return 'device_user_default';
  }
}

// Firestore User Profile Sync
export const firestoreService = {
  /**
   * Saves the profile under users/{uid}. Cloud writes only happen for a real Firebase session
   * (signed-in or anonymous guest) because firestore.rules require request.auth.uid == userId.
   * Without one, the profile stays on the device.
   */
  async syncLocalProfileToFirestore(profile: BeneficiaryProfile): Promise<string> {
    const cloudUid = await authService.ensureCloudUid();
    const uid = cloudUid || authService.getCurrentUser()?.uid || deviceUid();
    await this.saveUserProfile(uid, profile, true, Boolean(cloudUid));
    return uid;
  },

  async saveUserProfile(
    uid: string,
    profile: BeneficiaryProfile,
    consentSaved: boolean = true,
    cloudAllowed: boolean = true
  ) {
    const payload = clean({
      ...profile,
      consentSaved,
      updatedAt: new Date().toISOString()
    });

    if (isRealFirebaseConfigured && cloudAllowed) {
      try {
        await setDoc(doc(getDb(), 'users', uid), payload, { merge: true });
        return true;
      } catch (e: any) {
        console.warn('Firestore cloud save failed, storing locally:', e?.code || e?.message || e);
      }
    }

    try {
      localStorage.setItem(`jeevika_firestore_user_${uid}`, JSON.stringify(payload));
      return true;
    } catch (e) {
      return false;
    }
  },

  async getUserProfile(uid: string): Promise<BeneficiaryProfile | null> {
    if (isRealFirebaseConfigured) {
      try {
        const snap = await getDoc(doc(getDb(), 'users', uid));
        if (snap.exists()) {
          return snap.data() as BeneficiaryProfile;
        }
      } catch (e: any) {
        console.warn('Firestore fetch failed:', e?.code || e?.message || e);
      }
    }

    try {
      const data = localStorage.getItem(`jeevika_firestore_user_${uid}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async deleteUserData(uid: string): Promise<boolean> {
    if (isRealFirebaseConfigured) {
      try {
        await deleteDoc(doc(getDb(), 'users', uid));
      } catch (e) {}
    }

    try {
      localStorage.removeItem(`jeevika_firestore_user_${uid}`);
      return true;
    } catch (e) {
      return false;
    }
  }
};

export type ContentCollection = 'opportunities' | 'pathways' | 'training_centers';

/**
 * Admin-managed content. Reads are public (see firestore.rules); writes require an admin session.
 * Every call fails soft so the app keeps working offline with its built-in data.
 */
export const contentService = {
  async list<T = any>(name: ContentCollection): Promise<T[]> {
    try {
      const snap = await getDocs(collection(getDb(), name));
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as T);
    } catch (e: any) {
      console.warn(`Could not load ${name} from Firestore:`, e?.code || e?.message || e);
      return [];
    }
  },

  async upsert(name: ContentCollection, id: string, data: Record<string, any>): Promise<boolean> {
    try {
      await setDoc(doc(getDb(), name, id), clean({ ...data, id, updatedAt: new Date().toISOString() }), { merge: true });
      return true;
    } catch (e: any) {
      console.warn(`Could not save ${name}/${id}:`, e?.code || e?.message || e);
      return false;
    }
  },

  async remove(name: ContentCollection, id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(getDb(), name, id));
      return true;
    } catch (e: any) {
      console.warn(`Could not delete ${name}/${id}:`, e?.code || e?.message || e);
      return false;
    }
  }
};
