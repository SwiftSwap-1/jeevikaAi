import { SupportedLanguage } from '../types';

export interface CachedVocabularyItem {
  phrase: string;
  category: 'navigation' | 'card_reading' | 'education' | 'work_type' | 'mobility' | 'skills' | 'schemes' | 'affirmation';
  lang: SupportedLanguage;
  synonyms: string[];
}

const STORAGE_KEY = 'jeevika_voice_vocab_v1';

// Base seed vocabulary covering common voice-to-text phrases in Hindi, Bhojpuri, Hinglish, English
export const DEFAULT_VOICE_VOCABULARY: CachedVocabularyItem[] = [
  // 1. Navigation Commands
  {
    phrase: 'रोडमैप दिखाओ',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['रोडमैप खोलो', 'डैशबोर्ड पर जाओ', 'मेरा रोडमैप क्या है', 'करियर मार्ग दिखाओ', 'roadmap dikhao', 'open roadmap', 'show roadmap']
  },
  {
    phrase: 'नौकरी दिखाओ',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['रोजगार दिखाओ', 'काम दिखाओ', 'पास की नौकरियां', 'जॉब्स दिखाओ', 'naukri dikhao', 'kaam dikhao', 'show jobs', 'open jobs']
  },
  {
    phrase: 'प्रशिक्षण केंद्र दिखाओ',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['ट्रेनिंग केंद्र कहाँ है', 'कौशल केंद्र दिखाओ', 'पीएमकेवीवाई केंद्र', 'training dikhao', 'show training', 'training centers']
  },
  {
    phrase: 'कौशल अंतर दिखाओ',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['स्किल गैप दिखाओ', 'कौशल देखो', 'skill gap dikhao', 'show skill gap', 'my skills']
  },
  {
    phrase: 'प्रोफ़ाइल खोलो',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['मेरी जानकारी', 'प्रोफाइल दिखाओ', 'नाम बदलो', 'open profile', 'show profile', 'my profile']
  },
  {
    phrase: 'मुख्य पृष्ठ पर जाओ',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['होम पेज पर जाओ', 'शुरू से शुरू करो', 'नया मूल्यांकन', 'home par jao', 'go home', 'start over']
  },
  {
    phrase: 'सहेजे गए अवसर',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['सेव की हुई नौकरी', 'शॉर्टलिस्ट दिखाओ', 'saved jobs', 'show saved', 'bookmarks']
  },
  {
    phrase: 'डैशबोर्ड खोलो',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['डैशबोर्ड पर जाओ', 'डैशबोर्ड दिखाओ', 'go to dashboard', 'open dashboard', 'dashboard', 'take me to dashboard', 'dashboard par jao']
  },
  {
    phrase: 'सेटिंग्स खोलो',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['सेटिंग्स पर जाओ', 'सेटिंग्स दिखाओ', 'अलर्ट सेटिंग्स', 'open settings', 'go to settings', 'settings', 'notification settings', 'settings kholo']
  },
  {
    phrase: 'सहायता एवं सवाल',
    category: 'navigation',
    lang: 'hi',
    synonyms: ['मदद करो', 'एफएक्यू खोलो', 'help dikhao', 'open faq', 'support', 'open help', 'go to help']
  },

  // 2. Card Reading Commands
  {
    phrase: 'रोडमैप कार्ड पढ़ के बताओ',
    category: 'card_reading',
    lang: 'hi',
    synonyms: ['रोडमैप कार्ड पढ़ो', 'रोडमैप के स्टेप्स बताओ', 'करियर कार्ड बताओ', 'read roadmap card', 'read my roadmap', 'explain roadmap']
  },
  {
    phrase: 'नौकरी कार्ड पढ़ के बताओ',
    category: 'card_reading',
    lang: 'hi',
    synonyms: ['नौकरी कार्ड बताओ', 'पास की नौकरी कार्ड पढ़ो', 'सोलर नौकरी कार्ड बताओ', 'read job card', 'read jobs', 'explain job card']
  },
  {
    phrase: 'कौशल कार्ड पढ़ के बताओ',
    category: 'card_reading',
    lang: 'hi',
    synonyms: ['स्किल कार्ड पढ़ो', 'कौशल अंतर कार्ड पढ़ो', 'read skill card', 'explain skills', 'what skills do i need']
  },
  {
    phrase: 'प्रशिक्षण केंद्र कार्ड बताओ',
    category: 'card_reading',
    lang: 'hi',
    synonyms: ['ट्रेनिंग कार्ड पढ़ो', 'पीएमकेवीवाई कार्ड बताओ', 'read training card', 'training details']
  },
  {
    phrase: 'सरकारी योजना कार्ड बताओ',
    category: 'card_reading',
    lang: 'hi',
    synonyms: ['योजनाएं बताओ', 'पीएम विश्वकर्मा योजना बताओ', 'मुद्रा योजना कार्ड', 'read scheme card', 'government schemes']
  },

  // 3. Vocational Skills & Trades
  {
    phrase: 'सिलाई व टेलरिंग',
    category: 'skills',
    lang: 'hi',
    synonyms: ['सिलाई', 'टेलर', 'कपड़े सिलना', 'दर्जी', 'tailoring', 'sewing', 'garment']
  },
  {
    phrase: 'सोलर पैनल व इलेक्ट्रीशियन',
    category: 'skills',
    lang: 'hi',
    synonyms: ['सोलर', 'इलेक्ट्रीशियन', 'बिजली का काम', 'solar', 'electrician', 'wiring']
  },
  {
    phrase: 'कंप्यूटर ऑपरेटर व डाटा एंट्री',
    category: 'skills',
    lang: 'hi',
    synonyms: ['कंप्यूटर', 'डाटा एंट्री', 'टाइपिंग', 'ऑफिस काम', 'computer operator', 'data entry']
  },
  {
    phrase: 'ड्राइविंग व डिलीवरी',
    category: 'skills',
    lang: 'hi',
    synonyms: ['गाड़ी चलाना', 'ड्राइवर', 'ऑटो ड्राइवर', 'डिलीवरी', 'driving', 'driver']
  },
  {
    phrase: 'बढ़ई का काम (Carpentry)',
    category: 'skills',
    lang: 'hi',
    synonyms: ['कारपेंटर', 'लकड़ी का काम', 'बढ़ई', 'carpenter', 'carpentry', 'woodwork']
  },
  {
    phrase: 'ब्यूटी व वेलनेस',
    category: 'skills',
    lang: 'hi',
    synonyms: ['ब्यूटी पार्लर', 'मेकअप', 'ब्यूटीशियन', 'beauty parlor', 'wellness']
  },
  {
    phrase: 'कृषि व डेयरी फार्मिंग',
    category: 'skills',
    lang: 'hi',
    synonyms: ['खेती', 'डेयरी फार्मिंग', 'पशुपालन', 'दूध का काम', 'farming', 'dairy', 'agriculture']
  },
  {
    phrase: 'प्लंबिंग व सेनेटरी',
    category: 'skills',
    lang: 'hi',
    synonyms: ['प्लंबर', 'नल सुधारना', 'प्लंबिंग', 'plumber', 'plumbing']
  },

  // 4. Schemes & Programs
  {
    phrase: 'पीएम विश्वकर्मा योजना',
    category: 'schemes',
    lang: 'hi',
    synonyms: ['विश्वकर्मा योजना', 'कारीगर योजना', 'पीएम विश्वकर्मा', 'vishwakarma scheme']
  },
  {
    phrase: 'प्रधानमंत्री कौशल विकास योजना (PMKVY)',
    category: 'schemes',
    lang: 'hi',
    synonyms: ['पीएमकेवीवाई', 'कौशल विकास योजना', 'फ्री ट्रेनिंग', 'pmkvy scheme']
  },
  {
    phrase: 'पीएम मुद्रा लोन योजना',
    category: 'schemes',
    lang: 'hi',
    synonyms: ['मुद्रा लोन', 'बिजनेस लोन', 'स्वरोजगार लोन', 'mudra loan']
  },

  // 5. Assessment Qualifications (Education)
  {
    phrase: '10वीं पास',
    category: 'education',
    lang: 'hi',
    synonyms: ['दसवीं पास', 'मैट्रिक पास', 'हाईस्कूल', 'दसवां', '10th pass', 'matriculation', 'secondary']
  },
  {
    phrase: '12वीं पास',
    category: 'education',
    lang: 'hi',
    synonyms: ['बारहवीं पास', 'इंटर पास', 'इंटरमीडिएट', '12th pass', 'intermediate', 'higher secondary']
  },
  {
    phrase: 'स्नातक',
    category: 'education',
    lang: 'hi',
    synonyms: ['ग्रेजुएट', 'बीए पास', 'बीएससी पास', 'डिग्री', 'graduate', 'degree completed', 'graduation']
  },
  {
    phrase: 'आईटीआई डिप्लोमा',
    category: 'education',
    lang: 'hi',
    synonyms: ['आईटीआई पास', 'डिप्लोमा', 'पॉलिटेक्निक', 'iti pass', 'diploma holder']
  },
  {
    phrase: '8वीं पास',
    category: 'education',
    lang: 'hi',
    synonyms: ['आठवीं पास', 'आठवां पास', '8th pass', 'middle school']
  },
  {
    phrase: 'आठवीं से कम',
    category: 'education',
    lang: 'hi',
    synonyms: ['पढ़ाई नहीं की', 'कम पढ़े लिखे', 'below 8th', 'uneducated']
  },

  // 6. Work Preferences
  {
    phrase: 'नौकरी करना चाहते हैं',
    category: 'work_type',
    lang: 'hi',
    synonyms: ['नौकरी', 'जॉब चाहिए', 'वेतन वाला काम', 'job preference', 'want a job']
  },
  {
    phrase: 'खुद का काम या स्वरोजगार',
    category: 'work_type',
    lang: 'hi',
    synonyms: ['स्वरोजगार', 'दुकान खोलना', 'अपना काम', 'self employment', 'own business']
  },
  {
    phrase: 'कोई भी काम चलेगा',
    category: 'work_type',
    lang: 'hi',
    synonyms: ['दोनों चलेगा', 'कवनो भी काम', 'कुछ भी', 'either', 'both job or self']
  },

  // 7. Mobility / Location
  {
    phrase: 'घर के पास में ही',
    category: 'mobility',
    lang: 'hi',
    synonyms: ['गाँव के पास', '10 किलोमीटर के अंदर', 'लगे ही', 'nearby only', 'near home', 'local only']
  },
  {
    phrase: 'अपने जिले में',
    category: 'mobility',
    lang: 'hi',
    synonyms: ['जिले के अंदर', 'शहर में', 'जिला में काम', 'within district', 'anywhere in district']
  },
  {
    phrase: 'राज्य में कहीं भी',
    category: 'mobility',
    lang: 'hi',
    synonyms: ['बाहर भी जा सकते हैं', 'कहीं भी', 'पूरे राज्य में', 'anywhere in state', 'willing to relocate']
  },

  // 8. Common Affirmations
  {
    phrase: 'हाँ सही है',
    category: 'affirmation',
    lang: 'hi',
    synonyms: ['हाँ', 'जी हाँ', 'ठीक बा', 'एकदम सही', 'yes', 'correct', 'confirmed', 'proceed']
  },
  {
    phrase: 'नहीं बदलो',
    category: 'affirmation',
    lang: 'hi',
    synonyms: ['नहीं', 'गलत है', 'सुधार करो', 'no', 'wrong', 'change it']
  }
];

