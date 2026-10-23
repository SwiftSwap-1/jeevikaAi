import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { Icon } from './Icons';

interface VoiceStartModalProps {
  isOpen: boolean;
  currentLang: SupportedLanguage;
  onClose: () => void;
  onConfirm: (lang: SupportedLanguage) => void;
}

const LANGUAGES = [
  { id: 'hi' as SupportedLanguage, name: 'हिन्दी', sub: 'Hindi' },
  { id: 'bho' as SupportedLanguage, name: 'भोजपुरी', sub: 'Bhojpuri' },
  { id: 'en' as SupportedLanguage, name: 'English', sub: 'English' },
];

export const VoiceStartModal: React.FC<VoiceStartModalProps> = ({
  isOpen,
  currentLang,
  onClose,
  onConfirm,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(currentLang);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#DCE3EA] space-y-5 text-left">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#245A91] text-white flex items-center justify-center flex-none shadow-sm">
              <Icon name="mic" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#17365D]">
                बोलकर शुरू करें (Voice Assessment)
              </h3>
              <p className="text-xs text-[#5F6B76] mt-0.5">
                सीधे बातचीत करें — कोई लंबा फॉर्म भरने की जरूरत नहीं
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] flex items-center justify-center text-sm font-bold transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#17365D]">
            बातचीत की भाषा चुनें (Select Conversation Language):
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedLang(lang.id)}
                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                  selectedLang === lang.id
                    ? 'border-[#245A91] bg-[#F5F7FA] text-[#17365D] font-bold ring-2 ring-[#245A91]/20'
                    : 'border-[#DCE3EA] bg-white text-[#5F6B76] hover:border-[#17365D]'
                }`}
              >
                <div className="text-xs font-bold">{lang.name}</div>
                <div className="text-[10px] text-[#5F6B76]">{lang.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Simple 3 Points */}
        <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA] space-y-2.5 text-xs text-[#202B36]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#287D73] flex-none" />
            <span>
              <strong>माइक अनुमति:</strong> टैप करते ही माइक सक्रिय होगा
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#245A91] flex-none" />
            <span>
              <strong>ऑटोमेटिक बातचीत:</strong> सहायक सवाल खुद बोलकर पूछेंगे
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D9822B] flex-none" />
            <span>
              <strong>स्वाभाविक उत्तर:</strong> आप आराम से बोलिए, AI खुद समझ लेगा
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onConfirm(selectedLang)}
            className="flex-1 py-3 px-4 rounded-xl bg-[#245A91] hover:bg-[#17365D] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Icon name="mic" size={18} />
            <span>बातचीत शुरू करें (Start Now)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-[#DCE3EA] text-xs font-bold text-[#5F6B76] hover:bg-slate-50 transition-colors"
          >
            रद्द करें (Cancel)
          </button>
        </div>
      </div>
    </div>
  );
};
