import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { getDb, isRealFirebaseConfigured } from './firebase';
import { HeroSlide, MediaAssetRecord, ShowcaseProduct } from '../types';

// Cloudinary Configuration (Cloud Name and Upload Preset from User's Media Studio)
export const CLOUDINARY_CLOUD_NAME =
  (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || 'dm9hqkipf';
export const CLOUDINARY_UPLOAD_PRESET =
  (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || 'e3vvwepk';

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
// CURATED INITIAL HERO CAROUSEL SLIDES (Rural & Livelihood Skills)
// ─────────────────────────────────────────────────────────────
export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide_1',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
    title: 'सिलाई व परिधान निर्माण',
    subtitle: 'NSQF लेवल 4 सिलाई मशीन ऑपरेटर एवं बुटीक स्वरोजगार',
    tag: 'हुनर विकास',
    linkView: 'training',
  },
  {
    id: 'slide_2',
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    title: 'सोलर रूफटॉप एवं तकनीशियन',
    subtitle: 'पीएम सूर्य घर मुफ्त बिजली योजना के अंतर्गत प्रमाणित सोलर तकनीशियन',
    tag: 'हरित ऊर्जा',
    linkView: 'opportunities',
  },
  {
    id: 'slide_3',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    title: 'डिजिटल सेवा व सीएससी केंद्र',
    subtitle: 'ई-गवर्नेंस, ऑनलाइन बिलिंग और बैंकिंग कॉरेस्पोंडेंट (BC Sakhi)',
    tag: 'डिजिटल साक्षरता',
    linkView: 'opportunities',
  },
  {
    id: 'slide_4',
    imageUrl: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1200&q=80',
    title: 'ग्रामीण हस्तशिल्प व स्वयं सहायता समूह',
    subtitle: 'मिट्टी के बर्तन, खादी, कढ़ाई एवं हथकरघा उत्पाद बाज़ार से सीधे जुड़े',
    tag: 'स्थानीय उत्पाद',
    linkView: 'training',
  },
];

// ─────────────────────────────────────────────────────────────
// CURATED LOCAL BUSINESS / ARTISAN SHOWCASE ITEMS
// ─────────────────────────────────────────────────────────────
export const INITIAL_SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: 'show_001',
    title: 'हस्तनिर्मित कढ़ाई कुर्ती व दुपट्टा सेट',
    description: 'शुद्ध सूती कपड़े पर हाथ से की गई चिकनकारी और कसीदाकारी। स्वयं सहायता समूह दीदियों द्वारा तैयार।',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    price: '₹ 850',
    category: 'हस्तशिल्प व कपड़े',
    artisanName: 'सुनीता देवी (उजाला SHG)',
    location: 'महाराजगंज, उत्तर प्रदेश',
    contactPhone: '+91 98391 23456',
    createdAt: '2026-10-18T10:00:00Z',
  },
  {
    id: 'show_002',
    title: 'जैविक आँवला व आम का पारंपरिक अचार',
    description: 'बिना किसी केमिकल के सरसों के तेल व घरेलू मसालों से बना शुद्ध देसी अचार। 1 किलो कांच के जार में।',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    price: '₹ 320',
    category: 'खाद्य प्रसंस्करण',
    artisanName: 'आरती मौर्य',
    location: 'वाराणसी, उत्तर प्रदेश',
    contactPhone: '+91 91200 87654',
    createdAt: '2026-10-17T11:30:00Z',
  },
  {
    id: 'show_003',
    title: 'मिट्टी के दीये और नक्काशीदार कुल्हड़',
    description: 'पारंपरिक चाक पर बने इको-फ्रेंडली कुल्हड़ एवं उत्सवों हेतु डिज़ाइनर टेराकोटा दीये।',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    price: '₹ 150 (दर्जन)',
    category: 'मिट्टी शिल्प',
    artisanName: 'राम लखन कुम्हार',
    location: 'गोरखपुर, उत्तर प्रदेश',
    contactPhone: '+91 94520 11223',
    createdAt: '2026-10-16T09:15:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// FIRESTORE MEDIA MANAGEMENT HELPERS
// ─────────────────────────────────────────────────────────────
export const mediaStorageService = {
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
            });
          });
          return list;
        }
      } catch (err) {
        console.warn('Could not fetch media from Firestore:', err);
      }
    }

    try {
      const local = localStorage.getItem('jeevika_media_assets_v1');
      if (local) return JSON.parse(local);
    } catch {}
    return [];
  },

  /**
   * Saves a newly uploaded media record to Firestore and localStorage.
   */
  async saveMediaAsset(asset: Omit<MediaAssetRecord, 'id'>): Promise<string> {
    const payload = {
      ...asset,
      createdAt: serverTimestamp(),
    };

    let id = 'media_' + Date.now();
    if (isRealFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(getDb(), 'media'), payload);
        id = docRef.id;
      } catch (err) {
        console.warn('Could not save media asset to Firestore:', err);
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
   * Gets current hero banner slides (combines default with admin uploaded hero_banner media).
   */
  async getHeroSlides(): Promise<HeroSlide[]> {
    const media = await this.getMediaAssets();
    const bannerMedia = media.filter((m) => m.folder === 'banner' || m.folder === 'hero_banner');

    if (bannerMedia.length > 0) {
      const dynamicSlides: HeroSlide[] = bannerMedia.map((m) => ({
        id: m.id,
        imageUrl: m.url,
        title: m.name.replace(/\.[^/.]+$/, ''),
        subtitle: m.tags.length ? '#' + m.tags.join(' #') : 'जीविका प्रमाणित अवसर',
        tag: 'नवीनतम',
      }));
      return [...dynamicSlides, ...DEFAULT_HERO_SLIDES];
    }

    return DEFAULT_HERO_SLIDES;
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
};
