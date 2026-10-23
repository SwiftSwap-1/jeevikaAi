import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LogoMark } from './Logo';
import { Icon } from './Icons';
import { SupportedLanguage, AppView, BeneficiaryProfile } from '../types';
import { speechService, SpeechRecognitionResultWrapper } from '../services/speechService';
import { processLocalAssistantQuery } from '../services/aiAssistantEngine';
import { voiceVocabularyCache, CachedVocabularyItem } from '../services/voiceVocabularyCache';
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
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [showVocabModal, setShowVocabModal] = useState<boolean>(false);
  const [vocabSearch, setVocabSearch] = useState<string>('');
  const [vocabCategory, setVocabCategory] = useState<string>('all');
  const [cachedVocabList, setCachedVocabList] = useState<CachedVocabularyItem[]>(() =>
    voiceVocabularyCache.getAll()
  );

  const effectiveOffline = isOffline || simulatedOffline;

  const [aiMessage, setAiMessage] = useState<string>(
    'नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ? बोलिए, मैं सुन रहा हूँ।'
  );
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'नमस्ते! मैं जीविका एआई हूँ। आप बोलकर पूछ सकते हैं: "रोडमैप कार्ड पढ़ के बताओ", "नौकरी कार्ड बताओ", "कौशल (Skills) कार्ड पढ़ो", या "नौकरियां खोलो"। बोलिए, मैं सुन रहा हूँ!'
    }
  ]);
  const [textInput, setTextInput] = useState<string>('');
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [customWorkerUrl, setCustomWorkerUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('jeevika_custom_worker_url') || '';
    } catch {
      return '';
    }
  });
  const [workerTestStatus, setWorkerTestStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef<boolean>(false);

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
      setActionNotice(currentLang === 'en' ? '🌐 Back Online' : '🌐 इंटरनेट कनेक्ट हो गया है');
      setTimeout(() => setActionNotice(null), 3000);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setActionNotice(currentLang === 'en' ? '🌐 Offline Voice Cache Active' : '🌐 ऑफ़लाइन वॉइस कैश सक्रिय है');
      setTimeout(() => setActionNotice(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentLang]);

  // Sync speechService offline state whenever effectiveOffline changes
  useEffect(() => {
    speechService.setOfflineMode(effectiveOffline);
  }, [effectiveOffline]);

  // Filtered vocabulary list for offline browser modal
  const filteredVocab = useMemo(() => {
    return cachedVocabList.filter((item) => {
      const matchesCategory = vocabCategory === 'all' || item.category === vocabCategory;
      if (!matchesCategory) return false;
      if (!vocabSearch.trim()) return true;
      const q = vocabSearch.toLowerCase().trim();
      return (
        item.phrase.toLowerCase().includes(q) ||
        item.synonyms.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [cachedVocabList, vocabCategory, vocabSearch]);

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
  }, [chatHistory, liveTranscript, aiMessage]);

  // Teardown speech on unmount
  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  const handleStartListening = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }

    speechService.stopSpeaking();
    setIsSpeaking(false);
    setIsListening(true);
    setLiveTranscript('');

    speechService.startListening(
      currentLang,
      (result: SpeechRecognitionResultWrapper) => {
        setIsSpeaking(false); // Gracefully pause AI output state on user speech
        setLiveTranscript(result.transcript);
        if (result.isFinal && result.transcript.trim()) {
          processUserQuery(result.transcript.trim());
        }
      },
      (errorMsg: string, code?: string) => {
        setIsListening(false);
        setIsSpeaking(false);
        if (code === 'network') {
          const offlineNotice = currentLang === 'en'
            ? '🌐 Speech recognition network pause. You can also type your question below.'
            : '🌐 माइक से आवाज़ नहीं आ सकी। आप नीचे टाइप भी कर सकते हैं।';
          setAiMessage(offlineNotice);
        } else {
          setAiMessage(`माफ़ कीजिए: ${errorMsg}`);
        }
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleToggleOpen = async () => {
    if (!isOpen) {
      setIsOpen(true);
      // Proactively prompt browser for microphone permission
      await speechService.requestMicrophonePermission();

      // Auto-greet aloud and immediately start listening for seamless voice interaction
      const greeting = effectiveOffline
        ? (currentLang === 'en'
            ? 'Hello! Offline Voice Cache is active. You can speak or tap any cached command.'
            : 'नमस्ते! ऑफ़लाइन वॉइस कैश सक्रिय है। बोलिए, मैं सुन रहा हूँ!')
        : (currentLang === 'bho'
            ? 'नमस्ते! हम जीविका एआई बानी। रउआ रोडमैप, नौकरी या हुनर कार्ड पढ़े खातिर कह सकेनी, या पेज खोल सकेनी।'
            : currentLang === 'en'
            ? 'Hello! I am JeevikaAI. You can ask me to read your Roadmap Card, Job Cards, or navigate pages. Speak now, I am listening!'
            : 'नमस्ते! मैं जीविका एआई हूँ। आप मुझसे "रोडमैप कार्ड पढ़ो", "नौकरी कार्ड बताओ", या "पेज खोलो" कह सकते हैं। बोलिए, मैं सुन रहा हूँ!');

      setAiMessage(greeting);

      // Start listening immediately so user can speak anytime without waiting
      handleStartListening();

      setIsSpeaking(true);
      speechService.speak(greeting, currentLang, () => {
        setIsSpeaking(false);
      });
    } else {
      setIsOpen(false);
      speechService.stopListening();
      speechService.stopSpeaking();
      setIsListening(false);
      setIsSpeaking(false);
    }
  };

  const processUserQuery = async (queryText: string) => {
    if (processingRef.current || !queryText.trim()) return;
    processingRef.current = true;

    speechService.stopListening();
    setIsListening(false);

    // Add user query to chat history
    setChatHistory((prev) => [...prev, { sender: 'user', text: queryText }]);
    setLiveTranscript('');

    // Normalize with cached vocabulary if best match found
    let normalizedQuery = queryText;
    const cachedMatch = voiceVocabularyCache.findBestMatch(queryText);
    if (cachedMatch && cachedMatch.score >= 0.75) {
      normalizedQuery = cachedMatch.item.phrase;
    }

    // Pre-evaluate with local Indic & English engine
    const localResult = processLocalAssistantQuery(normalizedQuery, currentView, currentLang, profile);

    let finalReply = localResult.reply;
    let spokenText = localResult.spokenReply;
    let targetView = localResult.targetView;
    let actionHighlight = localResult.actionHighlight;
    let profileUpdates = localResult.profileUpdates;
    let isCardRead = localResult.isCardReadout;

    // Dynamically learn & persist the spoken phrase in local cache for future offline voice matching
    voiceVocabularyCache.addPhrase(queryText, 'navigation', currentLang);
    setCachedVocabList(voiceVocabularyCache.getAll());

    // Direct Fast-Track for Hands-Free Voice Navigation (Instant 0ms response for low-literacy users)
    const isDirectNav = Boolean(localResult.targetView && !localResult.isCardReadout && !localResult.profileUpdates);

    if (!isDirectNav) {
      // Attempt live AI call to Gemini / Cloudflare Worker / backend proxy for questions or card explanations
      setIsAiThinking(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const targetLocation = activeLocation || profile?.location || 'Maharajganj, Uttar Pradesh';
        const endpoint = customWorkerUrl.trim() || '/api/chat';

      let response: Response | null = null;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: normalizedQuery,
            language: currentLang,
            currentView,
            userProfile: {
              ...(profile || {}),
              location: targetLocation
            }
          }),
          signal: controller.signal
        });
      } catch (fetchErr) {
        // If custom worker failed (CORS error, network block, etc.), fallback to internal /api/chat
        if (customWorkerUrl.trim()) {
          console.warn('Custom worker fetch failed, falling back to /api/chat:', fetchErr);
          try {
            response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: normalizedQuery,
                language: currentLang,
                currentView,
                userProfile: {
                  ...(profile || {}),
                  location: targetLocation
                }
              }),
              signal: controller.signal
            });
          } catch (internalErr) {
            console.warn('Internal server fallback also failed:', internalErr);
          }
        }
      }
      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json();
        const extractedReply = data.reply || data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (extractedReply && !data.fallback) {
          finalReply = extractedReply;
          spokenText = extractedReply;
          if (data.targetView) targetView = data.targetView;
          if (data.actionHighlight) actionHighlight = data.actionHighlight;
          if (data.profileUpdates) profileUpdates = data.profileUpdates;
          setIsOffline(false);
          setSimulatedOffline(false);
        } else if (data.error && customWorkerUrl.trim()) {
          // If worker returned a Gemini quota or auth error, fallback to internal server
          console.warn('Worker returned error, attempting internal server:', data.error);
          try {
            const fallbackRes = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: normalizedQuery,
                language: currentLang,
                currentView,
                userProfile: {
                  ...(profile || {}),
                  location: targetLocation
                }
              })
            });
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              if (fallbackData.reply) {
                finalReply = fallbackData.reply;
                spokenText = fallbackData.reply;
                setIsOffline(false);
                setSimulatedOffline(false);
              }
            }
          } catch {
            // Ignore, finalReply will remain local fallback
          }
        }
      } else if (customWorkerUrl.trim()) {
        // Custom worker returned non-200 HTTP code (e.g. 455, 429, 500) -> try internal server
        try {
          const fallbackRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: normalizedQuery,
              language: currentLang,
              currentView,
              userProfile: {
                ...(profile || {}),
                location: targetLocation
              }
            })
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.reply) {
              finalReply = fallbackData.reply;
              spokenText = fallbackData.reply;
              setIsOffline(false);
              setSimulatedOffline(false);
            }
          }
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      // Fallback is already pre-computed in localResult!
      console.warn('AI assistant using resilient local Indic engine fallback:', err);
    } finally {
      setIsAiThinking(false);
    }
  }

    setAiMessage(finalReply);
    setChatHistory((prev) => [...prev, { sender: 'ai', text: finalReply }]);

    // Show temporary banner notice if reading card or navigating
    if (isCardRead) {
      setActionNotice(currentLang === 'en' ? '📖 Reading Card Aloud...' : '📖 कार्ड बोलकर सुनाया जा रहा है...');
      setTimeout(() => setActionNotice(null), 3500);
    } else if (targetView) {
      setActionNotice(currentLang === 'en' ? `🚀 Opening ${targetView}...` : `🚀 पेज खोला जा रहा है: ${targetView}...`);
      setTimeout(() => setActionNotice(null), 3000);
    }

    // Speak response aloud (clean spoken text)
    setIsSpeaking(true);
    speechService.speak(spokenText, currentLang, () => {
      setIsSpeaking(false);
    });

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
      }, 400);
    }

    processingRef.current = false;
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
      {/* Floating AI Action Notice Banner if Navigating */}
      {actionNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#17365D] text-white px-4 py-2 rounded-2xl shadow-xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Icon name="sparkles" size={16} className="text-[#38BDF8]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Floating Assistant Trigger Button - Draggable and repositionable anywhere on screen */}
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
          title="JeevikaAI Voice Assistant (टैप करें या ड्रैग करके कहीं भी रखें)"
        >
          {/* Animated Glow Rings */}
          <span className="absolute -inset-1 rounded-full bg-cyan-400/30 animate-ping pointer-events-none" />
          <LogoMark size={28} />

          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#D9822B] text-white text-[9px] font-extrabold shadow-sm border border-white">
            AI
          </span>
        </button>
      </div>

      {/* Floating Voice Assistant Panel / Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 w-[calc(100vw-1.5rem)] sm:w-96 max-h-[80vh] sm:max-h-[580px] bg-white border border-[#DCE3EA] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in ${
            customPosition && customPosition.x < 240 ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
          } ${customPosition && customPosition.y < 350 ? 'top-16' : 'bottom-20 md:bottom-24'}`}
        >
          {/* Panel Header */}
          <div className="p-4 bg-gradient-to-r from-[#17365D] to-[#245A91] text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <LogoMark size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none font-['Bricolage_Grotesque']">
                  JeevikaAI Voice Assistant
                </h3>
                <span className="text-[10px] text-white/80 font-medium">
                  Voice &amp; Nav Assistant
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowVocabModal(true)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="लोकल वॉइस-टू-टेक्स्ट डिक्शनरी (Local Speech Vocabulary Cache)"
              >
                <Icon name="layers" size={13} />
                <span className="hidden xs:inline">वॉइस कैश ({cachedVocabList.length})</span>
              </button>
              <button
                onClick={() => setShowApiModal(true)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="Cloudflare Worker & API Key Setup"
              >
                <Icon name="info" size={13} />
                <span className="hidden xs:inline">API Info</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  speechService.stopListening();
                  speechService.stopSpeaking();
                  setIsListening(false);
                  setIsSpeaking(false);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          </div>

          {/* Active Location & AI Status Banner */}
          <div className="px-3 py-1.5 bg-[#EBF3FB] border-b border-[#DCE3EA] flex items-center justify-between text-[11px] flex-wrap gap-1">
            <div className="flex items-center gap-1.5 font-bold text-[#17365D] min-w-0">
              <span className="text-amber-600 flex-shrink-0">📍</span>
              <span className="truncate max-w-[150px] sm:max-w-[190px]">
                {activeLocation || profile?.location || 'Maharajganj, Uttar Pradesh'}
              </span>
              <LocationAccuracyBadge
                level={locationIntelligenceService.getLocationAccuracy().level}
                confidenceScore={locationIntelligenceService.getLocationAccuracy().confidenceScore}
                currentLang={currentLang}
                className="flex-shrink-0"
              />
            </div>

            {isAiThinking ? (
              <span className="flex items-center gap-1 text-[#245A91] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#245A91]" />
                <span>AI लाइव सोच रहा है...</span>
              </span>
            ) : (
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Gemini AI कनेक्टेड</span>
              </span>
            )}
          </div>

          {/* Voice Spectrum / Waveform Animation Indicator */}
          <div className="p-3 bg-[#F5F7FA] border-b border-[#DCE3EA] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {isListening ? (
                <span className="flex items-center gap-1 text-[#287D73] font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#287D73]" />
                  <span>सुन रहा हूँ... (Listening)</span>
                </span>
              ) : isSpeaking ? (
                <span className="flex items-center gap-1 text-[#245A91] font-bold">
                  <Icon name="volume2" size={14} className="animate-pulse" />
                  <span>बोल रहा हूँ... (Speaking)</span>
                </span>
              ) : (
                <span className="text-[#5F6B76] font-medium">
                  माइक चालू करें (Tap mic to speak)
                </span>
              )}
            </div>

            {/* Audio Wave Bars */}
            {(isListening || isSpeaking) && (
              <div className="flex items-center gap-1 h-4">
                <span className="w-1 bg-[#287D73] rounded-full animate-bounce [animation-delay:0.1s] h-3" />
                <span className="w-1 bg-[#245A91] rounded-full animate-bounce [animation-delay:0.2s] h-4" />
                <span className="w-1 bg-[#D9822B] rounded-full animate-bounce [animation-delay:0.3s] h-2" />
                <span className="w-1 bg-[#287D73] rounded-full animate-bounce [animation-delay:0.4s] h-4" />
              </div>
            )}
          </div>

          {/* Offline Status & Cached Voice-to-Text Vocabulary Indicator */}
          {effectiveOffline && (
            <div className="p-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-[11px] text-amber-900 font-semibold animate-fade-in">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  🌐 ऑफ़लाइन वॉइस मोड: {cachedVocabList.length} कमांड्स कैश उपलब्ध
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowVocabModal(true)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold transition-colors shadow-2xs cursor-pointer"
                  title="ऑफ़लाइन वॉइस डिक्शनरी खोलें"
                >
                  डिक्शनरी
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsOffline(false);
                    setSimulatedOffline(false);
                    setActionNotice('🔄 ऑनलाइन कनेक्ट किया जा रहा है...');
                    try {
                      const res = await fetch('/api/health');
                      if (res.ok) {
                        setActionNotice('✅ ऑनलाइन सर्वर सफलतापूर्वक कनेक्टेड!');
                      }
                    } catch {
                      // ignore
                    }
                    setTimeout(() => setActionNotice(null), 3000);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                  title="ऑनलाइन मोड में पुनः कनेक्ट करें"
                >
                  <span>🔄</span>
                  <span>पुनः कनेक्ट करें</span>
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
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

            {/* Live Auto-Filling Speech Transcript */}
            {liveTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[85%] p-3 rounded-2xl bg-[#E3F1FA] text-[#245A91] border border-[#245A91]/30 rounded-br-none font-semibold animate-pulse">
                  <span className="text-[10px] uppercase tracking-wider block font-bold text-[#245A91] mb-0.5">
                    Recording Live Voice...
                  </span>
                  {liveTranscript}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Record & Keyboard Input Footer */}
          <div className="p-3 bg-white border-t border-[#DCE3EA] space-y-2">
            {/* Hands-Free Voice Guidance Banner for Low-Literacy Users */}
            <div className="bg-[#245A91]/10 border border-[#245A91]/20 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] text-[#17365D]">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-sm">🗣️</span>
                <span>
                  {currentLang === 'en'
                    ? 'Hands-Free: Say "Go to dashboard" or "Open settings"'
                    : currentLang === 'bho'
                    ? 'बोलल जाव: "डैशबोर्ड खोलीं" या "सेटिंग्स खोलीं"'
                    : 'बोलिए: "डैशबोर्ड खोलो" या "ओपन सेटिंग्स"'}
                </span>
              </div>
              <span className="text-[10px] bg-[#245A91] text-white px-2 py-0.5 rounded-full font-extrabold">
                वॉइस नेविगेशन
              </span>
            </div>

            {/* Quick Interactive Card Reading & Hands-Free Navigation Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold no-scrollbar">
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'go to dashboard' : 'डैशबोर्ड खोलो')}
                className="px-2.5 py-1 rounded-lg bg-[#17365D] text-white hover:bg-[#245A91] whitespace-nowrap flex items-center gap-1 transition-colors shadow-2xs font-bold"
                title="डैशबोर्ड पर जाएँ (Go to Dashboard)"
              >
                <span>📊</span>
                <span>{currentLang === 'en' ? 'Go to Dashboard' : 'डैशबोर्ड खोलो'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'open settings' : 'सेटिंग्स खोलो')}
                className="px-2.5 py-1 rounded-lg bg-[#5F6B76]/10 text-[#17365D] hover:bg-[#5F6B76]/20 whitespace-nowrap border border-[#DCE3EA] flex items-center gap-1 transition-colors font-bold"
                title="सेटिंग्स खोलें (Open Settings)"
              >
                <span>⚙️</span>
                <span>{currentLang === 'en' ? 'Open Settings' : 'सेटिंग्स'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Read Roadmap Card' : 'रोडमैप कार्ड पढ़ के बताओ')}
                className="px-2.5 py-1 rounded-lg bg-[#287D73]/10 text-[#287D73] hover:bg-[#287D73]/20 whitespace-nowrap border border-[#287D73]/20 flex items-center gap-1 transition-colors"
                title="रोडमैप कार्ड बोलकर सुनें"
              >
                <span>🗺️</span>
                <span>{currentLang === 'en' ? 'Read Roadmap' : 'रोडमैप कार्ड'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Read Job Cards' : 'नौकरी कार्ड पढ़ के बताओ')}
                className="px-2.5 py-1 rounded-lg bg-[#245A91]/10 text-[#245A91] hover:bg-[#245A91]/20 whitespace-nowrap border border-[#245A91]/20 flex items-center gap-1 transition-colors"
                title="पास की नौकरियों के कार्ड सुनें"
              >
                <span>💼</span>
                <span>{currentLang === 'en' ? 'Read Jobs' : 'नौकरियां'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Show Training Centers' : 'प्रशिक्षण केंद्र कार्ड बताओ')}
                className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 whitespace-nowrap border border-purple-200 flex items-center gap-1 transition-colors"
                title="प्रशिक्षण केंद्र कार्ड सुनें"
              >
                <span>🎓</span>
                <span>{currentLang === 'en' ? 'Training Centers' : 'प्रशिक्षण'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'Open Profile' : 'मेरी प्रोफ़ाइल खोलो')}
                className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 whitespace-nowrap border border-sky-200 flex items-center gap-1 transition-colors"
                title="प्रोफाइल खोलें"
              >
                <span>👤</span>
                <span>{currentLang === 'en' ? 'Profile' : 'प्रोफ़ाइल'}</span>
              </button>
              <button
                type="button"
                onClick={() => processUserQuery(currentLang === 'en' ? 'go home' : 'होम पेज पर जाओ')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 whitespace-nowrap border border-slate-200 flex items-center gap-1 transition-colors"
                title="होम पेज खोलें"
              >
                <span>🏠</span>
                <span>{currentLang === 'en' ? 'Home' : 'होम'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartListening}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                  isListening
                    ? 'bg-[#9E2A2B] text-white animate-pulse'
                    : 'bg-gradient-to-r from-[#245A91] to-[#17365D] text-white hover:opacity-95'
                }`}
              >
                <Icon name="mic" size={16} />
                <span>
                  {isListening ? 'सुन रहे हैं... (Tap to stop)' : 'बोलकर पूछें (Tap to Speak)'}
                </span>
              </button>
            </div>

            {/* Keyboard fallback form */}
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="या यहाँ टाइप करके पूछें..."
                className="flex-1 p-2.5 rounded-xl border border-[#DCE3EA] text-xs focus:border-[#245A91] focus:outline-none text-[#17365D]"
              />
              <button
                type="submit"
                className="px-3.5 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cloudflare Worker & API Key Instructions Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-[#DCE3EA] text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
              <div className="flex items-center gap-2">
                <LogoMark size={24} />
                <h3 className="font-extrabold text-base text-[#17365D]">
                  API Key &amp; Cloudflare Worker Proxy Setup
                </h3>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-[#5F6B76]"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[#202B36] leading-relaxed">
              <p>
                <strong>कौन सा API लगाना है? (Which API to use?):</strong>
              </p>
              <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA] font-semibold text-[#17365D]">
                🔑 <strong>Google Gemini API Key</strong> (`GEMINI_API_KEY`) from Google AI Studio.
              </div>

              <p>
                <strong>Cloudflare Worker में सही Proxy Code कैसे डालें?</strong>
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 font-medium text-[#5F6B76]">
                <li>Google AI Studio से <code className="text-[#17365D] font-bold">GEMINI_API_KEY</code> लें।</li>
                <li>Cloudflare Dashboard में Worker बनाएँ और <strong>Settings &gt; Variables and Secrets</strong> में <strong>GEMINI_API_KEY</strong> सेव करें।</li>
                <li>Worker Editor में नीचे दिया गया <strong>CORS-सक्षम एवं फॉर्मेटेड</strong> कोड पेस्ट करें:</li>
              </ol>

              {/* Code Snippet Box */}
              <div className="bg-[#17365D] text-white p-3.5 rounded-xl overflow-x-auto font-mono text-[11px] leading-snug max-h-64">
                <pre>{`export default {
  async fetch(request, env) {
    // 1. CORS Headers for browser requests
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 2. Preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    try {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'GEMINI_API_KEY secret not found in Worker settings' }),
          { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const message = body.message || 'नमस्ते';
      const language = body.language || 'hi';

      const systemPrompt = "You are Jeevika AI, a helpful Indian rural and career guide. Reply helpfully in 2-3 sentences in " + language + ".";

      // Use gemini-2.0-flash for high free quota (1500 req/day vs 20 req/day on 2.5-flash)
      const res = await fetch(
        \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\${apiKey}\`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: \`\${systemPrompt}\\n\\nUser query: \${message}\` }] }]
          })
        }
      );

      const data = await res.json();
      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error.message || 'Gemini Quota/API Error', fallback: true }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ?';

      return new Response(
        JSON.stringify({ reply: replyText.trim(), fallback: false }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message, fallback: true }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  }
};`}</pre>
              </div>

              {/* Optional Custom Worker URL Connector */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
                <div className="font-bold text-[#17365D] flex items-center justify-between">
                  <span>🚀 अपना Cloudflare Worker URL कनेक्ट करें (Optional)</span>
                  {customWorkerUrl && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-extrabold">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://my-worker.workers.dev"
                    value={customWorkerUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomWorkerUrl(val);
                      try {
                        localStorage.setItem('jeevika_custom_worker_url', val.trim());
                      } catch {
                        // Ignore
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#DCE3EA] bg-white text-xs font-mono"
                  />
                  <button
                    onClick={async () => {
                      if (!customWorkerUrl.trim()) {
                        setWorkerTestStatus('कृपया URL दर्ज करें');
                        return;
                      }
                      setWorkerTestStatus('परीक्षण हो रहा है...');
                      try {
                        const testRes = await fetch(customWorkerUrl.trim(), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ message: 'नमस्ते', language: 'hi' })
                        });
                        const testData = await testRes.json().catch(() => null);
                        if (testRes.ok && testData) {
                          const hasReply = testData.reply || testData.candidates?.[0]?.content?.parts?.[0]?.text;
                          if (hasReply) {
                            setWorkerTestStatus('✅ वर्कर सफल! AI लाइव कनेक्ट हो गया।');
                          } else if (testData.error) {
                            const msg = typeof testData.error === 'string' ? testData.error : testData.error?.message;
                            setWorkerTestStatus(`❌ Gemini Quota / API Key एरर: ${msg}`);
                          } else {
                            setWorkerTestStatus('⚠️ वर्कर चला लेकिन reply फ़ील्ड नहीं मिला।');
                          }
                        } else {
                          const errDetail = testData?.error?.message || testData?.error || `HTTP ${testRes.status}`;
                          setWorkerTestStatus(`❌ एरर: ${errDetail}`);
                        }
                      } catch (err: any) {
                        setWorkerTestStatus(`❌ CORS या नेटवर्क एरर: ${err.message} (Worker में CORS हेडर्स चेक करें)`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#287D73] text-white font-bold text-xs hover:bg-[#1E6058] transition-colors cursor-pointer"
                  >
                    Test
                  </button>
                </div>
                {workerTestStatus && (
                  <div className="text-[11px] font-bold text-[#17365D]">
                    {workerTestStatus}
                  </div>
                )}
                <p className="text-[10px] text-[#5F6B76]">
                  नोट: यदि आप वर्कर URL नहीं डालते हैं, तो ऐप अपने अंतर्निहित सर्वर (/api/chat) का उपयोग करेगी।
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-[#DCE3EA]">
              <button
                onClick={() => setShowApiModal(false)}
                className="px-4 py-2 rounded-xl bg-[#17365D] text-white font-bold text-xs hover:bg-[#245A91]"
              >
                समझ गया (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Voice-to-Text Vocabulary Cache Modal */}
      {showVocabModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col border border-[#DCE3EA] text-xs animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center text-base">
                  📂
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#17365D] leading-tight">
                    ऑफ़लाइन वॉइस-टू-टेक्स्ट डिक्शनरी (Voice Vocabulary Cache)
                  </h3>
                  <p className="text-[11px] text-[#5F6B76]">
                    लोकल Web Speech API व JSGF कैश — इंटरनेट न होने पर भी 100% काम करता है
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVocabModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-[#5F6B76] transition-colors"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Offline Status & Test Banner */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
              effectiveOffline
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${effectiveOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <div>
                  <span className="font-bold">
                    {effectiveOffline ? 'ऑफ़लाइन मोड सक्रिय (Offline Mode Active)' : 'इंटरनेट कनेक्टेड (Online Mode)'}
                  </span>
                  <span className="block text-[11px] opacity-80">
                    {effectiveOffline
                      ? 'नेटवर्क डिस्कनेक्ट होने पर भी स्पीच रिकग्निशन व कार्ड रीडिंग चालू है'
                      : 'नेटवर्क व लोकल कैश दोनों उपलब्ध हैं'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimulatedOffline(!simulatedOffline)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all shadow-xs ${
                  simulatedOffline
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-white text-[#17365D] border border-[#DCE3EA] hover:bg-slate-50'
                }`}
              >
                {simulatedOffline ? 'सिम्युलेशन बंद करें' : '🔌 ऑफ़लाइन टेस्ट करें'}
              </button>
            </div>

            {/* Search Input & Reset button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  placeholder="कमांड या हुनर खोजें (उदा. 'रोडमैप', 'नौकरी', 'सोलर', '10वीं')..."
                  className="w-full pl-8 pr-7 py-2 rounded-xl border border-[#DCE3EA] text-xs focus:border-[#245A91] focus:outline-none"
                />
                <span className="absolute left-2.5 top-2 text-[#5F6B76]">🔍</span>
                {vocabSearch && (
                  <button
                    onClick={() => setVocabSearch('')}
                    className="absolute right-2.5 top-2 text-[#5F6B76] hover:text-[#17365D]"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  voiceVocabularyCache.resetToDefault();
                  setCachedVocabList(voiceVocabularyCache.getAll());
                  onNotify('वॉइस डिक्शनरी डिफ़ॉल्ट पर रीसेट हो गई');
                }}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#5F6B76] text-[11px] font-semibold transition-colors whitespace-nowrap"
                title="Reset cache to seed vocabulary"
              >
                🔄 रीसेट
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <button
                onClick={() => setVocabCategory('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  vocabCategory === 'all'
                    ? 'bg-[#17365D] text-white'
                    : 'bg-[#F5F7FA] text-[#5F6B76] hover:bg-slate-200'
                }`}
              >
                सभी ({cachedVocabList.length})
              </button>
              {voiceVocabularyCache.getCategories().map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setVocabCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                    vocabCategory === cat.id
                      ? 'bg-[#245A91] text-white'
                      : 'bg-[#F5F7FA] text-[#5F6B76] hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{currentLang === 'en' ? cat.labelEn : cat.labelHi}</span>
                </button>
              ))}
            </div>

            {/* Vocabulary Items List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[45vh]">
              {filteredVocab.length === 0 ? (
                <div className="p-6 text-center text-[#5F6B76]">
                  कोई वॉइस कमांड नहीं मिला। दूसरा शब्द खोजें।
                </div>
              ) : (
                filteredVocab.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-[#DCE3EA] bg-[#FDFEFE] hover:border-[#245A91]/50 hover:bg-[#F5F7FA] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#17365D]">
                          "{item.phrase}"
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E3F1FA] text-[#245A91] font-bold">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[10px] text-[#5F6B76]">
                        <span className="font-semibold">वैकल्पिक:</span>
                        {item.synonyms.slice(0, 4).map((syn, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-slate-100 px-1.5 py-0.5 rounded text-[#202B36]"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          speechService.speak(item.phrase, currentLang);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17365D] font-bold text-[11px] flex items-center gap-1 transition-colors"
                        title="सुनें कि इसे कैसे बोलना है"
                      >
                        <Icon name="volume2" size={13} />
                        <span>सुनें</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowVocabModal(false);
                          processUserQuery(item.phrase);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#245A91] hover:bg-[#17365D] text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                        title="यह वॉइस कमांड तुरंत चलाएं"
                      >
                        <Icon name="mic" size={13} />
                        <span>बोलकर चलाएं</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#DCE3EA] flex items-center justify-between text-[11px] text-[#5F6B76]">
              <span className="flex items-center gap-1 font-medium">
                💾 <span>कुल {cachedVocabList.length} वॉइस कमांड्स लोकल स्टोरेज में सुरक्षित</span>
              </span>
              <button
                type="button"
                onClick={() => setShowVocabModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#17365D] text-white font-bold hover:bg-[#245A91] transition-colors"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
