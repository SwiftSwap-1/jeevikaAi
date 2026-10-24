import React from 'react';
import { Logo } from './Logo';
import { Icon } from './Icons';
import { SupportedLanguage } from '../types';

interface AppWelcomeProps {
  currentLang: SupportedLanguage;
  onOpenAccount: (mode: 'create' | 'login') => void;
  onLoadDemo: () => void;
}

export const AppWelcome: React.FC<AppWelcomeProps> = ({
  currentLang,
  onOpenAccount,
  onLoadDemo,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-[#F5F7FA] flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="gov-tricolor-line absolute top-0 left-0 right-0" />
      
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#DCE3EA] text-center space-y-6 my-auto">
        {/* Centered Platform Logo */}
        <div className="mx-auto flex flex-col items-center space-y-3">
          <div className="w-20 h-20 rounded-2xl bg-[#17365D] text-white flex items-center justify-center shadow-lg border-2 border-[#245A91]">
            <Logo size={48} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17365D] tracking-tight font-['Bricolage_Grotesque']">
              JeevikaAI
            </h1>
            <p className="text-xs font-bold text-[#287D73] mt-0.5">
              ग्रामीण हुनर व आजीविका सहायक
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#5F6B76] leading-relaxed">
          {currentLang === 'bho'
            ? 'बिना कवनो फॉर्म भरले, आवाज से आपन हुनर अउर ट्रेनिंग रोडमैप बनाईं।'
            : 'बिना कोई फॉर्म भरे, आवाज से अपना हुनर और ट्रेनिंग रोडमैप बनाएं। सुरक्षित खाता और मोबाइल नंबर के साथ।'}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3.5 pt-1">
          {/* Create Account Button */}
          <button
            onClick={() => onOpenAccount('create')}
            className="w-full min-h-14 px-6 rounded-2xl bg-[#287D73] hover:bg-[#1E6058] text-white text-base font-extrabold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <span>
              {currentLang === 'bho' ? 'नया खाता बनाईं (Create Account)' : 'खाता बनाएं (Create Account)'}
            </span>
          </button>

          {/* Login Button */}
          <button
            onClick={() => onOpenAccount('login')}
            className="w-full min-h-14 px-6 rounded-2xl bg-[#17365D] hover:bg-[#245A91] text-white text-base font-extrabold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <span>
              {currentLang === 'bho' ? 'लॉगिन करीं (Log In)' : 'लॉगिन करें (Log In)'}
            </span>
          </button>

          {/* Demo Button */}
          <button
            onClick={onLoadDemo}
            className="w-full py-3 px-4 rounded-xl border border-[#DCE3EA] bg-white text-[#17365D] hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Icon name="user" size={15} className="text-[#287D73]" />
            <span>डेमो देखें (Load Demo)</span>
          </button>
        </div>

        <div className="pt-1 text-[11px] text-[#5F6B76] font-medium flex items-center justify-center gap-1.5">
          <Icon name="shieldCheck" size={14} className="text-[#287D73]" />
          <span>सुरक्षित मोबाइल नंबर + PIN आधारित प्रणाली</span>
        </div>
      </div>
    </div>
  );
};
