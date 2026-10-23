import React, { useState } from 'react';
import { Icon } from './Icons';
import { BeneficiaryProfile, SupportedLanguage } from '../types';
import { EDU, WORK, MOB, SKILL_CHIPS, INTEREST_CHIPS } from '../data/mockData';
import { splitList } from '../services/recommendationEngine';
import { speechService, SpeechRecognitionResultWrapper } from '../services/speechService';
import { locationIntelligenceService } from '../services/locationIntelligenceService';
import { LocationAccuracyBadge } from './LocationAccuracyBadge';

interface ProfileViewProps {
  profile: BeneficiaryProfile;
  onUpdateProfile: (updated: BeneficiaryProfile) => void;
  onNotify: (msg: string) => void;
  go: (route: string) => void;
  onLogout?: () => void;
  currentLang?: SupportedLanguage;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onNotify,
  go,
  onLogout,
  currentLang = 'hi',
}) => {
  const [form, setForm] = useState<BeneficiaryProfile>({ ...profile });
  const [activeVoiceField, setActiveVoiceField] = useState<keyof BeneficiaryProfile | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceLiveTranscript, setVoiceLiveTranscript] = useState<string>('');
  const [voiceStatusText, setVoiceStatusText] = useState<string>('');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  const handleGpsDetect = async () => {
    if (isDetectingGps) return;
    setIsDetectingGps(true);
    onNotify(
      currentLang === 'bho'
        ? 'जीपीएस से स्थान खोजल जा रहल बा...'
        : 'जीपीएस द्वारा स्थान पहचाना जा रहा है...'
    );
    try {
      const res = await locationIntelligenceService.detectGpsLocation();
      if (res && res.location) {
        const updated = {
          ...form,
          location: res.location,
          locationAccuracy: res.accuracyLevel,
          locationConfidence: res.confidenceScore,
          locationAccuracyMeters: res.accuracyMeters,
        };
        setForm(updated);
        onUpdateProfile(updated);
        onNotify(
          currentLang === 'bho'
            ? `स्थान मिल गइल: ${res.location} (${res.accuracyLevel} · ${res.confidenceScore}%)`
            : `स्थान प्राप्त हुआ: ${res.location} (${res.accuracyLevel} · ${res.confidenceScore}% विश्वास)`
        );
      }
    } catch {
      onNotify('स्थान का पता नहीं चल सका। कृपया मैन्युअली लिखें।');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleChange = (k: keyof BeneficiaryProfile, v: any) => {
    const updated = { ...form, [k]: v };
    setForm(updated);
    onUpdateProfile(updated);
  };

  const handleToggleChip = (field: 'skills' | 'interests', chipText: string) => {
    const list = splitList(form[field]);
    const updatedList = list.includes(chipText)
      ? list.filter((x) => x !== chipText)
      : [...list, chipText];
    handleChange(field, updatedList.join(', '));
  };

  // Voice-guided field update with JeevikaAI
  const startVoiceUpdate = async (field: keyof BeneficiaryProfile, promptHindi: string) => {
    if (isListeningVoice && activeVoiceField === field) {
      speechService.stopListening();
      speechService.stopSpeaking();
      setIsListeningVoice(false);
      setActiveVoiceField(null);
      return;
    }

    speechService.stopListening();
    speechService.stopSpeaking();

    setActiveVoiceField(field);
    setIsListeningVoice(true);
    setVoiceLiveTranscript('');
    setVoiceStatusText(`JeevikaAI सुन रहा है: ${promptHindi}...`);

    // Speak prompt aloud
    speechService.speak(promptHindi, currentLang, () => {
      // Begin microphone capture after speaking
      speechService.startListening(
        currentLang,
        async (result: SpeechRecognitionResultWrapper) => {
          if (result.transcript) {
            setVoiceLiveTranscript(result.transcript);
          }
          if (result.isFinal && result.transcript.trim()) {
            const rawText = result.transcript.trim();
            setIsListeningVoice(false);
            setVoiceStatusText('AI उत्तर का विश्लेषण कर रहा है...');

            // AI extraction
            const aiRes = await speechService.extractWithGemini(
              rawText,
              currentLang,
              field,
              form,
              promptHindi
            );

            const cleanVal = aiRes.cleanValue || rawText;
            handleChange(field, cleanVal);

            const ack = currentLang === 'bho'
              ? 'बहुत बढ़िया, ई जानकारी अपडेट हो गइल बा!'
              : 'बहुत बढ़िया! यह जानकारी अपडेट कर दी गई है।';

            speechService.speak(ack, currentLang);
            onNotify(`✅ ${field.toUpperCase()} अपडेट हुआ: ${cleanVal}`);
            setActiveVoiceField(null);
            setVoiceStatusText('');
          }
        },
        (err) => {
          setIsListeningVoice(false);
          setActiveVoiceField(null);
          setVoiceStatusText('');
          onNotify(`माइक त्रुटि: ${err}`);
        },
        () => {
          setIsListeningVoice(false);
        }
      );
    });
  };

  // Full conversational profile update via JeevikaAI
  const startFullVoiceUpdate = async () => {
    if (isListeningVoice) {
      speechService.stopListening();
      speechService.stopSpeaking();
      setIsListeningVoice(false);
      setActiveVoiceField(null);
      setVoiceStatusText('');
      return;
    }

    speechService.stopListening();
    speechService.stopSpeaking();
    setIsListeningVoice(true);
    setActiveVoiceField('name');
    setVoiceLiveTranscript('');

    const promptText = currentLang === 'bho'
      ? 'प्रणाम! रउआ आपन नाम, पढ़ाई, हुनर या जिला जवन भी बदले के चाहत बानी, बोल के बताईं।'
      : 'नमस्ते! आप अपना नाम, शिक्षा, हुनर या जिला जो भी बदलना चाहते हैं, बोलिए, JeevikaAI सब अपडेट कर देगा।';

    setVoiceStatusText(promptText);

    speechService.speak(promptText, currentLang, () => {
      speechService.startListening(
        currentLang,
        async (result: SpeechRecognitionResultWrapper) => {
          if (result.transcript) {
            setVoiceLiveTranscript(result.transcript);
          }
          if (result.isFinal && result.transcript.trim()) {
            const rawText = result.transcript.trim();
            setIsListeningVoice(false);
            setVoiceStatusText('JeevikaAI विश्लेषण कर रहा है...');

            try {
              const res = await fetch('/api/parse-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: rawText,
                  language: currentLang,
                  currentProfile: form,
                  stepKey: 'skills',
                }),
              });

              if (res.ok) {
                const data = await res.json();
                let updated = { ...form };
                if (data.updatedProfile) {
                  updated = { ...updated, ...data.updatedProfile };
                } else if (data.cleanValue) {
                  updated = { ...updated, skills: data.cleanValue };
                }
                setForm(updated);
                onUpdateProfile(updated);
                const ack = currentLang === 'bho'
                  ? 'बहुत बढ़िया! रउआ प्रोफ़ाइल JeevikaAI द्वारा अपडेट हो गइल बा।'
                  : 'बहुत बढ़िया! आपकी प्रोफ़ाइल JeevikaAI द्वारा अपडेट कर दी गई है।';
                speechService.speak(ack, currentLang);
                onNotify('✅ JeevikaAI ने आपकी प्रोफ़ाइल अपडेट कर दी!');
              } else {
                onNotify(`अपडेट नोट हुआ: ${rawText}`);
              }
            } catch {
              onNotify(`अपडेट नोट हुआ: ${rawText}`);
            }

            setActiveVoiceField(null);
            setVoiceStatusText('');
          }
        },
        (err) => {
          setIsListeningVoice(false);
          setActiveVoiceField(null);
          setVoiceStatusText('');
          onNotify(`माइक त्रुटि: ${err}`);
        },
        () => {
          setIsListeningVoice(false);
        }
      );
    });
  };

  const handleConfirmLogout = () => {
    const confirmed = window.confirm(
      currentLang === 'bho'
        ? 'का रउआ सच में लॉगआउट / नया प्रोफ़ाइल बनावे खातिर रीसेट कइल चाहत बानी?'
        : 'क्या आप सच में लॉगआउट करके नया प्रोफ़ाइल बनाने के लिए रीसेट करना चाहते हैं?'
    );
    if (confirmed && onLogout) {
      onLogout();
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DCE3EA] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#17365D]/10 text-[#17365D] mb-2">
            <Icon name="user" size={14} />
            <span>Beneficiary Profile &amp; Preferences</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#17365D]">
            Profile Settings · प्रोफ़ाइल प्रबंधन
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={handleConfirmLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#7E1F20] text-white text-xs font-extrabold transition-all shadow-sm active:scale-95"
              title="लॉगआउट / नया प्रोफ़ाइल बनाएं"
            >
              <Icon name="logout" size={14} />
              <span>🚪 लॉगआउट (Logout)</span>
            </button>
          )}

          <button
            onClick={() => go('dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17365D] text-white text-xs font-bold hover:bg-[#245A91] transition-colors shadow-sm"
          >
            <Icon name="route" size={14} />
            View Active Roadmap
          </button>
        </div>
      </div>

      {/* JeevikaAI Voice Assistant Profile Update Banner */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#17365D] via-[#245A91] to-[#287D73] text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-[#38BDF8]">
            <Icon name="sparkles" size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">
              JeevikaAI वॉइस से पूरी प्रोफ़ाइल अपडेट करें
            </h3>
            <p className="text-xs text-white/85 mt-0.5">
              सीधे बोलकर नाम, हुनर, जिला या शिक्षा एक साथ बदलें।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={startFullVoiceUpdate}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm ${
              isListeningVoice && !activeVoiceField
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-white text-[#17365D] hover:bg-slate-100'
            }`}
          >
            <Icon name="mic" size={16} />
            <span>{isListeningVoice ? 'सुन रहे हैं (बोलिए)...' : '🎙️ AI से बोलकर अपडेट करें'}</span>
          </button>

          {activeVoiceField && (
            <div className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold flex items-center gap-2 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
              <span>{voiceStatusText || voiceLiveTranscript || 'बोलिए, सुन रहे हैं...'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#DCE3EA] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Full Name & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#5F6B76]">
                Full Name (पूरा नाम)
              </label>
              <button
                type="button"
                onClick={() => startVoiceUpdate('name', 'अपना पूरा नाम बोलिए')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors ${
                  activeVoiceField === 'name'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-[#245A91]/10 text-[#245A91] hover:bg-[#245A91]/20'
                }`}
              >
                <Icon name="mic" size={12} />
                <span>AI से बोलें</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full p-3 rounded-xl border border-[#DCE3EA] text-sm focus:outline-none focus:border-[#245A91]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#5F6B76]">
                District / Town (जिला या कस्बा)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGpsDetect}
                  disabled={isDetectingGps}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="फोन के जीपीएस से सटीक स्थान पहचानें"
                >
                  <Icon name={isDetectingGps ? 'refresh' : 'target'} size={12} className={isDetectingGps ? 'animate-spin' : ''} />
                  <span>{isDetectingGps ? 'खोज रहे हैं...' : 'GPS पहचानें'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => startVoiceUpdate('location', 'अपना जिला या शहर बोलिए')}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors ${
                    activeVoiceField === 'location'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[#245A91]/10 text-[#245A91] hover:bg-[#245A91]/20'
                  }`}
                >
                  <Icon name="mic" size={12} />
                  <span>AI से बोलें</span>
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full p-3 rounded-xl border border-[#DCE3EA] text-sm focus:outline-none focus:border-[#245A91]"
            />
            {form.location && (
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[11px] text-[#5F6B76] font-medium">सटीकता स्तर (Accuracy):</span>
                <LocationAccuracyBadge
                  level={form.locationAccuracy || 'District-level'}
                  confidenceScore={form.locationConfidence || 85}
                  accuracyMeters={form.locationAccuracyMeters}
                  currentLang={currentLang}
                  onReDetect={handleGpsDetect}
                  isDetecting={isDetectingGps}
                />
              </div>
            )}
          </div>
        </div>

        {/* Education Level */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#5F6B76]">
              Education Level (शिक्षा स्तर)
            </label>
            <button
              type="button"
              onClick={() => startVoiceUpdate('education', 'अपनी शिक्षा बताइए, जैसे 10वीं, 12वीं या ग्रेजुएट')}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors ${
                activeVoiceField === 'education'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-[#245A91]/10 text-[#245A91] hover:bg-[#245A91]/20'
              }`}
            >
              <Icon name="mic" size={12} />
              <span>AI से बोलें</span>
            </button>
          </div>
          <select
            value={form.education}
            onChange={(e) => handleChange('education', e.target.value)}
            className="w-full p-3 rounded-xl border border-[#DCE3EA] bg-white text-sm focus:outline-none focus:border-[#245A91]"
          >
            {EDU.map((opt) => (
              <option key={opt.v} value={opt.v}>
                {opt.v} ({opt.hi})
              </option>
            ))}
          </select>
        </div>

        {/* Existing Skills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#5F6B76]">
              Existing Skills (आपके मौजूदा कौशल / हुनर)
            </label>
            <button
              type="button"
              onClick={() => startVoiceUpdate('skills', 'अपने हुनर या कौशल बोलिए')}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors ${
                activeVoiceField === 'skills'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-[#245A91]/10 text-[#245A91] hover:bg-[#245A91]/20'
              }`}
            >
              <Icon name="mic" size={12} />
              <span>AI से बोलें</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={form.skills}
            onChange={(e) => handleChange('skills', e.target.value)}
            placeholder="e.g. typing, stitching, phone use, cooking"
            className="w-full p-3 rounded-xl border border-[#DCE3EA] text-sm focus:outline-none focus:border-[#245A91]"
          />
          <div className="flex flex-wrap gap-1.5">
            {SKILL_CHIPS.map((chip) => {
              const active = splitList(form.skills).includes(chip.en);
              return (
                <button
                  type="button"
                  key={chip.en}
                  onClick={() => handleToggleChip('skills', chip.en)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-[#17365D] text-white border-[#17365D]'
                      : 'bg-[#F5F7FA] border-[#DCE3EA] text-[#5F6B76] hover:border-[#245A91]'
                  }`}
                >
                  {active ? '✓ ' : '+ '}{chip.en} ({chip.hi})
                </button>
              );
            })}
          </div>
        </div>

        {/* Career Interests */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#5F6B76]">
              Interests &amp; Ambitions (आपकी रुचि / पसंदीदा काम)
            </label>
            <button
              type="button"
              onClick={() => startVoiceUpdate('interests', 'आपको किस तरह के काम में रुचि है? बोलिए')}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors ${
                activeVoiceField === 'interests'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-[#245A91]/10 text-[#245A91] hover:bg-[#245A91]/20'
              }`}
            >
              <Icon name="mic" size={12} />
              <span>AI से बोलें</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={form.interests}
            onChange={(e) => handleChange('interests', e.target.value)}
            placeholder="e.g. digital services, computers, tailoring, electrical repair"
            className="w-full p-3 rounded-xl border border-[#DCE3EA] text-sm focus:outline-none focus:border-[#245A91]"
          />
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_CHIPS.map((chip) => {
              const active = splitList(form.interests).includes(chip.en);
              return (
                <button
                  type="button"
                  key={chip.en}
                  onClick={() => handleToggleChip('interests', chip.en)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-[#17365D] text-white border-[#17365D]'
                      : 'bg-[#F5F7FA] border-[#DCE3EA] text-[#5F6B76] hover:border-[#245A91]'
                  }`}
                >
                  {active ? '✓ ' : '+ '}{chip.en} ({chip.hi})
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Work Type & Mobility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#5F6B76]">
                Preferred Work Type (कार्य का प्रकार)
              </label>
              <button
                type="button"
                onClick={() => startVoiceUpdate('workType', 'आप नौकरी चाहते हैं या खुद का काम?')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors ${
                  activeVoiceField === 'workType'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-[#245A91]/10 text-[#245A91] hover:bg-[#245A91]/20'
                }`}
              >
                <Icon name="mic" size={12} />
                <span>AI से बोलें</span>
              </button>
            </div>
            <select
              value={form.workType}
              onChange={(e) => handleChange('workType', e.target.value)}
              className="w-full p-3 rounded-xl border border-[#DCE3EA] bg-white text-sm focus:outline-none focus:border-[#245A91]"
            >
              {WORK.map((opt) => (
                <option key={opt.v} value={opt.v}>
                  {opt.v} ({opt.hi})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#5F6B76]">
                Travel Range / Mobility (यात्रा सीमा)
              </label>
              <button
                type="button"
                onClick={() => startVoiceUpdate('mobility', 'आप काम के लिए कितनी दूर जा सकते हैं?')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors ${
                  activeVoiceField === 'mobility'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-[#245A91]/10 text-[#245A91] hover:bg-[#245A91]/20'
                }`}
              >
                <Icon name="mic" size={12} />
                <span>AI से बोलें</span>
              </button>
            </div>
            <select
              value={form.mobility}
              onChange={(e) => handleChange('mobility', e.target.value)}
              className="w-full p-3 rounded-xl border border-[#DCE3EA] bg-white text-sm focus:outline-none focus:border-[#245A91]"
            >
              {MOB.map((opt) => (
                <option key={opt.v} value={opt.v}>
                  {opt.v} ({opt.hi})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls & Logout */}
        <div className="pt-4 border-t border-[#DCE3EA] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto-saved to device &amp; cloud · सभी बदलाव स्वतः सुरक्षित (Auto-saved)</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onLogout && (
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#7E1F20] text-white text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Icon name="logout" size={14} />
                <span>🚪 लॉगआउट / रीसेट (Logout)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => go('dashboard')}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#17365D] text-white text-xs font-bold hover:bg-[#245A91] transition-all shadow-sm"
            >
              Go to Dashboard (डैशबोर्ड देखें)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
