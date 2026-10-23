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
import { locationIntelligenceService, POPULAR_INDIAN_REGIONS } from '../services/locationIntelligenceService';
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
  const turnInProgressRef = useRef<boolean>(false);
  const activeStepRef = useRef<number>(-1);
  const profileRef = useRef<BeneficiaryProfile>(answers);
  const conversationStateRef = useRef<ConversationState>(conversationState);

  // Keep references in sync with state
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
    };
  }, []);

  // Automatically fetch GPS geolocation when entering location step if not already set
  useEffect(() => {
    if (currentStepIndex >= 0 && STEPS[currentStepIndex]?.key === 'location' && !answers.location) {
      locationIntelligenceService.detectGpsLocation().then((res) => {
        if (!res) return;
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
        onNotify(`📍 GPS Location: ${res.location} (${res.accuracyLevel} · ${res.confidenceScore}%)`);
      }).catch(() => {
        // Ignore fallback
      });
    }
  }, [currentStepIndex, answers.location, onNotify]);

  // Conversational Intro text in chosen language
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
    // Hindi default
    return 'नमस्ते! मैं जीविका एआई हूँ। आपको सही ट्रेनिंग और काम के विकल्प बताने के लिए कुछ सवाल पूछूँगा। क्या हम शुरू कर सकते हैं?';
  }, [currentLang]);

  // Get current active step question
  const getStepQuestionText = useCallback((stepIdx: number): string => {
    if (stepIdx === -1) return getIntroGreeting();
    const s = STEPS[stepIdx];
    if (!s) return '';
    return s.q[currentLang] || s.q.hi || s.q.en;
  }, [currentLang, getIntroGreeting]);

  // Start the automatic conversation loop
  const startConversation = useCallback(async () => {
    localStorage.setItem('jeevika_consent_given', 'true');
    setConsentGranted(true);
    setShowConsentModal(false);
    setErrorMessage('');

    // Proactively prompt browser for microphone permission
    await speechService.requestMicrophonePermission();

    // Strict microphone guard: Disallow any listening while formulating/asking question
    speechService.stopListening();
    speechService.stopSpeaking();
    turnInProgressRef.current = true; // Lock turn to prevent overlapping mic capture

    // Start with Intro Question Greeting
    setCurrentStepIndex(-1);
    setConversationState('asking_question');
    const greetingText = getIntroGreeting();

    speechService.speak(greetingText, currentLang, () => {
      // Transition strictly to listening AFTER question audio finishes with safe 300ms audio focus release
      if (inputMode === 'voice') {
        setTimeout(() => {
          startListeningForStep(-1);
        }, 300);
      } else {
        setConversationState('asking_question');
      }
    });
  }, [currentLang, getIntroGreeting, inputMode]);

  // Automatic voice conversation trigger when confirmed from start popup
  useEffect(() => {
    if (autoStart) {
      localStorage.setItem('jeevika_consent_given', 'true');
      setConsentGranted(true);
      setShowConsentModal(false);
      onResetAutoStart?.();

      const timer = setTimeout(() => {
        startConversation();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoStart, onResetAutoStart, startConversation]);

  // Speak a question aloud and automatically begin listening once speech finishes
  const askQuestionAloud = (stepIdx: number) => {
    if (stepIdx >= STEPS.length) {
      // All questions done -> Enter verbal readback and summary review
      initiateReadbackSummary();
      return;
    }

    // Explicit state machine transition: asking_question
    setCurrentStepIndex(stepIdx);
    setConversationState('asking_question');
    turnInProgressRef.current = true; // Lock turn while assistant speaks

    // Strict audio guard: stop mic immediately so speech recognition does not hear assistant's voice
    speechService.stopListening();
    speechService.stopSpeaking();

    setHeardText('');
    setInterimText('');
    setErrorMessage('');
    setClarificationPrompt('');

    const questionText = getStepQuestionText(stepIdx);

    speechService.speak(questionText, currentLang, () => {
      if (inputMode === 'voice') {
        setTimeout(() => {
          startListeningForStep(stepIdx);
        }, 300);
      } else {
        setConversationState('asking_question');
      }
    });
  };

  // Start listening automatically for the specific question
  const startListeningForStep = (stepIdx: number) => {
    // Explicit state machine transition: listening
    setConversationState('listening');
    setErrorMessage('');
    turnInProgressRef.current = false; // Open turn for user's voice input

    // Ensure audio playback is fully silenced before opening microphone
    speechService.stopSpeaking();

    speechService.startListening(
      currentLang,
      (result: SpeechRecognitionResultWrapper) => {
        setErrorMessage('');
        handleSpeechResult(result, stepIdx);
      },
      (errorMsg: string, code?: string) => {
        if (code === 'no-speech' || code === 'aborted') {
          setConversationState('listening');
        } else {
          setConversationState('recoverable_error');
          setErrorMessage(errorMsg);
        }
      },
      () => {
        // Recognition completed
      }
    );
  };

  /**
   * Handle speech results with end-of-speech detection and stability debouncing.
   * Guarantees NO duplicate submissions for interim and final results.
   */
  const handleSpeechResult = (result: SpeechRecognitionResultWrapper, stepIdx: number) => {
    // Strict guard: if not in listening state, turn is locked, or step index mismatch, drop event
    if (turnInProgressRef.current || stepIdx !== activeStepRef.current) return;

    // Gracefully pause AI audio output as soon as user begins speaking
    speechService.stopSpeaking();

    if (result.isFinal) {
      setInterimText('');
      setHeardText(result.transcript);

      // Clear any pending debouncers
      if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
      if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);

      // 800ms stability pause ensures user finished sentence without cutting off multi-clause utterances
      speechDebounceTimerRef.current = setTimeout(() => {
        if (!turnInProgressRef.current && result.transcript.trim() && stepIdx === activeStepRef.current) {
          dispatchAnswerProcessing(result.transcript.trim(), stepIdx);
        }
      }, 800);
    } else {
      // Interim progress display - update both interimText and heardText so live feedback is instantly visible
      setInterimText(result.transcript);
      setHeardText(result.transcript);

      // Fallback silence timer: if browser fails to emit isFinal but user went silent for 2000ms
      if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
      fallbackSilenceTimerRef.current = setTimeout(() => {
        if (!turnInProgressRef.current && result.transcript.trim() && stepIdx === activeStepRef.current) {
          setHeardText(result.transcript.trim());
          dispatchAnswerProcessing(result.transcript.trim(), stepIdx);
        }
      }, 2000);
    }
  };

  /**
   * Dispatches speech transcript to AI conversational interpreter.
   * Explicitly enters processing_answer state and disables microphone to prevent redundant processing.
   */
  const dispatchAnswerProcessing = async (transcript: string, stepIdx: number) => {
    // Prevent duplicate processing, re-entry, or processing stale step
    if (turnInProgressRef.current || stepIdx !== activeStepRef.current) return;
    turnInProgressRef.current = true;

    // Clear all pending debounce timers
    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);

    // CRITICAL: Stop microphone immediately upon entering processing_answer
    speechService.stopListening();

    // Explicit state transition: processing_answer
    setConversationState('processing_answer');
    setTurnCounter(prev => prev + 1);

    const isIntro = stepIdx === -1;
    const currentStepConfig = !isIntro ? STEPS[stepIdx] : null;
    const stepKey = isIntro ? 'intro' : currentStepConfig!.key;
    const questionText = getStepQuestionText(stepIdx);

    try {
      // 1. Call secure AI endpoint (with automatic fallback to local Indic rule engine)
      const aiResponse = await speechService.extractWithGemini(
        transcript,
        currentLang,
        stepKey,
        profileRef.current,
        questionText
      );

      // Handle Ambiguity / Low Confidence -> Transition to asking_question for clarification
      if (aiResponse.needsClarification && aiResponse.clarificationQuestion) {
        setClarificationPrompt(aiResponse.clarificationQuestion);
        speechService.playAudioCue('clarify');

        setConversationState('asking_question');
        speechService.speak(aiResponse.clarificationQuestion, currentLang, () => {
          if (inputMode === 'voice') {
            startListeningForStep(stepIdx);
          } else {
            setConversationState('asking_question');
          }
        });
        return;
      }

      // Handle Intro Phase
      if (isIntro) {
        if (aiResponse.recognizedIntent === 'start_negative') {
          setConversationState('idle');
          if (aiResponse.acknowledgment) {
            speechService.speak(aiResponse.acknowledgment, currentLang);
          }
          turnInProgressRef.current = false;
          return;
        }

        // User confirmed readiness ("Haan", "Ji", "Yes", etc.)
        speechService.playAudioCue('success');
        const ack = aiResponse.acknowledgment || (currentLang === 'bho' ? 'बहुत बढ़िया! आईं अब शुरू करत बानी।' : 'बहुत बढ़िया! चलिए शुरू करते हैं।');

        // Transition back to asking_question for Step 0
        setConversationState('asking_question');
        speechService.speak(ack, currentLang, () => {
          askQuestionAloud(0);
        });
        return;
      }

      // Handle Regular Question Phase (Steps 0 through 7)
      const extractedVal = aiResponse.cleanValue || transcript;

      // Update beneficiary profile
      setAnswers(prev => ({
        ...prev,
        [stepKey]: extractedVal
      }));
      profileRef.current = {
        ...profileRef.current,
        [stepKey]: extractedVal
      };

      speechService.playAudioCue('success');

      // Natural conversational segue + acknowledgment
      const acknowledgment = aiResponse.acknowledgment || (
        currentLang === 'bho' ? 'बहुत बढ़िया, ई नोट हो गइल।' : 'बहुत बढ़िया, यह नोट कर लिया है।'
      );

      const nextStepIdx = stepIdx + 1;

      if (nextStepIdx < STEPS.length) {
        // Explicit state transition: asking_question for the next question
        setConversationState('asking_question');
        setCurrentStepIndex(nextStepIdx);
        const nextPrompt = `${acknowledgment} ${getStepQuestionText(nextStepIdx)}`;

        speechService.speak(nextPrompt, currentLang, () => {
          if (inputMode === 'voice') {
            setTimeout(() => {
              startListeningForStep(nextStepIdx);
            }, 300);
          } else {
            setConversationState('asking_question');
          }
        });
      } else {
        // All 8 questions answered -> Advance step to 8 and transition immediately to readback review
        setCurrentStepIndex(8);
        activeStepRef.current = 8;
        setConversationState('readback_review');
        initiateReadbackSummary();
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      // In case of unexpected failure, safely allow user to retry or advance
      setConversationState('recoverable_error');
      setErrorMessage('Could not process speech. You can retry or edit your answer.');
      turnInProgressRef.current = false;
    }
  };

  /**
   * Read back important collected information before saving the confirmed profile.
   * Requirement 10: "Read back important information before saving the confirmed profile."
   */
  const initiateReadbackSummary = async () => {
    // Clear all pending debounce timers from question steps
    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);

    speechService.stopListening();
    activeStepRef.current = 999; // Lock active step index to 999 so no question handler jumps back!
    setConversationState('readback_review');

    // Generate warm conversational readback text
    const verbalSummary = await speechService.generateReadback(profileRef.current, currentLang);
    setReadbackText(verbalSummary);

    // Assistant speaks the summary aloud
    speechService.speak(verbalSummary, currentLang, () => {
      // After reading summary aloud, listen for any verbal confirmation to generate roadmap
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

  // Stop, replay, retry, and edit controls
  const handleStopSpeaking = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);
    turnInProgressRef.current = false;
    setConversationState('idle');
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

  const handleRetryAnswer = () => {
    speechService.stopListening();
    speechService.stopSpeaking();
    setHeardText('');
    setInterimText('');
    setErrorMessage('');
    turnInProgressRef.current = false;

    startListeningForStep(currentStepIndex);
  };

  // Editable transcript controls
  const handleStartEditTranscript = () => {
    setEditingTranscriptValue(interimText || heardText || (currentStepIndex >= 0 ? (answers[STEPS[currentStepIndex].key] as string) || '' : ''));
    setIsEditingTranscript(true);
    speechService.stopListening();
  };

  const handleSaveEditedTranscript = () => {
    const finalVal = editingTranscriptValue.trim();
    setIsEditingTranscript(false);
    setHeardText(finalVal);
    setInterimText('');

    if (finalVal) {
      dispatchAnswerProcessing(finalVal, currentStepIndex);
    }
  };

  // Manual option button or chip selection (usable fallback & tactile touch)
  const handleManualSelectOption = (value: string) => {
    if (currentStepIndex < 0 || currentStepIndex >= STEPS.length) return;
    const currentStepConfig = STEPS[currentStepIndex];

    speechService.stopSpeaking();
    speechService.stopListening();

    setAnswers(prev => ({ ...prev, [currentStepConfig.key]: value }));
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

  // GPS Auto-detection handler with precision calculation
  const handleDetectLocationGps = async () => {
    if (isDetectingGps) return;
    setIsDetectingGps(true);
    onNotify(
      currentLang === 'bho'
        ? 'जीपीएस से स्थान खोजल जा रहल बा... (Detecting Location)'
        : currentLang === 'en'
        ? 'Detecting your location via GPS...'
        : 'जीपीएस द्वारा आपके जिले का पता लगाया जा रहा है...'
    );

    try {
      const res = await locationIntelligenceService.detectGpsLocation();
      if (!res) {
        onNotify('स्थान स्वतः प्राप्त नहीं हो सका। कृपया बोलकर या लिखकर बताएं।');
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

      onNotify(`📍 ${res.location} (${res.accuracyLevel} · ${res.confidenceScore}%)`);

      const ackText =
        currentLang === 'bho'
          ? `स्थान मिल गइल: ${res.district}। बहुत बढ़िया!`
          : currentLang === 'en'
          ? `Location detected: ${res.district}. Great!`
          : `स्थान मिल गया: ${res.district}। बहुत बढ़िया!`;

      speechService.stopSpeaking();
      speechService.stopListening();

      const nextStepIdx = currentStepIndex + 1;
      if (nextStepIdx < STEPS.length) {
        setConversationState('asking_question');
        setCurrentStepIndex(nextStepIdx);
        const nextPrompt = `${ackText} ${getStepQuestionText(nextStepIdx)}`;
        speechService.speak(nextPrompt, currentLang, () => {
          if (inputMode === 'voice') {
            setTimeout(() => startListeningForStep(nextStepIdx), 300);
          } else {
            setConversationState('asking_question');
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
      onNotify('स्थान स्वतः प्राप्त नहीं हो सका। कृपया बोलकर या लिखकर बताएं।');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Quick district selection handler
  const handleSelectQuickDistrict = (districtName: string, stateName: string) => {
    const fullLoc = `${districtName}, ${stateName}`;
    const acc = locationIntelligenceService.setManualDistrict(districtName, stateName);

    setAnswers((prev) => ({
      ...prev,
      location: fullLoc,
      locationAccuracy: acc.level,
      locationConfidence: acc.confidenceScore,
      locationAccuracyMeters: acc.accuracyMeters,
    }));
    profileRef.current = {
      ...profileRef.current,
      location: fullLoc,
      locationAccuracy: acc.level,
      locationConfidence: acc.confidenceScore,
      locationAccuracyMeters: acc.accuracyMeters,
    };

    onNotify(`📍 चुना गया जिला: ${fullLoc}`);

    speechService.stopSpeaking();
    speechService.stopListening();

    const ackText =
      currentLang === 'bho'
        ? `${districtName} जिला नोट हो गइल।`
        : currentLang === 'en'
        ? `District ${districtName} noted.`
        : `${districtName} जिला नोट कर लिया गया है।`;

    const nextStepIdx = currentStepIndex + 1;
    if (nextStepIdx < STEPS.length) {
      setConversationState('asking_question');
      setCurrentStepIndex(nextStepIdx);
      const nextPrompt = `${ackText} ${getStepQuestionText(nextStepIdx)}`;
      speechService.speak(nextPrompt, currentLang, () => {
        if (inputMode === 'voice') {
          setTimeout(() => startListeningForStep(nextStepIdx), 300);
        } else {
          setConversationState('asking_question');
        }
      });
    } else {
      setCurrentStepIndex(8);
      activeStepRef.current = 8;
      setConversationState('readback_review');
      initiateReadbackSummary();
    }
  };

  // Confirm and persist profile to storage and Firestore (Auto-save / cross-device sync)
  const handleConfirmAndGenerateRoadmap = async () => {
    // Clear all pending audio & debounce timers
    if (speechDebounceTimerRef.current) clearTimeout(speechDebounceTimerRef.current);
    if (fallbackSilenceTimerRef.current) clearTimeout(fallbackSilenceTimerRef.current);

    speechService.stopSpeaking();
    speechService.stopListening();

    turnInProgressRef.current = true; // Lock turn permanently
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

    // Call onSubmit immediately so App.tsx switches view to dashboard and unmounts Assessment
    onSubmit(finalProfile);
  };

  // Load Sunita Devi demo profile
  const handleLoadDemoProfile = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setAnswers({ ...DEMO });
    profileRef.current = { ...DEMO };
    setCurrentStepIndex(STEPS.length - 1);
    setConversationState('confirming_answer');
    onNotify('Loaded demo profile (Sunita Devi). Review summary below.');
  };

  const currentStepConfig: AssessmentStep | null =
    currentStepIndex >= 0 && currentStepIndex < STEPS.length ? STEPS[currentStepIndex] : null;

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4">
      {/* Top Header Bar: Clean, Mobile-Native Header */}
      <div className="bg-white border border-[#DCE3EA] rounded-2xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-2">
        <button
          onClick={() => {
            handleStopSpeaking();
            go('home');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-[#5F6B76] hover:text-[#17365D] hover:bg-[#F5F7FA] transition-colors"
        >
          <Icon name="arrowL" size={16} />
          <span>वापस (Back)</span>
        </button>

        {/* Center Progress Pill */}
        <div className="text-center">
          <div className="text-[11px] sm:text-xs font-bold text-[#17365D]">
            {currentStepIndex === -1
              ? 'शुरुआत (Intro)'
              : `सवाल ${currentStepIndex + 1} / ${STEPS.length}`}
          </div>
          <div className="w-20 sm:w-28 bg-[#F5F7FA] h-1.5 rounded-full overflow-hidden border border-[#DCE3EA] mt-1 mx-auto">
            <div
              className="bg-[#245A91] h-full rounded-full transition-all duration-300"
              style={{
                width:
                  currentStepIndex === -1
                    ? '8%'
                    : `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Right: Language Switcher & Demo */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-[#F5F7FA] p-0.5 rounded-lg border border-[#DCE3EA]">
            {LANG_CONFIG.map((l) => (
              <button
                key={l.k}
                onClick={() => {
                  onLanguageChange(l.k as SupportedLanguage);
                  if (conversationState !== 'idle') {
                    handleStopSpeaking();
                  }
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

          <button
            onClick={handleLoadDemoProfile}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#DCE3EA] bg-white text-[11px] font-bold text-[#17365D] hover:border-[#245A91]"
            title="Load demo data for testing"
          >
            <Icon name="user" size={12} />
            <span>डेमो</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Canvas */}
      {conversationState === 'readback_review' || conversationState === 'confirming_answer' ? (
        /* ======================== CONFIRMATION & VERBAL READBACK REVIEW ======================== */
        <div className="bg-white border border-[#DCE3EA] rounded-2xl p-5 sm:p-7 shadow-sm space-y-5 animate-fade-in">
          <div className="border-b border-[#DCE3EA] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#287D73] mb-1">
                <Icon name="check" size={14} />
                <span>पुष्टि करें (Profile Confirmation)</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#17365D]">
                आपकी जानकारी (Your Verified Details)
              </h2>
            </div>

            <button
              onClick={() => {
                if (readbackText) {
                  speechService.speak(readbackText, currentLang);
                } else {
                  initiateReadbackSummary();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE3EA] bg-[#F5F7FA] text-xs font-bold text-[#17365D] hover:bg-slate-100"
            >
              <Icon name="volume2" size={14} />
              <span>पुनः सुनें (Listen Again)</span>
            </button>
          </div>

          {/* Spoken Readback Quote Box */}
          {readbackText && (
            <div className="p-3.5 bg-[#F5F7FA] border-l-4 border-[#245A91] rounded-r-xl text-xs sm:text-sm text-[#17365D] italic">
              “{readbackText}”
            </div>
          )}

          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase">नाम (Name)</span>
              <div className="font-bold text-[#17365D] mt-0.5 text-sm">{answers.name || 'उपलब्ध नहीं'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase">शिक्षा (Education)</span>
              <div className="font-bold text-[#17365D] mt-0.5 text-sm">{answers.education || 'उपलब्ध नहीं'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase">हुनर / कौशल (Skills)</span>
              <div className="font-bold text-[#17365D] mt-0.5">{answers.skills || 'उपलब्ध नहीं'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase">पसंदीदा काम (Interests)</span>
              <div className="font-bold text-[#17365D] mt-0.5">{answers.interests || 'उपलब्ध नहीं'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase">जिला या क्षेत्र (Location)</span>
              <div className="font-bold text-[#17365D] mt-0.5">{answers.location || 'उपलब्ध नहीं'}</div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase">कार्य का प्रकार (Work Type)</span>
              <div className="font-bold text-[#17365D] mt-0.5">{answers.workType || 'Job'}</div>
            </div>
          </div>

          {/* Voice Confirmation Helper Pill */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-900 font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>
                {currentLang === 'bho'
                  ? '🎙️ बोल के कहीं "हाँ सही बा" या नीचे बटन दबाईं:'
                  : currentLang === 'hi'
                  ? '🎙️ बोलिए "हाँ सब सही है" या नीचे दिए बटन पर टैप करें:'
                  : '🎙️ Say "Yes, confirm" or tap the button below:'}
              </span>
            </div>
            <button
              onClick={handleConfirmAndGenerateRoadmap}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs active:scale-95"
            >
              हाँ, सही है ✓
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#DCE3EA]">
            <button
              onClick={() => {
                handleStopSpeaking();
                setCurrentStepIndex(0);
                activeStepRef.current = 0;
                setConversationState('asking_question');
                askQuestionAloud(0);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#DCE3EA] text-xs font-bold text-[#5F6B76] hover:border-[#17365D] hover:bg-[#F5F7FA] transition-colors"
            >
              सुधार करें (Retake Questions)
            </button>

            <button
              onClick={handleConfirmAndGenerateRoadmap}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#17365D] to-[#245A91] hover:from-[#1E4373] hover:to-[#17365D] text-white text-sm font-extrabold shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 ring-2 ring-[#245A91]/40"
            >
              <Icon name="check" size={18} />
              <span>रोडमैप देखें (Confirm &amp; Open Dashboard)</span>
            </button>
          </div>
        </div>
      ) : (
        /* ======================== ACTIVE MOBILE-STYLE CONVERSATION ARENA ======================== */
        <div className="bg-white border border-[#DCE3EA] rounded-2xl p-5 sm:p-7 shadow-sm space-y-5 text-center animate-fade-in">
          {/* Dynamic Voice Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F7FA] text-[#17365D] border border-[#DCE3EA] text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                conversationState === 'listening'
                  ? 'bg-[#245A91] animate-ping'
                  : conversationState === 'asking_question'
                  ? 'bg-[#287D73] animate-pulse'
                  : conversationState === 'processing_answer'
                  ? 'bg-[#D9822B] animate-spin'
                  : 'bg-[#5F6B76]'
              }`}
            />
            <span>
              {conversationState === 'asking_question' &&
                (currentLang === 'bho'
                  ? 'सहायक सवाल पूछ रहल बानी (सुनीं)...'
                  : currentLang === 'hi'
                  ? 'सहायक सवाल पूछ रहे हैं (ध्यान से सुनें)...'
                  : 'Assistant Speaking (Please listen)...')}
              {conversationState === 'listening' &&
                (currentLang === 'bho'
                  ? 'माइक चालू बा — रउआ आराम से बोल सकीं...'
                  : currentLang === 'hi'
                  ? 'माइक चालू है — आप बोलिए...'
                  : 'Microphone Active — Speak your answer...')}
              {conversationState === 'processing_answer' &&
                (currentLang === 'bho'
                  ? 'AI समझ रहल बा (इंतज़ार करीं)...'
                  : currentLang === 'hi'
                  ? 'AI समझ रहा है (कृपया प्रतीक्षा करें)...'
                  : 'AI Interpreting Answer...')}
              {conversationState === 'idle' && 'माइक दबाकर बातचीत शुरू करें'}
              {conversationState === 'recoverable_error' && 'पुनः प्रयास करें (Tap to Retry)'}
            </span>
          </div>

          {/* Central Interactive Voice Sphere & Waveform */}
          <div className="flex flex-col items-center justify-center py-1 space-y-3">
            <div className="relative flex items-center justify-center">
              {conversationState === 'listening' && (
                <span className="absolute w-28 h-28 rounded-full bg-[#245A91]/20 animate-ping pointer-events-none" />
              )}
              {conversationState === 'asking_question' && (
                <span className="absolute w-28 h-28 rounded-full bg-[#287D73]/25 animate-pulse pointer-events-none" />
              )}
              {conversationState === 'processing_answer' && (
                <span className="absolute w-28 h-28 rounded-full bg-[#D9822B]/25 animate-pulse pointer-events-none" />
              )}

              <button
                onClick={
                  conversationState === 'idle'
                    ? startConversation
                    : conversationState === 'listening'
                    ? () => {
                        const textToProcess = interimText || heardText;
                        if (textToProcess) {
                          dispatchAnswerProcessing(textToProcess, currentStepIndex);
                        } else {
                          handleStopSpeaking();
                        }
                      }
                    : conversationState === 'processing_answer'
                    ? () => {}
                    : handleStopSpeaking
                }
                disabled={conversationState === 'processing_answer'}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                  conversationState === 'listening'
                    ? 'bg-[#245A91] text-white ring-4 ring-[#245A91]/30 hover:bg-[#17365D]'
                    : conversationState === 'asking_question'
                    ? 'bg-[#287D73] text-white hover:bg-[#20635B]'
                    : conversationState === 'processing_answer'
                    ? 'bg-[#D9822B] text-white cursor-wait opacity-90'
                    : 'bg-[#17365D] text-white hover:bg-[#245A91]'
                }`}
                aria-label="Voice microphone trigger"
              >
                <Icon
                  name={
                    conversationState === 'asking_question'
                      ? 'volume2'
                      : conversationState === 'listening'
                      ? 'stop'
                      : conversationState === 'processing_answer'
                      ? 'refresh'
                      : 'mic'
                  }
                  size={32}
                  className={conversationState === 'processing_answer' ? 'animate-spin' : ''}
                />
              </button>
            </div>

            {/* Dynamic Multi-Bar Visualizer Synced with Live Mic */}
            <div className="w-full max-w-sm mx-auto">
              <AudioVisualizer
                isListening={conversationState === 'listening'}
                isSpeaking={conversationState === 'asking_question'}
                barCount={20}
              />
            </div>
          </div>

          {/* Primary Question Prompt Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F7FA] border border-[#DCE3EA] text-left space-y-1.5 transition-all">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#245A91] flex items-center justify-between">
              <span>
                {currentStepIndex === -1 ? 'परिचय (Introduction)' : currentStepConfig?.label}
              </span>
              {conversationState === 'asking_question' && (
                <span className="text-[#287D73] font-semibold flex items-center gap-1 text-[11px]">
                  <Icon name="volume2" size={13} />
                  <span>सहायक बोल रहे हैं</span>
                </span>
              )}
            </div>

            <div className="text-base sm:text-xl font-extrabold text-[#17365D] leading-snug">
              {currentStepIndex === -1
                ? getIntroGreeting()
                : currentStepConfig
                ? currentStepConfig.q[currentLang] || currentStepConfig.q.hi || currentStepConfig.q.en
                : ''}
            </div>

            {currentStepConfig && currentLang !== 'en' && (
              <div className="text-xs text-[#5F6B76] italic">
                {currentStepConfig.q.en}
              </div>
            )}
          </div>

          {/* Step -1: One-tap Launch Confirmation */}
          {currentStepIndex === -1 && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  dispatchAnswerProcessing('Haan, shuru karein', -1);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#245A91] hover:bg-[#17365D] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Icon name="check" size={16} />
                <span>हाँ, शुरू करें (Yes, Begin)</span>
              </button>

              <button
                onClick={handleLoadDemoProfile}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-[#DCE3EA] text-xs font-bold text-[#17365D] hover:bg-slate-50 transition-colors"
              >
                डेमो प्रोफाइल से देखें (Sunita Devi)
              </button>
            </div>
          )}

          {/* Real-time Recognized Speech Live Transcription Card */}
          {currentStepIndex >= 0 && (
            <div className="bg-gradient-to-r from-[#F5F7FA] to-[#E3F1FA] border-2 border-[#245A91]/30 rounded-2xl p-4 text-left space-y-2 shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-extrabold text-[#245A91] flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${conversationState === 'listening' ? 'bg-red-500 animate-ping' : 'bg-[#245A91]'}`} />
                  <span>
                    {conversationState === 'listening'
                      ? 'आपकी आवाज़ टाइप हो रही है... (Live Speech Recording)'
                      : 'सहायक ने सुना (Transcript Recorded):'}
                  </span>
                </span>
                {(heardText || interimText) && !isEditingTranscript && (
                  <button
                    onClick={handleStartEditTranscript}
                    className="text-[11px] font-bold text-[#245A91] hover:underline bg-white px-2 py-0.5 rounded-md border border-[#DCE3EA]"
                  >
                    बदलें (Edit Text)
                  </button>
                )}
              </div>

              {isEditingTranscript ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingTranscriptValue}
                    onChange={(e) => setEditingTranscriptValue(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#245A91] rounded-xl text-xs font-bold text-[#17365D]"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsEditingTranscript(false)}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#5F6B76]"
                    >
                      रद्द करें
                    </button>
                    <button
                      onClick={handleSaveEditedTranscript}
                      className="px-3.5 py-1 bg-[#245A91] text-white text-[11px] font-bold rounded-lg shadow-xs"
                    >
                      सहेजें (Save)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm sm:text-base font-bold text-[#17365D] min-h-[36px] flex items-center">
                  {interimText || heardText ? (
                    <div className="space-y-1 w-full">
                      <div className="text-[#17365D] bg-white p-2.5 rounded-xl border border-[#245A91]/20 font-['Hind'] leading-relaxed shadow-xs">
                        “{interimText || heardText}”
                      </div>
                      <div className="text-[10px] font-bold text-[#287D73] flex items-center gap-1">
                        <Icon name="sparkles" size={11} className="text-[#D9822B] animate-spin" />
                        <span>स्वतः फ़ील्ड भर रहा है (Auto-filling &amp; advancing...)</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#5F6B76] italic font-normal text-xs">
                      {conversationState === 'listening'
                        ? 'बोलिए... आपके शब्द यहाँ स्वतः टाइप होंगे (Speak now...)'
                        : conversationState === 'asking_question'
                        ? 'सहायक सवाल पूछ रहे हैं (ध्यान से सुनें)...'
                        : conversationState === 'processing_answer'
                        ? 'AI उत्तर का विश्लेषण करके फ़ील्ड भर रहा है...'
                        : 'अपनी आवाज़ में उत्तर दें...'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick-Select Choice Options (Mobile Friendly Grid) */}
          {currentStepConfig && currentStepConfig.type === 'choice' && currentStepConfig.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-1">
              {currentStepConfig.options.map((opt) => {
                const isSelected = (answers[currentStepConfig.key] as string) === opt.v;
                const label =
                  currentLang === 'bho'
                    ? opt.bho || opt.hi
                    : currentLang === 'hi'
                    ? opt.hi
                    : opt.v;

                return (
                  <button
                    key={opt.v}
                    onClick={() => handleManualSelectOption(opt.v)}
                    className={`p-3 sm:p-3.5 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm font-semibold transition-all active:scale-98 ${
                      isSelected
                        ? 'border-[#245A91] bg-[#F5F7FA] text-[#17365D] font-bold ring-2 ring-[#245A91]/20'
                        : 'border-[#DCE3EA] bg-white text-[#202B36] hover:border-[#245A91]'
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <Icon name="check" size={16} className="text-[#245A91]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Text/Area Input Fallback when Keyboard Mode is Enabled */}
          {currentStepConfig && currentStepConfig.type !== 'choice' && (
            <div className="space-y-2 text-left pt-1">
              {currentStepConfig.chips && (
                <div className="flex flex-wrap gap-1.5">
                  {currentStepConfig.chips.map((c) => {
                    const label =
                      currentLang === 'bho' ? c.bho || c.hi : currentLang === 'hi' ? c.hi : c.en;
                    const currList = splitList(answers[currentStepConfig.key] as string);
                    const isPicked = currList.includes(label);

                    return (
                      <button
                        key={c.en}
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isPicked
                            ? 'border-[#245A91] bg-[#245A91] text-white font-bold'
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

              {inputMode === 'text' && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={(answers[currentStepConfig.key] as string) || ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [currentStepConfig.key]: e.target.value }))
                    }
                    placeholder={currentStepConfig.ph[currentLang] || currentStepConfig.ph.hi}
                    className="w-full p-3 rounded-xl border border-[#DCE3EA] text-xs sm:text-sm focus:outline-none focus:border-[#245A91] bg-white text-[#17365D]"
                  />
                </div>
              )}

              {currentStepConfig.key === 'location' && (
                <div className="pt-2 space-y-3">
                  {/* Official GPS Detection Button */}
                  <button
                    onClick={handleDetectLocationGps}
                    disabled={isDetectingGps}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#245A91] to-[#17365D] hover:from-[#17365D] hover:to-[#245A91] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm active:scale-98 transition-all disabled:opacity-75"
                  >
                    {isDetectingGps ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon name="target" size={17} className="text-[#38BDF8]" />
                    )}
                    <span>
                      {isDetectingGps
                        ? currentLang === 'bho'
                          ? 'जीपीएस से स्थान खोजल जा रहल बा...'
                          : 'जीपीएस द्वारा स्थान पता किया जा रहा है...'
                        : currentLang === 'bho'
                        ? '📍 वर्तमान GPS स्थान स्वतः लें (Auto-Detect Location)'
                        : '📍 वर्तमान GPS स्थान स्वतः लें (Auto-Detect Location)'}
                    </span>
                  </button>

                  {/* Selected / Detected Location Confirmation Pill */}
                  {answers.location && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="text-[#17365D] font-bold">
                          📍 {answers.location}
                        </span>
                        {answers.locationAccuracy && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
                            {answers.locationAccuracy}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const nextStepIdx = currentStepIndex + 1;
                          if (nextStepIdx < STEPS.length) {
                            askQuestionAloud(nextStepIdx);
                          } else {
                            setCurrentStepIndex(8);
                            activeStepRef.current = 8;
                            setConversationState('readback_review');
                            initiateReadbackSummary();
                          }
                        }}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] shadow-xs"
                      >
                        आगे बढ़ें (Next) →
                      </button>
                    </div>
                  )}

                  {/* Popular District Quick Chips */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-[#5F6B76] uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="map" size={12} className="text-[#245A91]" />
                      <span>
                        {currentLang === 'bho'
                          ? 'या सीधा आपन जिला चुनीं (Quick Districts):'
                          : 'या सीधा अपना जिला चुनें (Quick Districts):'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: 'Maharajganj', hi: 'महराजगंज', state: 'Uttar Pradesh' },
                        { name: 'Gorakhpur', hi: 'गोरखपुर', state: 'Uttar Pradesh' },
                        { name: 'Patna', hi: 'पटना', state: 'Bihar' },
                        { name: 'Varanasi', hi: 'वाराणसी', state: 'Uttar Pradesh' },
                        { name: 'Lucknow', hi: 'लखनऊ', state: 'Uttar Pradesh' },
                        { name: 'Deoria', hi: 'देवरिया', state: 'Uttar Pradesh' },
                        { name: 'Kushinagar', hi: 'कुशीनगर', state: 'Uttar Pradesh' },
                        { name: 'Basti', hi: 'बस्ती', state: 'Uttar Pradesh' },
                        { name: 'Prayagraj', hi: 'प्रयागराज', state: 'Uttar Pradesh' },
                        { name: 'Gaya', hi: 'गया', state: 'Bihar' },
                        { name: 'Muzaffarpur', hi: 'मुजफ्फरपुर', state: 'Bihar' },
                        { name: 'Ranchi', hi: 'राँची', state: 'Jharkhand' },
                      ].map((item) => {
                        const isPicked = (answers.location || '').includes(item.name);
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleSelectQuickDistrict(item.name, item.state)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              isPicked
                                ? 'bg-[#245A91] text-white border-[#245A91] shadow-xs font-bold'
                                : 'bg-[#F5F7FA] text-[#17365D] border-[#DCE3EA] hover:border-[#245A91] hover:bg-white'
                            }`}
                          >
                            {isPicked ? '✓ ' : ''}
                            {item.hi} ({item.name})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clarification prompt if AI is unsure */}
          {clarificationPrompt && (
            <div className="w-full text-xs p-3 rounded-xl bg-[#FFF8EE] border border-[#D9822B]/30 text-[#8F5517] text-left">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Icon name="info" size={14} className="text-[#D9822B]" />
                <span>स्पष्टीकरण (Clarification):</span>
              </div>
              <div>{clarificationPrompt}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="w-full text-xs p-3 rounded-xl bg-[#FDEDEC] text-[#9E2A2B] border border-[#9E2A2B]/20 font-medium text-left flex items-start gap-2">
              <Icon name="info" size={15} className="flex-none mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* In-Call Bottom Control Strip */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#DCE3EA]">
            <button
              onClick={handleReplayQuestion}
              className="py-2.5 px-2 rounded-xl border border-[#DCE3EA] bg-white text-[11px] sm:text-xs font-bold text-[#17365D] hover:bg-[#F5F7FA] flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors"
              title="Replay Question"
            >
              <Icon name="volume2" size={14} />
              <span>सुनें</span>
            </button>

            <button
              onClick={handleStopSpeaking}
              className="py-2.5 px-2 rounded-xl border border-[#DCE3EA] bg-white text-[11px] sm:text-xs font-bold text-[#5F6B76] hover:bg-[#F5F7FA] flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors"
              title="Pause Voice"
            >
              <Icon name="stop" size={14} />
              <span>रोकें</span>
            </button>

            <button
              onClick={() => {
                handleStopSpeaking();
                setInputMode(inputMode === 'voice' ? 'text' : 'voice');
              }}
              className="py-2.5 px-2 rounded-xl border border-[#DCE3EA] bg-white text-[11px] sm:text-xs font-bold text-[#245A91] hover:bg-[#F5F7FA] flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors"
              title="Toggle Typing Mode"
            >
              <Icon name="edit" size={14} />
              <span>{inputMode === 'voice' ? 'लिखें' : 'बोलें'}</span>
            </button>

            <button
              onClick={() => {
                const nextStepIdx = currentStepIndex + 1;
                if (nextStepIdx < STEPS.length) {
                  askQuestionAloud(nextStepIdx);
                } else {
                  initiateReadbackSummary();
                }
              }}
              className="py-2.5 px-2 rounded-xl bg-[#245A91] text-white text-[11px] sm:text-xs font-bold hover:bg-[#17365D] flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors shadow-xs"
              title="Next Question"
            >
              <Icon name="arrowR" size={14} />
              <span>आगे</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
