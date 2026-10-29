import React, { useState, useEffect, useRef } from 'react';
import { LogoMark } from './Logo';
import { Icon } from './Icons';
import { SupportedLanguage, AppView, BeneficiaryProfile, LocationLivelihoodData } from '../types';
import { speechService, SpeechRecognitionResultWrapper } from '../services/speechService';
import { processLocalAssistantQuery } from '../services/aiAssistantEngine';
import { voiceVocabularyCache } from '../services/voiceVocabularyCache';
import { locationIntelligenceService } from '../services/locationIntelligenceService';
import { LocationAccuracyBadge } from './LocationAccuracyBadge';

interface FloatingVoiceAssistantProps {
  currentView: AppView;
  currentLang: SupportedLanguage;
  profile: BeneficiaryProfile | null;
  go: (view: AppView, sectionId?: string) => void;
  onNotify: (msg: string) => void;
  onUpdateProfile?: (updated: BeneficiaryProfile) => void;
  activeLocation?: string;
  onLocationChange?: (newLoc: string) => void;
  locationData?: LocationLivelihoodData | null;
}

export const FloatingVoiceAssistant: React.FC<FloatingVoiceAssistantProps> = ({
  currentView,
  currentLang,
  profile,
  go,
  onNotify,
  onUpdateProfile,
  activeLocation,
  onLocationChange,
  locationData,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSettlingAfterSpeech, setIsSettlingAfterSpeech] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isInterrupted, setIsInterrupted] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'नमस्ते! मैं जीविका एआई हूँ। आप बोलकर पूछ सकते हैं: "रोडमैप पढ़ो", "नौकरी बताओ", "योजना पढ़ो", या कोई भी सवाल पूछें!'
    }
  ]);
  const [textInput, setTextInput] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef<boolean>(false);
  const isOpenRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isSettlingRef = useRef<boolean>(false);
  const bargeInTimerRef = useRef<number | null>(null);
  const postSpeechCooldownTimerRef = useRef<number | null>(null);
  const finalSpeechDebounceTimerRef = useRef<number | null>(null);
  const interimSilenceTimerRef = useRef<number | null>(null);
  const interruptBadgeTimerRef = useRef<number | null>(null);

  // Real-time Canvas Waveform & Web Audio Analyser refs
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speechBoostRef = useRef<number>(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isSettlingRef.current = isSettlingAfterSpeech;
  }, [isSettlingAfterSpeech]);

  // Boost waveform amplitude immediately when interim speech transcript updates
  useEffect(() => {
    if (liveTranscript) {
      speechBoostRef.current = 1.0;
    }
  }, [liveTranscript]);

  // Draggable floating icon position state
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('jeevika_bot_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  const buttonContainerRef = useRef<HTMLDivElement>(null);

  // Track network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    speechService.setOfflineMode(isOffline);
  }, [isOffline]);

  // Re-clamp position on window resize
  useEffect(() => {
    const handleResize = () => {
      setCustomPosition((prev) => {
        if (!prev) return null;
        const clampedX = Math.max(12, Math.min(window.innerWidth - 68, prev.x));
        const clampedY = Math.max(64, Math.min(window.innerHeight - 80, prev.y));
        return { x: clampedX, y: clampedY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startDrag = (clientX: number, clientY: number) => {
    const rect = buttonContainerRef.current?.getBoundingClientRect();
    const currX = rect ? rect.left : (customPosition?.x || (window.innerWidth - 72));
    const currY = rect ? rect.top : (customPosition?.y || (window.innerHeight - 100));

    dragInfoRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: currX,
      initialY: currY,
      hasMoved: false,
    };
  };

  const onDragMove = (clientX: number, clientY: number) => {
    const dx = clientX - dragInfoRef.current.startX;
    const dy = clientY - dragInfoRef.current.startY;

    if (!dragInfoRef.current.hasMoved && Math.hypot(dx, dy) > 5) {
      dragInfoRef.current.hasMoved = true;
      setIsDragging(true);
    }

    if (dragInfoRef.current.hasMoved) {
      const nextX = Math.max(10, Math.min(window.innerWidth - 68, dragInfoRef.current.initialX + dx));
      const nextY = Math.max(60, Math.min(window.innerHeight - 84, dragInfoRef.current.initialY + dy));
      setCustomPosition({ x: nextX, y: nextY });
    }
  };

  const endDrag = () => {
    if (dragInfoRef.current.hasMoved) {
      setTimeout(() => {
        setIsDragging(false);
      }, 60);
      if (customPosition) {
        try {
          localStorage.setItem('jeevika_bot_pos', JSON.stringify(customPosition));
        } catch {
          // Ignore
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      onDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      onDragMove(moveEvent.clientX, moveEvent.clientY);
    };

    const onMouseUp = () => {
      endDrag();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleClickTrigger = () => {
    if (dragInfoRef.current.hasMoved) {
      return;
    }
    handleToggleOpen();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, liveTranscript, isAiThinking]);

  const clearAllVoiceTimers = () => {
    if (bargeInTimerRef.current) {
      window.clearTimeout(bargeInTimerRef.current);
      bargeInTimerRef.current = null;
    }
    if (postSpeechCooldownTimerRef.current) {
      window.clearTimeout(postSpeechCooldownTimerRef.current);
      postSpeechCooldownTimerRef.current = null;
    }
    if (finalSpeechDebounceTimerRef.current) {
      window.clearTimeout(finalSpeechDebounceTimerRef.current);
      finalSpeechDebounceTimerRef.current = null;
    }
    if (interimSilenceTimerRef.current) {
      window.clearTimeout(interimSilenceTimerRef.current);
      interimSilenceTimerRef.current = null;
    }
  };

  /**
   * Interruption Handler:
   * Invoked when the user explicitly taps the mic/waveform to interrupt while the AI is outputting audio.
   * Stops playback, clears the synthesis & Web Audio buffer, waits briefly for hardware audio to settle,
   * and transitions cleanly to 'listening' mode.
   */
  const handleUserInterruption = () => {
    clearAllVoiceTimers();

    // Stop AI playback & flush audio buffer immediately
    speechService.interruptAndClearAudioBuffer(false);
    speechService.stopListening();
    isSpeakingRef.current = false;
    isSettlingRef.current = true;
    setIsSpeaking(false);
    setIsListening(false);
    setIsSettlingAfterSpeech(true);
    setIsInterrupted(true);

    if (interruptBadgeTimerRef.current) {
      window.clearTimeout(interruptBadgeTimerRef.current);
    }
    interruptBadgeTimerRef.current = window.setTimeout(() => {
      setIsInterrupted(false);
    }, 2200);

    // Wait 250ms for speaker hardware buffer to flush completely before opening microphone
    postSpeechCooldownTimerRef.current = window.setTimeout(() => {
      isSettlingRef.current = false;
      setIsSettlingAfterSpeech(false);
      if (isOpenRef.current && !processingRef.current && !isSpeakingRef.current) {
        startBotListening(false);
      }
    }, 250);
  };

  // Register interruption handler with speechService while assistant is open
  useEffect(() => {
    if (isOpen) {
      speechService.setInterruptionHandler(handleUserInterruption);
    } else {
      speechService.setInterruptionHandler(null);
    }
    return () => {
      speechService.setInterruptionHandler(null);
    };
  }, [isOpen, currentLang]);

  // Teardown speech and audio analyser on unmount
  useEffect(() => {
    return () => {
      clearAllVoiceTimers();
      if (interruptBadgeTimerRef.current) window.clearTimeout(interruptBadgeTimerRef.current);
      if (animFrameRef.current) window.cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      speechService.setInterruptionHandler(null);
      speechService.interruptAndClearAudioBuffer(false);
      speechService.stopListening();
    };
  }, []);

  // Real-time Dynamic Canvas Waveform Animation (Zero-contention with SpeechRecognition)
  useEffect(() => {
    if (!isOpen) {
      if (animFrameRef.current) {
        window.cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    let isCancelled = false;
    let phase = 0;

    const renderWaveform = () => {
      if (isCancelled) return;
      const canvas = waveformCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          const width = rect.width || 320;
          const height = rect.height || 44;

          if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
          }

          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, width, height);

          // Decay speech transcript boost smoothly
          speechBoostRef.current = Math.max(0, speechBoostRef.current * 0.93);

          const activeEnergy = isListening
            ? Math.max(speechBoostRef.current * 0.85, 0.36 + Math.sin(phase * 1.7) * 0.14)
            : isSpeaking
            ? 0.58 + Math.sin(phase * 2.1) * 0.22
            : isAiThinking || isSettlingAfterSpeech
            ? 0.25
            : 0.08;

          const centerY = height / 2;
          phase += isListening ? 0.15 + activeEnergy * 0.1 : isSpeaking ? 0.13 : 0.05;

          // 1. Background subtle glow ribbon wave
          ctx.beginPath();
          for (let x = 0; x <= width; x += 3) {
            const normX = x / width;
            const envelope = Math.sin(normX * Math.PI);
            const yOffset =
              Math.sin(normX * 10 + phase) *
              Math.cos(normX * 4 - phase * 0.6) *
              (height * 0.36) *
              activeEnergy *
              envelope;
            const y = centerY + yOffset;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = isListening
            ? 'rgba(40, 125, 115, 0.28)'
            : isSpeaking
            ? 'rgba(36, 90, 145, 0.26)'
            : 'rgba(148, 163, 184, 0.25)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 2. Dynamic symmetric rounded frequency bars
          const barCount = 30;
          const totalGap = (barCount - 1) * 4;
          const barWidth = Math.max(2.5, (width - 24 - totalGap) / barCount);
          const startX = 12;

          for (let i = 0; i < barCount; i++) {
            const normIdx = i / (barCount - 1);
            const centerWeight = Math.sin(normIdx * Math.PI);

            let barMag = 0;
            if (isListening || isSpeaking || isAiThinking || isSettlingAfterSpeech) {
              const wave1 = Math.sin(phase * 1.4 + i * 0.55);
              const wave2 = Math.cos(phase * 0.9 - i * 0.35);
              barMag = (0.35 + 0.65 * Math.abs(wave1 * wave2)) * activeEnergy;
            } else {
              barMag = 0.08;
            }

            const barHeight = Math.max(
              4,
              Math.min(height - 6, barMag * (height - 6) * (0.45 + 0.55 * centerWeight))
            );
            const x = startX + i * (barWidth + 4);
            const y = centerY - barHeight / 2;

            // Color palette keyed to voice assistant state
            if (isInterrupted) {
              ctx.fillStyle = '#0D9488';
            } else if (isListening) {
              ctx.fillStyle = i % 2 === 0 ? '#287D73' : '#17365D';
            } else if (isSpeaking) {
              ctx.fillStyle = i % 2 === 0 ? '#245A91' : '#D9822B';
            } else if (isAiThinking || isSettlingAfterSpeech) {
              ctx.fillStyle = '#245A91';
            } else {
              ctx.fillStyle = '#CBD5E1';
            }

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }
      animFrameRef.current = window.requestAnimationFrame(renderWaveform);
    };

    animFrameRef.current = window.requestAnimationFrame(renderWaveform);

    return () => {
      isCancelled = true;
      if (animFrameRef.current) {
        window.cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isOpen, isListening, isSpeaking, isAiThinking, isSettlingAfterSpeech, isInterrupted]);

  /**
   * Starts microphone capture ONLY when bot speech output and post-speech cooldown are 100% finished.
   */
  const startBotListening = (_keepSpeaking = false) => {
    if (!isOpenRef.current || processingRef.current) return;

    // Never activate microphone if bot is still speaking or in post-speech cooldown
    if (isSpeakingRef.current || isSettlingRef.current || speechService.isCurrentlySpeaking()) {
      return;
    }

    if (finalSpeechDebounceTimerRef.current) {
      window.clearTimeout(finalSpeechDebounceTimerRef.current);
      finalSpeechDebounceTimerRef.current = null;
    }
    if (interimSilenceTimerRef.current) {
      window.clearTimeout(interimSilenceTimerRef.current);
      interimSilenceTimerRef.current = null;
    }

    setIsSpeaking(false);
    setIsSettlingAfterSpeech(false);
    setIsListening(true);
    setLiveTranscript('');

    speechService.startListening(
      currentLang,
      (result: SpeechRecognitionResultWrapper) => {
        // Strict non-overlap guard: ignore any mic input if bot is speaking or settling
        if (
          !isOpenRef.current ||
          processingRef.current ||
          isSpeakingRef.current ||
          isSettlingRef.current ||
          speechService.isCurrentlySpeaking()
        ) {
          return;
        }

        const cleaned = speechService.deduplicateSpokenText(result.transcript, false);
        if (!cleaned) return;

        setIsSpeaking(false);
        setIsListening(true);
        setLiveTranscript(cleaned);

        if (finalSpeechDebounceTimerRef.current) {
          window.clearTimeout(finalSpeechDebounceTimerRef.current);
          finalSpeechDebounceTimerRef.current = null;
        }
        if (interimSilenceTimerRef.current) {
          window.clearTimeout(interimSilenceTimerRef.current);
          interimSilenceTimerRef.current = null;
        }

        if (result.isFinal && cleaned.trim()) {
          finalSpeechDebounceTimerRef.current = window.setTimeout(() => {
            if (isOpenRef.current && !processingRef.current && !isSpeakingRef.current) {
              processUserQuery(cleaned.trim());
            }
          }, 550);
        } else if (cleaned.trim()) {
          interimSilenceTimerRef.current = window.setTimeout(() => {
            if (isOpenRef.current && !processingRef.current && !isSpeakingRef.current) {
              processUserQuery(cleaned.trim());
            }
          }, 1500);
        }
      },
      (_errorMsg: string) => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  /**
   * Speaks AI reply aloud with strict separation from input capture:
   * 1. Immediately stops microphone capture before starting speech output.
   * 2. Waits until speech synthesis has genuinely completed.
   * 3. Enforces a dedicated post-speech acoustic settling cooldown (600ms) so the microphone
   *    never activates prematurely while speaker audio is still decaying.
   */
  const speakAndAutoListen = (spokenText: string) => {
    clearAllVoiceTimers();

    // Ensure microphone is completely off before bot starts talking
    speechService.stopListening();
    isSpeakingRef.current = true;
    isSettlingRef.current = false;
    setIsListening(false);
    setIsSettlingAfterSpeech(false);
    setIsInterrupted(false);
    setIsSpeaking(true);

    speechService.speak(spokenText, currentLang, () => {
      // Poll until browser speechSynthesis hardware is 100% finished speaking
      const waitUntilSynthesisIdle = () => {
        if (!isOpenRef.current || processingRef.current) {
          isSpeakingRef.current = false;
          isSettlingRef.current = false;
          setIsSpeaking(false);
          setIsSettlingAfterSpeech(false);
          return;
        }

        if (
          typeof window !== 'undefined' &&
          (window.speechSynthesis?.speaking || speechService.isCurrentlySpeaking())
        ) {
          postSpeechCooldownTimerRef.current = window.setTimeout(waitUntilSynthesisIdle, 180);
          return;
        }

        // Bot has finished speaking; enter post-speech acoustic cooldown before activating microphone
        isSpeakingRef.current = false;
        isSettlingRef.current = true;
        setIsSpeaking(false);
        setIsSettlingAfterSpeech(true);

        postSpeechCooldownTimerRef.current = window.setTimeout(() => {
          isSettlingRef.current = false;
          setIsSettlingAfterSpeech(false);
          if (isOpenRef.current && !processingRef.current && !isSpeakingRef.current) {
            startBotListening(false);
          }
        }, 600);
      };

      waitUntilSynthesisIdle();
    });
  };

  const handleMicButtonTap = () => {
    clearAllVoiceTimers();

    // If AI is speaking or in post-speech cooldown, tapping the mic interrupts and transitions cleanly to listening
    if (isSpeaking || isSettlingAfterSpeech || speechService.isCurrentlySpeaking()) {
      handleUserInterruption();
      return;
    }

    // If already listening and user has partial transcript, process it immediately
    if (isListening) {
      if (liveTranscript.trim()) {
        processUserQuery(liveTranscript.trim());
      } else {
        speechService.stopListening();
        setIsListening(false);
      }
      return;
    }

    startBotListening(false);
  };

  const handleToggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      isOpenRef.current = true;

      const greeting =
        currentLang === 'bho'
          ? 'नमस्ते! हम जीविका एआई बानी। रउआ रोडमैप पढ़ो, नौकरी बताओ, या कवनो सवाल पूछ सकेनी।'
          : currentLang === 'en'
          ? 'Hello! I am JeevikaAI. You can say Read Roadmap, Show Jobs, or ask any question.'
          : 'नमस्ते! मैं जीविका एआई हूँ। आप "रोडमैप पढ़ो", "नौकरी बताओ", या कोई भी सवाल बोल सकते हैं।';

      speakAndAutoListen(greeting);
    } else {
      setIsOpen(false);
      isOpenRef.current = false;
      isSpeakingRef.current = false;
      isSettlingRef.current = false;
      clearAllVoiceTimers();
      speechService.interruptAndClearAudioBuffer(false);
      speechService.stopListening();
      setIsListening(false);
      setIsSpeaking(false);
      setIsSettlingAfterSpeech(false);
      setIsInterrupted(false);
    }
  };

  const sanitizeProfileUpdates = (rawUpdates: any): Partial<BeneficiaryProfile> | undefined => {
    if (!rawUpdates || typeof rawUpdates !== 'object') return undefined;
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawUpdates)) {
      if (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' && v.trim().toLowerCase() !== 'undefined') {
        cleaned[k] = v.trim();
      }
    }
    return Object.keys(cleaned).length > 0 ? (cleaned as Partial<BeneficiaryProfile>) : undefined;
  };

  const processUserQuery = async (rawQueryText: string) => {
    const queryText = speechService.deduplicateSpokenText(rawQueryText, false) || rawQueryText.trim();
    if (processingRef.current || !queryText) return;
    processingRef.current = true;

    clearAllVoiceTimers();
    speechService.stopListening();
    speechService.stopSpeaking();
    isSpeakingRef.current = false;
    isSettlingRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    setIsSettlingAfterSpeech(false);

    // Add user query to chat history
    setChatHistory((prev) => [...prev, { sender: 'user', text: queryText }]);
    setLiveTranscript('');

    // Normalize with cached vocabulary if high-confidence match found
    let normalizedQuery = queryText;
    const cachedMatch = voiceVocabularyCache.findBestMatch(queryText);
    if (cachedMatch && cachedMatch.score >= 0.82) {
      normalizedQuery = cachedMatch.item.phrase;
    }

    // Evaluate with local Indic & English intent engine using actual live locationData on screen
    const localResult = processLocalAssistantQuery(
      normalizedQuery,
      currentView,
      currentLang,
      profile,
      locationData
    );

    let finalReply = localResult.reply;
    let spokenText = localResult.spokenReply;
    let targetView = localResult.targetView;
    let actionHighlight = localResult.actionHighlight;
    let profileUpdates = sanitizeProfileUpdates(localResult.profileUpdates);
    let isCardRead = localResult.isCardReadout;

    voiceVocabularyCache.addPhrase(queryText, 'navigation', currentLang);

    // If localResult matched a concrete app command (e.g., "रोडमैप पढ़ो", "नौकरी बताओ", "योजना पढ़ो", "सारा डेटा पढ़ो", page navigation, or profile update),
    // execute immediately with 0ms delay so card reading and voice actions always work reliably!
    // Otherwise, route to live Gemini with full chatHistory & live screen locationData so it answers follow-up questions naturally.
    if (!localResult.matchedIntent) {
      setIsAiThinking(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 14000);

        const targetLocation = activeLocation || profile?.location || locationData?.locationLabel || 'Maharajganj, Uttar Pradesh';
        const requestPayload = JSON.stringify({
          message: queryText,
          language: currentLang,
          currentView,
          userProfile: {
            ...(profile || {}),
            location: targetLocation
          },
          chatHistory: chatHistory.slice(-10),
          locationData: locationData
            ? {
                locationLabel: locationData.locationLabel,
                district: locationData.district,
                state: locationData.state,
                opportunities: (locationData.opportunities || []).slice(0, 6).map((o) => ({
                  title: o.title,
                  org: o.org,
                  pay: o.pay,
                  loc: o.loc,
                  distance: o.distance,
                  req: o.req,
                  tag: o.tag,
                  contactPhone: o.contactPhone,
                })),
                trainingCenters: (locationData.trainingCenters || []).slice(0, 5).map((t) => ({
                  title: t.title,
                  org: t.org,
                  pay: t.pay,
                  loc: t.loc,
                  distance: t.distance,
                  req: t.req,
                })),
                schemes: (locationData.schemes || []).slice(0, 5),
                insight: locationData.insight,
              }
            : null,
        });

        let response: Response | null = null;
        try {
          // Primary live Gemini endpoint on backend server
          response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestPayload,
            signal: controller.signal
          });
        } catch {
          response = null;
        }

        // Secondary fallback to Cloudflare Worker if configured and /api/chat was unreachable
        const workerUrl = (import.meta.env.VITE_CLOUDFLARE_WORKER_URL || '').trim();
        if ((!response || !response.ok) && workerUrl) {
          try {
            response = await fetch(workerUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: requestPayload,
              signal: controller.signal
            });
          } catch {
            // Ignore worker network error, fallback to localResult
          }
        }

        clearTimeout(timeoutId);

        if (response && response.ok) {
          const data = await response.json();
          const extractedReply = data.reply || data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (extractedReply && typeof extractedReply === 'string' && !data.error) {
            finalReply = extractedReply;
            spokenText = extractedReply;
            if (data.targetView) targetView = data.targetView;
            if (data.actionHighlight) actionHighlight = data.actionHighlight;
            const liveUpdates = sanitizeProfileUpdates(data.profileUpdates);
            if (liveUpdates) profileUpdates = liveUpdates;
            setIsOffline(false);
          }
        }
      } catch (err) {
        console.warn('Voice assistant fallback:', err);
      } finally {
        setIsAiThinking(false);
      }
    }

    setChatHistory((prev) => [...prev, { sender: 'ai', text: finalReply }]);

    if (isCardRead) {
      setActionNotice(currentLang === 'en' ? '📖 Reading Screen Data Aloud...' : '📖 स्क्रीन का डेटा बोलकर सुनाया जा रहा है...');
      setTimeout(() => setActionNotice(null), 3500);
    } else if (targetView) {
      setActionNotice(currentLang === 'en' ? `🚀 Opening ${targetView}...` : `🚀 पेज खोला जा रहा है...`);
      setTimeout(() => setActionNotice(null), 3000);
    }

    // Apply profile updates via voice if extracted (including location)
    if (profileUpdates) {
      if (profileUpdates.location && onLocationChange) {
        onLocationChange(profileUpdates.location);
        onNotify(
          currentLang === 'en'
            ? `Location updated to: ${profileUpdates.location}`
            : `स्थान अपडेट हुआ: ${profileUpdates.location}`
        );
      }
      if (profile && onUpdateProfile) {
        const updatedProfile = { ...profile, ...profileUpdates };
        onUpdateProfile(updatedProfile);
      }
    }

    // Direct navigation & card pulse highlight
    if (targetView) {
      go(targetView as AppView, actionHighlight);

      setTimeout(() => {
        const highlightId = actionHighlight || `${targetView}-section`;
        const el = document.getElementById(highlightId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-[#287D73]', 'animate-pulse');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-[#287D73]', 'animate-pulse');
          }, 3500);
        }
      }, 350);
    }

    processingRef.current = false;

    // Clean any markdown formatting symbols before speaking aloud and automatically re-enable mic
    const cleanSpoken = spokenText.replace(/\*\*/g, '').replace(/[#•]/g, '').trim();
    speakAndAutoListen(cleanSpoken);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const q = textInput.trim();
    setTextInput('');
    processUserQuery(q);
  };

  return (
    <>
      {/* Floating AI Action Notice Banner if Navigating or Reading Card */}
      {actionNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#17365D] text-white px-4 py-2 rounded-2xl shadow-xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Icon name="sparkles" size={16} className="text-[#38BDF8]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Floating Assistant Trigger Button - Draggable */}
      <div
        ref={buttonContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={
          customPosition
            ? {
                left: `${customPosition.x}px`,
                top: `${customPosition.y}px`,
                right: 'auto',
                bottom: 'auto',
                touchAction: 'none',
              }
            : {
                touchAction: 'none',
              }
        }
        className={`fixed z-50 select-none ${
          !customPosition ? 'bottom-20 md:bottom-8 right-4 sm:right-6' : ''
        } ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}`}
      >
        <button
          type="button"
          onClick={handleClickTrigger}
          className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-[#17365D] via-[#245A91] to-[#287D73] text-white shadow-2xl hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center justify-center border-2 border-white ring-2 ring-black/10"
          aria-label="Open AI Voice Assistant"
          title="JeevikaAI Voice Assistant"
        >
          <span className="absolute -inset-1 rounded-full bg-cyan-400/30 animate-ping pointer-events-none" />
          <LogoMark size={28} />
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#D9822B] text-white text-[9px] font-extrabold shadow-sm border border-white">
            AI
          </span>
        </button>
      </div>

      {/* Floating Voice Assistant Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 w-[calc(100vw-1.5rem)] sm:w-96 max-h-[80vh] sm:max-h-[560px] bg-white border border-[#DCE3EA] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in ${
            customPosition && customPosition.x < 240 ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
          } ${customPosition && customPosition.y < 350 ? 'top-16' : 'bottom-20 md:bottom-24'}`}
        >
          {/* Clean Panel Header */}
          <div className="p-3.5 bg-gradient-to-r from-[#17365D] to-[#245A91] text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <LogoMark size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none font-['Bricolage_Grotesque']">
                  JeevikaAI सहायक
                </h3>
                <span className="text-[10px] text-white/80 font-medium">
                  बोलकर पूछें या पेज खोलें
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                isOpenRef.current = false;
                if (bargeInTimerRef.current) {
                  window.clearTimeout(bargeInTimerRef.current);
                  bargeInTimerRef.current = null;
                }
                speechService.interruptAndClearAudioBuffer(false);
                speechService.stopListening();
                setIsListening(false);
                setIsSpeaking(false);
                setIsInterrupted(false);
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close Assistant"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          {/* Active Location & Voice State Bar */}
          <div className="px-3.5 py-2 bg-[#F5F7FA] border-b border-[#DCE3EA] flex items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-1.5 font-bold text-[#17365D] min-w-0">
              <span className="text-amber-600 flex-shrink-0">📍</span>
              <span className="truncate max-w-[165px] sm:max-w-[200px]">
                {activeLocation || profile?.location || 'Maharajganj, Uttar Pradesh'}
              </span>
              <LocationAccuracyBadge
                level={locationIntelligenceService.getLocationAccuracy().level}
                confidenceScore={locationIntelligenceService.getLocationAccuracy().confidenceScore}
                currentLang={currentLang}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isAiThinking ? (
                <span className="flex items-center gap-1 text-[#245A91] font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#245A91]" />
                  <span>सोच रहा हूँ...</span>
                </span>
              ) : isInterrupted ? (
                <span className="flex items-center gap-1 text-[#287D73] font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#287D73]" />
                  <span>{currentLang === 'en' ? '⚡ Interrupted — Listening...' : '⚡ आवाज़ रोकी गई — सुन रहा हूँ...'}</span>
                </span>
              ) : isSpeaking ? (
                <span className="flex items-center gap-1 text-[#245A91] font-bold">
                  <Icon name="volume2" size={13} className="animate-pulse" />
                  <span>बोल रहा हूँ... (बीच में बोल सकते हैं)</span>
                </span>
              ) : isListening ? (
                <span className="flex items-center gap-1 text-[#287D73] font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#287D73]" />
                  <span>सुन रहा हूँ...</span>
                </span>
              ) : (
                <span className="text-[#5F6B76] font-medium">माइक तैयार है</span>
              )}
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-white">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-[#245A91] text-white rounded-br-none font-medium shadow-xs'
                      : 'bg-[#F5F7FA] text-[#17365D] border border-[#DCE3EA] rounded-bl-none font-medium leading-relaxed'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Live Speech Transcript */}
            {liveTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[85%] p-2.5 rounded-2xl bg-[#E3F1FA] text-[#245A91] border border-[#245A91]/30 rounded-br-none font-semibold animate-pulse">
                  {liveTranscript}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips & Voice / Text Input Footer */}
          <div className="p-3 bg-[#F8FAFC] border-t border-[#DCE3EA] space-y-2.5">
            {/* Quick Action Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] font-semibold no-scrollbar">
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Read All Screen Data' : 'सारा डेटा पढ़ो')}
                className="px-2.5 py-1.5 rounded-xl bg-[#17365D]/10 text-[#17365D] hover:bg-[#17365D]/20 whitespace-nowrap border border-[#17365D]/25 flex items-center gap-1 transition-colors font-bold"
              >
                <Icon name="volume2" size={12} />
                <span>{currentLang === 'en' ? 'Read Page Data' : 'सारा डेटा पढ़ो'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Read Roadmap' : 'रोडमैप पढ़ो')}
                className="px-2.5 py-1.5 rounded-xl bg-[#287D73]/10 text-[#287D73] hover:bg-[#287D73]/20 whitespace-nowrap border border-[#287D73]/25 flex items-center gap-1 transition-colors font-bold"
              >
                <Icon name="map" size={12} />
                <span>{currentLang === 'en' ? 'Read Roadmap' : 'रोडमैप पढ़ो'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Read Jobs' : 'नौकरी बताओ')}
                className="px-2.5 py-1.5 rounded-xl bg-[#245A91]/10 text-[#245A91] hover:bg-[#245A91]/20 whitespace-nowrap border border-[#245A91]/25 flex items-center gap-1 transition-colors font-bold"
              >
                <Icon name="briefcase" size={12} />
                <span>{currentLang === 'en' ? 'Read Jobs' : 'नौकरियां सुनाओ'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Read Schemes' : 'सरकारी योजना बताओ')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 whitespace-nowrap border border-amber-200 flex items-center gap-1 transition-colors font-bold"
              >
                <Icon name="award" size={12} />
                <span>{currentLang === 'en' ? 'Schemes' : 'योजनाएं सुनाओ'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Show Training Centers' : 'प्रशिक्षण केंद्र बताओ')}
                className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 whitespace-nowrap border border-purple-200 flex items-center gap-1 transition-colors font-bold"
              >
                <Icon name="cap" size={12} />
                <span>{currentLang === 'en' ? 'Training' : 'ट्रेनिंग केंद्र'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Open Profile' : 'प्रोफ़ाइल खोलो')}
                className="px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 whitespace-nowrap border border-sky-200 flex items-center gap-1 transition-colors font-bold"
              >
                <Icon name="user" size={12} />
                <span>{currentLang === 'en' ? 'Profile' : 'प्रोफ़ाइल'}</span>
              </button>
            </div>

            {/* Real-Time Dynamic Canvas Waveform Visualizer & Primary Voice Mic Control */}
            <div className="rounded-2xl border border-[#DCE3EA] bg-white p-2 shadow-2xs space-y-1.5">
              <div
                onClick={handleMicButtonTap}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleMicButtonTap();
                }}
                className="relative w-full h-11 rounded-xl bg-gradient-to-r from-[#F8FAFC] via-[#EFF6FF] to-[#F0FDFA] border border-[#E2E8F0] overflow-hidden flex items-center justify-center cursor-pointer"
                title={
                  isListening
                    ? 'आपकी आवाज़ की लाइव तरंगें (Speaking Waveform)'
                    : 'बोलने के लिए टैप करें (Tap to Speak)'
                }
              >
                <canvas
                  ref={waveformCanvasRef}
                  className="w-full h-full block"
                  aria-label="Live Voice Waveform Visualizer"
                />
                <span className="absolute right-2.5 bottom-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/85 text-[#17365D] border border-[#DCE3EA] shadow-2xs pointer-events-none">
                  {isListening
                    ? 'LIVE MIC WAVE'
                    : isSpeaking
                    ? 'AI VOICE WAVE'
                    : isSettlingAfterSpeech
                    ? 'PREPARING MIC'
                    : isAiThinking
                    ? 'ANALYZING'
                    : 'READY'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleMicButtonTap}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                  isListening
                    ? 'bg-[#287D73] text-white ring-4 ring-[#287D73]/20'
                    : isSpeaking
                    ? 'bg-[#D9822B] text-white'
                    : isSettlingAfterSpeech
                    ? 'bg-[#245A91] text-white opacity-90'
                    : 'bg-gradient-to-r from-[#245A91] to-[#17365D] text-white hover:opacity-95'
                }`}
              >
                <Icon name="mic" size={16} className={isListening ? 'animate-pulse' : ''} />
                <span>
                  {isSpeaking
                    ? currentLang === 'en'
                      ? 'Speaking... (Tap to interrupt & speak)'
                      : 'AI बोल रहा है... (रोककर बोलने के लिए टैप करें)'
                    : isSettlingAfterSpeech
                    ? currentLang === 'en'
                      ? 'Speech finished — activating mic...'
                      : 'आवाज़ पूरी हुई — माइक चालू हो रहा है...'
                    : isListening
                    ? currentLang === 'en'
                      ? 'Mic is ON — Speak now'
                      : 'माइक चालू है - अभी बोलिए (सुन रहा हूँ...)'
                    : currentLang === 'en'
                    ? 'Tap to Speak'
                    : 'बोलकर पूछें (Tap to Speak)'}
                </span>
              </button>
            </div>

            {/* Keyboard Input Form */}
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="या यहाँ लिखकर पूछें..."
                className="flex-1 p-2.5 rounded-xl border border-[#DCE3EA] bg-white text-xs focus:border-[#245A91] focus:outline-none text-[#17365D]"
              />
              <button
                type="submit"
                className="px-3.5 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold transition-colors"
              >
                पूछें
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
