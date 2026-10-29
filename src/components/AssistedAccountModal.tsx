import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { SupportedLanguage } from '../types';
import {
  AccountError,
  AppUser,
  authService,
  isValidIndianMobile,
  normalizePhone,
  PhoneCheckResult,
} from '../services/firebase';
import { speechService } from '../services/speechService';
import { parseSpokenDigits } from '../services/spokenDigits';

export type AccountMode = 'create' | 'login';
type Step = 'intro' | 'phone' | 'pin' | 'pin2' | 'busy' | 'done' | 'error' | 'forgot_phone' | 'forgot_verify' | 'forgot_newpin';
type Row = Record<SupportedLanguage, string>;

const T = {
  titleCreate: { hi: 'जीविका एआई आपका खाता बनाएगा', bho: 'जीविका एआई रउआ खाता बनाई', en: 'JeevikaAI will create your account', hin: 'JeevikaAI aapka account banayega' },
  titleLogin: { hi: 'लॉगिन करें', bho: 'लॉगिन करीं', en: 'Log in', hin: 'Login karein' },
  titleForgot: { hi: 'PIN रीसेट करें (Forgot PIN)', bho: 'PIN रीसेट करीं', en: 'Reset PIN', hin: 'PIN Reset karein' },
  intro: {
    hi: 'नमस्ते! आपको कुछ लिखने की ज़रूरत नहीं है। मैं आपका खाता बना दूँगा, ताकि आपकी जानकारी सुरक्षित रहे और आप किसी भी फ़ोन से वापस आ सकें। बस अपना मोबाइल नंबर और 4 अंक का PIN बताइए।',
    bho: 'प्रणाम! रउआ कुछ लिखे के जरूरत नइखे। हम रउआ खाता बना देब, ताकि रउआ जानकारी सुरक्षित रहे अउर रउआ कवनो फोन से लौट सकीं। बस आपन मोबाइल नंबर अउर 4 अंक के PIN बताईं।',
    en: 'Hello! You do not need to write anything. I will create your account so your details stay safe and you can come back from any phone. Just tell me your mobile number and a 4-digit PIN.',
    hin: 'Namaste! Aapko kuch likhne ki zaroorat nahi. Main aapka account bana dunga, taaki aapki jaankari surakshit rahe aur aap kisi bhi phone se wapas aa sakein. Bas apna mobile number aur 4 ank ka PIN bataiye.',
  },
  privacy: {
    hi: 'आपकी जानकारी आपके मोबाइल नंबर से जुड़कर सुरक्षित रखी जाएगी।',
    bho: 'रउआ जानकारी रउआ मोबाइल नंबर से जोड़ के सुरक्षित रखल जाई।',
    en: 'Your details will be saved securely against your mobile number.',
    hin: 'Aapki jaankari aapke mobile number se judkar surakshit rahegi.',
  },
  start: { hi: 'शुरू करें', bho: 'शुरू करीं', en: 'Start', hin: 'Shuru karein' },
  phonePrompt: {
    hi: 'अपना 10 अंक का मोबाइल नंबर बताइए, या नीचे के बटन दबाइए।',
    bho: 'आपन 10 अंक के मोबाइल नंबर बताईं, या नीचे के बटन दबाईं।',
    en: 'Say your 10-digit mobile number, or tap the buttons below.',
    hin: 'Apna 10 ank ka mobile number boliye, ya neeche ke buttons dabaiye.',
  },
  pinPromptCreate: {
    hi: 'अब कोई 4 अंक का PIN चुनिए जो आपको याद रहे। इसे किसी को न बताइए।',
    bho: 'अब कवनो 4 अंक के PIN चुनीं जे रउआ के याद रहे। एकरा के केहू के मत बताईं।',
    en: 'Now choose a 4-digit PIN that you will remember. Do not tell it to anyone.',
    hin: 'Ab koi 4 ank ka PIN chuniye jo aapko yaad rahe. Ise kisi ko na bataiye.',
  },
  pinPromptLogin: {
    hi: 'अपना 4 अंक का PIN बताइए।',
    bho: 'आपन 4 अंक के PIN बताईं।',
    en: 'Say your 4-digit PIN.',
    hin: 'Apna 4 ank ka PIN boliye.',
  },
  pin2Prompt: {
    hi: 'वही PIN एक बार और बताइए।',
    bho: 'उहे PIN एक बेर अउर बताईं।',
    en: 'Please enter the same PIN once more.',
    hin: 'Wahi PIN ek baar aur bataiye.',
  },
  phoneLoginPrompt: {
    hi: 'अपना 10 अंक का मोबाइल नंबर बताइए, या नीचे के बटन दबाइए।',
    bho: 'आपन 10 अंक के मोबाइल नंबर बताईं, या नीचे के बटन दबाईं।',
    en: 'Say your 10-digit mobile number, or tap the buttons below.',
    hin: 'Apna 10 ank ka mobile number boliye, ya neeche ke buttons dabaiye.',
  },
  forgotPhonePrompt: {
    hi: 'अपना पंजीकृत 10 अंक का मोबाइल नंबर दर्ज करें।',
    bho: 'आपन पंजीकृत 10 अंक के मोबाइल नंबर दर्ज करीं।',
    en: 'Enter your registered 10-digit mobile number.',
    hin: 'Apna panjikrit 10 ank ka mobile number darj karein.',
  },
  forgotVerifyPrompt: {
    hi: 'पहचान की पुष्टि के लिए बताइए: आपने कहाँ तक पढ़ाई की है या अपना पूरा नाम बोलें।',
    bho: 'पहचान खातिर बताईं: रउआ कहाँ तक पढ़ले बानी या आपन पूरा नाम बोलीं।',
    en: 'For identity verification: Where did you study or what is your name?',
    hin: 'Pahchan ki pushti ke liye bataiye: Aapne kahan tak padhai ki hai ya apna poora naam bolein.',
  },
  newPinPrompt: {
    hi: 'अब अपना नया 4 अंकों का PIN दर्ज करें।',
    bho: 'अब आपन नया 4 अंक के PIN दर्ज करीं।',
    en: 'Now enter your new 4-digit PIN.',
    hin: 'Ab apna naya 4 ank ka PIN darj karein.',
  },
  forgotPin: { hi: 'पासवर्ड भूल गए?', bho: 'पासवर्ड भुला गइल?', en: 'Forgot PIN?', hin: 'Password bhool gaye?' },
  yourNumber: { hi: 'आपका नंबर', bho: 'रउआ नंबर', en: 'Your number', hin: 'Aapka number' },
  pinLabel: { hi: 'आपका PIN', bho: 'रउआ PIN', en: 'Your PIN', hin: 'Aapka PIN' },
  mismatch: {
    hi: 'दोनों PIN अलग हैं। कृपया फिर से PIN चुनिए।',
    bho: 'दुनो PIN अलग बा। कृपया फेर से PIN चुनीं।',
    en: 'The two PINs are different. Please choose your PIN again.',
    hin: 'Dono PIN alag hain. Kripya phir se PIN chuniye.',
  },
  badPhone: {
    hi: 'नंबर सही नहीं है। 10 अंक का मोबाइल नंबर चाहिए, जो 6, 7, 8 या 9 से शुरू हो।',
    bho: 'नंबर सही नइखे। 10 अंक के मोबाइल नंबर चाहीं, जे 6, 7, 8 या 9 से शुरू होखे।',
    en: 'That number does not look right. It must be 10 digits starting with 6, 7, 8 or 9.',
    hin: 'Number sahi nahi hai. 10 ank ka mobile number chahiye, jo 6, 7, 8 ya 9 se shuru ho.',
  },
  busyCreate: { hi: 'खाता बन रहा है...', bho: 'खाता बन रहल बा...', en: 'Creating your account...', hin: 'Account ban raha hai...' },
  busyLogin: { hi: 'लॉगिन हो रहा है...', bho: 'लॉगिन हो रहल बा...', en: 'Logging you in...', hin: 'Login ho raha hai...' },
  doneCreate: {
    hi: 'बधाई हो! आपका खाता बन गया। अगली बार अपना मोबाइल नंबर और PIN बताकर लॉगिन करिए। PIN याद रखिए।',
    bho: 'बधाई बा! रउआ खाता बन गइल। अगिला बेर आपन मोबाइल नंबर अउर PIN बताके लॉगिन करीं। PIN याद राखीं।',
    en: 'Congratulations! Your account is ready. Next time, log in with your mobile number and PIN. Remember your PIN.',
    hin: 'Badhai ho! Aapka account ban gaya. Agli baar apna mobile number aur PIN batakar login kijiye. PIN yaad rakhiye.',
  },
  doneLogin: {
    hi: 'स्वागत है! आपकी जानकारी खुल गई है।',
    bho: 'स्वागत बा! रउआ जानकारी खुल गइल।',
    en: 'Welcome back! Your details are open.',
    hin: 'Swagat hai! Aapki jaankari khul gayi hai.',
  },
  doneLoginEmpty: {
    hi: 'स्वागत है! इस खाते में अभी कोई जानकारी सहेजी नहीं है। चलिए, सवाल शुरू करते हैं।',
    bho: 'स्वागत बा! एह खाता में अभी कुछ सहेजल नइखे। चलीं, सवाल शुरू करीं।',
    en: 'Welcome! This account has no saved details yet. Let us start the questions.',
    hin: 'Swagat hai! Is account mein abhi kuch saved nahi hai. Chaliye, sawal shuru karte hain.',
  },
  doneReset: {
    hi: 'आपका PIN सफलतापूर्वक रीसेट कर दिया गया है! अब नए PIN से लॉगिन हो रहा है।',
    bho: 'रउआ PIN सफलता पूर्वक बदल गइल बा!',
    en: 'Your PIN has been successfully reset! Logging in now.',
    hin: 'Aapka PIN safaltapoorvak reset kar diya gaya hai!',
  },
  exists: {
    hi: 'इस नंबर से खाता पहले से बना है। कृपया लॉगिन करिए।',
    bho: 'एह नंबर से खाता पहिले से बा। कृपया लॉगिन करीं।',
    en: 'An account already exists for this number. Please log in.',
    hin: 'Is number se account pehle se hai. Kripya login kijiye.',
  },
  wrong: {
    hi: 'नंबर या PIN सही नहीं है। फिर से कोशिश करिए।',
    bho: 'नंबर या PIN सही नइखे। फेर से कोशिश करीं।',
    en: 'The number or PIN is not correct. Please try again.',
    hin: 'Number ya PIN sahi nahi hai. Phir se koshish kijiye.',
  },
  offline: {
    hi: 'इंटरनेट नहीं है। आपकी जानकारी इस फ़ोन में सुरक्षित है। इंटरनेट आने पर फिर कोशिश करिए।',
    bho: 'इंटरनेट नइखे। रउआ जानकारी एह फोन में सुरक्षित बा। इंटरनेट आवे पर फेर कोशिश करीं।',
    en: 'No internet. Your details are safe on this phone. Please try again when you are online.',
    hin: 'Internet nahi hai. Aapki jaankari is phone mein surakshit hai. Internet aane par phir koshish kijiye.',
  },
  disabled: {
    hi: 'खाता सुविधा अभी चालू नहीं है। कृपया बाद में कोशिश करिए।',
    bho: 'खाता सुविधा अभी चालू नइखे। कृपया बाद में कोशिश करीं।',
    en: 'Accounts are not switched on yet. Please try again later.',
    hin: 'Account suvidha abhi chalu nahi hai. Kripya baad mein koshish kijiye.',
  },
  locked: {
    hi: 'बहुत बार गलत कोशिश हुई। थोड़ी देर बाद फिर कोशिश करिए।',
    bho: 'बहुत बेर गलत कोशिश भइल। थोड़ा देर बाद फेर करीं।',
    en: 'Too many wrong tries. Please wait a little and try again.',
    hin: 'Bahut baar galat koshish hui. Thodi der baad phir koshish kijiye.',
  },
  unknown: {
    hi: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करिए।',
    bho: 'कुछ गड़बड़ हो गइल। कृपया फेर से कोशिश करीं।',
    en: 'Something went wrong. Please try again.',
    hin: 'Kuch gadbad ho gayi. Kripya phir se koshish kijiye.',
  },
  next: { hi: 'आगे', bho: 'आगे', en: 'Next', hin: 'Aage' },
  back: { hi: 'वापस', bho: 'वापस', en: 'Back', hin: 'Wapas' },
  listen: { hi: 'सुनें', bho: 'सुनीं', en: 'Listen', hin: 'Suniye' },
  speak: { hi: 'बोलकर बताएँ', bho: 'बोल के बताईं', en: 'Say it', hin: 'Bolkar bataiye' },
  listening: { hi: 'सुन रहा हूँ... रोकें', bho: 'सुन रहल बानी... रोकीं', en: 'Listening... stop', hin: 'Sun raha hoon... roko' },
  heard: { hi: 'सुना', bho: 'सुनल', en: 'Heard', hin: 'Suna' },
  noMic: {
    hi: 'इस फ़ोन में बोलकर बताना नहीं चलेगा। कृपया बटन दबाइए।',
    bho: 'एह फोन में बोल के बतावल ना चली। कृपया बटन दबाईं।',
    en: 'Voice is not available on this phone. Please use the buttons.',
    hin: 'Is phone mein bolkar batana nahi chalega. Kripya buttons dabaiye.',
  },
  micDenied: {
    hi: 'माइक की अनुमति नहीं मिली। कृपया बटन दबाइए।',
    bho: 'माइक के अनुमति नइखे मिलल। कृपया बटन दबाईं।',
    en: 'Microphone permission was not given. Please use the buttons.',
    hin: 'Mic ki permission nahi mili. Kripya buttons dabaiye.',
  },
  ok: { hi: 'ठीक है', bho: 'ठीक बा', en: 'OK', hin: 'Theek hai' },
  tryAgain: { hi: 'फिर कोशिश करें', bho: 'फेर कोशिश करीं', en: 'Try again', hin: 'Phir koshish karein' },
  switchToLogin: { hi: 'पहले से खाता है? लॉगिन करें', bho: 'पहिले से खाता बा? लॉगिन करीं', en: 'Already have an account? Log in', hin: 'Pehle se account hai? Login karein' },
  switchToCreate: { hi: 'खाता नहीं है? नया खाता बनाएँ', bho: 'खाता नइखे? नया खाता बनाईं', en: 'No account? Create one', hin: 'Account nahi hai? Naya account banayein' },
  close: { hi: 'बंद करें', bho: 'बंद करीं', en: 'Close', hin: 'Band karein' },
  del: { hi: 'मिटाएँ', bho: 'मिटाईं', en: 'Delete', hin: 'Mitayein' },
  change: { hi: 'बदलें', bho: 'बदलीं', en: 'Change', hin: 'Badlein' },
  stepOf: { hi: 'चरण', bho: 'चरण', en: 'Step', hin: 'Step' },
} satisfies Record<string, Row>;

