import React from 'react';
import { LogoMark } from './Logo';
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
    <div className="fixed inset-0 z-40 bg-[#17365D]/95 flex flex-col items-center justify-between p-3 sm:p-6 overflow-y-auto">
      <div className="gov-tricolor-line absolute top-0 left-0 right-0" />
      
      {/* Top Gap Promotional Banner (Highlighted Artisan / Skill Empowerment) */}
      <div className="w-full max-w-md mt-2 relative rounded-2xl overflow-hidden shadow-lg border border-white/20 h-24 sm:h-28 flex-shrink-0">
        <img
          src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=800&q=80"
          alt="Rural Artisan & Skill Empowerment"
          className="w-full h-full object-cover brightness-90 transform hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#17365D]/90 via-[#17365D]/40 to-transparent flex flex-col justify-end p-3 text-left">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#287D73] text-white w-max">
            <span>✨ राष्ट्रीय कौशल मिशन (NSQF)</span>
          </div>
          <div className="text-white text-xs sm:text-sm font-extrabold drop-shadow-sm mt-0.5">
            ग्रामीण हुनरमंदों व महिला उद्यमियों का डिजिटल सशक्तिकरण
          </div>
        </div>
      </div>

      {/* Center Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#DCE3EA] text-center space-y-4 my-2 flex-shrink-0">
        {/* Centered App Icon Mark */}
        <div className="mx-auto flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#17365D] text-white flex items-center justify-center shadow-lg border-2 border-[#245A91]">
            <LogoMark size={38} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#17365D] tracking-tight font-['Bricolage_Grotesque']">
              Jeevika<span className="text-[#245A91]">AI</span>
            </h1>
            <p className="text-[11px] font-bold text-[#287D73] mt-0.5">
              ग्रामीण हुनर व आजीविका सहायक
            </p>
          </div>
        </div>

        <p className="text-xs text-[#5F6B76] leading-relaxed">
          {currentLang === 'bho'
            ? 'बिना कवनो फॉर्म भरले, आवाज से आपन हुनर अउर ट्रेनिंग रोडमैप बनाईं।'
            : 'बिना कोई फॉर्म भरे, आवाज से अपना हुनर और ट्रेनिंग रोडमैप बनाएं। सुरक्षित खाता और मोबाइल नंबर के साथ।'}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          {/* Create Account Button */}
          <button
            onClick={() => onOpenAccount('create')}
            className="w-full min-h-12 px-6 rounded-2xl bg-[#287D73] hover:bg-[#1E6058] text-white text-sm sm:text-base font-extrabold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <span>
              {currentLang === 'bho' ? 'नया खाता बनाईं (Create Account)' : 'खाता बनाएं (Create Account)'}
            </span>
          </button>

          {/* Login Button */}
          <button
            onClick={() => onOpenAccount('login')}
            className="w-full min-h-12 px-6 rounded-2xl bg-[#17365D] hover:bg-[#245A91] text-white text-sm sm:text-base font-extrabold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <span>
              {currentLang === 'bho' ? 'लॉगिन करीं (Log In)' : 'लॉगिन करें (Log In)'}
            </span>
          </button>

          {/* Demo Button */}
          <button
            onClick={onLoadDemo}
            className="w-full py-2.5 px-4 rounded-xl border border-[#DCE3EA] bg-slate-50 text-[#17365D] hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Icon name="user" size={14} className="text-[#287D73]" />
            <span>डेमो देखें (Load Demo)</span>
          </button>
        </div>

        <div className="pt-1 text-[10px] text-[#5F6B76] font-medium flex items-center justify-center gap-1.5">
          <Icon name="shieldCheck" size={13} className="text-[#287D73]" />
          <span>सुरक्षित मोबाइल नंबर + PIN आधारित प्रणाली</span>
        </div>
      </div>

      {/* Bottom Gap Promotional Banner (Subtle Community Livelihood Footer) */}
      <div className="w-full max-w-md mb-1 relative rounded-2xl overflow-hidden shadow-md border border-white/10 h-16 sm:h-20 flex-shrink-0 opacity-90">
        <img
          src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
          alt="Community Livelihood Growth"
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17365D]/80 to-[#287D73]/60 flex items-center justify-center px-4 text-center">
          <div className="text-white text-[11px] sm:text-xs font-bold drop-shadow-sm flex items-center gap-2">
            <span>🤝</span>
            <span>स्थानीय स्वयं सहायता समूह (SHG) एवं कारीगरों हेतु समर्पित</span>
          </div>
        </div>
      </div>
    </div>
  );
};
