import React, { useState, useEffect, useRef } from 'react';
import { LogoMark } from './Logo';
import { Icon } from './Icons';
import { SupportedLanguage, AppView, BeneficiaryProfile } from '../types';
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
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
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
  const bargeInTimerRef = useRef<number | null>(null);
  const interruptBadgeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

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

  /**
   * Interruption Handler:
   * Invoked immediately when the user starts speaking while the AI is outputting audio.
   * Stops playback, clears the synthesis & Web Audio buffer, and transitions to 'listening' mode.
   */
  const handleUserInterruption = () => {
    if (bargeInTimerRef.current) {
      window.clearTimeout(bargeInTimerRef.current);
      bargeInTimerRef.current = null;
    }

    // Stop AI playback & flush audio buffer immediately
    speechService.interruptAndClearAudioBuffer(false);
    setIsSpeaking(false);
    setIsListening(true);
    setIsInterrupted(true);

    if (interruptBadgeTimerRef.current) {
      window.clearTimeout(interruptBadgeTimerRef.current);
    }
    interruptBadgeTimerRef.current = window.setTimeout(() => {
      setIsInterrupted(false);
    }, 2200);

    // If recognition wasn't already active, start active listening immediately
    if (isOpenRef.current && !processingRef.current && !speechService.isCurrentlyListening()) {
      startBotListening(false);
    }
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

  // Teardown speech on unmount
  useEffect(() => {
    return () => {
      if (bargeInTimerRef.current) window.clearTimeout(bargeInTimerRef.current);
      if (interruptBadgeTimerRef.current) window.clearTimeout(interruptBadgeTimerRef.current);
      speechService.setInterruptionHandler(null);
      speechService.interruptAndClearAudioBuffer(false);
      speechService.stopListening();
    };
  }, []);

  // Start listening with optional keepSpeaking for barge-in while TTS is playing
  const startBotListening = (keepSpeaking = false) => {
    if (!isOpenRef.current || processingRef.current) return;

    if (!keepSpeaking) {
      speechService.interruptAndClearAudioBuffer(false);
      setIsSpeaking(false);
    }

    setIsListening(true);
    setLiveTranscript('');

    speechService.startListening(
      currentLang,
      (result: SpeechRecognitionResultWrapper) => {
        const cleaned = speechService.deduplicateSpokenText(result.transcript, false);
        if (!cleaned) return;

        // If AI was speaking when user started talking, trigger the interruption handler immediately
        if (speechService.isCurrentlySpeaking() || isSpeaking) {
          handleUserInterruption();
        } else {
          setIsSpeaking(false);
          setIsListening(true);
        }

        setLiveTranscript(cleaned);

        if (result.isFinal && cleaned.trim()) {
          processUserQuery(cleaned.trim());
        }
      },
      (_errorMsg: string) => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      },
      keepSpeaking
    );
  };

  // Speak AI reply aloud, allow immediate barge-in while speaking, and auto-enable mic after speaking finishes
  const speakAndAutoListen = (spokenText: string) => {
    if (bargeInTimerRef.current) {
      window.clearTimeout(bargeInTimerRef.current);
      bargeInTimerRef.current = null;
    }

    setIsInterrupted(false);
    setIsSpeaking(true);

    // Enable background barge-in listening right after speech begins so user can interrupt anytime
    bargeInTimerRef.current = window.setTimeout(() => {
      if (isOpenRef.current && !processingRef.current) {
        startBotListening(true);
      }
    }, 180);

    speechService.speak(spokenText, currentLang, () => {
      setIsSpeaking(false);
      if (bargeInTimerRef.current) {
        window.clearTimeout(bargeInTimerRef.current);
        bargeInTimerRef.current = null;
      }
      // Automatically turn on active microphone after bot finishes speaking
      if (isOpenRef.current && !processingRef.current) {
        window.setTimeout(() => {
          if (isOpenRef.current && !processingRef.current) {
            startBotListening(false);
          }
        }, 150);
      }
    });
  };

  const handleMicButtonTap = () => {
    if (bargeInTimerRef.current) {
      window.clearTimeout(bargeInTimerRef.current);
      bargeInTimerRef.current = null;
    }

    // If AI is speaking, tapping the mic invokes the interruption handler to stop playback, clear buffer, and listen
    if (isSpeaking || speechService.isCurrentlySpeaking()) {
      handleUserInterruption();
      startBotListening(false);
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

  const handleToggleOpen = async () => {
    if (!isOpen) {
      setIsOpen(true);
      isOpenRef.current = true;

      await speechService.requestMicrophonePermission();

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
      if (bargeInTimerRef.current) {
        window.clearTimeout(bargeInTimerRef.current);
        bargeInTimerRef.current = null;
      }
      speechService.interruptAndClearAudioBuffer(false);
      speechService.stopListening();
      setIsListening(false);
      setIsSpeaking(false);
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

    if (bargeInTimerRef.current) {
      window.clearTimeout(bargeInTimerRef.current);
      bargeInTimerRef.current = null;
    }
    speechService.stopListening();
    speechService.stopSpeaking();
    setIsListening(false);
    setIsSpeaking(false);

    // Add user query to chat history
    setChatHistory((prev) => [...prev, { sender: 'user', text: queryText }]);
    setLiveTranscript('');

    // Normalize with cached vocabulary if high-confidence match found
    let normalizedQuery = queryText;
    const cachedMatch = voiceVocabularyCache.findBestMatch(queryText);
    if (cachedMatch && cachedMatch.score >= 0.82) {
      normalizedQuery = cachedMatch.item.phrase;
    }

    // Evaluate with local Indic & English intent engine
    const localResult = processLocalAssistantQuery(normalizedQuery, currentView, currentLang, profile);

    let finalReply = localResult.reply;
    let spokenText = localResult.spokenReply;
    let targetView = localResult.targetView;
    let actionHighlight = localResult.actionHighlight;
    let profileUpdates = sanitizeProfileUpdates(localResult.profileUpdates);
    let isCardRead = localResult.isCardReadout;

    voiceVocabularyCache.addPhrase(queryText, 'navigation', currentLang);

    // If localResult matched a concrete app command (e.g., "रोडमैप पढ़ो", "नौकरी बताओ", "योजना पढ़ो", "ट्रेनिंग बताओ", page navigation, or profile update),
    // execute immediately with 0ms delay so card reading and voice actions always work reliably!
    if (!localResult.matchedIntent) {
      setIsAiThinking(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 14000);

        const targetLocation = activeLocation || profile?.location || 'Maharajganj, Uttar Pradesh';
        const requestPayload = JSON.stringify({
          message: queryText,
          language: currentLang,
          currentView,
          userProfile: {
            ...(profile || {}),
            location: targetLocation
          }
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
      setActionNotice(currentLang === 'en' ? '📖 Reading Card Aloud...' : '📖 कार्ड बोलकर सुनाया जा रहा है...');
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

    // Speak response aloud and automatically re-enable mic for continuous conversation
    speakAndAutoListen(spokenText);
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

            {/* Primary Voice Mic Control */}
            <button
              type="button"
              onClick={handleMicButtonTap}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                isListening
                  ? 'bg-[#287D73] text-white ring-4 ring-[#287D73]/20'
                  : isSpeaking
                  ? 'bg-[#D9822B] text-white'
                  : 'bg-gradient-to-r from-[#245A91] to-[#17365D] text-white hover:opacity-95'
              }`}
            >
              <Icon name="mic" size={16} className={isListening ? 'animate-pulse' : ''} />
              <span>
                {isSpeaking
                  ? 'बोल रहा है... (रोककर बोलने के लिए टैप करें या सीधे बोलें)'
                  : isListening
                  ? 'माइक चालू है - अभी बोलिए (सुन रहा हूँ...)'
                  : 'बोलकर पूछें (Tap to Speak)'}
              </span>
            </button>

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
