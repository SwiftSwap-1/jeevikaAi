import React from 'react';
import { Icon } from './Icons';
import { AppView, SupportedLanguage } from '../types';
import { t } from '../services/translationService';

interface BottomNavProps {
  currentView: AppView;
  go: (view: AppView) => void;
  shortlistCount: number;
  currentLang: SupportedLanguage;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, go, shortlistCount, currentLang }) => {
  const tabs = [
    { id: 'dashboard', label: t('nav.roadmap', currentLang), icon: 'route' },
    { id: 'opportunities', label: t('nav.jobs', currentLang), icon: 'briefcase' },
    { id: 'training', label: t('nav.training', currentLang), icon: 'cap' },
    { id: 'saved', label: t('nav.saved', currentLang), icon: 'star', badge: shortlistCount },
    { id: 'profile', label: t('nav.profile', currentLang), icon: 'user' },
  ];

  return (
    <nav aria-label="App Bottom Navigation" className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#DCE3EA] shadow-[0_-4px_25px_rgba(0,0,0,0.12)] py-2 px-3 block">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => go(tab.id as AppView)}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all relative ${
                isActive ? 'text-[#245A91] font-bold scale-105' : 'text-[#5F6B76] hover:text-[#17365D]'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-[#245A91]/15 text-[#245A91]' : 'text-[#5F6B76]'}`}>
                <Icon name={tab.icon as any} size={22} />
              </div>
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                {tab.label}
              </span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-0 right-1 w-4 h-4 bg-[#D9822B] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
