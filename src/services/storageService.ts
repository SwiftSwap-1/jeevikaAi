import { BeneficiaryProfile, LocationLivelihoodData } from '../types';

const DATA_CACHE_NAME = 'jeevika-data-v1.4.0';

const STORAGE_KEYS = {
  PROFILE: 'jeevika_profile_v1',
  SHORTLIST: 'jeevika_shortlist_v1',
  ROADMAP_PROGRESS: 'jeevika_roadmap_progress_v1',
  CURRENT_STEP: 'jeevika_current_step_v1',
  LIVELIHOOD_DATA: 'jeevika_location_livelihood_cache_v2',
};

export const storageService = {
  async saveProfile(profile: BeneficiaryProfile): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open(DATA_CACHE_NAME);
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
        caches.open(DATA_CACHE_NAME).then(cache => cache.delete('/api/offline-profile'));
      }
    } catch (e) {
      // Ignore
    }
  },

  /**
   * Persists essential livelihood opportunities, training centers, and schemes
   * to both LocalStorage and the Service Worker's Cache API for instant offline availability.
   */
  async saveCachedLivelihoodData(data: LocationLivelihoodData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.LIVELIHOOD_DATA, JSON.stringify(data));
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open(DATA_CACHE_NAME);
        const response = new Response(
          JSON.stringify({
            fallback: false,
            offline: true,
            cached: true,
            result: data
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Jeevika-Offline': 'active'
            }
          }
        );
        await cache.put('/api/livelihood-data', response);
      }
    } catch (e) {
      console.warn('Cache API livelihood save failed:', e);
    }
  },

  /**
   * Retrieves livelihood opportunities from Cache API or LocalStorage when offline.
   */
  async loadCachedLivelihoodData(): Promise<LocationLivelihoodData | null> {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open(DATA_CACHE_NAME);
        const match = await cache.match('/api/livelihood-data');
        if (match) {
          const payload = await match.json();
          if (payload?.result) return payload.result as LocationLivelihoodData;
          return payload as LocationLivelihoodData;
        }
      }
    } catch (err) {
      console.warn('Cache API livelihood read notice:', err);
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LIVELIHOOD_DATA);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
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
