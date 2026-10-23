import React from 'react';
import { Logo } from './Logo';
import { AppView, SupportedLanguage } from '../types';
import { t } from '../services/translationService';

interface FooterProps {
  go: (view: AppView) => void;
  currentLang: SupportedLanguage;
}

export const Footer: React.FC<FooterProps> = ({ go, currentLang }) => {
  return (
    <footer className="bg-[#F5F7FA] border-t border-[#DCE3EA] text-[#5F6B76] text-xs py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <Logo onClick={() => go('home')} />
            <p className="text-xs text-[#5F6B76] max-w-sm leading-relaxed">
              {t('footer.desc', currentLang)}
            </p>
            <div className="text-[11px] text-[#245A91] font-semibold">
              {t('footer.tagline', currentLang)}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#17365D]">
              {t('footer.navTitle', currentLang)}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => go('home')} className="hover:text-[#17365D]">
                  {t('nav.home', currentLang)}
                </button>
              </li>
              <li>
                <button onClick={() => go('about')} className="hover:text-[#17365D] text-[#245A91] font-semibold">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => go('assessment')} className="hover:text-[#17365D]">
                  {t('btn.voiceAssessment', currentLang)}
                </button>
              </li>
              <li>
                <button onClick={() => go('dashboard')} className="hover:text-[#17365D]">
                  {t('nav.roadmap', currentLang)}
                </button>
              </li>
              <li>
                <button onClick={() => go('opportunities')} className="hover:text-[#17365D]">
                  {t('nav.jobs', currentLang)}
                </button>
              </li>
              <li>
                <button onClick={() => go('training')} className="hover:text-[#17365D]">
                  {t('nav.training', currentLang)}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#17365D]">
              {t('footer.legalTitle', currentLang)}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => go('about')} className="hover:text-[#17365D]">
                  About Us &amp; Initiative
                </button>
              </li>
              <li>
                <button onClick={() => go('accessibility')} className="hover:text-[#17365D]">
                  Accessibility Standards
                </button>
              </li>
              <li>
                <button onClick={() => go('privacy')} className="hover:text-[#17365D]">
                  Privacy Notice &amp; Consent
                </button>
              </li>
              <li>
                <button onClick={() => go('faq')} className="hover:text-[#17365D]">
                  {t('nav.faq', currentLang)}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#DCE3EA] pt-6 space-y-2 text-[11px] text-[#5F6B76] leading-relaxed">
          <p>
            <strong>Disclaimer:</strong> {t('footer.disclaimer', currentLang)}
          </p>
          <p>© 2026 JeevikaAI · All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
