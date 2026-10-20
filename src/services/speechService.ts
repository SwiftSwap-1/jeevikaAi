import { SupportedLanguage, BeneficiaryProfile, StepOption } from '../types';
import { EDU, WORK, MOB } from '../data/mockData';
import { voiceVocabularyCache } from './voiceVocabularyCache';

export interface SpeechRecognitionResultWrapper {
  transcript: string;
  isFinal: boolean;
}

export interface ExtractedAIResponse {
  recognizedIntent?: string;
  cleanValue?: string;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  acknowledgment?: string;
  suggestedNextTopic?: string;
}

export type SpeechCallback = (result: SpeechRecognitionResultWrapper) => void;
export type SpeechErrorCallback = (error: string, code?: string) => void;
export type SpeechEndCallback = () => void;

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private speechTimeout: any = null;
  private activeSessionId: number = 0;
  private activeSpeakId: number = 0;
  private audioCtx: AudioContext | null = null;
  private isOfflineMode: boolean = typeof navigator !== 'undefined' ? !navigator.onLine : false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('offline', () => {
        this.isOfflineMode = true;
      });
      window.addEventListener('online', () => {
        this.isOfflineMode = false;
      });
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public isOffline(): boolean {
    if (typeof navigator !== 'undefined') {
      return !navigator.onLine || this.isOfflineMode;
    }
    return this.isOfflineMode;
  }

  public setOfflineMode(enabled: boolean): void {
    this.isOfflineMode = enabled;
  }

  public getCachedVocabulary() {
    return voiceVocabularyCache.getAll();
  }

  public getVocabCategories() {
    return voiceVocabularyCache.getCategories();
  }

  public matchCachedCommand(query: string) {
    return voiceVocabularyCache.findBestMatch(query);
  }

  public isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking || (typeof window !== 'undefined' && Boolean(window.speechSynthesis?.speaking));
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately after granting permission so mic is free for speech recognition
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  // Audio cue: Soft chime when listening begins (accessibility for non-readers)
  public playAudioCue(type: 'listen_start' | 'success' | 'clarify' = 'listen_start') {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0.001, now);

      if (type === 'listen_start') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.17);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.exponentialRampToValueAtTime(0.07, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'clarify') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(370, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch {
      // Audio cue is optional non-blocking enhancement
    }
  }

  /**
   * Start listening strictly AFTER speech synthesis has stopped.
   * Enforces single-session ID to discard stale recognition events.
   */
  public startListening(
    lang: SupportedLanguage,
    onResult: SpeechCallback,
    onError: SpeechErrorCallback,
    onEnd: SpeechEndCallback
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Voice capture is not supported in this browser. Please type your answer.', 'unsupported');
      return;
    }

    // Safety guard: stop any ongoing synthesis or previous session
    this.stopSpeaking();
    this.stopListening();

    const sessionId = ++this.activeSessionId;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      this.recognition = new SpeechRec();
    } catch {
      onError('Could not initialize speech recognition. Please type your answer.', 'init_fail');
      return;
    }

    // Set recognition language: Hindi for hi/bho/hin, Indian English for en
    const langCode = (lang === 'hi' || lang === 'bho' || lang === 'hin') ? 'hi-IN' : 'en-IN';
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    this.recognition.lang = langCode;
    this.recognition.interimResults = true;
    // Android Mobile Chrome requires continuous=false to prevent onresult buffer locks
    this.recognition.continuous = !isMobile;
    this.recognition.maxAlternatives = 1;

    // Pre-load Web Speech API SpeechGrammarList with cached vocabulary
    const SpeechGrammarListClass = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
    if (SpeechGrammarListClass) {
      try {
        const grammarList = new SpeechGrammarListClass();
        const jsgf = voiceVocabularyCache.generateJSGFGrammar(lang);
        grammarList.addFromString(jsgf, 1);
        this.recognition.grammars = grammarList;
      } catch {
        // Safe fallback if JSGF grammar is not supported by device engine
      }
    }

    let lastKnownTranscript = '';

    this.recognition.onstart = () => {
      if (sessionId !== this.activeSessionId) return;
      this.isListening = true;
      lastKnownTranscript = '';
      if (!isMobile) {
        this.playAudioCue('listen_start');
      }
    };

    this.recognition.onresult = (event: any) => {
      if (sessionId !== this.activeSessionId) return;

      // User barge-in: If AI was speaking and user starts speaking, stop AI speech immediately!
      if (this.isSpeaking) {
        this.stopSpeaking();
      }

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = (finalTranscript || interimTranscript).trim();
      const isFinal = Boolean(event.results[event.results.length - 1]?.isFinal);

      if (text) {
        lastKnownTranscript = text;
        // Dynamically add recognized phrase to local cache
        if (isFinal) {
          voiceVocabularyCache.addPhrase(text, 'navigation', lang);
        }
        onResult({ transcript: text, isFinal });
      }
    };

    this.recognition.onerror = (event: any) => {
      if (sessionId !== this.activeSessionId) return;

      const code = event && event.error;
      let msg = 'Voice capture encountered an issue. You can continue typing instead.';

      if (code === 'not-allowed' || code === 'service-not-allowed') {
        msg = 'Microphone access is blocked in this browser. Please allow microphone access or type your answers.';
      } else if (code === 'no-speech') {
        msg = 'No speech heard. Please tap the mic and speak aloud.';
      } else if (code === 'audio-capture') {
        msg = 'No microphone found on this device. Please use keyboard input.';
      } else if (code === 'network') {
        this.isOfflineMode = true;
        // If user was speaking and network dropped, salvage using cached voice vocabulary
        if (lastKnownTranscript) {
          const salvaged = voiceVocabularyCache.findBestMatch(lastKnownTranscript);
          if (salvaged && salvaged.score >= 0.35) {
            this.isListening = false;
            onResult({ transcript: salvaged.item.phrase, isFinal: true });
            return;
          }
        }
        msg = (lang === 'en')
          ? 'Network connection lost. Offline Voice Vocabulary Cache active.'
          : 'इंटरनेट कनेक्शन नहीं है। ऑफ़लाइन वॉइस कैश सक्रिय है।';
      }

      if (code !== 'no-speech' && code !== 'aborted') {
        this.isListening = false;
        onError(msg, code);
      }
    };

    this.recognition.onend = () => {
      if (sessionId !== this.activeSessionId) return;

      // Auto-restart recognition seamlessly on mobile if still in listening mode
      if (this.isListening) {
        setTimeout(() => {
          if (sessionId === this.activeSessionId && this.isListening) {
            try {
              this.recognition.start();
            } catch {
              // Soft catch if instance already started
            }
          }
        }, 120);
        return;
      }

      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch {
      this.isListening = false;
      onError('Unable to open microphone. Please use text mode.', 'start_fail');
    }
  }

  public stopListening() {
    this.activeSessionId++;
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        if (typeof this.recognition.abort === 'function') {
          this.recognition.abort();
        } else if (typeof this.recognition.stop === 'function') {
          this.recognition.stop();
        }
      } catch {
        // Safe ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  /**
   * Speak aloud using browser Text-to-Speech (TTS).
   */
  public speak(text: string, lang: SupportedLanguage, onEnd?: () => void) {
    if (!this.isSpeechSynthesisSupported() || !text || !text.trim()) {
      if (onEnd) onEnd();
      return;
    }

    // Safety guard: cancel existing synthesis only (keep listening active for barge-in)
    this.stopSpeaking();
    const speakId = ++this.activeSpeakId;

    try {
      window.speechSynthesis.cancel();
      if (this.speechTimeout) clearTimeout(this.speechTimeout);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = (lang === 'hi' || lang === 'bho' || lang === 'hin') ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.94; // slightly slower than default for high clarity
      utterance.pitch = 1.0;

      // Select suitable Indian or regional voice
      const voices = window.speechSynthesis.getVoices();
      const targetPrefix = (lang === 'hi' || lang === 'bho') ? 'hi' : 'en';
      const bestVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix)) || voices[0];
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      this.isSpeaking = true;

      let hasFinished = false;
      const finishExecution = () => {
        if (hasFinished || speakId !== this.activeSpeakId) return;
        hasFinished = true;
        this.isSpeaking = false;
        if (this.speechTimeout) clearTimeout(this.speechTimeout);
        // Small 150ms buffer before invoking next state
        setTimeout(() => {
          if (speakId === this.activeSpeakId && onEnd) {
            onEnd();
          }
        }, 150);
      };

      utterance.onend = finishExecution;
      utterance.onerror = finishExecution;

      // Watchdog timeout to prevent frozen state machine if onend event drops in background tab
      const estimatedDurationMs = Math.max(1800, text.length * 85 + 1500);
      this.speechTimeout = setTimeout(finishExecution, estimatedDurationMs);

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      if (speakId === this.activeSpeakId && onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    this.activeSpeakId++;
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout);
      this.speechTimeout = null;
    }
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe ignore
      }
      this.isSpeaking = false;
    }
  }

  /**
   * Conversational profile interpretation via backend proxy to Gemini
   * Falls back to client-side Indic NLP rules if server fails or key is missing.
   */
  public async extractWithGemini(
    message: string,
    language: SupportedLanguage,
    currentStepKey: string,
    existingProfile: BeneficiaryProfile,
    stepQuestion: string
  ): Promise<ExtractedAIResponse> {
    try {
      const response = await fetch('/api/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language,
          currentStep: currentStepKey,
          existingProfile,
          stepQuestion
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.fallback && data.result) {
          return {
            recognizedIntent: data.result.recognizedIntent,
            cleanValue: data.result.cleanValue,
            confidence: typeof data.result.confidence === 'number' ? data.result.confidence : 0.9,
            needsClarification: Boolean(data.result.needsClarification),
            clarificationQuestion: data.result.clarificationQuestion || '',
            acknowledgment: data.result.acknowledgment || '',
            suggestedNextTopic: data.result.suggestedNextTopic
          };
        }
      }
    } catch {
      // Network failed or offline - fall through to client rule engine
    }

    // Client-side Indic NLP fallback
    return this.fallbackIndicExtraction(message, language, currentStepKey);
  }

  /**
   * Fallback Indic Rule Engine
   * Understands Hindi, Bhojpuri, Hinglish, and English vernacular expressions
   */
  public fallbackIndicExtraction(
    speech: string,
    lang: SupportedLanguage,
    stepKey: string
  ): ExtractedAIResponse {
    const raw = speech.trim();
    const lower = raw.toLowerCase();

    // 1. Intro Step check (haan / ji / yes / start / shuru / ho / theek ba)
    if (stepKey === 'intro') {
      const affirmativeWords = [
        'haan', 'ha', 'ji', 'yes', 'shuru', 'theek', 'sure', 'start', 'ok', 'okay', 'ho',
        'हाँ', 'हां', 'जी', 'शुरू', 'ठीक', 'हवे', 'बा', 'अवश्य'
      ];
      const negativeWords = ['nahi', 'no', 'mat', 'na', 'रुको', 'नहीं', 'ना'];

      if (negativeWords.some(w => lower.includes(w))) {
        return {
          recognizedIntent: 'start_negative',
          confidence: 0.9,
          needsClarification: false,
          acknowledgment: lang === 'bho' ? 'कोई बात नइखे, जब तइयार होखब तब बोलीं।' : 'कोई बात नहीं, जब आप तैयार हों तब बताइएगा।'
        };
      }

      if (affirmativeWords.some(w => lower.includes(w)) || raw.length > 0) {
        return {
          recognizedIntent: 'start_affirmative',
          confidence: 0.95,
          needsClarification: false,
          acknowledgment: lang === 'bho' ? 'बहुत बढ़िया! आईं अब शुरू करत बानी।' : 'बहुत बढ़िया! चलिए अब शुरू करते हैं।'
        };
      }
    }

    // 2. Education extraction
    if (stepKey === 'education') {
      let matchedOpt: StepOption | null = null;
      let maxScore = 0;

      EDU.forEach(opt => {
        let score = 0;
        opt.kw.forEach(kw => {
          if (lower.includes(kw.toLowerCase())) score += 2;
        });
        if (lower.includes(opt.v.toLowerCase())) score += 3;
        if (score > maxScore) {
          maxScore = score;
          matchedOpt = opt;
        }
      });

      // Special check for 12th / baarahvi / inter
      if (lower.includes('12') || lower.includes('baarah') || lower.includes('barah') || lower.includes('बारह') || lower.includes('इंटर') || lower.includes('inter')) {
        matchedOpt = EDU.find(e => e.v.includes('12th')) || matchedOpt;
        maxScore = 5;
      }
      // Special check for 10th / dasvi / matric
      if (lower.includes('10') || lower.includes('das') || lower.includes('दस') || lower.includes('मैट्रिक') || lower.includes('matric')) {
        matchedOpt = EDU.find(e => e.v.includes('10th')) || matchedOpt;
        maxScore = 5;
      }
      // Special check for graduate / ba / bsc / degree
      if (lower.includes('grad') || lower.includes('ba ') || lower.includes('b.a') || lower.includes('bsc') || lower.includes('बीए') || lower.includes('स्नातक')) {
        matchedOpt = EDU.find(e => e.v.includes('Graduate')) || matchedOpt;
        maxScore = 5;
      }
      // ITI / Diploma
      if (lower.includes('iti') || lower.includes('diploma') || lower.includes('डिप्लोमा') || lower.includes('आईटीआई')) {
        matchedOpt = EDU.find(e => e.v.includes('ITI')) || matchedOpt;
        maxScore = 5;
      }

      // Check offline cached vocabulary for education if score is low
      if (!matchedOpt) {
        const cachedMatch = voiceVocabularyCache.findBestMatch(raw);
        if (cachedMatch && cachedMatch.item.category === 'education') {
          matchedOpt = EDU.find(e =>
            e.v.toLowerCase().includes(cachedMatch.item.phrase.toLowerCase()) ||
            cachedMatch.item.synonyms.some(s => e.v.toLowerCase().includes(s.toLowerCase())) ||
            e.kw.some(k => cachedMatch.item.phrase.toLowerCase().includes(k.toLowerCase()))
          ) || null;
        }
      }

      if (matchedOpt) {
        const ack = lang === 'bho'
          ? `अच्छा, ${matchedOpt.bho || matchedOpt.hi}। नोट हो गइल।`
          : `अच्छा, ${matchedOpt.hi}। बहुत बढ़िया!`;
        return {
          recognizedIntent: 'education',
          cleanValue: matchedOpt.v,
          confidence: 0.92,
          needsClarification: false,
          acknowledgment: ack
        };
      }

      return {
        recognizedIntent: 'education',
        cleanValue: raw,
        confidence: 0.55,
        needsClarification: true,
        clarificationQuestion: lang === 'bho'
          ? 'का रउआ 10वीं, 12वीं या स्नातक पास बानी?'
          : 'क्या आपने 10वीं, 12वीं या कॉलेज तक पढ़ाई की है?'
      };
    }

    // 3. Name extraction
    if (stepKey === 'name') {
      const cleanName = raw
        .replace(/^(my name is|mera naam|हमर नाम|मेरा नाम|हमार नाम|naam hai|नाम है)\s+/i, '')
        .replace(/\s+(hai|बा|हवे|है|ji|जी)\.?$/i, '')
        .trim();

      return {
        recognizedIntent: 'name',
        cleanValue: cleanName || raw,
        confidence: cleanName.length > 2 ? 0.9 : 0.6,
        needsClarification: false,
        acknowledgment: lang === 'bho'
          ? `नमस्ते ${cleanName || ''} जी!`
          : `नमस्ते ${cleanName || ''} जी, आपका स्वागत है!`
      };
    }

    // 4. Work Type extraction (Job / Self / Either)
    if (stepKey === 'workType') {
      let matched = WORK[0].v;
      const cachedMatch = voiceVocabularyCache.findBestMatch(raw);
      if (lower.includes('self') || lower.includes('business') || lower.includes('dukan') || lower.includes('apna') || lower.includes('दुकान') || lower.includes('स्वरोजगार') || lower.includes('खुद') || (cachedMatch?.item.phrase.includes('स्वरोजगार'))) {
        matched = 'Self-employment';
      } else if (lower.includes('dono') || lower.includes('any') || lower.includes('either') || lower.includes('kuch bhi') || lower.includes('कोई भी') || lower.includes('दोनों') || (cachedMatch?.item.phrase.includes('कोई भी'))) {
        matched = 'Either';
      } else {
        matched = 'Job';
      }

      const ack = lang === 'bho'
        ? `ठीक बा, ${matched === 'Job' ? 'नौकरी' : matched === 'Self-employment' ? 'खुद के काम' : 'कवनो भी काम'} दर्ज हो गइल।`
        : `ठीक है, ${matched === 'Job' ? 'नौकरी' : matched === 'Self-employment' ? 'अपना काम' : 'कोई भी काम'} नोट कर लिया है।`;

      return {
        recognizedIntent: 'workType',
        cleanValue: matched,
        confidence: 0.9,
        needsClarification: false,
        acknowledgment: ack
      };
    }

    // 5. Mobility extraction
    if (stepKey === 'mobility') {
      let matched = MOB[0].v;
      const cachedMatch = voiceVocabularyCache.findBestMatch(raw);
      if (lower.includes('anywhere') || lower.includes('state') || lower.includes('door') || lower.includes('बाहर') || lower.includes('कहीं भी') || (cachedMatch?.item.phrase.includes('राज्य'))) {
        matched = MOB[2].v;
      } else if (lower.includes('district') || lower.includes('zila') || lower.includes('shahar') || lower.includes('जिला') || lower.includes('शहर') || (cachedMatch?.item.phrase.includes('जिले'))) {
        matched = MOB[1].v;
      } else {
        matched = MOB[0].v;
      }

      return {
        recognizedIntent: 'mobility',
        cleanValue: matched,
        confidence: 0.88,
        needsClarification: false,
        acknowledgment: lang === 'bho' ? 'समझ गइनी, दूरी के प्राथमिकता नोट हो गइल।' : 'समझ गए, दूरी की प्राथमिकता नोट कर ली गई है।'
      };
    }

    // 6. Generic Text Fields (skills, interests, occupation, location)
    const ack = lang === 'bho' ? 'बहुत बढ़िया, ई नोट हो गइल बा।' : 'बहुत बढ़िया, यह नोट कर लिया है।';
    return {
      recognizedIntent: stepKey,
      cleanValue: raw,
      confidence: 0.85,
      needsClarification: false,
      acknowledgment: ack
    };
  }

  /**
   * Request verbal readback summary from backend
   */
  public async generateReadback(profile: BeneficiaryProfile, lang: SupportedLanguage): Promise<string> {
    try {
      const response = await fetch('/api/generate-readback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, language: lang })
      });
      if (response.ok) {
        const data = await response.json();
        if (!data.fallback && data.readbackText) {
          return data.readbackText;
        }
      }
    } catch {
      // Fallback below
    }

    // High quality conversational readback text covering all details
    if (lang === 'bho') {
      return `रउआ नाम ${profile.name || 'उपलब्ध नहीं'} बा। रउआ शिक्षा ${profile.education || 'उपलब्ध नहीं'}, हुनर ${profile.skills || 'उपलब्ध नहीं'}, पसंदीदा काम ${profile.interests || 'उपलब्ध नहीं'}, जिला ${profile.location || 'उपलब्ध नहीं'} अउर कार्य प्राथमिकता ${profile.workType || 'Job'} बा। का ई सब जानकारी सही बा? पुष्टि करीं ताकि हम रउआ खातिर सही रोडमैप बनाईं।`;
    }
    if (lang === 'en') {
      return `Your name is ${profile.name || 'Beneficiary'}. Education: ${profile.education || 'Not specified'}. Skills: ${profile.skills || 'Not specified'}. Interests: ${profile.interests || 'Not specified'}. Location: ${profile.location || 'Not specified'}. Work preference: ${profile.workType || 'Job'}. Is all this information correct? Please confirm to view your roadmap.`;
    }
    // Hindi default
    return `आपका नाम ${profile.name || 'उपलब्ध नहीं'} है। आपकी शिक्षा ${profile.education || 'उपलब्ध नहीं'}, हुनर ${profile.skills || 'उपलब्ध नहीं'}, पसंदीदा काम ${profile.interests || 'उपलब्ध नहीं'}, जिला ${profile.location || 'उपलब्ध नहीं'}, और कार्य प्रकार ${profile.workType || 'Job'} है। क्या यह सभी जानकारी सही है? पुष्टि करें ताकि हम आपके लिए सही रोडमैप तैयार कर सकें।`;
  }
}

export const speechService = new SpeechService();