type TKey = keyof typeof T;
const tx = (k: TKey, l: SupportedLanguage) => (T[k] as Row)[l] ?? T[k].hi;
const spaced = (digits: string) => digits.split('').join(' ');

interface Props {
  isOpen: boolean;
  mode: AccountMode;
  currentLang: SupportedLanguage;
  profileName?: string;
  onClose: () => void;
  onSwitchMode: (mode: AccountMode) => void;
  onCreated: (user: AppUser) => Promise<void> | void;
  onLoggedIn: (user: AppUser) => Promise<boolean> | boolean;
}

export const AssistedAccountModal: React.FC<Props> = ({
  isOpen,
  mode,
  currentLang: L,
  profileName,
  onClose,
  onSwitchMode,
  onCreated,
  onLoggedIn,
}) => {
  const [step, setStep] = useState<Step>('intro');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [forgotVerifyAnswer, setForgotVerifyAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [errorKind, setErrorKind] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [heardText, setHeardText] = useState('');
  const [doneText, setDoneText] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneCheckResult, setPhoneCheckResult] = useState<PhoneCheckResult | null>(null);
  const [lastAdvancedPhone, setLastAdvancedPhone] = useState('');
  const [lastAdvancedPin, setLastAdvancedPin] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(mode === 'create' ? 'intro' : 'phone');
    setPhone('');
    setPin('');
    setPin2('');
    setForgotVerifyAnswer('');
    setMessage('');
    setErrorKind('');
    setHeardText('');
    setDoneText('');
    setIsCheckingPhone(false);
    setPhoneCheckResult(null);
    setLastAdvancedPhone('');
    setLastAdvancedPin('');
  }, [isOpen, mode]);

  // Real-time phone number registration verification
  useEffect(() => {
    const p = normalizePhone(phone);
    if ((step === 'phone' || step === 'forgot_phone') && isValidIndianMobile(p)) {
      let isCancelled = false;
      setIsCheckingPhone(true);
      authService.checkPhoneExists(p).then((res) => {
        if (isCancelled) return;
        setIsCheckingPhone(false);
        setPhoneCheckResult(res);
      }).catch(() => {
        if (!isCancelled) setIsCheckingPhone(false);
      });
      return () => {
        isCancelled = true;
      };
    } else {
      setPhoneCheckResult(null);
      setIsCheckingPhone(false);
    }
  }, [phone, step]);

  // Auto-advance when input reaches required length (10 digits for phone, 4 digits for PIN)
  useEffect(() => {
    if (!isOpen || step === 'busy' || step === 'done' || step === 'error') return;

    if ((step === 'phone' || step === 'forgot_phone') && phone.length === 10) {
      const timer = setTimeout(() => {
        next();
      }, 300);
      return () => clearTimeout(timer);
    }
    if ((step === 'pin' || step === 'forgot_newpin') && pin.length === 4) {
      const timer = setTimeout(() => {
        next();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (step === 'pin2' && pin2.length === 4) {
      const timer = setTimeout(() => {
        next();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (step === 'forgot_verify' && forgotVerifyAnswer.trim().length > 0) {
      // Manual confirm button used for forgot_verify
    }
  }, [phone, pin, pin2, forgotVerifyAnswer, step, isOpen]);

  const promptFor = useCallback(
    (s: Step): string => {
      switch (s) {
        case 'intro':
          return tx('intro', L);
        case 'phone':
          return mode === 'create' ? tx('phonePrompt', L) : tx('phoneLoginPrompt', L);
        case 'pin':
          return mode === 'create' ? tx('pinPromptCreate', L) : tx('pinPromptLogin', L);
        case 'pin2':
          return tx('pin2Prompt', L);
        case 'forgot_phone':
          return tx('forgotPhonePrompt', L);
        case 'forgot_verify':
          return tx('forgotVerifyPrompt', L);
        case 'forgot_newpin':
          return tx('newPinPrompt', L);
        case 'busy':
          return mode === 'create' ? tx('busyCreate', L) : tx('busyLogin', L);
        default:
          return '';
      }
    },
    [L, mode]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (step === 'busy') return;
    const text = promptFor(step);
    if (text) speechService.speak(text, L, () => {});
    return () => {
      speechService.stopSpeaking();
    };
  }, [isOpen, step, mode, L]);

  useEffect(() => {
    if (!isOpen) {
      speechService.stopSpeaking();
      speechService.stopListening();
      setIsListening(false);
    } else {
      closeRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isForgotStep = step === 'forgot_phone' || step === 'forgot_verify' || step === 'forgot_newpin';
  const field =
    step === 'phone' || step === 'forgot_phone'
      ? phone
      : step === 'pin' || step === 'forgot_newpin'
      ? pin
      : step === 'pin2'
      ? pin2
      : '';
  const maxLen = step === 'phone' || step === 'forgot_phone' ? 10 : 4;

  const setField = (v: string) => {
    const next = v.replace(/\D/g, '').slice(0, maxLen);
    if (step === 'phone' || step === 'forgot_phone') setPhone(next);
    else if (step === 'pin' || step === 'forgot_newpin') setPin(next);
    else if (step === 'pin2') setPin2(next);
  };

  const press = (d: string) => {
    speechService.stopSpeaking();
    setMessage('');
    setField(field + d);
  };
  const backspace = () => {
    setMessage('');
    setField(field.slice(0, -1));
  };

  const stopMic = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  const toggleMic = async () => {
    if (isListening) {
      stopMic();
      return;
    }
    if (!speechService.isSpeechRecognitionSupported()) {
      setMessage(tx('noMic', L));
      return;
    }
    const ok = await speechService.requestMicrophonePermission();
    if (!ok) {
      setMessage(tx('micDenied', L));
      return;
    }
    setHeardText('');
    setMessage('');
    setIsListening(true);
    speechService.startListening(
      L,
      (res) => {
        setHeardText(res.transcript);
        const digits = parseSpokenDigits(res.transcript);
        if (step === 'forgot_verify') {
          if (res.transcript) {
            setForgotVerifyAnswer(res.transcript);
          }
          if (res.isFinal) setIsListening(false);
        } else {
          const digits = parseSpokenDigits(res.transcript);
          if (digits) {
            const nextVal = digits.slice(0, maxLen);
            setField(nextVal);
            if ((step === 'phone' || step === 'forgot_phone') && nextVal.length === 10) {
              setIsListening(false);
            } else if (nextVal.length === maxLen) {
              setIsListening(false);
            }
          }
          if (res.isFinal) setIsListening(false);
        }
      },
      () => {
        setIsListening(false);
        setMessage(tx('noMic', L));
      },
      () => setIsListening(false)
    );
  };

  const showError = (kind: string) => {
    setErrorKind(kind);
    setMessage(tx((kind in T ? kind : 'unknown') as TKey, L));
    setStep('error');
  };

  const run = async (pinValue: string) => {
    setStep('busy');
    try {
      if (mode === 'create') {
        const user = await authService.registerWithPhone(phone, pinValue, profileName);
        await onCreated(user);
        setDoneText(tx('doneCreate', L));
        setStep('done');
      } else {
        const user = await authService.loginWithPhone(phone, pinValue);
        const hadData = await onLoggedIn(user);
        setDoneText(tx(hadData ? 'doneLogin' : 'doneLoginEmpty', L));
        setStep('done');
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err) {
      showError(err instanceof AccountError ? err.kind : 'unknown');
    }
  };

  const next = async () => {
    speechService.stopSpeaking();
    stopMic();
    if (step === 'intro') {
      setStep('phone');
    } else if (step === 'phone') {
      const p = normalizePhone(phone);
      if (!isValidIndianMobile(p)) {
        setMessage(tx('badPhone', L));
        speechService.speak(tx('badPhone', L), L, () => {});
        return;
      }
      setPhone(p);
      setIsCheckingPhone(true);
      try {
        const check = await authService.checkPhoneExists(p);
        setIsCheckingPhone(false);
        setPhoneCheckResult(check);
        if (check.exists) {
          // If already registered, do not show registration or 4-digit PIN setup again!
          // Switch directly to login mode and PIN entry step.
          if (mode === 'create') {
            onSwitchMode('login');
            setStep('pin');
            const alertText =
              L === 'bho'
                ? 'एह नंबर से खाता पहिले से बनल बा। आपन 4 अंक के PIN बताईं।'
                : 'यह नंबर पहले से पंजीकृत है। कृपया अपना 4 अंक का PIN बताइए।';
            speechService.speak(alertText, L, () => {});
            return;
          }
        } else if (mode === 'login') {
          setMessage(
            L === 'bho'
              ? 'एह नंबर से खाता नइखे। कृपया नया खाता बनाईं।'
              : 'इस नंबर से खाता नहीं मिला। कृपया नया खाता बनाएं।'
          );
          return;
        }
      } catch {
        setIsCheckingPhone(false);
      }
      setStep('pin');
    } else if (step === 'pin') {
      if (pin.length !== 4) return;
      if (mode === 'create') setStep('pin2');
      else run(pin);
    } else if (step === 'pin2') {
      if (pin2.length !== 4) return;
      if (pin2 !== pin) {
        setPin('');
        setPin2('');
        setMessage(tx('mismatch', L));
        setStep('pin');
        return;
      }
      run(pin);
    } else if (step === 'forgot_phone') {
      const p = normalizePhone(phone);
      if (!isValidIndianMobile(p)) {
        setMessage(tx('badPhone', L));
        return;
      }
      setPhone(p);
      setMessage('');
      setStep('forgot_verify');
    } else if (step === 'forgot_verify') {
      if (!forgotVerifyAnswer.trim()) {
        setMessage('कृपया अपनी शिक्षा या नाम दर्ज करें।');
        return;
      }
      setMessage('');
      setStep('forgot_newpin');
    } else if (step === 'forgot_newpin') {
      if (pin.length !== 4) return;
      // Reset PIN by registering/updating with new PIN
      setStep('busy');
      try {
        const user = await authService.registerWithPhone(phone, pin, profileName);
        await onLoggedIn(user);
        setDoneText(tx('doneReset', L));
        setStep('done');
        setTimeout(() => {
          onClose();
        }, 800);
      } catch {
        // If already exists, try logging in with new PIN or update
        try {
          const user = await authService.loginWithPhone(phone, pin);
          await onLoggedIn(user);
          setDoneText(tx('doneReset', L));
          setStep('done');
          setTimeout(() => {
            onClose();
          }, 800);
        } catch (e: any) {
          showError('unknown');
        }
      }
    }
  };

  const goBack = () => {
    stopMic();
    setMessage('');
    if (step === 'phone') setStep(mode === 'create' ? 'intro' : 'phone');
    else if (step === 'pin') {
      setLastAdvancedPhone('');
      setStep('phone');
    } else if (step === 'pin2') {
      setPin2('');
      setStep('pin');
    } else if (step === 'forgot_phone') setStep('phone');
    else if (step === 'forgot_verify') setStep('forgot_phone');
    else if (step === 'forgot_newpin') {
      setPin('');
      setLastAdvancedPin('');
      setStep('forgot_verify');
    }
  };

  const ready =
    ((step === 'phone' || step === 'forgot_phone') && phone.length === 10) ||
    ((step === 'pin' || step === 'forgot_newpin') && pin.length === 4) ||
    (step === 'pin2' && pin2.length === 4) ||
    (step === 'forgot_verify' && forgotVerifyAnswer.trim().length > 0);

  const stepNo = isForgotStep ? 1 : step === 'phone' ? 1 : step === 'pin' ? 2 : step === 'pin2' ? 3 : 0;
  const totalSteps = mode === 'create' ? 3 : 2;
  const prompt = step === 'intro' ? tx('intro', L) : step === 'error' || step === 'done' ? '' : promptFor(step);

  const phoneGroups = (() => {
    const pVal = step === 'forgot_phone' ? phone : phone;
    const slots = Array.from({ length: 10 }, (_, i) => pVal[i] || '');
    return [slots.slice(0, 5), slots.slice(5)];
  })();

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="acct-title"
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DCE3EA] max-h-[100dvh] overflow-y-auto"
      >
        <div className="gov-tricolor-line" />
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-11 h-11 rounded-xl bg-[#17365D] text-white flex items-center justify-center flex-none">
                <Icon name="user" size={22} />
              </span>
              <div className="min-w-0">
                <h3 id="acct-title" className="text-base sm:text-lg font-extrabold text-[#17365D] leading-tight">
                  {isForgotStep
                    ? tx('titleForgot', L)
                    : mode === 'create'
                    ? tx('titleCreate', L)
                    : tx('titleLogin', L)}
                </h3>
                {stepNo > 0 && !isForgotStep && (
                  <div className="text-xs text-[#5F6B76] font-semibold">
                    {tx('stepOf', L)} {stepNo} / {totalSteps}
                  </div>
                )}
              </div>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label={tx('close', L)}
              className="w-11 h-11 rounded-full bg-[#F5F7FA] text-[#17365D] hover:bg-[#E4EAF0] flex items-center justify-center flex-none"
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          {/* Assistant speech bubble */}
          {prompt && (
            <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-[#DCE3EA] flex items-start gap-3">
              <button
                onClick={() => speechService.speak(prompt, L, () => {})}
                aria-label={tx('listen', L)}
                className="w-11 h-11 rounded-full bg-[#245A91] text-white flex items-center justify-center flex-none active:scale-95"
              >
                <Icon name="volume2" size={20} />
              </button>
              <p className="text-sm sm:text-base text-[#17365D] font-semibold leading-relaxed">{prompt}</p>
            </div>
          )}

          {step === 'intro' && (
            <>
              <p className="text-xs text-[#5F6B76] flex items-start gap-2">
                <Icon name="shieldCheck" size={14} className="text-[#287D73] flex-none mt-0.5" />
                {tx('privacy', L)}
              </p>
              <button
                onClick={next}
                className="w-full min-h-14 rounded-2xl bg-[#287D73] hover:bg-[#1E6058] text-white text-lg font-extrabold shadow-md active:scale-[0.98]"
              >
                {tx('start', L)}
              </button>
            </>
          )}

          {step === 'forgot_verify' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F7FA] border border-[#DCE3EA] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#17365D]">
                  {L === 'bho' ? 'रउआ कहाँ तक पढ़ले बानी या नाम बताईं:' : 'आप कहाँ तक पढ़े हैं या अपना नाम बताएं:'}
                </label>
                <input
                  type="text"
                  value={forgotVerifyAnswer}
                  onChange={(e) => setForgotVerifyAnswer(e.target.value)}
                  placeholder="उदा: 10वीं पास, स्नातक, या अपना नाम..."
                  className="w-full p-3 rounded-xl border border-[#245A91] bg-white text-[#17365D] font-bold text-sm focus:ring-2 focus:ring-[#245A91]"
                />
              </div>

              {message && (
                <p role="alert" className="text-sm font-bold text-[#9E2A2B] bg-[#FDEDEC] border border-[#9E2A2B]/20 rounded-xl px-3 py-2">
                  {message}
                </p>
              )}

              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={isListening}
                className={`w-full min-h-12 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 ${
                  isListening
                    ? 'bg-[#9E2A2B] border-[#9E2A2B] text-white animate-pulse'
                    : 'bg-white border-[#245A91] text-[#245A91] hover:bg-[#F5F7FA]'
                }`}
              >
                <Icon name="mic" size={20} />
                {isListening ? tx('listening', L) : tx('speak', L)}
              </button>
              {heardText && (
                <p className="text-xs text-[#5F6B76]">
                  {tx('heard', L)}: <span className="font-semibold text-[#17365D]">{heardText}</span>
                </p>
              )}

              <button
                type="button"
                onClick={next}
                disabled={!forgotVerifyAnswer.trim()}
                className="w-full min-h-14 rounded-2xl bg-[#287D73] hover:bg-[#1E6058] text-white text-base font-extrabold shadow-md disabled:opacity-30 active:scale-95"
              >
                {L === 'bho' ? 'पुष्टि करीं (Confirm & Continue)' : 'पुष्टि करें (Confirm & Continue)'}
              </button>

              <button
                type="button"
                onClick={goBack}
                className="w-full min-h-11 rounded-xl border border-[#C5D1DD] text-[#17365D] font-bold text-xs"
              >
                ← {tx('back', L)}
              </button>
            </div>
          )}

          {(step === 'phone' || step === 'pin' || step === 'pin2' || step === 'forgot_phone' || step === 'forgot_newpin') && (
            <>
              {/* Entered value */}
              <div className="rounded-2xl border-2 border-[#245A91]/30 bg-white p-3 text-center" aria-live="polite">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76] mb-1">
                  {step === 'phone' || step === 'forgot_phone'
                    ? tx('yourNumber', L)
                    : tx('pinLabel', L)}
                </div>
                {step === 'phone' || step === 'forgot_phone' ? (
                  <div className="flex items-center justify-center gap-3 text-2xl sm:text-3xl font-extrabold tracking-widest text-[#17365D] tabular-nums">
                    {phoneGroups.map((g, gi) => (
                      <span key={gi} className="flex gap-1">
                        {g.map((d, i) => (
                          <span key={i} className={`w-5 sm:w-6 text-center ${d ? '' : 'text-[#C5D1DD]'}`}>
                            {d || '•'}
                          </span>
                        ))}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 py-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`w-5 h-5 rounded-full border-2 ${
                          i < field.length ? 'bg-[#17365D] border-[#17365D]' : 'border-[#C5D1DD]'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {step !== 'phone' && step !== 'forgot_phone' && (
                  <div className="mt-1 text-xs text-[#5F6B76]">
                    {tx('yourNumber', L)}: <span className="font-bold tabular-nums">{phone}</span>
                  </div>
                )}
              </div>

              {/* Live Phone Existence Status & One-Tap Login Banner */}
              {step === 'phone' && (
                <>
                  {isCheckingPhone && (
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#5F6B76] py-1">
                      <span className="w-3.5 h-3.5 border-2 border-[#245A91] border-t-transparent rounded-full animate-spin" />
                      <span>
                        {L === 'bho'
                          ? 'खाता जाँचल जा रहल बा...'
                          : 'खाता जाँचा जा रहा है... (Checking account...)'}
                      </span>
                    </div>
                  )}

                  {!isCheckingPhone && phoneCheckResult?.exists && mode === 'create' && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl flex flex-col gap-2.5 shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center flex-none font-black text-sm mt-0.5">
                          ✓
                        </span>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-extrabold text-sm text-[#17365D]">
                            {L === 'bho'
                              ? 'ई मोबाइल नंबर पहिले से पंजीकृत बा!'
                              : 'यह मोबाइल नंबर पहले से पंजीकृत है!'}
                          </div>
                          <div className="text-xs text-amber-900 font-medium leading-relaxed mt-0.5">
                            {phoneCheckResult.name &&
                            !phoneCheckResult.name.includes('नागरिक (') ? (
                              <span className="font-bold text-[#17365D]">
                                {phoneCheckResult.name} ·{' '}
                              </span>
                            ) : null}
                            {L === 'bho'
                              ? 'नया पिन बनावे के जरूरत नइखे। बस आपन 4 अंक के PIN डाल के तुरंत लॉगिन करीं।'
                              : 'नया PIN बनाने की ज़रूरत नहीं है। बस अपना 4 अंक का PIN डालकर तुरंत लॉगिन करें।'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSwitchMode('login');
                          setStep('pin');
                          speechService.stopSpeaking();
                          speechService.speak(
                            L === 'bho'
                              ? 'आपन 4 अंक के PIN बताईं'
                              : 'अपना 4 अंक का PIN बताइए',
                            L,
                            () => {}
                          );
                        }}
                        className="w-full py-3 px-4 bg-[#17365D] hover:bg-[#245A91] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
                      >
                        <Icon name="check" size={17} className="text-emerald-400" />
                        <span>
                          {L === 'bho'
                            ? '👉 लॉगिन करीं (Tap to Login)'
                            : '👉 लॉगिन करें (Tap to Login)'}
                        </span>
                      </button>
                    </div>
                  )}

                  {!isCheckingPhone && phoneCheckResult?.exists && mode === 'login' && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse flex-none" />
                      <span>
                        {L === 'bho'
                          ? 'पंजीकृत खाता मिल गइल बा। आपन 4 अंक के PIN बताईं।'
                          : 'पंजीकृत खाता मौजूद है। अपना 4 अंक का PIN बताइए।'}
                      </span>
                    </div>
                  )}

                  {!isCheckingPhone && phoneCheckResult && !phoneCheckResult.exists && mode === 'login' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-red-900">
                      <span>
                        {L === 'bho'
                          ? 'एह नंबर से खाता नइखे मिलल।'
                          : 'इस नंबर से कोई खाता नहीं मिला।'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchMode('create');
                          setStep('pin');
                        }}
                        className="px-3 py-1 bg-[#287D73] text-white font-bold rounded-lg whitespace-nowrap"
                      >
                        {L === 'bho' ? 'नया खाता बनाईं' : 'नया खाता बनाएं'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {message && (
                <p role="alert" className="text-sm font-bold text-[#9E2A2B] bg-[#FDEDEC] border border-[#9E2A2B]/20 rounded-xl px-3 py-2">
                  {message}
                </p>
              )}

              {/* Voice entry */}
              <button
                onClick={toggleMic}
                aria-pressed={isListening}
                className={`w-full min-h-12 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 ${
                  isListening
                    ? 'bg-[#9E2A2B] border-[#9E2A2B] text-white animate-pulse'
                    : 'bg-white border-[#245A91] text-[#245A91] hover:bg-[#F5F7FA]'
                }`}
              >
                <Icon name="mic" size={20} />
                {isListening ? tx('listening', L) : tx('speak', L)}
              </button>
              {heardText && (
                <p className="text-xs text-[#5F6B76] -mt-2">
                  {tx('heard', L)}: <span className="font-semibold text-[#17365D]">{heardText}</span>
                </p>
              )}

              {/* Big keypad */}
              <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    onClick={() => press(d)}
                    className="min-h-16 rounded-2xl bg-[#F5F7FA] hover:bg-[#E4EAF0] border border-[#DCE3EA] text-2xl font-extrabold text-[#17365D] active:scale-95"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={backspace}
                  aria-label={tx('del', L)}
                  className="min-h-16 rounded-2xl bg-[#FDEDEC] border border-[#9E2A2B]/20 text-[#9E2A2B] font-extrabold text-sm active:scale-95"
                >
                  ⌫ {tx('del', L)}
                </button>
                <button
                  onClick={() => press('0')}
                  className="min-h-16 rounded-2xl bg-[#F5F7FA] hover:bg-[#E4EAF0] border border-[#DCE3EA] text-2xl font-extrabold text-[#17365D] active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={next}
                  disabled={!ready}
                  aria-label={tx('next', L)}
                  className="min-h-16 rounded-2xl bg-[#287D73] text-white text-2xl font-extrabold disabled:opacity-30 active:scale-95"
                >
                  ✓
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  {step === 'phone' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'create') {
                          onSwitchMode('login');
                          setMessage('लॉगिन करने के लिए अपना पंजीकृत मोबाइल नंबर दर्ज करें।');
                        } else {
                          onSwitchMode('create');
                          setMessage('नया खाता बनाने के लिए अपना मोबाइल नंबर दर्ज करें।');
                        }
                      }}
                      className="min-h-11 px-3 py-1.5 rounded-xl border border-[#245A91] text-[#245A91] hover:bg-[#F5F7FA] font-extrabold text-xs flex items-center gap-1 active:scale-95"
                    >
                      <Icon name="user" size={13} />
                      <span>
                        {mode === 'create'
                          ? (L === 'bho' ? 'पहले से खाता बा? लॉगिन करीं' : 'पहले से खाता है? लॉगिन करें')
                          : (L === 'bho' ? 'नया खाता बनाईं' : 'नया खाता बनाएं')}
                      </span>
                    </button>
                  ) : (
                    step !== 'forgot_phone' && (
                      <button
                        onClick={goBack}
                        className="min-h-11 px-4 rounded-xl border border-[#C5D1DD] text-[#17365D] font-bold text-xs"
                      >
                        ← {tx('back', L)}
                      </button>
                    )
                  )}
                </div>

                {/* Forgot PIN link on bottom right during login phone step */}
                {mode === 'login' && step === 'phone' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep('forgot_phone');
                      setPhone('');
                      setMessage('अपना पंजीकृत मोबाइल नंबर दर्ज करें।');
                    }}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    {tx('forgotPin', L)}
                  </button>
                )}
              </div>
            </>
          )}

          {step === 'busy' && (
            <div className="py-8 flex flex-col items-center gap-3 text-[#17365D]" role="status">
              <span className="w-10 h-10 rounded-full border-4 border-[#245A91]/30 border-t-[#245A91] animate-spin" />
              <p className="font-bold">{mode === 'create' ? tx('busyCreate', L) : tx('busyLogin', L)}</p>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#287D73] text-white flex items-center justify-center">
                <Icon name="check" size={34} />
              </div>
              <p className="text-base font-bold text-[#17365D] leading-relaxed">{doneText}</p>
              {mode === 'create' && !isForgotStep && (
                <p className="text-sm text-[#5F6B76]">
                  {tx('yourNumber', L)}: <span className="font-extrabold text-[#17365D] tabular-nums">{phone}</span>
                </p>
              )}
              <button
                onClick={onClose}
                className="w-full min-h-14 rounded-2xl bg-[#287D73] hover:bg-[#1E6058] text-white text-base font-extrabold shadow-md active:scale-[0.98]"
              >
                {L === 'bho' ? 'डैशबोर्ड देखीं (Open Dashboard)' : 'डैशबोर्ड देखें (Open Dashboard)'}
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-3">
              <p role="alert" className="text-base font-bold text-[#9E2A2B] bg-[#FDEDEC] border border-[#9E2A2B]/20 rounded-2xl p-3.5">
                {message}
              </p>
              {errorKind === 'exists' ? (
                <button
                  onClick={() => onSwitchMode('login')}
                  className="w-full min-h-14 rounded-2xl bg-[#17365D] text-white text-base font-extrabold"
                >
                  {tx('switchToLogin', L)}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setPin('');
                    setPin2('');
                    setMessage('');
                    setStep(errorKind === 'wrong' || errorKind === 'locked' ? 'phone' : 'pin');
                  }}
                  className="w-full min-h-14 rounded-2xl bg-[#17365D] text-white text-base font-extrabold"
                >
                  {tx('tryAgain', L)}
                </button>
              )}
            </div>
          )}

          {step !== 'busy' && step !== 'done' && !isForgotStep && (
            <button
              onClick={() => onSwitchMode(mode === 'create' ? 'login' : 'create')}
              className="w-full min-h-11 text-sm font-bold text-[#245A91] underline underline-offset-4"
            >
              {mode === 'create' ? tx('switchToLogin', L) : tx('switchToCreate', L)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
