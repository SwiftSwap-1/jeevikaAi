import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, increment, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { getDb, isRealFirebaseConfigured } from './firebase';
import { HeroSlide, MediaAssetRecord, ShowcaseProduct } from '../types';

// Cloudinary Configuration (Cloud Name and Upload Preset provided by user)
export const CLOUDINARY_CLOUD_NAME =
  (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || 'kvyah2au';
export const CLOUDINARY_UPLOAD_PRESET =
  (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || 'jeevikaai';

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Uploads an image file to Cloudinary with real-time progress callbacks.
 * Returns the secure HTTPS URL of the uploaded image.
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'banner',
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    if (folder) {
      formData.append('folder', `jeevika/${folder}`);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_UPLOAD_URL);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new Error('Cloudinary response did not return secure_url'));
          }
        } catch (err: any) {
          reject(new Error('Failed to parse Cloudinary response: ' + err.message));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData?.error?.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary image upload'));
    xhr.send(formData);
  });
}

/**
 * Extracts AI-style keyword tags from filename.
 */
export function generateTagsFromFilename(filename: string): string[] {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  return nameWithoutExt
    .toLowerCase()
    .split(/[^a-z0-9]/g)
    .filter((w) => w.length > 2);
}

// ─────────────────────────────────────────────────────────────
// CURATED INITIAL HERO CAROUSEL SLIDES (Empty by default, admin only)
// ─────────────────────────────────────────────────────────────
export const DEFAULT_HERO_SLIDES: HeroSlide[] = [];

// ─────────────────────────────────────────────────────────────
// CURATED LOCAL BUSINESS / ARTISAN SHOWCASE ITEMS (Empty by default, admin only)
// ─────────────────────────────────────────────────────────────
export const INITIAL_SHOWCASE_PRODUCTS: ShowcaseProduct[] = [];

// ─────────────────────────────────────────────────────────────
// FIRESTORE MEDIA MANAGEMENT HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Sanitizes an object before sending to Firestore by omitting any fields with `undefined` values.
 * Firestore throws a runtime error if any property is undefined.
 */
function cleanForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export const mediaStorageService = {
  /**
   * Rescues and syncs any orphaned media stored only in localStorage to Firestore.
   * This handles any uploads from previous sessions that failed Firestore writes due to undefined fields.
   */
  async syncLocalMediaToFirestore(): Promise<number> {
    if (!isRealFirebaseConfigured) return 0;

    try {
      const localStr = localStorage.getItem('jeevika_media_assets_v1');
      if (!localStr) return 0;
      const localAssets: MediaAssetRecord[] = JSON.parse(localStr);
      if (!Array.isArray(localAssets) || localAssets.length === 0) return 0;

      // Get existing firestore docs to compare
      const snap = await getDocs(collection(getDb(), 'media'));
      const firestoreIds = new Set(snap.docs.map((d) => d.id));
      const firestoreUrls = new Set(snap.docs.map((d) => d.data().url));

      let syncedCount = 0;
      const updatedLocal: MediaAssetRecord[] = [];

      for (const asset of localAssets) {
        // If it's a temporary ID or its URL does not exist in Firestore, push it to Firestore
        const isLocalOnly = asset.id.startsWith('media_') || (!firestoreIds.has(asset.id) && !firestoreUrls.has(asset.url));
        if (isLocalOnly) {
          try {
            const raw = {
              url: asset.url,
              folder: asset.folder || 'banner',
              name: asset.name || 'Untitled',
              tags: asset.tags || ['जीविका अवसर'],
              used: asset.used || 1,
              time: asset.time || Date.now(),
              ctaUrl: asset.ctaUrl || null,
              ctaLabel: asset.ctaLabel || null,
              order: typeof asset.order === 'number' ? asset.order : 0,
              active: asset.active !== false,
              createdAt: serverTimestamp(),
            };
            const docRef = await addDoc(collection(getDb(), 'media'), cleanForFirestore(raw));
            updatedLocal.push({ ...asset, id: docRef.id });
            firestoreIds.add(docRef.id);
            firestoreUrls.add(asset.url);
            syncedCount++;
          } catch (err) {
            console.warn('Failed to sync orphan local asset to Firestore:', err);
            updatedLocal.push(asset);
          }
        } else {
          updatedLocal.push(asset);
        }
      }

      if (syncedCount > 0) {
        localStorage.setItem('jeevika_media_assets_v1', JSON.stringify(updatedLocal));
      }
      return syncedCount;
    } catch (e) {
      console.warn('syncLocalMediaToFirestore error:', e);
      return 0;
    }
  },

  /**
   * Subscribes to real-time changes in the Firestore `media` collection.
   * Ensures instant cross-device updates for banners and media assets.
   */
  subscribeMediaAssets(callback: (assets: MediaAssetRecord[]) => void): () => void {
    if (!isRealFirebaseConfigured) return () => {};

    try {
      const q = collection(getDb(), 'media');
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list: MediaAssetRecord[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              url: data.url,
              folder: data.folder || 'banner',
              name: data.name || 'Untitled',
              tags: data.tags || [],
              used: data.used || 0,
              time: data.time || Date.now(),
              createdAt: data.createdAt,
              ctaUrl: data.ctaUrl || undefined,
              ctaLabel: data.ctaLabel || undefined,
              order: typeof data.order === 'number' ? data.order : undefined,
              active: data.active !== false,
            });
          });

          // Only update local cache when list is non-empty to avoid clearing unsynced local media
          if (list.length > 0) {
            try {
              localStorage.setItem('jeevika_media_assets_v1', JSON.stringify(list));
            } catch {}
          }

          callback(list);
        },
        (err) => {
          console.warn('Firestore media onSnapshot error:', err);
        }
      );
      return unsub;
    } catch (err) {
      console.warn('Could not setup media subscription:', err);
      return () => {};
    }
  },

  /**
   * Loads all media uploaded by admin or users.
   */
  async getMediaAssets(): Promise<MediaAssetRecord[]> {
    if (isRealFirebaseConfigured) {
      try {
        const snap = await getDocs(collection(getDb(), 'media'));
        if (!snap.empty) {
          const list: MediaAssetRecord[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              url: data.url,
              folder: data.folder || 'banner',
              name: data.name || 'Untitled',
              tags: data.tags || [],
              used: data.used || 0,
              time: data.time || Date.now(),
              createdAt: data.createdAt,
              ctaUrl: data.ctaUrl || undefined,
              ctaLabel: data.ctaLabel || undefined,
              order: typeof data.order === 'number' ? data.order : undefined,
              active: data.active !== false,
            });
          });
          try {
            localStorage.setItem('jeevika_media_assets_v1', JSON.stringify(list));
          } catch {}
          return list;
        }
      } catch (err) {
        console.warn('Could not fetch media from Firestore:', err);
      }
    }

    try {
      const local = localStorage.getItem('jeevika_media_assets_v1');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}

    return [];
  },

  /**
   * Saves a newly uploaded media record to Firestore and localStorage.
   */
  async saveMediaAsset(asset: Omit<MediaAssetRecord, 'id'>): Promise<string> {
    const rawPayload = {
      url: asset.url,
      folder: asset.folder || 'banner',
      name: asset.name || 'Untitled',
      tags: asset.tags || ['जीविका अवसर'],
      used: asset.used ?? 1,
      time: asset.time || Date.now(),
      ctaUrl: asset.ctaUrl ? asset.ctaUrl.trim() : null,
      ctaLabel: asset.ctaLabel ? asset.ctaLabel.trim() : null,
      order: typeof asset.order === 'number' ? asset.order : 0,
      active: asset.active !== false,
      createdAt: serverTimestamp(),
    };

    const payload = cleanForFirestore(rawPayload);

    let id = 'media_' + Date.now();
    if (isRealFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(getDb(), 'media'), payload);
        id = docRef.id;
      } catch (err) {
        console.error('Critical: Could not save media asset to Firestore:', err);
      }
    }

    try {
      const existing = await this.getMediaAssets();
      existing.unshift({ ...asset, id });
      localStorage.setItem('jeevika_media_assets_v1', JSON.stringify(existing));
    } catch {}

    return id;
  },

  /**
   * Increments the usage count of a media item in Firestore.
   */
  async incrementUsage(id: string): Promise<void> {
    if (isRealFirebaseConfigured) {
      try {
        await updateDoc(doc(getDb(), 'media', id), {
          used: increment(1),
        });
      } catch {}
    }
  },

  /**
   * Deletes a media asset by doc ID.
   */
  async deleteMediaAsset(id: string): Promise<boolean> {
    if (isRealFirebaseConfigured) {
      try {
        await deleteDoc(doc(getDb(), 'media', id));
      } catch (err) {
        console.warn('Could not delete media doc from Firestore:', err);
      }
    }

    try {
      const existing = await this.getMediaAssets();
      const filtered = existing.filter((m) => m.id !== id);
      localStorage.setItem('jeevika_media_assets_v1', JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Updates a media asset by doc ID.
   */
  async updateMediaAsset(id: string, asset: Partial<MediaAssetRecord>): Promise<void> {
    const cleaned = cleanForFirestore({
      ...asset,
      ctaUrl: asset.ctaUrl !== undefined ? (asset.ctaUrl ? asset.ctaUrl.trim() : null) : undefined,
      ctaLabel: asset.ctaLabel !== undefined ? (asset.ctaLabel ? asset.ctaLabel.trim() : null) : undefined,
    });

    if (isRealFirebaseConfigured) {
      try {
        await updateDoc(doc(getDb(), 'media', id), cleaned as any);
      } catch (err) {
        console.warn('Could not update media asset in Firestore:', err);
      }
    }
    try {
      const existing = await this.getMediaAssets();
      const updated = existing.map((m) => (m.id === id ? { ...m, ...asset } : m));
      localStorage.setItem('jeevika_media_assets_v1', JSON.stringify(updated));
    } catch {}
  },

  /**
   * Gets current hero banner slides (combines default with admin uploaded hero_banner media).
   * Sorted strictly by admin-defined order index.
   */
  async getHeroSlides(): Promise<HeroSlide[]> {
    const media = await this.getMediaAssets();
    const bannerMedia = media.filter(
      (m) => (m.folder === 'banner' || m.folder === 'hero_banner') && m.active !== false
    );

    // Sort by admin-specified position order
    bannerMedia.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 999;
      const orderB = typeof b.order === 'number' ? b.order : 999;
      return orderA - orderB;
    });

    if (bannerMedia.length > 0) {
      const dynamicSlides: HeroSlide[] = bannerMedia.map((m, idx) => {
        const cleanTags = (m.tags || []).filter(
          (t) =>
            t &&
            t !== 'admin-uploaded' &&
            t !== 'banner' &&
            t !== 'hero_banner' &&
            !t.toLowerCase().includes('admin') &&
            !t.toLowerCase().includes('upload')
        );

        return {
          id: m.id,
          imageUrl: m.url,
          title: m.name.replace(/\.[^/.]+$/, ''),
          subtitle:
            cleanTags.length > 0
              ? cleanTags.join(' • ')
              : 'जीविका प्रमाणित अवसर',
          tag: m.folder === 'hero_banner' ? 'विशेष' : 'नवीनतम',
          ctaUrl: m.ctaUrl,
          ctaLabel: m.ctaLabel,
          order: typeof m.order === 'number' ? m.order : idx,
          active: m.active !== false,
        };
      });
      return dynamicSlides;
    }

    return DEFAULT_HERO_SLIDES;
  },

  /**
   * Reorder media assets (e.g. hero banner slides) and persist to Firestore and localStorage
   */
  async reorderMedia(items: { id: string; order: number }[]): Promise<void> {
    const media = await this.getMediaAssets();
    const orderMap = new Map(items.map((it) => [it.id, it.order]));

    const updated = media.map((m) => {
      if (orderMap.has(m.id)) {
        return { ...m, order: orderMap.get(m.id)! };
      }
      return m;
    });

    try {
      localStorage.setItem('jeevika_media_assets_v1', JSON.stringify(updated));
    } catch {}

    if (isRealFirebaseConfigured) {
      try {
        const db = getDb();
        await Promise.allSettled(
          items.map((it) => updateDoc(doc(db, 'media', it.id), { order: it.order }))
        );
      } catch (err) {
        console.warn('Could not reorder media in Firestore:', err);
      }
    }
  },

  /**
   * Local Business Showcase Products CRUD
   */
  async getShowcaseProducts(): Promise<ShowcaseProduct[]> {
    if (isRealFirebaseConfigured) {
      try {
        const snap = await getDocs(collection(getDb(), 'showcase'));
        if (!snap.empty) {
          const list: ShowcaseProduct[] = [];
          snap.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as any) });
          });
          return list;
        }
      } catch (err) {
        console.warn('Could not load showcase from Firestore:', err);
      }
    }

    try {
      const local = localStorage.getItem('jeevika_showcase_products_v1');
      if (local) return JSON.parse(local);
    } catch {}

    return INITIAL_SHOWCASE_PRODUCTS;
  },

  async addShowcaseProduct(prod: Omit<ShowcaseProduct, 'id'>): Promise<string> {
    let id = 'show_' + Date.now();
    if (isRealFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(getDb(), 'showcase'), {
          ...prod,
          createdAt: serverTimestamp(),
        });
        id = docRef.id;
      } catch (err) {
        console.warn('Could not save showcase to Firestore:', err);
      }
    }

    try {
      const existing = await this.getShowcaseProducts();
      existing.unshift({ ...prod, id });
      localStorage.setItem('jeevika_showcase_products_v1', JSON.stringify(existing));
    } catch {}

    return id;
  },

  async deleteShowcaseProduct(id: string): Promise<boolean> {
    if (isRealFirebaseConfigured) {
      try {
        await deleteDoc(doc(getDb(), 'showcase', id));
      } catch (err) {
        console.warn('Could not delete showcase doc from Firestore:', err);
      }
    }

    try {
      const existing = await this.getShowcaseProducts();
      const filtered = existing.filter((p) => p.id !== id);
      localStorage.setItem('jeevika_showcase_products_v1', JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  },

  async updateShowcaseProduct(id: string, prod: Partial<ShowcaseProduct>): Promise<void> {
    if (isRealFirebaseConfigured) {
      try {
        await updateDoc(doc(getDb(), 'showcase', id), prod as any);
      } catch (err) {
        console.warn('Could not update showcase doc in Firestore:', err);
      }
    }
    try {
      const existing = await this.getShowcaseProducts();
      const updated = existing.map((p) => (p.id === id ? { ...p, ...prod } : p));
      localStorage.setItem('jeevika_showcase_products_v1', JSON.stringify(updated));
    } catch {}
  },
};
