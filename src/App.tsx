import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Logo } from './components/Logo';
import { Icon } from './components/Icons';
import { BottomNav } from './components/BottomNav';
import { Home } from './components/Home';
import { Assessment } from './components/Assessment';
import { Dashboard } from './components/Dashboard';
import { OpportunitiesView } from './components/OpportunitiesView';
import { TrainingView } from './components/TrainingView';
import { SkillGapView } from './components/SkillGapView';
import { SavedView } from './components/SavedView';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { NotificationSettingsView } from './components/NotificationSettingsView';
import { HelpFAQView } from './components/HelpFAQView';
import { AdminCMSView } from './components/AdminCMSView';
import { OpportunityDetailModal } from './components/OpportunityDetailModal';
import { SummaryModal } from './components/SummaryModal';
import { VoiceStartModal } from './components/VoiceStartModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { FloatingVoiceAssistant } from './components/FloatingVoiceAssistant';
import { BeneficiaryProfile, SupportedLanguage, AppView, Opportunity, SummaryModalData, LocationLivelihoodData } from './types';
import { DEMO } from './data/mockData';
import { storageService } from './services/storageService';
import { authService, AppUser, firestoreService } from './services/firebase';
import { locationIntelligenceService } from './services/locationIntelligenceService';

export default function App() {
  const isStandalone = 
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

  const [currentView, setCurrentView] = useState<AppView>(() => {
    const hasProfile = Boolean(storageService.loadProfile());
    if (hasProfile || isStandalone) {
      return hasProfile ? 'dashboard' : 'assessment';
    }
    return 'home';
  });
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    try {
      return (localStorage.getItem('jeevika_lang') as SupportedLanguage) || 'hi';
    } catch {
      return 'hi';
    }
  });
  const [profile, setProfile] = useState<BeneficiaryProfile | null>(() => storageService.loadProfile());
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [shortlist, setShortlist] = useState<Record<string, boolean>>(() => storageService.loadShortlist());
  const [toastMessage, setToastMessage] = useState<string>('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [summaryModalData, setSummaryModalData] = useState<SummaryModalData | null>(null);
  const [autoStartAssessment, setAutoStartAssessment] = useState<boolean>(() => {
    const hasProfile = Boolean(storageService.loadProfile());
    return Boolean(isStandalone && !hasProfile);
  });
  const [showVoiceStartModal, setShowVoiceStartModal] = useState<boolean>(false);
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState<boolean>(false);
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(1);

  // Active Location & Live Location Intelligence State
  const [activeLocation, setActiveLocation] = useState<string>(() => {
    return storageService.loadProfile()?.location || locationIntelligenceService.getActiveLocation() || 'Maharajganj, Uttar Pradesh';
  });
  const [locationData, setLocationData] = useState<LocationLivelihoodData | null>(() => {
    const initialProfileLoc = storageService.loadProfile()?.location;
    return locationIntelligenceService.getCachedData(initialProfileLoc);
  });
  const [isRefreshingLocationData, setIsRefreshingLocationData] = useState<boolean>(false);

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return Boolean(isStandalone && !sessionStorage.getItem('jeevika_pwa_splashed'));
  });

  // Subscribe to location intelligence changes & keep synced with profile.location
  useEffect(() => {
    const unsub = locationIntelligenceService.subscribe((data) => {
      setLocationData(data);
    });
    const locToFetch = profile?.location?.trim() || activeLocation;
    if (profile?.location && profile.location.trim() !== activeLocation) {
      setActiveLocation(profile.location.trim());
    }
    locationIntelligenceService.fetchLocationData(locToFetch, currentLang, profile);
    return () => unsub();
  }, [profile?.location]);

  useEffect(() => {
    if (showSplash) {
      sessionStorage.setItem('jeevika_pwa_splashed', 'true');
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const pendingSectionRef = useRef<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const notify = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 4500);
  };

  const navigateTo = (v: AppView | string, sectionId?: string) => {
    const targetView = (v as AppView) || 'home';
    if (targetView === currentView) {
      if (sectionId) {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    pendingSectionRef.current = sectionId || null;
    setCurrentView(targetView);
  };

  // Scroll restoration after view change
  useEffect(() => {
    const sec = pendingSectionRef.current;
    pendingSectionRef.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (sec) {
          const el = document.getElementById(sec);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      });
    });
  }, [currentView]);

  // Prevent accidental back-navigation to assessment steps once dashboard is loaded
  useEffect(() => {
    const handlePopState = () => {
      if (profile && currentView === 'dashboard') {
        window.history.pushState(null, '', window.location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [profile, currentView]);

  const handleAssessmentComplete = async (newProfile: BeneficiaryProfile) => {
    // 1. Immediately switch view to dashboard so Assessment unmounts cleanly and permanently!
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 2. Determine target location from profile (or fallback) and systematically synchronize active location
    const targetLoc = (newProfile.location && newProfile.location.trim())
      ? newProfile.location.trim()
      : (activeLocation || 'Maharajganj, Uttar Pradesh');

    setActiveLocation(targetLoc);
    locationIntelligenceService.setActiveLocation(targetLoc);

    // 3. Persist confirmed profile into state and storage
    setProfile(newProfile);
    await storageService.saveProfile(newProfile);

    // 4. Prevent accidental navigation back to previous assessment steps
    try {
      localStorage.removeItem('jeevika_current_step_v1');
      sessionStorage.removeItem('jeevika_current_step_v1');
      window.history.replaceState({ view: 'dashboard' }, '', window.location.pathname);
    } catch {
      // Ignore
    }

    // 5. Initiate AI profile analysis overlay & stage progression
    setIsAnalyzingProfile(true);
    setAnalysisStep(1);

    const step1Timer = setTimeout(() => setAnalysisStep(2), 500);
    const step2Timer = setTimeout(() => setAnalysisStep(3), 1000);

    let analyzedProfile = { ...newProfile };

    try {
      // Fetch profile analysis AND real location-wise livelihood data concurrently during the synthesis animation
      const [profileAnalysisRes, locationDataRes] = await Promise.allSettled([
        fetch('/api/analyze-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: newProfile, language: currentLang })
        }).then((res) => (res.ok ? res.json() : null)),
        locationIntelligenceService.fetchLocationData(targetLoc, currentLang, newProfile)
      ]);

      if (profileAnalysisRes.status === 'fulfilled' && profileAnalysisRes.value?.analysis) {
        analyzedProfile = {
          ...analyzedProfile,
          aiAnalysis: profileAnalysisRes.value.analysis
        };
        await storageService.saveProfile(analyzedProfile);
      }

      if (locationDataRes.status === 'fulfilled' && locationDataRes.value) {
        setLocationData(locationDataRes.value);
      }
    } catch {
      // Graceful fallback
    }

    await new Promise((resolve) => setTimeout(resolve, 1600));
    clearTimeout(step1Timer);
    clearTimeout(step2Timer);

    // 6. Update application state with fully analyzed profile and dismiss loading
    setProfile(analyzedProfile);
    setIsAnalyzingProfile(false);

    // 7. Notify user
    notify(
      currentLang === 'bho'
        ? `रोडमैप तैयार भइल! ${analyzedProfile.name} खातिर ${targetLoc} के अनुसार अवसर लोड हो गइल बा।`
        : currentLang === 'en'
        ? `Personalized dashboard ready for ${analyzedProfile.name} with opportunities in ${targetLoc}!`
        : `रोडमैप तैयार हुआ! ${analyzedProfile.name} के लिए ${targetLoc} के अवसर लोड हो गए हैं।`
    );
  };

  const handleLoadDemoBeneficiary = () => {
    const demoProf = { ...DEMO };
    setProfile(demoProf);
    storageService.saveProfile(demoProf);
    notify('Loaded demo beneficiary: Sunita Devi (Maharajganj, UP).');
    navigateTo('dashboard');
  };

  const handleShortlistToggle = (id: string) => {
    setShortlist((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      storageService.saveShortlist(updated);
      notify(updated[id] ? 'Opportunity added to your shortlist.' : 'Opportunity removed from shortlist.');
      return updated;
    });
  };

  const handleProfileUpdate = async (updated: BeneficiaryProfile) => {
    setProfile(updated);
    storageService.saveProfile(updated);
    try {
      await firestoreService.syncLocalProfileToFirestore(updated);
    } catch (err) {
      console.error('Error syncing profile change to Firestore:', err);
    }

    // Refresh AI recommendation analysis in background
    try {
      fetch('/api/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: updated, language: currentLang }),
      })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.analysis) {
            const enriched = { ...updated, aiAnalysis: data.analysis };
            setProfile(enriched);
            storageService.saveProfile(enriched);
          }
        })
        .catch(() => {});
    } catch {
      // Ignore
    }
  };

  const handleLocationChange = async (newLocation: string) => {
    setActiveLocation(newLocation);
    const accuracy = locationIntelligenceService.getLocationAccuracy();
    locationIntelligenceService.setActiveLocation(newLocation);
    if (profile) {
      const updated = {
        ...profile,
        location: newLocation,
        locationAccuracy: accuracy.level,
        locationConfidence: accuracy.confidenceScore,
        locationAccuracyMeters: accuracy.accuracyMeters,
      };
      setProfile(updated);
      storageService.saveProfile(updated);
    }
    setIsRefreshingLocationData(true);
    try {
      const fresh = await locationIntelligenceService.fetchLocationData(newLocation, currentLang, profile);
      setLocationData(fresh);
      notify(
        currentLang === 'bho'
          ? `स्थान बदलल गइल: ${newLocation} (${accuracy.level})`
          : currentLang === 'en'
          ? `Location updated to: ${newLocation} (${accuracy.level})`
          : `स्थान अपडेट हुआ: ${newLocation} (${accuracy.level})`
      );
    } catch {
      // Handled in service
    } finally {
      setIsRefreshingLocationData(false);
    }
  };

  const handleRefreshLocationAi = async () => {
    setIsRefreshingLocationData(true);
    try {
      const fresh = await locationIntelligenceService.fetchLocationData(activeLocation, currentLang, profile);
      setLocationData(fresh);
      notify(
        currentLang === 'bho'
          ? 'AI से लाइव डेटा अपडेट हो गइल!'
          : currentLang === 'en'
          ? 'Live location data refreshed via Gemini AI!'
          : 'AI द्वारा लाइव लोकेशन डेटा सफलतापूर्वक लोड हुआ!'
      );
    } catch {
      notify('Curated district data is active.');
    } finally {
      setIsRefreshingLocationData(false);
    }
  };

  const handleStartVoiceAssessment = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    setAutoStartAssessment(true);
    setCurrentView('assessment');
    setShowVoiceStartModal(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    }
    storageService.clearProfile();
    setProfile(null);
    setCurrentUser(null);
    notify(
      currentLang === 'bho'
        ? 'सफलतापूर्वक लॉगआउट हो गइल।'
        : 'सफलतापूर्वक लॉगआउट हो गया (Signed out successfully).'
    );
    navigateTo('home');
  };

  const activeProfile = profile || { ...DEMO, isDemo: true };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#202B36]">
      {/* PWA Splash Screen Overlay */}
      {showSplash && (
        <div className="fixed inset-0 z-50 bg-[#17365D] text-white flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="gov-tricolor-line absolute top-0 left-0 right-0" />
          <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl mb-6 animate-pulse">
            <Logo size={48} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-2 font-['Bricolage_Grotesque']">
            JeevikaAI
          </h1>
          <p className="text-xs sm:text-sm text-white/80 text-center max-w-xs mb-8">
            Voice-First NSQF Livelihood &amp; Skill Guidance Platform
          </p>
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <div className="absolute bottom-8 text-[11px] text-white/60 font-medium">
            Loading your session...
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      {!showSplash && (
        <Navbar
          currentView={currentView}
          currentLang={currentLang}
          currentUser={currentUser}
          profileName={profile?.name}
          onLanguageChange={(l) => {
            setCurrentLang(l);
            try { localStorage.setItem('jeevika_lang', l); } catch {}
          }}
          go={navigateTo}
          onLogout={handleLogout}
          onStartVoiceAssessment={() => setShowVoiceStartModal(true)}
          onOpenAdminLogin={() => setAdminLoginModalOpen(true)}
        />
      )}

      {/* Primary Route Views */}
      <div className="flex-1 pt-16 sm:pt-20 pb-20 sm:pb-24">
        {currentView === 'home' && (
          <Home
            go={navigateTo}
            onLoadDemo={handleLoadDemoBeneficiary}
            onStartVoiceAssessment={handleStartVoiceAssessment}
            currentLang={currentLang}
          />
        )}

        {currentView === 'assessment' && (
          <Assessment
            initialProfile={profile}
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            onSubmit={handleAssessmentComplete}
            onNotify={notify}
            go={navigateTo}
            autoStart={autoStartAssessment}
            onResetAutoStart={() => setAutoStartAssessment(false)}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            profile={activeProfile}
            hasAssessment={Boolean(profile)}
            currentLang={currentLang}
            go={navigateTo}
            onNotify={notify}
            onOpenSummary={setSummaryModalData}
            onSelectDetail={setSelectedOpportunity}
            onUpdateProfile={handleProfileUpdate}
            onLocationChange={handleLocationChange}
            locationData={locationData}
            onRefreshLocationAi={handleRefreshLocationAi}
            isRefreshingLocationData={isRefreshingLocationData}
          />
        )}

        {currentView === 'opportunities' && (
          <OpportunitiesView
            shortlist={shortlist}
            onShortlistToggle={handleShortlistToggle}
            onSelectDetail={setSelectedOpportunity}
            go={navigateTo}
            currentLang={currentLang}
            locationData={locationData}
            onLocationChange={handleLocationChange}
            onRefreshAi={handleRefreshLocationAi}
            isRefreshingAi={isRefreshingLocationData}
            userProfile={activeProfile}
          />
        )}

        {currentView === 'training' && (
          <TrainingView
            shortlist={shortlist}
            onShortlistToggle={handleShortlistToggle}
            onSelectDetail={setSelectedOpportunity}
            go={navigateTo}
            currentLang={currentLang}
            locationData={locationData}
            onLocationChange={handleLocationChange}
            onRefreshAi={handleRefreshLocationAi}
            isRefreshingAi={isRefreshingLocationData}
            userProfile={activeProfile}
          />
        )}

        {currentView === 'skill-gap' && (
          <SkillGapView
            profile={activeProfile}
            go={navigateTo}
          />
        )}

        {currentView === 'saved' && (
          <SavedView
            shortlist={shortlist}
            onShortlistToggle={handleShortlistToggle}
            onSelectDetail={setSelectedOpportunity}
            go={navigateTo}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            currentProfile={activeProfile}
            go={navigateTo}
            onRestoreProfile={(p) => {
              setProfile(p);
              storageService.saveProfile(p);
              notify('Restored profile as active.');
              navigateTo('dashboard');
            }}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            profile={activeProfile}
            onUpdateProfile={handleProfileUpdate}
            onNotify={notify}
            go={navigateTo}
            onLogout={handleLogout}
            currentLang={currentLang}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationSettingsView
            onNotify={notify}
            go={navigateTo}
          />
        )}

        {currentView === 'faq' && (
          <HelpFAQView
            initialTab="faq"
            go={navigateTo}
          />
        )}

        {currentView === 'accessibility' && (
          <HelpFAQView
            initialTab="accessibility"
            go={navigateTo}
          />
        )}

        {currentView === 'privacy' && (
          <HelpFAQView
            initialTab="privacy"
            go={navigateTo}
          />
        )}

        {currentView === 'about' && (
          <HelpFAQView
            initialTab="about"
            go={navigateTo}
          />
        )}

        {currentView === 'admin' && (
          <AdminCMSView
            currentUser={currentUser}
            onNotify={notify}
            go={navigateTo}
            onOpenLogin={() => setAdminLoginModalOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* Footer - Hidden when running as an installed PWA */}
      {!isStandalone && <Footer go={navigateTo} currentLang={currentLang} />}

      {/* App-like Bottom Navigation Bar (Website & PWA) */}
      {!showSplash && profile && currentView !== 'assessment' && currentView !== 'home' && (
        <BottomNav currentView={currentView} go={navigateTo} currentLang={currentLang} shortlistCount={Object.values(shortlist).filter(Boolean).length} />
      )}

      {/* Floating AI Voice Assistant */}
      {!showSplash && (
        <FloatingVoiceAssistant
          currentView={currentView}
          currentLang={currentLang}
          profile={profile}
          go={navigateTo}
          onNotify={notify}
          onUpdateProfile={handleProfileUpdate}
          activeLocation={activeLocation}
          onLocationChange={handleLocationChange}
        />
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opp={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onShortlistToggle={handleShortlistToggle}
          isShortlisted={Boolean(shortlist[selectedOpportunity.id])}
        />
      )}

      {/* Export / Summary Modal */}
      {summaryModalData && (
        <SummaryModal
          data={summaryModalData}
          onClose={() => setSummaryModalData(null)}
          onNotify={notify}
          currentLang={currentLang}
        />
      )}


      {/* Global Voice Assessment Start Modal */}
      <VoiceStartModal
        isOpen={showVoiceStartModal}
        currentLang={currentLang}
        onClose={() => setShowVoiceStartModal(false)}
        onConfirm={handleStartVoiceAssessment}
      />

      {/* Dedicated Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminLoginModalOpen}
        onClose={() => setAdminLoginModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          navigateTo('admin');
        }}
        onNotify={notify}
      />

      {/* AI Profile Analysis & Livelihood Synthesis Overlay */}
      {isAnalyzingProfile && (
        <div className="fixed inset-0 z-50 bg-[#17365D]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-fade-in">
          <div className="max-w-md w-full bg-white text-[#202B36] rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-center space-y-5">
            {/* Pulsing AI Icon */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#17365D] to-[#245A91] text-white flex items-center justify-center shadow-lg">
              <span className="absolute -inset-2 rounded-2xl bg-cyan-400/30 animate-ping pointer-events-none" />
              <Icon name="sparkles" size={32} className="text-[#38BDF8]" />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#17365D]">
                {currentLang === 'bho'
                  ? 'AI प्रोफाइल विश्लेषण जारी बा...'
                  : currentLang === 'en'
                  ? 'AI Profile Analysis in Progress...'
                  : 'AI प्रोफाइल विश्लेषण जारी है...'}
              </h3>
              <p className="text-xs text-[#5F6B76] mt-1">
                {currentLang === 'bho'
                  ? 'रउआ हुनर, पढ़ाई अउर रुचि के आधार पर सही आजीविका रोडमैप तैयार हो रहल बा।'
                  : currentLang === 'en'
                  ? 'Synthesizing your NSQF skills and hyperlocal livelihood roadmap.'
                  : 'आपकी योग्यता, रुचि और दूरी के अनुसार आजीविका रोडमैप तैयार किया जा रहा है।'}
              </p>
            </div>

            {/* Step Indicators */}
            <div className="space-y-2 text-left text-xs bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#DCE3EA]">
              <div className="flex items-center gap-2.5">
                {analysisStep >= 1 ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
                <span className={analysisStep >= 1 ? 'font-bold text-[#17365D]' : 'text-[#5F6B76]'}>
                  {currentLang === 'bho' ? 'प्रोफ़ाइल डेटा सत्यापन' : 'Profile Data Verification'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {analysisStep >= 2 ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                ) : analysisStep === 1 ? (
                  <span className="w-5 h-5 rounded-full border-2 border-[#245A91] border-t-transparent animate-spin" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
                <span className={analysisStep >= 2 ? 'font-bold text-[#17365D]' : 'text-[#5F6B76]'}>
                  {currentLang === 'bho' ? 'NSQF स्तर अउर हुनर मैपिंग' : 'NSQF Skill & Interest Matching'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {analysisStep >= 3 ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                ) : analysisStep === 2 ? (
                  <span className="w-5 h-5 rounded-full border-2 border-[#245A91] border-t-transparent animate-spin" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
                <span className={analysisStep >= 3 ? 'font-bold text-[#17365D]' : 'text-[#5F6B76]'}>
                  {currentLang === 'bho'
                    ? `हाइपरलोकल रोजगार अउर ट्रेनिंग केंद्र (${activeLocation})`
                    : currentLang === 'en'
                    ? `Hyperlocal Jobs & Certified Centers (${activeLocation})`
                    : `हाइपरलोकल रोजगार व ट्रेनिंग केंद्र (${activeLocation})`}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[#5F6B76] font-medium flex items-center justify-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-[#245A91] border-t-transparent animate-spin" />
              <span>
                {currentLang === 'bho'
                  ? 'कृपया तनी इंतज़ार करीं, डैशबोर्ड खुल रहल बा...'
                  : currentLang === 'en'
                  ? 'Redirecting to your personalized dashboard...'
                  : 'कृपया प्रतीक्षा करें, व्यक्तिगत डैशबोर्ड खुल रहा है...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#17365D] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs sm:text-sm font-semibold max-w-[92vw] text-center"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
