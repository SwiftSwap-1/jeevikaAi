import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { BeneficiaryProfile } from '../types';
import appletConfig from '../../firebase-applet-config.json';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  role?: 'beneficiary' | 'admin';
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (appletConfig?.apiKey || ''),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (appletConfig?.authDomain || ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (appletConfig?.projectId || ''),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (appletConfig?.storageBucket || ''),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (appletConfig?.messagingSenderId || ''),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (appletConfig?.appId || '')
};

// Real Firebase live persistence enabled only when a valid API key and project ID are configured via environment
export const isRealFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.trim().length > 10
);

// Fallback user state in localStorage when real Firebase credentials are not yet added
const LOCAL_USER_KEY = 'jeevika_auth_user_v1';

class AuthService {
  private listeners: ((user: AppUser | null) => void)[] = [];
  private currentUser: AppUser | null = null;
  private auth: any = null;
  private db: any = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load initial local user if any
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    } catch (e) {}

    if (isRealFirebaseConfigured) {
      try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        this.auth = getAuth(app);
        this.db = getFirestore(app);

        onAuthStateChanged(this.auth, (fbUser: FirebaseUser | null) => {
          if (fbUser) {
            this.currentUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              isAnonymous: fbUser.isAnonymous,
              role: fbUser.email?.includes('admin') ? 'admin' : 'beneficiary'
            };
          } else {
            this.currentUser = null;
          }
          this.notifyListeners();
        });
      } catch (err) {
        console.warn('Real Firebase init error, falling back to local adapter:', err);
      }
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
    if (this.currentUser) {
      try {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(this.currentUser));
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem(LOCAL_USER_KEY);
      } catch (e) {}
    }
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  public getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  public async loginWithEmail(email: string, pass: string): Promise<AppUser> {
    const cleanEmail = email.trim().toLowerCase();

    // Dedicated Super Admin Credentials Check
    if (cleanEmail === 'ayushgupt640@gmail.com') {
      if (pass !== '7905') {
        throw new Error('गलत पासवर्ड! कृपया सही एडमिन पासवर्ड दर्ज करें। (Invalid admin password)');
      }

      const adminUser: AppUser = {
        uid: 'admin_ayush_super',
        email: 'ayushgupt640@gmail.com',
        displayName: 'Ayush Gupta (Super Admin)',
        isAnonymous: false,
        role: 'admin',
      };
      this.currentUser = adminUser;
      this.notifyListeners();
      return adminUser;
    }

    if (isRealFirebaseConfigured && this.auth) {
      try {
        const res = await signInWithEmailAndPassword(this.auth, email, pass);
        return {
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          isAnonymous: res.user.isAnonymous,
          role: (res.user.email?.toLowerCase() === 'ayushgupt640@gmail.com' || res.user.email?.includes('admin')) ? 'admin' : 'beneficiary'
        };
      } catch (err: any) {
        // Fallback to local if Firebase fails
        console.warn('Firebase signIn failed, attempting local fallback:', err.message);
      }
    }

    // Local simulated auth
    const user: AppUser = {
      uid: 'user_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
      email,
      displayName: email.split('@')[0],
      isAnonymous: false,
      role: (cleanEmail === 'ayushgupt640@gmail.com' || cleanEmail.includes('admin')) ? 'admin' : 'beneficiary'
    };
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  public async registerWithEmail(email: string, pass: string, name?: string): Promise<AppUser> {
    if (isRealFirebaseConfigured && this.auth) {
      const res = await createUserWithEmailAndPassword(this.auth, email, pass);
      return {
        uid: res.user.uid,
        email: res.user.email,
        displayName: name || res.user.displayName,
        isAnonymous: false,
        role: email.includes('admin') ? 'admin' : 'beneficiary'
      };
    }

    const user: AppUser = {
      uid: 'user_' + Date.now(),
      email,
      displayName: name || email.split('@')[0],
      isAnonymous: false,
      role: email.includes('admin') ? 'admin' : 'beneficiary'
    };
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  public async loginAsGuest(): Promise<AppUser> {
    if (isRealFirebaseConfigured && this.auth) {
      const res = await signInAnonymously(this.auth);
      return {
        uid: res.user.uid,
        email: null,
        displayName: 'Guest Beneficiary',
        isAnonymous: true,
        role: 'beneficiary'
      };
    }

    const user: AppUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: null,
      displayName: 'Guest Beneficiary',
      isAnonymous: true,
      role: 'beneficiary'
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

// Firestore User Profile Sync
export const firestoreService = {
  async syncLocalProfileToFirestore(profile: BeneficiaryProfile): Promise<string> {
    const currentUser = authService.getCurrentUser();
    let uid: string = currentUser?.uid || '';
    if (!uid) {
      if (typeof window !== 'undefined') {
        const storedUid = localStorage.getItem('jeevika_device_uid_v1');
        if (storedUid) {
          uid = storedUid;
        } else {
          uid = 'device_user_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
          localStorage.setItem('jeevika_device_uid_v1', uid);
        }
      } else {
        uid = 'device_user_default';
      }
    }
    await this.saveUserProfile(uid, profile);
    return uid;
  },

  async saveUserProfile(uid: string, profile: BeneficiaryProfile, consentSaved: boolean = true) {
    const payload = {
      ...profile,
      consentSaved,
      updatedAt: new Date().toISOString()
    };

    if (isRealFirebaseConfigured) {
      try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const db = getFirestore(app);
        await setDoc(doc(db, 'users', uid), payload, { merge: true });
        console.log('Firebase Firestore profile sync successful for UID:', uid);
        return true;
      } catch (e: any) {
        console.warn('Firestore cloud save failed, storing locally:', e?.message || e);
      }
    }

    // Local storage fallback for user profile
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
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          return snap.data() as BeneficiaryProfile;
        }
      } catch (e: any) {
        console.warn('Firestore fetch failed:', e?.message || e);
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
        const app = getApp();
        const db = getFirestore(app);
        await deleteDoc(doc(db, 'users', uid));
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
