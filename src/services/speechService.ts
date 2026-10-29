import { SupportedLanguage, BeneficiaryProfile, StepOption } from '../types';
import { EDU, WORK, MOB, SKILL_CHIPS, INTEREST_CHIPS } from '../data/mockData';
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
  private currentSpokenText: string = '';
  private speechTimeout: any = null;
  private activeSessionId: number = 0;
  private activeSpeakId: number = 0;
  private audioCtx: AudioContext | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private activeAudioNodes: Array<AudioScheduledSourceNode> = [];
  private interruptionHandler: (() => void) | null = null;
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

  /**
   * Registers an interruption callback invoked immediately when the user speaks
   * while AI audio is playing.
   */
  public setInterruptionHandler(handler: (() => void) | null): void {
    this.interruptionHandler = handler;
  }

  /**
   * Immediately halts any active AI audio playback, flushes the synthesis & Web Audio
   * buffers, and notifies the registered interruption handler so UI transitions to 'listening'.
   */
  public interruptAndClearAudioBuffer(triggerCallback: boolean = true): boolean {
    const wasSpeaking = this.isCurrentlySpeaking();
    this.stopSpeaking();

    // Flush any active Web Audio nodes/buffers
    if (this.activeAudioNodes.length > 0) {
      for (const node of this.activeAudioNodes) {
        try {
          node.stop();
          node.disconnect();
        } catch {
          // Ignore already stopped nodes
        }
      }
      this.activeAudioNodes = [];
    }

    if (wasSpeaking && triggerCallback && this.interruptionHandler) {
      try {
        this.interruptionHandler();
      } catch {
        // Non-blocking callback
      }
    }

    return wasSpeaking;
  }

  /**
   * Deduplicates repeated words and repeated multi-word sequences from spoken transcripts.
   * For example:
   * - "राहुल कुमार राहुल कुमार" -> "राहुल कुमार"
   * - "मेरा नाम सुनीता देवी है सुनीता देवी" -> "सुनीता देवी"
   * - "सिलाई सिलाई कढ़ाई" -> "सिलाई कढ़ाई"
   */
  public deduplicateSpokenText(rawText: string, isNameField: boolean = false): string {
    if (!rawText || !rawText.trim()) return '';

    let text = rawText.trim().replace(/\s+/g, ' ');

    if (isNameField) {
      // Remove conversational prefixes/suffixes around names, even if repeated mid-sentence
      text = text
        .replace(/(?:मेरा नाम|हमार नाम|हमर नाम|नाम है|नाम बा|जी मेरा नाम|सर मेरा नाम|मैडम मेरा नाम|my name is|i am|naam hai|mera naam|hamaar naam)\s*/gi, ' ')
        .replace(/\s+(?:है|बा|हवे|हूँ|हूं|जी|सर|बोल रहा हूँ|बोल रही हूँ|hai|ba|hu|hun|ji)\b\.?/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const words = text.split(' ').filter(Boolean);
    if (words.length <= 1) return words.join(' ');

    // 1. Remove consecutive duplicate single words (case-insensitive)
    const singleDedup: string[] = [];
    for (const w of words) {
      const cleanW = w.replace(/[.,!?।]/g, '').toLowerCase();
      const prevW = singleDedup.length > 0 ? singleDedup[singleDedup.length - 1].replace(/[.,!?।]/g, '').toLowerCase() : '';
      if (cleanW && cleanW !== prevW) {
        singleDedup.push(w);
      }
    }

    // 2. Remove repeated 2-word or 3-word sequences (e.g. "Sunita Devi Sunita Devi")
    const nGramDedup = (arr: string[], n: number): string[] => {
      if (arr.length < n * 2) return arr;
      const out: string[] = [];
      let i = 0;
      while (i < arr.length) {
        if (i + n * 2 <= arr.length) {
          const chunk1 = arr.slice(i, i + n).map((x) => x.toLowerCase()).join(' ');
          const chunk2 = arr.slice(i + n, i + n * 2).map((x) => x.toLowerCase()).join(' ');
          if (chunk1 === chunk2) {
            out.push(...arr.slice(i, i + n));
            i += n * 2;
            // Skip any further immediate repetitions of the same chunk
            while (
              i + n <= arr.length &&
              arr.slice(i, i + n).map((x) => x.toLowerCase()).join(' ') === chunk1
            ) {
              i += n;
            }
            continue;
          }
        }
        out.push(arr[i]);
        i++;
      }
      return out;
    };

    let cleaned = nGramDedup(singleDedup, 3);
    cleaned = nGramDedup(cleaned, 2);
    cleaned = nGramDedup(cleaned, 1);

    // 3. For name fields, ensure unique tokens if someone said "Rahul Kumar Rahul"
    if (isNameField && cleaned.length > 1) {
      const seen = new Set<string>();
      const uniqueNameTokens: string[] = [];
      for (const token of cleaned) {
        const key = token.replace(/[.,!?।]/g, '').toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueNameTokens.push(token.replace(/[.,!?।]/g, ''));
        }
      }
      return uniqueNameTokens.slice(0, 3).join(' ').trim();
    }

    return cleaned.join(' ').trim();
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
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

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
      this.activeAudioNodes.push(osc);
      osc.onended = () => {
        this.activeAudioNodes = this.activeAudioNodes.filter((n) => n !== osc);
      };

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
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
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
      // Non-blocking cue
    }
  }

  /**
   * Starts speech recognition.
   * When `keepSpeaking` is true, allows background listening while TTS is speaking
   * so the user can barge-in (interrupt) immediately by speaking!
   */
  public startListening(
    lang: SupportedLanguage,
    onResult: SpeechCallback,
    onError: SpeechErrorCallback,
    onEnd: SpeechEndCallback,
    keepSpeaking: boolean = false
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Voice capture is not supported in this browser. Please type your answer.', 'unsupported');
      return;
    }

    if (!keepSpeaking) {
      this.interruptAndClearAudioBuffer(false);
    }
    this.stopListening();

    const sessionId = ++this.activeSessionId;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      this.recognition = new SpeechRec();
    } catch {
      onError('Could not initialize speech recognition. Please type your answer.', 'init_fail');
      return;
    }

    const langCode = (lang === 'hi' || lang === 'bho' || lang === 'hin') ? 'hi-IN' : 'en-IN';
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    this.recognition.lang = langCode;
    this.recognition.interimResults = true;
    this.recognition.continuous = !isMobile;
    this.recognition.maxAlternatives = 1;

    const SpeechGrammarListClass = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
    if (SpeechGrammarListClass) {
      try {
        const grammarList = new SpeechGrammarListClass();
        const jsgf = voiceVocabularyCache.generateJSGFGrammar(lang);
        grammarList.addFromString(jsgf, 1);
        this.recognition.grammars = grammarList;
      } catch {
        // Safe fallback
      }
    }

    let lastKnownTranscript = '';

    this.recognition.onstart = () => {
      if (sessionId !== this.activeSessionId) return;
      this.isListening = true;
      lastKnownTranscript = '';
      if (!isMobile && !keepSpeaking) {
        this.playAudioCue('listen_start');
      }
    };

    // Immediate voice activity detection: if user starts speaking while AI is outputting audio,
    // trigger interruption handler to stop playback and clear buffer right away.
    this.recognition.onspeechstart = () => {
      if (sessionId !== this.activeSessionId) return;
      if (this.isCurrentlySpeaking()) {
        this.interruptAndClearAudioBuffer(true);
      }
    };

    this.recognition.onresult = (event: any) => {
      if (sessionId !== this.activeSessionId) return;

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const rawText = (finalTranscript || interimTranscript).trim();
      if (!rawText) return;

      // Echo guard: if TTS is actively speaking and the recognized snippet is just part of the AI's own prompt, ignore it
      if (this.isSpeaking && this.currentSpokenText) {
        const normSpoken = this.currentSpokenText.toLowerCase().replace(/[?,.!।]/g, '');
        const normHeard = rawText.toLowerCase().replace(/[?,.!।]/g, '').trim();
        if (normHeard.length > 3 && normSpoken.includes(normHeard)) {
          return;
        }
      }

      // User barge-in interruption handler: immediately stop AI speech, flush audio buffer, and transition to listening!
      if (this.isCurrentlySpeaking()) {
        this.interruptAndClearAudioBuffer(true);
      }

      const dedupedText = this.deduplicateSpokenText(rawText, false);
      const isFinal = Boolean(event.results[event.results.length - 1]?.isFinal);

      if (dedupedText) {
        lastKnownTranscript = dedupedText;
        if (isFinal) {
          voiceVocabularyCache.addPhrase(dedupedText, 'navigation', lang);
        }
        onResult({ transcript: dedupedText, isFinal });
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
        if (lastKnownTranscript) {
          const salvaged = voiceVocabularyCache.findBestMatch(lastKnownTranscript);
          if (salvaged && salvaged.score >= 0.35) {
            this.isListening = false;
            onResult({ transcript: salvaged.item.phrase, isFinal: true });
            return;
          }
        }
        msg = lang === 'en'
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

      if (this.isListening) {
        setTimeout(() => {
          if (sessionId === this.activeSessionId && this.isListening) {
            try {
              this.recognition.start();
            } catch {
              // Soft catch
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
        this.recognition.onspeechstart = null;
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

    this.stopSpeaking();
    const speakId = ++this.activeSpeakId;
    this.currentSpokenText = text;

    try {
      window.speechSynthesis.cancel();
      if (this.speechTimeout) clearTimeout(this.speechTimeout);

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;
      utterance.lang = (lang === 'hi' || lang === 'bho' || lang === 'hin') ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.96;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const targetPrefix = (lang === 'hi' || lang === 'bho') ? 'hi' : 'en';
      const bestVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix)) || voices[0];
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      this.isSpeaking = true;

      let hasFinished = false;
      const finishExecution = () => {
        if (hasFinished || speakId !== this.activeSpeakId) return;
        hasFinished = true;
        this.isSpeaking = false;
        this.currentSpokenText = '';
        this.activeUtterance = null;
        if (this.speechTimeout) clearTimeout(this.speechTimeout);
        setTimeout(() => {
          if (speakId === this.activeSpeakId && onEnd) {
            onEnd();
          }
        }, 120);
      };

      utterance.onend = finishExecution;
      utterance.onerror = finishExecution;

      const estimatedDurationMs = Math.max(1800, text.length * 80 + 1200);
      this.speechTimeout = setTimeout(finishExecution, estimatedDurationMs);

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      this.currentSpokenText = '';
      this.activeUtterance = null;
      if (speakId === this.activeSpeakId && onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    this.activeSpeakId++;
    this.currentSpokenText = '';
    if (this.activeUtterance) {
      try {
        this.activeUtterance.onend = null;
        this.activeUtterance.onerror = null;
      } catch {
        // Ignore
      }
      this.activeUtterance = null;
    }
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout);
      this.speechTimeout = null;
    }
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.pause();
        window.speechSynthesis.cancel();
      } catch {
        // Safe ignore
      }
      this.isSpeaking = false;
    }
  }

  /**
   * Conversational profile interpretation:
   * First applies fast, deterministic fuzzy ("aspaas") matching & deduplication so common answers
   * resolve in 0ms without delay or false clarification loops, and uses Gemini for complex utterances.
   */
  public async extractWithGemini(
    message: string,
    language: SupportedLanguage,
    currentStepKey: string,
    existingProfile: BeneficiaryProfile,
    stepQuestion: string
  ): Promise<ExtractedAIResponse> {
    const dedupedMessage = this.deduplicateSpokenText(message, currentStepKey === 'name');

    // Fast local fuzzy extraction first
    const localResult = this.fallbackIndicExtraction(dedupedMessage, language, currentStepKey);

    // For structured choice steps or high-confidence matches, return immediately for snappy UX
    if (
      currentStepKey === 'intro' ||
      currentStepKey === 'name' ||
      currentStepKey === 'education' ||
      currentStepKey === 'workType' ||
      currentStepKey === 'mobility' ||
      localResult.confidence >= 0.88
    ) {
      return localResult;
    }

    try {
      const response = await fetch('/api/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: dedupedMessage,
          language,
          currentStep: currentStepKey,
          existingProfile,
          stepQuestion,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.fallback && data.result && data.result.cleanValue) {
          const cleanedVal = this.deduplicateSpokenText(
            String(data.result.cleanValue),
            currentStepKey === 'name'
          );
          return {
            recognizedIntent: data.result.recognizedIntent,
            cleanValue: cleanedVal || localResult.cleanValue,
            confidence: typeof data.result.confidence === 'number' ? data.result.confidence : 0.9,
            needsClarification: false,
            clarificationQuestion: '',
            acknowledgment: data.result.acknowledgment || localResult.acknowledgment,
            suggestedNextTopic: data.result.suggestedNextTopic,
          };
        }
      }
    } catch {
      // Fall through to localResult
    }

    return localResult;
  }

  /**
   * Fuzzy ("aspaas") Indic + English Rule Engine
   * Matches any nearby word or phrase in Hindi, Bhojpuri, Hinglish, or English and deduplicates cleanly.
   */
  public fallbackIndicExtraction(
    speech: string,
    lang: SupportedLanguage,
    stepKey: string
  ): ExtractedAIResponse {
    const raw = this.deduplicateSpokenText(speech, stepKey === 'name');
    const lower = raw.toLowerCase();

    // 1. Intro Step check
    if (stepKey === 'intro') {
      const negativeWords = ['nahi', 'no', 'mat', 'ruko', 'later', 'नहीं', 'ना', 'रुको', 'बाद में'];
      if (negativeWords.some((w) => lower === w || lower.startsWith(w + ' '))) {
        return {
          recognizedIntent: 'start_negative',
          confidence: 0.9,
          needsClarification: false,
          acknowledgment: lang === 'bho' ? 'कोई बात नइखे, जब तइयार होखब तब बोलीं।' : 'कोई बात नहीं, जब आप तैयार हों तब बताइएगा।',
        };
      }

      return {
        recognizedIntent: 'start_affirmative',
        confidence: 0.96,
        needsClarification: false,
        acknowledgment: lang === 'bho' ? 'बहुत बढ़िया! आईं शुरू करीं।' : 'बहुत बढ़िया! चलिए शुरू करते हैं।',
      };
    }

    // 2. Name extraction (with strict deduplication so same name spoken twice is never repeated)
    if (stepKey === 'name') {
      const cleanName = this.deduplicateSpokenText(raw, true);
      const finalName = cleanName || raw;
      return {
        recognizedIntent: 'name',
        cleanValue: finalName,
        confidence: 0.95,
        needsClarification: false,
        acknowledgment:
          lang === 'bho'
            ? `नमस्ते ${finalName} जी!`
            : lang === 'en'
            ? `Welcome ${finalName}!`
            : `नमस्ते ${finalName} जी, स्वागत है!`,
      };
    }

    // 3. Education extraction (fuzzy matching nearby words)
    if (stepKey === 'education') {
      let matchedOpt: StepOption | null = null;

      if (
        lower.includes('iti') ||
        lower.includes('diploma') ||
        lower.includes('polytechnic') ||
        lower.includes('डिप्लोमा') ||
        lower.includes('आईटीआई') ||
        lower.includes('पॉलिटेक्निक') ||
        lower.includes('टेक्निकल')
      ) {
        matchedOpt = EDU.find((e) => e.v.includes('ITI')) || null;
      } else if (
        lower.includes('grad') ||
        lower.includes('ba') ||
        lower.includes('b.a') ||
        lower.includes('bsc') ||
        lower.includes('bcom') ||
        lower.includes('b.sc') ||
        lower.includes('ma') ||
        lower.includes('mba') ||
        lower.includes('degree') ||
        lower.includes('college') ||
        lower.includes('बीए') ||
        lower.includes('बीएससी') ||
        lower.includes('बीकॉम') ||
        lower.includes('स्नातक') ||
        lower.includes('ग्रेजुएट') ||
        lower.includes('कॉलेज') ||
        lower.includes('डिग्री')
      ) {
        matchedOpt = EDU.find((e) => e.v.includes('Graduate')) || null;
      } else if (
        lower.includes('12') ||
        lower.includes('11') ||
        lower.includes('baarah') ||
        lower.includes('barah') ||
        lower.includes('twelfth') ||
        lower.includes('twelve') ||
        lower.includes('inter') ||
        lower.includes('बारह') ||
        lower.includes('12वीं') ||
        lower.includes('इंटर') ||
        lower.includes('हायर')
      ) {
        matchedOpt = EDU.find((e) => e.v.includes('12th')) || null;
      } else if (
        lower.includes('10') ||
        lower.includes('9') ||
        lower.includes('das') ||
        lower.includes('tenth') ||
        lower.includes('ten') ||
        lower.includes('matric') ||
        lower.includes('high school') ||
        lower.includes('highschool') ||
        lower.includes('दस') ||
        lower.includes('10वीं') ||
        lower.includes('मैट्रिक') ||
        lower.includes('हाई स्कूल') ||
        lower.includes('हाईस्कूल')
      ) {
        matchedOpt = EDU.find((e) => e.v.includes('10th')) || null;
      } else if (
        lower.includes('8') ||
        lower.includes('aath') ||
        lower.includes('eight') ||
        lower.includes('middle') ||
        lower.includes('आठ') ||
        lower.includes('8वीं') ||
        lower.includes('मिडिल')
      ) {
        matchedOpt = EDU.find((e) => e.v.includes('8th class pass')) || null;
      } else if (
        lower.includes('below') ||
        lower.includes('5') ||
        lower.includes('6') ||
        lower.includes('7') ||
        lower.includes('paanch') ||
        lower.includes('chhah') ||
        lower.includes('saat') ||
        lower.includes('nahi') ||
        lower.includes('unpadh') ||
        lower.includes('anpadh') ||
        lower.includes('kam') ||
        lower.includes('अनपढ़') ||
        lower.includes('नहीं पढ़') ||
        lower.includes('कम') ||
        lower.includes('पांच') ||
        lower.includes('सात')
      ) {
        matchedOpt = EDU.find((e) => e.v.includes('Below 8th')) || null;
      }

      if (!matchedOpt) {
        // Fallback to any keyword overlap or default to 10th pass if user spoke something
        for (const opt of EDU) {
          if (opt.kw.some((k) => lower.includes(k.toLowerCase()))) {
            matchedOpt = opt;
            break;
          }
        }
      }

      const finalOpt = matchedOpt || EDU[2]; // Default to 10th pass if approximate speech
      const ack =
        lang === 'bho'
          ? `अच्छा, ${finalOpt.bho || finalOpt.hi}। नोट हो गइल।`
          : lang === 'en'
          ? `Got it, ${finalOpt.v}.`
          : `अच्छा, ${finalOpt.hi}। नोट कर लिया है।`;

      return {
        recognizedIntent: 'education',
        cleanValue: finalOpt.v,
        confidence: 0.94,
        needsClarification: false,
        acknowledgment: ack,
      };
    }

    // 4. Skills & Interests fuzzy matching ("aspaas ka kuch bhi word match kare likhde")
    if (stepKey === 'skills' || stepKey === 'interests') {
      const matchedItems: string[] = [];
      const addUnique = (val: string) => {
        if (!matchedItems.some((x) => x.toLowerCase() === val.toLowerCase())) {
          matchedItems.push(val);
        }
      };

      const fuzzyMap: Array<{ keywords: string[]; labelHi: string; labelEn: string }> = [
        {
          keywords: ['सिलाई', 'कढ़ाई', 'दर्जी', 'कपड़ा', 'बुटीक', 'मशीन', 'silai', 'kadhai', 'tailor', 'stitch', 'sewing', 'garment', 'boutique'],
          labelHi: 'सिलाई-कढ़ाई',
          labelEn: 'Tailoring & Stitching',
        },
        {
          keywords: ['कंप्यूटर', 'टाइपिंग', 'ऑनलाइन', 'डाटा', 'डिजिटल', 'सीएससी', 'फॉर्म', 'computer', 'typing', 'online', 'digital', 'data', 'csc', 'cyber'],
          labelHi: 'कंप्यूटर व डिजिटल सेवाएँ',
          labelEn: 'Computers & Digital Services',
        },
        {
          keywords: ['मोबाइल', 'फोन', 'रिपेयर', 'व्हाट्सएप', 'ऐप', 'mobile', 'phone', 'app', 'smartphone'],
          labelHi: 'मोबाइल चलाना व रिपेयर',
          labelEn: 'Using a phone & Mobile apps',
        },
        {
          keywords: ['सोलर', 'बिजली', 'इलेक्ट्रीशियन', 'वायरिंग', 'इन्वर्टर', 'बैटरी', 'मोटर', 'solar', 'bijli', 'electric', 'wiring', 'inverter'],
          labelHi: 'सोलर ऊर्जा व इलेक्ट्रिकल',
          labelEn: 'Solar energy & Electrical work',
        },
        {
          keywords: ['दुकान', 'बिक्री', 'सेल्स', 'व्यापार', 'हिसाब', 'किराना', 'रिटेल', 'dukan', 'dukaan', 'shop', 'sales', 'retail', 'billing', 'account', 'business'],
          labelHi: 'दुकान और बिक्री (हिसाब-किताब)',
          labelEn: 'Shop, sales & billing',
        },
        {
          keywords: ['खेती', 'किसान', 'कृषि', 'डेयरी', 'पशुपालन', 'गाय', 'भैंस', 'बागवानी', 'kheti', 'farm', 'agri', 'dairy', 'milk'],
          labelHi: 'कृषि व डेयरी पशुपालन',
          labelEn: 'Agriculture & Dairy',
        },
        {
          keywords: ['खाना', 'रसोई', 'पकवान', 'टिफिन', 'अचार', 'पापड़', 'khana', 'cook', 'food', 'kitchen', 'catering'],
          labelHi: 'खाना बनाना व फूड प्रोसेसिंग',
          labelEn: 'Cooking & Food processing',
        },
        {
          keywords: ['बातचीत', 'बोलना', 'ग्राहक', 'सहायता', 'communication', 'speaking', 'customer', 'talking'],
          labelHi: 'बातचीत करना',
          labelEn: 'Basic communication',
        },
        {
          keywords: ['ब्यूटी', 'पार्लर', 'मेहंदी', 'मेकअप', 'सैलून', 'beauty', 'parlor', 'parlour', 'salon', 'makeup'],
          labelHi: 'ब्यूटी पार्लर व वेलनेस',
          labelEn: 'Beauty & Wellness',
        },
        {
          keywords: ['बढ़ई', 'लकड़ी', 'फर्नीचर', 'राजमिस्त्री', 'पेंटिंग', 'वेल्डिंग', 'प्लंबर', 'ड्राइविंग', 'गाड़ी', 'carpenter', 'mason', 'welding', 'plumber', 'driving', 'driver'],
          labelHi: 'तकनीकी व कारीगरी कार्य',
          labelEn: 'Skilled Trade & Craft',
        },
      ];

      for (const entry of fuzzyMap) {
        if (entry.keywords.some((kw) => lower.includes(kw))) {
          addUnique(lang === 'en' ? entry.labelEn : entry.labelHi);
        }
      }

      // Also check SKILL_CHIPS / INTEREST_CHIPS directly
      const sourceChips = stepKey === 'skills' ? SKILL_CHIPS : INTEREST_CHIPS;
      for (const chip of sourceChips) {
        if (
          lower.includes(chip.en.toLowerCase()) ||
          lower.includes(chip.hi.toLowerCase()) ||
          (chip.bho && lower.includes(chip.bho.toLowerCase()))
        ) {
          addUnique(lang === 'en' ? chip.en : lang === 'bho' ? chip.bho || chip.hi : chip.hi);
        }
      }

      const finalVal = matchedItems.length > 0 ? matchedItems.join(', ') : raw;
      return {
        recognizedIntent: stepKey,
        cleanValue: finalVal,
        confidence: 0.92,
        needsClarification: false,
        acknowledgment:
          lang === 'bho'
            ? `बहुत बढ़िया, ${finalVal} नोट हो गइल।`
            : lang === 'en'
            ? `Great, noted ${finalVal}.`
            : `बहुत बढ़िया, ${finalVal} नोट कर लिया है।`,
      };
    }

    // 5. Work Type extraction (Job / Self / Either)
    if (stepKey === 'workType') {
      let matched = WORK[0].v;
      if (
        lower.includes('self') ||
        lower.includes('business') ||
        lower.includes('dukan') ||
        lower.includes('dukaan') ||
        lower.includes('apna') ||
        lower.includes('khud') ||
        lower.includes('vyapar') ||
        lower.includes('dhandha') ||
        lower.includes('दुकान') ||
        lower.includes('स्वरोजगार') ||
        lower.includes('खुद') ||
        lower.includes('अपना') ||
        lower.includes('बिजनेस') ||
        lower.includes('व्यापार')
      ) {
        matched = 'Self-employment';
      } else if (
        lower.includes('dono') ||
        lower.includes('any') ||
        lower.includes('either') ||
        lower.includes('kuch bhi') ||
        lower.includes('kavano') ||
        lower.includes('कोई भी') ||
        lower.includes('दोनों') ||
        lower.includes('कुछ भी') ||
        lower.includes('कवनो')
      ) {
        matched = 'Either';
      } else {
        matched = 'Job';
      }

      const ack =
        lang === 'bho'
          ? `ठीक बा, ${matched === 'Job' ? 'नौकरी' : matched === 'Self-employment' ? 'खुद के काम' : 'कवनो भी काम'} दर्ज हो गइल।`
          : `ठीक है, ${matched === 'Job' ? 'नौकरी' : matched === 'Self-employment' ? 'स्वरोजगार (अपना काम)' : 'कोई भी काम'} नोट कर लिया है।`;

      return {
        recognizedIntent: 'workType',
        cleanValue: matched,
        confidence: 0.94,
        needsClarification: false,
        acknowledgment: ack,
      };
    }

    // 6. Mobility extraction
    if (stepKey === 'mobility') {
      let matched = MOB[0].v;
      if (
        lower.includes('anywhere') ||
        lower.includes('state') ||
        lower.includes('door') ||
        lower.includes('bahar') ||
        lower.includes('pardes') ||
        lower.includes('बाहर') ||
        lower.includes('कहीं भी') ||
        lower.includes('राज्य') ||
        lower.includes('दूर')
      ) {
        matched = MOB[2].v;
      } else if (
        lower.includes('district') ||
        lower.includes('zila') ||
        lower.includes('jila') ||
        lower.includes('shahar') ||
        lower.includes('city') ||
        lower.includes('जिला') ||
        lower.includes('जिले') ||
        lower.includes('शहर')
      ) {
        matched = MOB[1].v;
      } else {
        matched = MOB[0].v;
      }

      return {
        recognizedIntent: 'mobility',
        cleanValue: matched,
        confidence: 0.92,
        needsClarification: false,
        acknowledgment:
          lang === 'bho'
            ? 'समझ गइनी, दूरी के प्राथमिकता नोट हो गइल।'
            : 'समझ गए, दूरी की प्राथमिकता नोट कर ली गई है।',
      };
    }

    // 7. Occupation or Location
    const ack = lang === 'bho' ? 'बहुत बढ़िया, ई नोट हो गइल बा।' : 'बहुत बढ़िया, यह नोट कर लिया है।';
    return {
      recognizedIntent: stepKey,
      cleanValue: raw,
      confidence: 0.9,
      needsClarification: false,
      acknowledgment: ack,
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
        body: JSON.stringify({ profile, language: lang }),
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

    if (lang === 'bho') {
      return `रउआ नाम ${profile.name || 'लाभार्थी'} बा। रउआ शिक्षा ${profile.education || 'उपलब्ध नहीं'}, हुनर ${profile.skills || 'उपलब्ध नहीं'}, पसंदीदा काम ${profile.interests || 'उपलब्ध नहीं'}, स्थान ${profile.location || 'उपलब्ध नहीं'} अउर कार्य प्राथमिकता ${profile.workType || 'Job'} बा। का ई सब जानकारी सही बा?`;
    }
    if (lang === 'en') {
      return `Your name is ${profile.name || 'Beneficiary'}. Education: ${profile.education || 'Not specified'}. Skills: ${profile.skills || 'Not specified'}. Interests: ${profile.interests || 'Not specified'}. Location: ${profile.location || 'Not specified'}. Work preference: ${profile.workType || 'Job'}. Is all this information correct?`;
    }
    return `आपका नाम ${profile.name || 'लाभार्थी'} है। आपकी शिक्षा ${profile.education || 'उपलब्ध नहीं'}, हुनर ${profile.skills || 'उपलब्ध नहीं'}, पसंदीदा काम ${profile.interests || 'उपलब्ध नहीं'}, स्थान ${profile.location || 'उपलब्ध नहीं'}, और कार्य प्रकार ${profile.workType || 'Job'} है। क्या यह सभी जानकारी सही है?`;
  }
}

export const speechService = new SpeechService();
