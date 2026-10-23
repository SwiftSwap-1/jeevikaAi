import { BeneficiaryProfile } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'jeevika_profile_v1',
  SHORTLIST: 'jeevika_shortlist_v1',
  ROADMAP_PROGRESS: 'jeevika_roadmap_progress_v1',
  CURRENT_STEP: 'jeevika_current_step_v1',
};

export const storageService = {
  async saveProfile(profile: BeneficiaryProfile): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open('jeevika-data-v1.3.0');
        const response = new Response(JSON.stringify(profile), {
          headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('/api/offline-profile', response);
      }
    } catch (e) {
      console.warn('LocalStorage or Cache API save failed:', e);
    }
  },

  loadProfile(): BeneficiaryProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  clearProfile(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.open('jeevika-data-v1.3.0').then(cache => cache.delete('/api/offline-profile'));
      }
    } catch (e) {
      // Ignore
    }
  },

  saveShortlist(shortlist: Record<string, boolean>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHORTLIST, JSON.stringify(shortlist));
    } catch (e) {
      // Ignore
    }
  },

  loadShortlist(): Record<string, boolean> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHORTLIST);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  saveProgress(doneStages: Record<string, boolean>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ROADMAP_PROGRESS, JSON.stringify(doneStages));
    } catch (e) {
      // Ignore
    }
  },

  loadProgress(): Record<string, boolean> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROADMAP_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },
};