class VoiceVocabularyCache {
  private cache: CachedVocabularyItem[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    this.initCache();
    this.initNetworkListeners();
  }

  private initCache(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cache = parsed;
            return;
          }
        }
      }
    } catch {
      // Fallback to default in-memory
    }
    this.cache = [...DEFAULT_VOICE_VOCABULARY];
    this.persistCache();
  }

  private initNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public getIsOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return this.isOnline;
  }

  public getAll(): CachedVocabularyItem[] {
    return this.cache;
  }

  public getByCategory(category: CachedVocabularyItem['category']): CachedVocabularyItem[] {
    return this.cache.filter((item) => item.category === category);
  }

  public getCategories(): Array<{ id: CachedVocabularyItem['category']; labelHi: string; labelEn: string; icon: string }> {
    return [
      { id: 'card_reading', labelHi: 'कार्ड बोलकर सुनें', labelEn: 'Card Reading', icon: '📖' },
      { id: 'navigation', labelHi: 'पेज नेविगेशन', labelEn: 'Page Navigation', icon: '🚀' },
      { id: 'skills', labelHi: 'हुनर व ट्रेड', labelEn: 'Skills & Trades', icon: '⚡' },
      { id: 'schemes', labelHi: 'सरकारी योजनाएं', labelEn: 'Govt Schemes', icon: '🏛️' },
      { id: 'education', labelHi: 'योग्यता', labelEn: 'Education', icon: '🎓' },
      { id: 'work_type', labelHi: 'काम का प्रकार', labelEn: 'Work Type', icon: '💼' },
      { id: 'mobility', labelHi: 'दूरी व स्थान', labelEn: 'Location', icon: '📍' },
    ];
  }

  /**
   * Persists vocabulary cache to localStorage for offline readiness across PWA restarts
   */
  public persistCache(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
      }
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Resets cache back to default seed vocabulary
   */
  public resetToDefault(): void {
    this.cache = [...DEFAULT_VOICE_VOCABULARY];
    this.persistCache();
  }

  /**
   * Adds newly recognized phrases to the local cache dynamically
   */
  public addPhrase(phrase: string, category: CachedVocabularyItem['category'], lang: SupportedLanguage, synonyms: string[] = []): void {
    const trimmed = phrase.trim();
    if (!trimmed) return;

    const existing = this.cache.find(
      (item) => item.phrase.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      synonyms.forEach((syn) => {
        if (!existing.synonyms.includes(syn)) {
          existing.synonyms.push(syn);
        }
      });
    } else {
      this.cache.push({
        phrase: trimmed,
        category,
        lang,
        synonyms
      });
    }

    this.persistCache();
  }

  /**
   * Generates JSGF (JSpeech Grammar Format) string for Web Speech API SpeechGrammarList
   * This biases browser speech recognition towards cached vocabulary when available.
   */
  public generateJSGFGrammar(lang: SupportedLanguage = 'hi'): string {
    const allWords = new Set<string>();

    this.cache.forEach((item) => {
      allWords.add(item.phrase);
      item.synonyms.forEach((syn) => allWords.add(syn));
    });

    const wordsArray = Array.from(allWords)
      .map((w) => w.replace(/[^\w\s\u0900-\u097F]/gi, '').trim())
      .filter(Boolean);

    return `#JSGF V1.0; grammar jeevika_vocab_${lang}; public <command> = ( ${wordsArray.join(' | ')} );`;
  }

  /**
   * Matches spoken input against cached vocabulary using phonetic/stem similarities
   * Vital for offline voice navigation & card reading when network recognition is unavailable.
   */
  public findBestMatch(input: string): { item: CachedVocabularyItem; matchedPhrase: string; score: number } | null {
    if (!input || !input.trim()) return null;
    const clean = input.toLowerCase().trim();

    let bestMatch: { item: CachedVocabularyItem; matchedPhrase: string; score: number } | null = null;
    let highestScore = 0;

    for (const item of this.cache) {
      const candidates = [item.phrase, ...item.synonyms];

      for (const cand of candidates) {
        const candClean = cand.toLowerCase().trim();

        // Exact match
        if (clean === candClean) {
          return { item, matchedPhrase: cand, score: 1.0 };
        }

        // Substring match
        if (clean.includes(candClean) || candClean.includes(clean)) {
          const score = Math.min(clean.length, candClean.length) / Math.max(clean.length, candClean.length);
          if (score > highestScore) {
            highestScore = score;
            bestMatch = { item, matchedPhrase: cand, score };
          }
        }

        // Word overlap match
        const cleanWords = clean.split(/\s+/);
        const candWords = candClean.split(/\s+/);
        const overlap = cleanWords.filter((w) => candWords.includes(w)).length;
        if (overlap > 0) {
          const wordScore = (overlap * 2) / (cleanWords.length + candWords.length);
          if (wordScore > highestScore) {
            highestScore = wordScore;
            bestMatch = { item, matchedPhrase: cand, score: wordScore };
          }
        }
      }
    }

    return highestScore >= 0.35 ? bestMatch : null;
  }
}

export const voiceVocabularyCache = new VoiceVocabularyCache();
