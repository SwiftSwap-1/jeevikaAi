import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Icon } from './Icons';
import { SupportedLanguage, AppView } from '../types';
import { LANG_CONFIG } from '../data/mockData';
import { AppUser } from '../services/firebase';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface NavbarProps {
  currentView: AppView;
  currentLang: SupportedLanguage;
  currentUser: AppUser | null;
  profileName?: string;
  onLanguageChange: (lang: SupportedLanguage) => void;
  go: (view: AppView, sectionId?: string) => void;
  onLogout: () => void;
  onStartVoiceAssessment?: () => void;
  onOpenAdminLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentLang,
  currentUser,
  profileName,
  onLanguageChange,
  go,
  onLogout,
  onStartVoiceAssessment,
  onOpenAdminLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isStandalone = 
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

  const { canInstall, isInstalled, promptInstall } = usePWAInstall();

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const [isOnline, setIsOnline] = useState<boolean>(() => 
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNav = (v: AppView, s?: string) => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setLangMenuOpen(false);
    go(v, s);
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'ayushgupt640@gmail.com';
  const activeLangConfig = LANG_CONFIG.find((l) => l.k === currentLang) || LANG_CONFIG[0];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-xs">
      {/* Subtle National Civic Top Accent Line */}
      <div className="gov-tricolor-line" />

      {/* Offline Status Indicator Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-[11px] font-bold py-1 px-3 text-center flex items-center justify-center gap-1.5 shadow-inner transition-all animate-fade-in">
          <Icon name="wifiOff" size={13} className="text-white animate-pulse flex-shrink-0" />
          <span className="truncate">
            ऑफलाइन मोड: आप सहेजा हुआ डेटा देख रहे हैं (Offline — Viewing Cached Data)
          </span>
        </div>
      )}

      {/* Top National Civic Ribbon - Hidden in PWA standalone mode */}
      {!isStandalone && (
        <div className="bg-[#17365D] text-[#C9DAEC] text-[10px] sm:text-xs py-1.5 px-3 sm:px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-[#D9822B] text-white flex-shrink-0">
                Public Service
              </span>
              <span className="text-white/85 truncate font-medium">
                Voice-First NSQF Livelihood &amp; Skill Guidance
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] flex-shrink-0">
              <button
                onClick={() => handleNav('about')}
                className="hover:underline font-semibold text-white/95"
              >
                About
              </button>
              <span className="opacity-40">|</span>
              <button
                onClick={() => handleNav('faq')}
                className="hover:underline hidden xs:inline text-white/80"
              >
                Help &amp; FAQ
              </button>
              <span className="opacity-40 hidden xs:inline">|</span>
              <button
                onClick={() => handleNav('privacy')}
                className="hover:underline hidden md:inline text-white/80"
              >
                Privacy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar Bar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-[#DCE3EA]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo with responsive text */}
          <div className="flex items-center flex-shrink-0">
            <Logo size={32} userName={profileName} onClick={() => handleNav('home')} />
          </div>

          {/* Desktop Nav Links (Visible on >= 1024px lg screens) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-[#5F6B76]" aria-label="Main navigation">
            <button
              onClick={() => handleNav('home')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-[#17365D] ${
                currentView === 'home' ? 'text-[#245A91] font-extrabold' : ''
              }`}
            >
              Home
            </button>

            <button
              onClick={() => handleNav('dashboard')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-[#17365D] ${
                currentView === 'dashboard' ? 'text-[#245A91] font-extrabold' : ''
              }`}
            >
              Roadmap
            </button>

            <button
              onClick={() => handleNav('opportunities')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-[#17365D] ${
                currentView === 'opportunities' ? 'text-[#245A91] font-extrabold' : ''
              }`}
            >
              Jobs
            </button>

            <button
              onClick={() => handleNav('training')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-[#17365D] ${
                currentView === 'training' ? 'text-[#245A91] font-extrabold' : ''
              }`}
            >
              Training Centers
            </button>

            <button
              onClick={() => handleNav('skill-gap')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-[#17365D] ${
                currentView === 'skill-gap' ? 'text-[#245A91] font-extrabold' : ''
              }`}
            >
              Skill Gaps
            </button>

            <button
              onClick={() => handleNav('saved')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-[#17365D] ${
                currentView === 'saved' ? 'text-[#245A91] font-extrabold' : ''
              }`}
            >
              Saved
            </button>

            <button
              onClick={() => handleNav('faq')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-[#17365D] ${
                currentView === 'faq' ? 'text-[#245A91] font-extrabold' : ''
              }`}
            >
              Help &amp; FAQ
            </button>

            <button
              onClick={() => handleNav('about')}
              className={`px-3 py-2 rounded-lg transition-colors hover:text-[#17365D] ${
                currentView === 'about' ? 'text-[#245A91] font-extrabold' : ''
              }`}
            >
              About
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors bg-[#17365D] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs`}
              >
                <Icon name="shield" size={13} />
                <span>Admin CMS</span>
              </button>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Offline Status Badge */}
            {!isOnline && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex-shrink-0 animate-fade-in" title="You are offline and viewing cached data">
                <Icon name="wifiOff" size={12} className="text-amber-700 animate-pulse" />
                <span className="hidden xs:inline">Offline</span>
              </span>
            )}
            {/* Desktop PWA Install Button */}
            {canInstall && (
              <button
                onClick={promptInstall}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D9822B] bg-[#FFF4DB] text-[#D9822B] text-xs font-bold hover:bg-[#FCECC3] transition-transform active:scale-95"
                title="Install JeevikaAI as a native app on your home screen"
              >
                <Icon name="download" size={14} />
                <span>Install</span>
              </button>
            )}

            {/* Language Switcher (Compact & fluid) */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[#DCE3EA] bg-white text-[#202B36] hover:border-[#245A91] transition-colors"
                aria-label="Change language"
                title="भाषा बदलें (Change Language)"
              >
                <Icon name="globe" size={14} className="text-[#245A91]" />
                <span className="font-bold text-[11px] sm:text-xs">{activeLangConfig.label}</span>
                <Icon name="chev" size={11} className="text-[#5F6B76]" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-[#DCE3EA] rounded-xl shadow-xl py-1 z-50">
                  {LANG_CONFIG.map((lang) => (
                    <button
                      key={lang.k}
                      onClick={() => {
                        onLanguageChange(lang.k as SupportedLanguage);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F5F7FA] ${
                        currentLang === lang.k
                          ? 'font-bold text-[#245A91] bg-slate-50'
                          : 'text-[#202B36]'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-[10px] text-[#5F6B76]">{lang.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prominent Saved User Profile & Red Logout Button at Top */}
            {(profileName || currentUser) && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleNav('profile')}
                  className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-[#DCE3EA] text-[#17365D] max-w-[90px] xxs:max-w-[125px] sm:max-w-[160px] transition-colors"
                  title="प्रोफ़ाइल देखें (View Profile)"
                >
                  <div className="w-5 h-5 rounded-full bg-[#17365D] text-white flex items-center justify-center font-extrabold text-[10px] flex-shrink-0">
                    {(profileName || currentUser?.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-extrabold truncate">
                    {profileName || currentUser?.displayName || 'प्रोफ़ाइल'}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-xl bg-[#9E2A2B] hover:bg-[#7E1F20] text-white text-[11px] sm:text-xs font-extrabold transition-all shadow-xs flex items-center gap-1 active:scale-95 flex-shrink-0"
                  title="लॉगआउट (Logout)"
                >
                  <Icon name="logout" size={13} />
                  <span>लॉगआउट</span>
                </button>
              </div>
            )}

            {/* Admin Login Button when not logged in */}
            {!currentUser && !profileName && onOpenAdminLogin && (
              <button
                onClick={onOpenAdminLogin}
                className="hidden sm:flex px-3 py-1.5 text-xs font-bold rounded-xl bg-[#17365D] text-white hover:bg-[#245A91] transition-colors items-center gap-1.5 shadow-xs"
              >
                <Icon name="shield" size={13} />
                <span>Admin Login</span>
              </button>
            )}

            {/* PROMINENT MOBILE & TABLET HAMBURGER BUTTON */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border-2 border-[#17365D]/30 text-[#17365D] hover:bg-slate-100 font-bold text-xs shadow-xs transition-all active:scale-95 flex-shrink-0"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
                {mobileMenuOpen ? (
                  <span className="text-base font-extrabold leading-none">✕</span>
                ) : (
                  <>
                    <span className="w-4 h-0.5 bg-[#17365D] rounded-full" />
                    <span className="w-4 h-0.5 bg-[#17365D] rounded-full" />
                    <span className="w-4 h-0.5 bg-[#17365D] rounded-full" />
                  </>
                )}
              </div>
              <span className="text-[11px] font-extrabold tracking-tight hidden xxs:inline">
                {mobileMenuOpen ? 'बंद' : 'मेनू'}
              </span>
            </button>
          </div>
        </div>

        {/* Backdrop for Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-[calc(4rem+1.8rem)] z-40 bg-black/50 backdrop-blur-xs lg:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 z-50 bg-white border-b border-[#DCE3EA] shadow-2xl max-h-[calc(100vh-6rem)] overflow-y-auto px-4 py-4 space-y-3 text-xs font-semibold animate-fade-in">
            {/* Beneficiary Profile or User Account & Prominent Logout Button at the Top */}
            {(profileName || currentUser) && (
              <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-9 h-9 rounded-full bg-[#17365D] text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-sm">
                      {(profileName || currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="font-extrabold text-[#17365D] text-sm truncate">
                        {profileName || currentUser?.displayName || 'लाभार्थी'}
                      </div>
                      <div className="text-[10px] text-[#5F6B76] font-medium truncate">
                        सक्रिय प्रोफ़ाइल · Active Profile
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold text-white bg-[#9E2A2B] hover:bg-[#7E1F20] transition-colors shadow-sm flex items-center gap-1.5 flex-shrink-0 active:scale-95"
                  >
                    <span>🚪 लॉगआउट</span>
                  </button>
                </div>
              </div>
            )}



            {/* Main Navigation Links */}
            <div className="space-y-1 pt-1 border-t border-[#DCE3EA]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B76] px-2 py-1">
                नेविगेशन मेनू (Navigation)
              </div>
              <button
                onClick={() => handleNav('home')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'home' ? 'bg-[#245A91]/10 text-[#245A91] font-bold' : 'hover:bg-[#F5F7FA] text-[#202B36]'
                }`}
              >
                <span>मुख्य पृष्ठ (Home)</span>
                <Icon name="chev" size={12} className="opacity-40" />
              </button>
              <button
                onClick={() => handleNav('dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'dashboard' ? 'bg-[#245A91]/10 text-[#245A91] font-bold' : 'hover:bg-[#F5F7FA] text-[#202B36]'
                }`}
              >
                <span>आजीविका रोडमैप (Livelihood Roadmap)</span>
                <Icon name="chev" size={12} className="opacity-40" />
              </button>
              <button
                onClick={() => handleNav('opportunities')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'opportunities' ? 'bg-[#245A91]/10 text-[#245A91] font-bold' : 'hover:bg-[#F5F7FA] text-[#202B36]'
                }`}
              >
                <span>रोजगार अवसर (Jobs Directory)</span>
                <Icon name="chev" size={12} className="opacity-40" />
              </button>
              <button
                onClick={() => handleNav('training')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'training' ? 'bg-[#245A91]/10 text-[#245A91] font-bold' : 'hover:bg-[#F5F7FA] text-[#202B36]'
                }`}
              >
                <span>प्रशिक्षण केंद्र (PMKVY / RSETI)</span>
                <Icon name="chev" size={12} className="opacity-40" />
              </button>
              <button
                onClick={() => handleNav('skill-gap')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'skill-gap' ? 'bg-[#245A91]/10 text-[#245A91] font-bold' : 'hover:bg-[#F5F7FA] text-[#202B36]'
                }`}
              >
                <span>कौशल अंतर विश्लेषण (Skill Gap)</span>
                <Icon name="chev" size={12} className="opacity-40" />
              </button>
              <button
                onClick={() => handleNav('saved')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'saved' ? 'bg-[#245A91]/10 text-[#245A91] font-bold' : 'hover:bg-[#F5F7FA] text-[#202B36]'
                }`}
              >
                <span>सहेजे गए अवसर (Saved Items)</span>
                <Icon name="chev" size={12} className="opacity-40" />
              </button>
              <button
                onClick={() => handleNav('faq')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'faq' ? 'bg-[#245A91]/10 text-[#245A91] font-bold' : 'hover:bg-[#F5F7FA] text-[#202B36]'
                }`}
              >
                <span>सहायता व प्रश्नोत्तर (Help &amp; FAQ)</span>
                <Icon name="chev" size={12} className="opacity-40" />
              </button>
              <button
                onClick={() => handleNav('about')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'about' ? 'bg-[#245A91]/10 text-[#245A91] font-bold' : 'hover:bg-[#F5F7FA] text-[#202B36]'
                }`}
              >
                <span>हमारे बारे में (About Us)</span>
                <Icon name="chev" size={12} className="opacity-40" />
              </button>
            </div>

            {/* PWA App Install option in drawer */}
            {canInstall && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    promptInstall();
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-[#FFF4DB] border border-[#D9822B]/40 text-[#D9822B] font-bold flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Icon name="download" size={16} />
                    <span>ऐप इंस्टॉल करें (Install App)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#D9822B] text-white">
                    Only 1MB
                  </span>
                </button>
              </div>
            )}

            {/* ADMIN PORTAL LINK PLACED AT THE VERY BOTTOM OF HAMBURGER MENU */}
            <div className="pt-2 border-t border-[#DCE3EA]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAdmin) {
                    handleNav('admin');
                  } else if (onOpenAdminLogin) {
                    onOpenAdminLogin();
                  } else {
                    handleNav('admin');
                  }
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#5F6B76] hover:text-[#17365D] transition-all flex items-center justify-between text-[11px]"
              >
                <span className="flex items-center gap-2">
                  <Icon name="shield" size={13} className="text-[#5F6B76]" />
                  <span>प्रशासनिक पोर्टल (Admin Portal)</span>
                </span>
                <span className="font-bold underline text-[#245A91]">
                  {isAdmin ? 'CMS' : 'Login'}
                </span>
              </button>
            </div>
          </div>
        )}
        </div>
      </header>
  );
};
