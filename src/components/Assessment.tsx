import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icons';
import {
  BeneficiaryProfile,
  SupportedLanguage,
  AssessmentStep,
  ConversationState,
} from '../types';
import { STEPS, DEMO, LANG_CONFIG } from '../data/mockData';
import { speechService, SpeechRecognitionResultWrapper } from '../services/speechService';
import { splitList } from '../services/recommendationEngine';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firebase';
import { locationIntelligenceService } from '../services/locationIntelligenceService';
import { AudioVisualizer } from './AudioVisualizer';

interface AssessmentProps {
  initialProfile?: BeneficiaryProfile | null;
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onSubmit: (profile: BeneficiaryProfile) => void;
  onNotify: (message: string) => void;
  go: (route: string) => void;
  autoStart?: boolean;
  onResetAutoStart?: () => void;
}

export const Assessment: React.FC<AssessmentProps> = ({
  initialProfile,
  currentLang,
  onLanguageChange,
  onSubmit,
  onNotify,
  go,
  autoStart = false,
  onResetAutoStart,
}) => {
  const blankProfile: BeneficiaryProfile = {
    name: '',
    education: '',
    skills: '',
    interests: '',
    occupation: '',
    location: '',
    workType: '',
    mobility: '',
    isDemo: false,
  };

  const [answers, setAnswers] = useState<BeneficiaryProfile>(() => {
    return initialProfile ? { ...initialProfile } : { ...blankProfile };
  });

  // -1 indicates the conversational intro/greeting phase
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [heardText, setHeardText] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [editingTranscriptValue, setEditingTranscriptValue] = useState<string>('');
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);
  const [clarificationPrompt, setClarificationPrompt] = useState<string>('');
  const [readbackText, setReadbackText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [turnCounter, setTurnCounter] = useState<number>(0);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  const [consentGranted, setConsentGranted] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('jeevika_consent_given'));
  });
  const [showConsentModal, setShowConsentModal] = useState<boolean>(!consentGranted);

  // References to guarantee state consistency across async voice events
  const speechDebounceTimerRef = useRef<any>(null);
  const fallbackSilenceTimerRef = useRef<any>(null);
  const bargeInListenerTimerRef = useRef<any>(null);
  const turnInProgressRef = useRef<boolean>(false);
  const activeStepRef = useRef<number>(-1);
  const profileRef = useRef<BeneficiaryProfile>(answers);
  const conversationStateRef = useRef<ConversationState>(conversationState);

  useEffect(() => {
    activeStepRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    profileRef.current = answers;
  }, [answers]);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  // Teardown speech and audio timers on unmount
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      speechService.stopListening();
      if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
      if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
      if (bargeInListenerTimerRef.current) clearTimeout(bargeInListenerTimerRef.current);
    };
  }, []);

  const hasAutoFetchedGpsRef = useRef<boolean>(false);

  const getIntroGreeting = useCallback(() => {
    if (currentLang === 'bho') {
      return 'प्रणाम! हम जीविका एआई हईं। रउआ खातिर सही ट्रेनिंग अउर काम के सुझाव देवे खातिर कुछ सवाल पूछब। का हमनी के शुरू कर सकीं?';
    }
    if (currentLang === 'en') {
      return 'Namaste! I am JeevikaAI. I will ask you a few quick questions to recommend the best training and livelihood options. Shall we begin?';
    }
    if (currentLang === 'hin') {
      return 'Namaste! Main JeevikaAI hoon. Aapko sahi training aur kaam ke options suggest karne ke liye kuch sawal poochunga. Kya hum shuru kar sakte hain?';
    }
    return 'नमस्ते! मैं जीविका एआई हूँ। आपको सही ट्रेनिंग और काम के विकल्प बताने के लिए कुछ सवाल पूछूँगा। क्या हम शुरू कर सकते हैं?';
  }, [currentLang]);

  const getStepQuestionText = useCallback(
    (stepIdx: number): string => {
      if (stepIdx === -1) return getIntroGreeting();
      const s = STEPS[stepIdx];
      if (!s) return '';
      return s.q[currentLang] || s.q.hi || s.q.en;
    },
    [currentLang, getIntroGreeting]
  );

  /**
   * Starts listening for a step.
   * When `keepSpeaking` is true, listens in the background while the AI speaks
   * so if the user already understands and speaks immediately, it captures right away!
   */
  const startListeningForStep = useCallback(
    (stepIdx: number, keepSpeaking: boolean = false) => {
      if (!keepSpeaking) {
        setConversationState('listening');
        speechService.stopSpeaking();
      }
      setErrorMessage('');
      turnInProgressRef.current = false;

      speechService.startListening(
        currentLang,
        (result: SpeechRecognitionResultWrapper) => {
          setErrorMessage('');
          setConversationState('listening');
          handleSpeechResult(result, stepIdx);
        },
        (errorMsg: string, code?: string) => {
          if (code === 'no-speech' || code === 'aborted') {
            if (!speechService.isCurrentlySpeaking()) {
              setConversationState('listening');
            }
          } else {
            setConversationState('recoverable_error');
            setErrorMessage(errorMsg);
          }
        },
        () => {
          // Recognition ended
        },
        keepSpeaking
      );
    },
    [currentLang]
  );

  // Start the automatic conversation loop
  const startConversation = useCallback(async () => {
    localStorage.setItem('jeevika_consent_given', 'true');
    setConsentGranted(true);
    setShowConsentModal(false);
    setErrorMessage('');

    await speechService.requestMicrophonePermission();

    speechService.stopListening();
    speechService.stopSpeaking();
    if (bargeInListenerTimerRef.current) clearTimeout(bargeInListenerTimerRef.current);

    setCurrentStepIndex(-1);
    activeStepRef.current = -1;
    setConversationState('asking_question');
    turnInProgressRef.current = false;

    const greetingText = getIntroGreeting();

    // Open barge-in listener while AI is speaking so user can answer immediately
    if (inputMode === 'voice') {
      bargeInListenerTimerRef.current = setTimeout(() => {
        if (activeStepRef.current === -1 && !turnInProgressRef.current) {
          startListeningForStep(-1, true);
        }
      }, 300);
    }

    speechService.speak(greetingText, currentLang, () => {
      if (inputMode === 'voice' && activeStepRef.current === -1 && !turnInProgressRef.current) {
        setConversationState('listening');
        if (!speechService.isCurrentlyListening()) {
          startListeningForStep(-1, false);
        }
      }
    });
  }, [currentLang, getIntroGreeting, inputMode, startListeningForStep]);

  useEffect(() => {
    if (autoStart) {
      localStorage.setItem('jeevika_consent_given', 'true');
      setConsentGranted(true);
      setShowConsentModal(false);
      onResetAutoStart?.();

      const timer = setTimeout(() => {
        startConversation();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [autoStart, onResetAutoStart, startConversation]);

  // Speak a question aloud and simultaneously allow immediate user barge-in speech
  const askQuestionAloud = (stepIdx: number) => {
    if (stepIdx >= STEPS.length) {
      initiateReadbackSummary();
      return;
    }

    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
    if (bargeInListenerTimerRef.current) clearTimeout(bargeInListenerTimerRef.current);

    setCurrentStepIndex(stepIdx);
    activeStepRef.current = stepIdx;
    setConversationState('asking_question');
    turnInProgressRef.current = false;

    speechService.stopListening();
    speechService.stopSpeaking();

    setHeardText('');
    setInterimText('');
    setErrorMessage('');
    setClarificationPrompt('');

    const questionText = getStepQuestionText(stepIdx);

    // Enable immediate barge-in listening while AI is speaking the question
    if (inputMode === 'voice') {
      bargeInListenerTimerRef.current = setTimeout(() => {
        if (activeStepRef.current === stepIdx && !turnInProgressRef.current) {
          startListeningForStep(stepIdx, true);
        }
      }, 300);
    }

    speechService.speak(questionText, currentLang, () => {
      if (inputMode === 'voice' && activeStepRef.current === stepIdx && !turnInProgressRef.current) {
        setConversationState('listening');
        if (!speechService.isCurrentlyListening()) {
          startListeningForStep(stepIdx, false);
        }
      }
    });
  };

  /**
   * Handle speech results with barge-in, deduplication, and fast stability debouncing.
   */
  const handleSpeechResult = (result: SpeechRecognitionResultWrapper, stepIdx: number) => {
    if (turnInProgressRef.current || stepIdx !== activeStepRef.current) return;

    // Stop AI speech immediately as soon as user speaks
    speechService.stopSpeaking();
    setConversationState('listening');

    const isNameStep = stepIdx >= 0 && STEPS[stepIdx]?.key === 'name';
    const cleanTranscript = speechService.deduplicateSpokenText(result.transcript, isNameStep);
    if (!cleanTranscript) return;

    if (result.isFinal) {
      setInterimText('');
      setHeardText(cleanTranscript);

      if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
      if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);

      speechDebounceTimerRef.current = setTimeout(() => {
        if (!turnInProgressRef.current && cleanTranscript && stepIdx === activeStepRef.current) {
          dispatchAnswerProcessing(cleanTranscript, stepIdx);
        }
      }, 650);
    } else {
      setInterimText(cleanTranscript);
      setHeardText(cleanTranscript);

      if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
      fallbackSilenceTimerRef.current = setTimeout(() => {
        if (!turnInProgressRef.current && cleanTranscript && stepIdx === activeStepRef.current) {
          setHeardText(cleanTranscript);
          dispatchAnswerProcessing(cleanTranscript, stepIdx);
        }
      }, 1500);
    }
  };

  /**
   * Dispatches speech transcript to AI conversational interpreter & fuzzy matcher.
   */
  const dispatchAnswerProcessing = async (transcript: string, stepIdx: number) => {
    if (turnInProgressRef.current || stepIdx !== activeStepRef.current) return;
    turnInProgressRef.current = true;

    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
    if (bargeInListenerTimerRef.current) clearTimeout(bargeInListenerTimerRef.current);

    speechService.stopListening();
    speechService.stopSpeaking();

    setConversationState('processing_answer');
    setTurnCounter((prev) => prev + 1);

    const isIntro = stepIdx === -1;
    const currentStepConfig = !isIntro ? STEPS[stepIdx] : null;
    const stepKey = isIntro ? 'intro' : currentStepConfig!.key;
    const questionText = getStepQuestionText(stepIdx);
    const dedupedInput = speechService.deduplicateSpokenText(transcript, stepKey === 'name');

    try {
      const aiResponse = await speechService.extractWithGemini(
        dedupedInput,
        currentLang,
        stepKey,
        profileRef.current,
        questionText
      );

      if (aiResponse.needsClarification && aiResponse.clarificationQuestion) {
        setClarificationPrompt(aiResponse.clarificationQuestion);
        speechService.playAudioCue('clarify');

        setConversationState('asking_question');
        turnInProgressRef.current = false;

        if (inputMode === 'voice') {
          bargeInListenerTimerRef.current = setTimeout(() => {
            if (activeStepRef.current === stepIdx && !turnInProgressRef.current) {
              startListeningForStep(stepIdx, true);
            }
          }, 300);
        }

        speechService.speak(aiResponse.clarificationQuestion, currentLang, () => {
          if (inputMode === 'voice' && activeStepRef.current === stepIdx && !turnInProgressRef.current) {
            setConversationState('listening');
            if (!speechService.isCurrentlyListening()) {
              startListeningForStep(stepIdx, false);
            }
          }
        });
        return;
      }

      if (isIntro) {
        if (aiResponse.recognizedIntent === 'start_negative') {
          setConversationState('idle');
          if (aiResponse.acknowledgment) {
            speechService.speak(aiResponse.acknowledgment, currentLang);
          }
          turnInProgressRef.current = false;
          return;
        }

        speechService.playAudioCue('success');
        askQuestionAloud(0);
        return;
      }

      const rawExtracted = aiResponse.cleanValue || dedupedInput;
      const extractedVal = speechService.deduplicateSpokenText(rawExtracted, stepKey === 'name');

      setAnswers((prev) => ({
        ...prev,
        [stepKey]: extractedVal,
      }));
      profileRef.current = {
        ...profileRef.current,
        [stepKey]: extractedVal,
      };

      speechService.playAudioCue('success');

      const acknowledgment =
        aiResponse.acknowledgment ||
        (currentLang === 'bho' ? 'नोट हो गइल।' : 'नोट कर लिया है।');

      const nextStepIdx = stepIdx + 1;

      if (nextStepIdx < STEPS.length) {
        setCurrentStepIndex(nextStepIdx);
        activeStepRef.current = nextStepIdx;
        setConversationState('asking_question');
        turnInProgressRef.current = false;
        setHeardText('');
        setInterimText('');

        const nextPrompt = `${acknowledgment} ${getStepQuestionText(nextStepIdx)}`;

        // Open barge-in listener for the next question right away
        if (inputMode === 'voice') {
          bargeInListenerTimerRef.current = setTimeout(() => {
            if (activeStepRef.current === nextStepIdx && !turnInProgressRef.current) {
              startListeningForStep(nextStepIdx, true);
            }
          }, 300);
        }

        speechService.speak(nextPrompt, currentLang, () => {
          if (inputMode === 'voice' && activeStepRef.current === nextStepIdx && !turnInProgressRef.current) {
            setConversationState('listening');
            if (!speechService.isCurrentlyListening()) {
              startListeningForStep(nextStepIdx, false);
            }
          }
        });
      } else {
        setCurrentStepIndex(8);
        activeStepRef.current = 8;
        setConversationState('readback_review');
        initiateReadbackSummary();
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setConversationState('recoverable_error');
      setErrorMessage('आवाज़ समझने में समस्या हुई। कृपया माइक दबाकर दोबारा बोलें।');
      turnInProgressRef.current = false;
    }
  };

  /**
   * Read back important collected information before saving the confirmed profile.
   */
  const initiateReadbackSummary = async () => {
    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
    if (bargeInListenerTimerRef.current) clearTimeout(bargeInListenerTimerRef.current);

    speechService.stopListening();
    activeStepRef.current = 999;
    setConversationState('readback_review');

    const verbalSummary = await speechService.generateReadback(profileRef.current, currentLang);
    setReadbackText(verbalSummary);

    speechService.speak(verbalSummary, currentLang, () => {
      if (inputMode === 'voice') {
        speechService.startListening(
          currentLang,
          (result: SpeechRecognitionResultWrapper) => {
            if (result.transcript && result.transcript.trim()) {
              handleConfirmAndGenerateRoadmap();
            }
          },
          () => {},
          () => {}
        );
      }
    });
  };

  const handleStopSpeaking = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
    if (bargeInListenerTimerRef.current) clearTimeout(bargeInListenerTimerRef.current);
    turnInProgressRef.current = false;
    setConversationState('idle');
  };

  /**
   * Microphone Button Tap Handler:
   * Fixes the bug where tapping the mic restarted from the beginning (-1).
   * Now it always operates on the current step!
   */
  const handleMicButtonTap = async () => {
    if (conversationState === 'processing_answer') return;

    // If user is on the intro and hasn't started yet
    if (currentStepIndex === -1 && conversationState === 'idle') {
      await speechService.requestMicrophonePermission();
      askQuestionAloud(0);
      return;
    }

    // If AI is currently speaking, tapping the mic stops AI speech and immediately listens on the current step
    if (conversationState === 'asking_question') {
      speechService.stopSpeaking();
      if (bargeInListenerTimerRef.current) clearTimeout(bargeInListenerTimerRef.current);
      startListeningForStep(currentStepIndex, false);
      return;
    }

    // If already listening, submit captured text if present, or restart listening cleanly on current step
    if (conversationState === 'listening') {
      const textToProcess = (interimText || heardText).trim();
      if (textToProcess) {
        dispatchAnswerProcessing(textToProcess, currentStepIndex);
      } else {
        startListeningForStep(currentStepIndex, false);
      }
      return;
    }

    // If idle or recoverable_error on any step >= 0, resume listening on the current step (never reset to -1)
    await speechService.requestMicrophonePermission();
    startListeningForStep(currentStepIndex, false);
  };

  const handleReplayQuestion = () => {
    speechService.stopListening();
    speechService.stopSpeaking();
    if (currentStepIndex === -1) {
      startConversation();
    } else {
      askQuestionAloud(currentStepIndex);
    }
  };

  // Step Back to previous question (Left bottom button)
  const handlePreviousStep = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
    if (bargeInListenerTimerRef.current) clearTimeout(bargeInListenerTimerRef.current);
    turnInProgressRef.current = false;

    if (currentStepIndex > 0) {
      askQuestionAloud(currentStepIndex - 1);
    } else if (currentStepIndex === 0) {
      setCurrentStepIndex(-1);
      activeStepRef.current = -1;
      setConversationState('idle');
    } else {
      go('home');
    }
  };

  // Step Forward to next question (Right bottom button)
  const handleNextStep = () => {
    if (currentStepIndex === -1) {
      askQuestionAloud(0);
      return;
    }
    const nextStepIdx = currentStepIndex + 1;
    if (nextStepIdx < STEPS.length) {
      askQuestionAloud(nextStepIdx);
    } else {
      initiateReadbackSummary();
    }
  };

  const handleStartEditTranscript = () => {
    setEditingTranscriptValue(
      interimText ||
        heardText ||
        (currentStepIndex >= 0 ? (answers[STEPS[currentStepIndex].key] as string) || '' : '')
    );
    setIsEditingTranscript(true);
    speechService.stopListening();
    speechService.stopSpeaking();
  };

  const handleSaveEditedTranscript = () => {
    const isNameStep = currentStepIndex >= 0 && STEPS[currentStepIndex]?.key === 'name';
    const finalVal = speechService.deduplicateSpokenText(editingTranscriptValue.trim(), isNameStep);
    setIsEditingTranscript(false);
    setHeardText(finalVal);
    setInterimText('');

    if (finalVal) {
      dispatchAnswerProcessing(finalVal, currentStepIndex);
    }
  };

  const handleManualSelectOption = (value: string) => {
    if (currentStepIndex < 0 || currentStepIndex >= STEPS.length) return;
    const currentStepConfig = STEPS[currentStepIndex];

    speechService.stopSpeaking();
    speechService.stopListening();

    setAnswers((prev) => ({ ...prev, [currentStepConfig.key]: value }));
    profileRef.current = { ...profileRef.current, [currentStepConfig.key]: value };

    const nextStepIdx = currentStepIndex + 1;
    if (nextStepIdx < STEPS.length) {
      askQuestionAloud(nextStepIdx);
    } else {
      setCurrentStepIndex(8);
      activeStepRef.current = 8;
      setConversationState('readback_review');
      initiateReadbackSummary();
    }
  };

  // Automatic Exact GPS Location Fetch (Village/City + District + State)
  const handleDetectLocationGps = async () => {
    if (isDetectingGps) return;
    setIsDetectingGps(true);
    onNotify(
      currentLang === 'bho'
        ? 'जीपीएस से रउआ सटीक गाँव/शहर अउर जिला खोजल जा रहल बा...'
        : currentLang === 'en'
        ? 'Auto-fetching your exact village/town and district via GPS...'
        : 'जीपीएस द्वारा आपका सटीक गाँव/शहर और जिला स्वतः प्राप्त किया जा रहा है...'
    );

    try {
      const res = await locationIntelligenceService.detectGpsLocation();
      if (!res) {
        onNotify('स्थान स्वतः प्राप्त नहीं हो सका। कृपया माइक से अपना गाँव/शहर और जिला बोलें।');
        return;
      }

      setAnswers((prev) => ({
        ...prev,
        location: res.location,
        locationAccuracy: res.accuracyLevel,
        locationConfidence: res.confidenceScore,
        locationAccuracyMeters: res.accuracyMeters,
      }));
      profileRef.current = {
        ...profileRef.current,
        location: res.location,
        locationAccuracy: res.accuracyLevel,
        locationConfidence: res.confidenceScore,
        locationAccuracyMeters: res.accuracyMeters,
      };

      setHeardText(res.location);
      onNotify(`📍 ${res.location} (${res.confidenceScore}%)`);

      const ackText =
        currentLang === 'bho'
          ? `रउआ स्थान मिल गइल: ${res.location}।`
          : currentLang === 'en'
          ? `Exact location detected: ${res.location}.`
          : `आपका सटीक स्थान मिल गया: ${res.location}।`;

      speechService.stopSpeaking();
      speechService.stopListening();

      const nextStepIdx = currentStepIndex + 1;
      if (nextStepIdx < STEPS.length) {
        setCurrentStepIndex(nextStepIdx);
        activeStepRef.current = nextStepIdx;
        setConversationState('asking_question');
        turnInProgressRef.current = false;

        const nextPrompt = `${ackText} ${getStepQuestionText(nextStepIdx)}`;
        if (inputMode === 'voice') {
          bargeInListenerTimerRef.current = setTimeout(() => {
            if (activeStepRef.current === nextStepIdx && !turnInProgressRef.current) {
              startListeningForStep(nextStepIdx, true);
            }
          }, 300);
        }
        speechService.speak(nextPrompt, currentLang, () => {
          if (inputMode === 'voice' && activeStepRef.current === nextStepIdx && !turnInProgressRef.current) {
            setConversationState('listening');
            if (!speechService.isCurrentlyListening()) {
              startListeningForStep(nextStepIdx, false);
            }
          }
        });
      } else {
        setCurrentStepIndex(8);
        activeStepRef.current = 8;
        setConversationState('readback_review');
        initiateReadbackSummary();
      }
    } catch (err) {
      console.warn('GPS detection failed:', err);
      onNotify('जीपीएस अनुमति नहीं मिली। कृपया अपना गाँव/शहर और जिला बोलकर बताएं।');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Auto-trigger GPS fetch as soon as user reaches the location step
  useEffect(() => {
    if (currentStepIndex >= 0 && STEPS[currentStepIndex]?.key === 'location') {
      if (!hasAutoFetchedGpsRef.current) {
        hasAutoFetchedGpsRef.current = true;
        handleDetectLocationGps();
      }
    }
  }, [currentStepIndex]);

  const handleConfirmAndGenerateRoadmap = async () => {
    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
    if (bargeInListenerTimerRef.current) clearTimeout(bargeInListenerTimerRef.current);

    speechService.stopSpeaking();
    speechService.stopListening();

    turnInProgressRef.current = true;
    setCurrentStepIndex(8);
    activeStepRef.current = 999;

    setConversationState('saving_profile');
    const finalProfile = profileRef.current || answers;
    storageService.saveProfile(finalProfile);

    try {
      firestoreService.syncLocalProfileToFirestore(finalProfile).catch(() => {});
    } catch {
      // Ignore
    }

    onSubmit(finalProfile);
  };

  const handleLoadDemoProfile = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setAnswers({ ...DEMO });
    profileRef.current = { ...DEMO };
    setCurrentStepIndex(STEPS.length - 1);
    setConversationState('confirming_answer');
    onNotify('डेमो प्रोफाइल (सुनीता देवी) लोड हो गई है।');
  };

  const currentStepConfig: AssessmentStep | null =
    currentStepIndex >= 0 && currentStepIndex < STEPS.length ? STEPS[currentStepIndex] : null;

  const currentFieldVal = currentStepConfig ? (answers[currentStepConfig.key] as string) || '' : '';

  return (
    <main className="max-w-xl mx-auto px-3 sm:px-5 py-3 sm:py-5 space-y-3.5">
      {/* App-Style Top Navigation & Progress Header */}
      <div className="bg-white border border-[#DCE3EA] rounded-2xl p-3 sm:p-3.5 shadow-xs flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            handleStopSpeaking();
            go('home');
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#17365D] hover:bg-[#F5F7FA] transition-colors"
        >
          <Icon name="arrowL" size={16} />
          <span>होम (Home)</span>
        </button>

        {/* Step Progress Indicator */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-extrabold text-[#17365D]">
            {currentStepIndex === -1
              ? 'प्रोफ़ाइल शुरुआत'
              : currentStepIndex >= STEPS.length
              ? 'समीक्षा (Review)'
              : `चरण ${currentStepIndex + 1} / ${STEPS.length}`}
          </div>
          <div className="w-24 sm:w-32 bg-[#F5F7FA] h-1.5 rounded-full overflow-hidden border border-[#DCE3EA] mt-1">
            <div
              className="bg-[#287D73] h-full rounded-full transition-all duration-300"
              style={{
                width:
                  currentStepIndex === -1
                    ? '10%'
                    : `${Math.min(100, ((currentStepIndex + 1) / STEPS.length) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-[#F5F7FA] p-0.5 rounded-lg border border-[#DCE3EA]">
          {LANG_CONFIG.map((l) => (
            <button
              key={l.k}
              type="button"
              onClick={() => {
                onLanguageChange(l.k as SupportedLanguage);
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                currentLang === l.k
                  ? 'bg-white text-[#17365D] shadow-xs'
                  : 'text-[#5F6B76] hover:text-[#202B36]'
              }`}
            >
              {l.k === 'hi' ? 'हिन्दी' : l.k === 'bho' ? 'भोजपुरी' : 'EN'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation Canvas */}
      {conversationState === 'readback_review' || conversationState === 'confirming_answer' ? (
        /* ======================== CONFIRMATION & VERBAL READBACK REVIEW ======================== */
        <div className="bg-white border border-[#DCE3EA] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-[#DCE3EA] pb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-[#287D73]">
                प्रोफ़ाइल तैयार है · Profile Verified
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#17365D]">
                आपकी आजीविका प्रोफ़ाइल
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                if (readbackText) {
                  speechService.speak(readbackText, currentLang);
                } else {
                  initiateReadbackSummary();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DCE3EA] bg-[#F5F7FA] text-xs font-bold text-[#17365D] hover:bg-slate-100"
            >
              <Icon name="volume2" size={14} />
              <span>सुनें</span>
            </button>
          </div>

          {readbackText && (
            <div className="p-3.5 bg-[#F5F7FA] border border-[#DCE3EA] rounded-xl text-xs sm:text-sm text-[#17365D] leading-relaxed">
              “{readbackText}”
            </div>
          )}

          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[11px] font-semibold text-[#5F6B76]">नाम (Name)</span>
              <div className="font-bold text-[#17365D] mt-0.5 text-sm">{answers.name || '—'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[11px] font-semibold text-[#5F6B76]">शिक्षा (Education)</span>
              <div className="font-bold text-[#17365D] mt-0.5 text-sm">{answers.education || '—'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[11px] font-semibold text-[#5F6B76]">हुनर / कौशल (Skills)</span>
              <div className="font-bold text-[#17365D] mt-0.5">{answers.skills || '—'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[11px] font-semibold text-[#5F6B76]">रुचि (Interests)</span>
              <div className="font-bold text-[#17365D] mt-0.5">{answers.interests || '—'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[11px] font-semibold text-[#5F6B76]">सटीक स्थान (Exact Location)</span>
              <div className="font-bold text-[#287D73] mt-0.5">{answers.location || '—'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[11px] font-semibold text-[#5F6B76]">कार्य का प्रकार (Work Type)</span>
              <div className="font-bold text-[#17365D] mt-0.5">{answers.workType || 'Job'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#DCE3EA]">
            <button
              type="button"
              onClick={() => {
                handleStopSpeaking();
                askQuestionAloud(STEPS.length - 1);
              }}
              className="px-4 py-3 rounded-xl border border-[#DCE3EA] text-xs font-bold text-[#17365D] hover:bg-[#F5F7FA] flex items-center gap-1.5"
            >
              <Icon name="arrowL" size={15} />
              <span>पीछे जाएँ (Back)</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmAndGenerateRoadmap}
              className="flex-1 py-3.5 px-5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-sm font-extrabold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Icon name="check" size={18} />
              <span>रोडमैप और योजनाएं देखें →</span>
            </button>
          </div>
        </div>
      ) : (
        /* ======================== APP-STYLE CONVERSATION & VOICE STUDIO ======================== */
        <div className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs flex flex-col">
          {/* 1. Question Header Card */}
          <div className="p-4 sm:p-5 bg-[#F8FAFC] border-b border-[#DCE3EA] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#245A91]">
              <span>
                {currentStepIndex === -1
                  ? 'जीविका एआई परिचय'
                  : `${currentStepIndex + 1}. ${currentStepConfig?.label}`}
              </span>
              <span className="text-[#287D73]">
                {conversationState === 'asking_question'
                  ? 'बोलिए, AI बीच में भी सुन सकता है'
                  : conversationState === 'listening'
                  ? 'माइक चालू है · बोलिए'
                  : conversationState === 'processing_answer'
                  ? 'समझ रहा है...'
                  : 'माइक दबाकर बोलें'}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold text-[#17365D] leading-snug">
              {currentStepIndex === -1
                ? getIntroGreeting()
                : currentStepConfig
                ? currentStepConfig.q[currentLang] || currentStepConfig.q.hi || currentStepConfig.q.en
                : ''}
            </h1>

            {currentStepConfig && currentLang !== 'en' && (
              <p className="text-xs text-[#5F6B76]">{currentStepConfig.q.en}</p>
            )}
          </div>

          {/* 2. Interactive Microphone & Waveform Studio */}
          <div className="px-4 py-5 flex flex-col items-center justify-center bg-white space-y-3">
            <div className="relative flex items-center justify-center">
              {(conversationState === 'listening' || conversationState === 'asking_question') && (
                <span className="absolute w-24 h-24 rounded-full bg-[#245A91]/15 animate-ping pointer-events-none" />
              )}

              <button
                type="button"
                onClick={handleMicButtonTap}
                disabled={conversationState === 'processing_answer'}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                  conversationState === 'listening'
                    ? 'bg-[#245A91] text-white ring-4 ring-[#245A91]/25'
                    : conversationState === 'asking_question'
                    ? 'bg-[#287D73] text-white ring-4 ring-[#287D73]/20'
                    : conversationState === 'processing_answer'
                    ? 'bg-[#D9822B] text-white opacity-90'
                    : 'bg-[#17365D] text-white hover:bg-[#245A91]'
                }`}
                aria-label="Voice microphone control"
              >
                <Icon
                  name={
                    conversationState === 'processing_answer'
                      ? 'refresh'
                      : 'mic'
                  }
                  size={30}
                  className={conversationState === 'processing_answer' ? 'animate-spin' : ''}
                />
              </button>
            </div>

            <div className="w-full max-w-xs mx-auto">
              <AudioVisualizer
                isListening={conversationState === 'listening' || conversationState === 'asking_question'}
                isSpeaking={conversationState === 'asking_question'}
                barCount={18}
              />
            </div>

            <p className="text-xs font-semibold text-[#5F6B76] text-center">
              {conversationState === 'asking_question'
                ? 'AI बोल रहा है — आप अभी तुरंत भी बोलकर जवाब दे सकते हैं'
                : conversationState === 'listening'
                ? 'बोलिए... आपके शब्द नीचे अपने-आप लिखे जा रहे हैं'
                : 'माइक पर टैप करके अपना उत्तर बोलें'}
            </p>
          </div>

          {/* 3. Structured App View Below the Mic */}
          <div className="px-4 pb-4 space-y-3.5">
            {/* Step -1: Quick Start Buttons */}
            {currentStepIndex === -1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => askQuestionAloud(0)}
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Icon name="check" size={16} />
                  <span>हाँ, शुरू करें (Start Now)</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadDemoProfile}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-[#DCE3EA] bg-[#F5F7FA] text-xs font-bold text-[#17365D] hover:bg-slate-200/70 transition-colors"
                >
                  डेमो प्रोफाइल देखें
                </button>
              </div>
            )}

            {/* Live Captured Answer Box (For Steps 0..7) */}
            {currentStepIndex >= 0 && (
              <div className="rounded-xl border border-[#DCE3EA] bg-[#F8FAFC] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17365D]">
                    {interimText || heardText
                      ? 'आपका बोला गया उत्तर (Captured Answer)'
                      : currentFieldVal
                      ? 'दर्ज उत्तर (Saved Answer)'
                      : 'उत्तर यहाँ दिखेगा (Live Capture)'}
                  </span>
                  {(heardText || interimText || currentFieldVal) && !isEditingTranscript && (
                    <button
                      type="button"
                      onClick={handleStartEditTranscript}
                      className="text-xs font-bold text-[#245A91] hover:underline px-2 py-0.5 rounded bg-white border border-[#DCE3EA]"
                    >
                      सुधारें (Edit)
                    </button>
                  )}
                </div>

                {isEditingTranscript ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingTranscriptValue}
                      onChange={(e) => setEditingTranscriptValue(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#245A91] rounded-lg text-sm font-bold text-[#17365D] focus:outline-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingTranscript(false)}
                        className="px-3 py-1.5 text-xs font-bold text-[#5F6B76]"
                      >
                        रद्द करें
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditedTranscript}
                        className="px-4 py-1.5 bg-[#17365D] text-white text-xs font-bold rounded-lg"
                      >
                        सहेजें व आगे बढ़ें
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[38px] flex items-center">
                    {interimText || heardText || currentFieldVal ? (
                      <div className="w-full bg-white px-3 py-2 rounded-lg border border-[#DCE3EA] text-sm font-bold text-[#17365D] flex items-center justify-between gap-2">
                        <span>{interimText || heardText || currentFieldVal}</span>
                        <Icon name="check" size={16} className="text-[#287D73] flex-none" />
                      </div>
                    ) : (
                      <span className="text-xs text-[#5F6B76]">
                        { currentStepConfig?.ph[currentLang] || currentStepConfig?.ph.hi || 'सीधे बोलें या नीचे विकल्प चुनें...' }
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Choice Options Grid (Education, WorkType, Mobility) */}
            {currentStepConfig && currentStepConfig.type === 'choice' && currentStepConfig.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentStepConfig.options.map((opt) => {
                  const isSelected = currentFieldVal === opt.v;
                  const label =
                    currentLang === 'bho'
                      ? opt.bho || opt.hi
                      : currentLang === 'hi'
                      ? opt.hi
                      : opt.v;

                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => handleManualSelectOption(opt.v)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm font-bold transition-all ${
                        isSelected
                          ? 'border-[#17365D] bg-[#17365D] text-white'
                          : 'border-[#DCE3EA] bg-white text-[#17365D] hover:bg-[#F5F7FA]'
                      }`}
                    >
                      <span>{label}</span>
                      {isSelected && <Icon name="check" size={15} />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Skills / Interests Chips */}
            {currentStepConfig && currentStepConfig.type !== 'choice' && currentStepConfig.chips && (
              <div className="flex flex-wrap gap-1.5">
                {currentStepConfig.chips.map((c) => {
                  const label =
                    currentLang === 'bho' ? c.bho || c.hi : currentLang === 'hi' ? c.hi : c.en;
                  const currList = splitList(currentFieldVal);
                  const isPicked = currList.includes(label);

                  return (
                    <button
                      key={c.en}
                      type="button"
                      onClick={() => {
                        const next = isPicked
                          ? currList.filter((x) => x !== label)
                          : [...currList, label];
                        const updated = next.join(', ');
                        setAnswers((prev) => ({
                          ...prev,
                          [currentStepConfig.key]: updated,
                        }));
                        profileRef.current = {
                          ...profileRef.current,
                          [currentStepConfig.key]: updated,
                        };
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        isPicked
                          ? 'border-[#245A91] bg-[#245A91] text-white'
                          : 'border-[#DCE3EA] bg-[#F5F7FA] text-[#17365D] hover:border-[#245A91]'
                      }`}
                    >
                      {isPicked ? '✓ ' : '+ '}
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* LOCATION STEP: Exact Auto-Fetch GPS Card Only (No Manual District List Below) */}
            {currentStepConfig && currentStepConfig.key === 'location' && (
              <div className="rounded-xl border border-[#DCE3EA] bg-[#F8FAFC] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#287D73]">
                      ऑटोमैटिक जीपीएस लोकेशन · Exact Village/City &amp; District
                    </div>
                    <p className="text-xs text-[#5F6B76]">
                      डैशबोर्ड पर आपके सटीक गाँव/शहर और जिले की सरकारी योजनाएं व रोजगार दिखाने के लिए ऑटो-फेच चालू है।
                    </p>
                  </div>
                </div>

                {answers.location && (
                  <div className="p-3 bg-white border border-[#287D73]/40 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-[#5F6B76]">आपका सटीक स्थान:</div>
                      <div className="text-sm font-extrabold text-[#17365D] truncate">
                        📍 {answers.location}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-3.5 py-2 bg-[#287D73] hover:bg-[#1E6058] text-white font-bold rounded-lg text-xs flex-none"
                    >
                      आगे बढ़ें →
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDetectLocationGps}
                  disabled={isDetectingGps}
                  className="w-full py-3 px-4 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-75"
                >
                  <Icon name={isDetectingGps ? 'refresh' : 'target'} size={17} className={isDetectingGps ? 'animate-spin' : ''} />
                  <span>
                    {isDetectingGps
                      ? 'सटीक गाँव/शहर और जिला खोजा जा रहा है...'
                      : '📍 सटीक GPS लोकेशन ऑटो-फेच करें (Auto-Detect Exact Location)'}
                  </span>
                </button>
              </div>
            )}

            {/* Optional Keyboard Input Box when in Text Mode */}
            {currentStepConfig && inputMode === 'text' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentFieldVal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAnswers((prev) => ({ ...prev, [currentStepConfig.key]: val }));
                    profileRef.current = { ...profileRef.current, [currentStepConfig.key]: val };
                  }}
                  placeholder={currentStepConfig.ph[currentLang] || currentStepConfig.ph.hi}
                  className="flex-1 p-3 rounded-xl border border-[#DCE3EA] text-sm focus:outline-none focus:border-[#245A91] bg-white text-[#17365D]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (currentFieldVal.trim()) {
                      dispatchAnswerProcessing(currentFieldVal.trim(), currentStepIndex);
                    } else {
                      handleNextStep();
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-[#17365D] text-white text-xs font-bold"
                >
                  दर्ज करें
                </button>
              </div>
            )}

            {clarificationPrompt && (
              <div className="text-xs p-3 rounded-xl bg-[#FFF8EE] border border-[#D9822B]/30 text-[#8F5517]">
                {clarificationPrompt}
              </div>
            )}

            {errorMessage && (
              <div className="text-xs p-3 rounded-xl bg-[#FDEDEC] text-[#9E2A2B] border border-[#9E2A2B]/20 font-medium">
                {errorMessage}
              </div>
            )}
          </div>

          {/* 4. App-Type Bottom Navigation Bar with Left Back Button */}
          <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#DCE3EA] flex items-center justify-between gap-2">
            {/* Left Side: Back Button */}
            <button
              type="button"
              onClick={handlePreviousStep}
              className="min-h-11 px-3.5 py-2 rounded-xl border border-[#DCE3EA] bg-white hover:bg-slate-100 text-xs font-extrabold text-[#17365D] flex items-center gap-1.5 transition-colors"
            >
              <Icon name="arrowL" size={15} />
              <span>पिछला (Back)</span>
            </button>

            {/* Center Utility Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReplayQuestion}
                className="min-h-11 px-3 py-2 rounded-xl border border-[#DCE3EA] bg-white hover:bg-slate-100 text-xs font-bold text-[#17365D] flex items-center gap-1 transition-colors"
                title="सवाल फिर से सुनें"
              >
                <Icon name="volume2" size={15} />
                <span className="hidden sm:inline">सुनें</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputMode(inputMode === 'voice' ? 'text' : 'voice');
                }}
                className="min-h-11 px-3 py-2 rounded-xl border border-[#DCE3EA] bg-white hover:bg-slate-100 text-xs font-bold text-[#245A91] flex items-center gap-1 transition-colors"
              >
                <Icon name="edit" size={14} />
                <span>{inputMode === 'voice' ? 'लिखें' : 'बोलें'}</span>
              </button>
            </div>

            {/* Right Side: Next / Skip Button */}
            <button
              type="button"
              onClick={handleNextStep}
              className="min-h-11 px-4 py-2 rounded-xl bg-[#245A91] hover:bg-[#17365D] text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors"
            >
              <span>अगला (Next)</span>
              <Icon name="arrowR" size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Privacy & Voice Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-[#17365D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCE3EA] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F5F7FA] text-[#245A91] flex items-center justify-center border border-[#DCE3EA]">
                <Icon name="mic" size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#17365D]">
                  आवाज़ से प्रोफ़ाइल बनाएँ
                </h3>
                <p className="text-xs text-[#5F6B76]">Voice Livelihood Profile Setup</p>
              </div>
            </div>

            <p className="text-xs text-[#5F6B76] leading-relaxed">
              जीविका एआई आपसे कुछ आसान सवाल पूछेगा। आप AI के बोलते समय बीच में भी तुरंत अपना जवाब बोल सकते हैं, और आपका स्थान जीपीएस से स्वतः ले लिया जाएगा।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setInputMode('text');
                  localStorage.setItem('jeevika_consent_given', 'true');
                  setConsentGranted(true);
                  setShowConsentModal(false);
                  setCurrentStepIndex(0);
                }}
                className="px-3.5 py-2.5 rounded-xl border border-[#DCE3EA] text-xs font-bold text-[#5F6B76] hover:text-[#17365D]"
              >
                लिखकर भरें (Type)
              </button>
              <button
                type="button"
                onClick={startConversation}
                className="px-5 py-2.5 rounded-xl bg-[#245A91] text-white text-xs font-bold hover:bg-[#17365D] shadow-sm flex items-center gap-1.5"
              >
                <Icon name="mic" size={14} />
                <span>बोलकर शुरू करें (Start)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
