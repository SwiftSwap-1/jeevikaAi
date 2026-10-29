import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './Icons';
import { SchemeCard } from './SchemeCard';
import { Opportunity, SupportedLanguage, LocationLivelihoodData, BeneficiaryProfile } from '../types';
import { JOBS } from '../data/mockData';
import { t } from '../services/translationService';
import { contentService, OperationType, handleFirestoreError } from '../services/firebase';
import { speechService } from '../services/speechService';
import { POPULAR_INDIAN_REGIONS } from '../services/locationIntelligenceService';

interface OpportunitiesViewProps {
  onShortlistToggle: (id: string) => void;
  shortlist: Record<string, boolean>;
  onSelectDetail: (opp: Opportunity) => void;
  go: (route: string) => void;
  currentLang: SupportedLanguage;
  locationData?: LocationLivelihoodData | null;
  onLocationChange?: (newLoc: string) => void;
  onRefreshAi?: () => Promise<void>;
  isRefreshingAi?: boolean;
  userProfile?: BeneficiaryProfile | null;
}

interface EnrichedOpportunity extends Opportunity {
  isLiveFirestore?: boolean;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  onShortlistToggle,
  shortlist,
  onSelectDetail,
  go,
  currentLang,
  locationData,
  onLocationChange,
  onRefreshAi,
  isRefreshingAi = false,
  userProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'nearby' | 'district' | 'self'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time Firestore state
  const [firestoreOpportunities, setFirestoreOpportunities] = useState<Opportunity[]>([]);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState<boolean>(true);
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Audio narration state for low-literacy beneficiaries
  const [speakingJobId, setSpeakingJobId] = useState<string | null>(null);

  // Current active district
  const initialDistrict = useMemo(() => {
    if (locationData?.district) return locationData.district;
    if (userProfile?.location) {
      const parts = userProfile.location.split(',');
      return parts[0]?.trim() || 'Maharajganj';
    }
    return 'Maharajganj';
  }, [locationData?.district, userProfile?.location]);

  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [showDistrictModal, setShowDistrictModal] = useState<boolean>(false);

  // Synchronize district if profile or locationData changes externally
  useEffect(() => {
    if (locationData?.district && locationData.district !== selectedDistrict) {
      setSelectedDistrict(locationData.district);
    }
  }, [locationData?.district]);

  // Real-time Firestore Subscription to 'opportunities' collection
  useEffect(() => {
    let isSubscribed = true;
    setIsLoadingFirestore(true);

    const unsubscribe = contentService.subscribe<Opportunity>(
      'opportunities',
      (items) => {
        if (!isSubscribed) return;
        setFirestoreOpportunities(items || []);
        setIsLiveSyncing(true);
        setIsLoadingFirestore(false);
        setFirestoreError(null);
      },
      (err) => {
        if (!isSubscribed) return;
        setIsLoadingFirestore(false);
        // Error handling compliant with Firebase skill
        handleFirestoreError(err, OperationType.LIST, 'opportunities');
        setFirestoreError(
          currentLang === 'bho'
            ? 'फ़ायरबेस से लाइव संपर्क धीमा बा, स्थानीय सुरक्षित डेटा देखावल जात बा।'
            : currentLang === 'en'
            ? 'Live Firestore sync slow or offline; serving verified local catalog.'
            : 'फ़ायरबेस से लाइव संपर्क धीमा है, स्थानीय प्रमाणित डेटा दिखाया जा रहा है।'
        );
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [currentLang]);

  // Merge Firestore real-time data with locationData/JOBS data for seamless fallback
  const combinedOpportunities = useMemo<EnrichedOpportunity[]>(() => {
    const list: EnrichedOpportunity[] = [];
    const seenKeys = new Set<string>();

    // 1. First add real-time Firestore opportunities
    firestoreOpportunities.forEach((opp) => {
      if (opp.type === 'Training') return; // Training handled in TrainingView
      const key = `${opp.title.toLowerCase().trim()}|${opp.org.toLowerCase().trim()}`;
      seenKeys.add(key);
      seenKeys.add(opp.id);
      list.push({ ...opp, isLiveFirestore: true });
    });

    // 2. Add locationData / seeded JOBS if not already present from Firestore
    const baseSource =
      locationData && locationData.opportunities && locationData.opportunities.length > 0
        ? locationData.opportunities
        : JOBS.filter((j) => j.type !== 'Training');

    baseSource.forEach((opp) => {
      if (opp.type === 'Training') return;
      const key = `${opp.title.toLowerCase().trim()}|${opp.org.toLowerCase().trim()}`;
      if (!seenKeys.has(key) && !seenKeys.has(opp.id)) {
        seenKeys.add(key);
        seenKeys.add(opp.id);
        list.push({ ...opp, isLiveFirestore: false });
      }
    });

    return list;
  }, [firestoreOpportunities, locationData]);

  // District filter matcher
  const matchesDistrict = (opp: Opportunity, districtName: string): boolean => {
    if (!districtName || districtName === 'all' || districtName.toLowerCase() === 'all india') {
      return true;
    }
    const dLower = districtName.toLowerCase().trim();
    const locLower = (opp.loc || '').toLowerCase();
    const explicitDistrict = ((opp as any).district || '').toLowerCase();

    // Check location string or district field
    if (locLower.includes(dLower) || explicitDistrict.includes(dLower)) {
      return true;
    }
    // Statewide/National opportunities also apply
    if (locLower.includes('all india') || locLower.includes('statewide') || locLower.includes('anywhere')) {
      return true;
    }
    return false;
  };

  // Filtered list based on active tab, district, and search query
  const filtered = useMemo(() => {
    return combinedOpportunities.filter((j) => {
      if (j.type === 'Training') return false;
      if (activeTab === 'nearby' && j.km > 10) return false;
      if (activeTab === 'district' && j.km > 40) return false;
      if (activeTab === 'self' && j.type !== 'Self-employment') return false;

      // Location / District filter
      if (!matchesDistrict(j, selectedDistrict)) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          j.loc.toLowerCase().includes(q) ||
          j.org.toLowerCase().includes(q) ||
          (j.eligibility && j.eligibility.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [combinedOpportunities, activeTab, selectedDistrict, searchQuery]);

  // Audio narration handler for low-literacy users
  const handleListen = (job: Opportunity) => {
    if (speakingJobId === job.id) {
      speechService.stopSpeaking();
      setSpeakingJobId(null);
      return;
    }

    setSpeakingJobId(job.id);

    let textToSpeak = '';
    if (currentLang === 'bho') {
      textToSpeak = `काम: ${job.title}। संस्था: ${job.org}। वेतन: ${job.pay}। जगह: ${job.loc}। दूरी: ${job.km} किलोमीटर। योग्यता: ${job.eligibility}।`;
    } else if (currentLang === 'en') {
      textToSpeak = `Position: ${job.title}. Organization: ${job.org}. Estimated Pay: ${job.pay}. Location: ${job.loc}, ${job.km} kilometers away. Eligibility: ${job.eligibility}.`;
    } else {
      textToSpeak = `पद का नाम: ${job.title}। संस्थान: ${job.org}। संभावित वेतन: ${job.pay}। स्थान: ${job.loc}। दूरी: ${job.km} किलोमीटर। योग्यता: ${job.eligibility}।`;
    }

    speechService.speak(textToSpeak, currentLang, () => {
      setSpeakingJobId(null);
    });
  };

  const handleSelectDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    setShowDistrictModal(false);
    if (onLocationChange && dist !== 'all') {
      const stateMatch = POPULAR_INDIAN_REGIONS.find((r) =>
        r.districts.some((d) => d.name.toLowerCase() === dist.toLowerCase())
      );
      const stateName = stateMatch ? stateMatch.state : 'Uttar Pradesh';
      onLocationChange(`${dist}, ${stateName}`);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DCE3EA] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#245A91]/15 text-[#245A91] mb-2">
            <Icon name="briefcase" size={14} />
            <span>{t('opp.badge', currentLang)}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#17365D]">
            {t('opp.title', currentLang)}
          </h1>
        </div>
      </div>

      {/* Real-time District Intelligence & Location Banner */}
      <div className="bg-gradient-to-r from-[#F5F7FA] via-[#EBF3FA] to-[#E3F1FA] border border-[#245A91]/25 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#245A91] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Icon name="map" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#5F6B76] uppercase tracking-wider">
                  {currentLang === 'bho'
                    ? 'चयनित जिला'
                    : currentLang === 'en'
                    ? 'Selected District'
                    : 'चयनित जिला'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#17365D]/10 text-[#17365D] border border-[#17365D]/20">
                  {filtered.length} अवसर उपलब्ध
                </span>
              </div>
              <div className="text-lg font-extrabold text-[#17365D] flex items-center gap-2">
                <span>📍 {selectedDistrict === 'all' ? 'समस्त जिले (All India)' : selectedDistrict}</span>
                {locationData?.state && selectedDistrict !== 'all' && (
                  <span className="text-xs text-[#5F6B76] font-normal">({locationData.state})</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

            <button
              onClick={() => go('dashboard')}
              className="px-3.5 py-2 rounded-xl border border-[#DCE3EA] bg-white text-xs font-bold text-[#17365D] hover:bg-[#F5F7FA] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Icon name="user" size={14} />
              <span>
                {currentLang === 'bho'
                  ? 'डैशबोर्ड'
                  : currentLang === 'en'
                  ? 'Dashboard'
                  : 'डैशबोर्ड'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Fallback notification banner if Firestore is syncing or error occurred */}
      {firestoreError && (
        <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <Icon name="info" size={16} />
          <span>{firestoreError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs font-bold">
          {[
            { id: 'all', label: t('opp.tabAll', currentLang) },
            { id: 'nearby', label: t('opp.tabNearby', currentLang) },
            { id: 'district', label: t('opp.tabDistrict', currentLang) },
            { id: 'self', label: t('opp.tabSelf', currentLang) },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#17365D] text-white shadow-sm'
                  : 'bg-[#F5F7FA] text-[#5F6B76] border border-[#DCE3EA] hover:border-[#245A91]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('opp.searchPlaceholder', currentLang)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#DCE3EA] bg-white focus:outline-none focus:border-[#245A91] pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoadingFirestore && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-[#DCE3EA] rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-4 bg-slate-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* Opportunity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((job) => {
          const isSaved = Boolean(shortlist[job.id]);
          const isAudioPlaying = speakingJobId === job.id;

          return (
            <div
              key={job.id}
              className="bg-white border border-[#DCE3EA] rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-[#245A91]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#17365D]/10 text-[#17365D]">
                      <Icon name="briefcase" size={12} />
                      <span>{job.type}</span>
                    </span>

                    {/* Live Badge */}
                    {job.isLiveFirestore && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                        <span>नवीनतम अवसर</span>
                      </span>
                    )}

                    {job.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Icon name="check" size={12} />
                        <span>सत्यापित</span>
                      </span>
                    )}
                  </div>

                  {/* Audio Listen Button for Low-Literacy Beneficiaries */}
                  <button
                    onClick={() => handleListen(job)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                      isAudioPlaying
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-[#F5F7FA] text-[#17365D] hover:bg-[#EBF3FA] border border-[#DCE3EA]'
                    }`}
                    title="बोलकर सुनें (Listen to job details in audio)"
                    aria-label="Listen details"
                  >
                    <Icon name="volume" size={14} />
                    <span>{isAudioPlaying ? 'बोल रहा है...' : 'सुनें 🔊'}</span>
                  </button>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#287D73] mb-1">
                    📍 {job.loc} {job.km ? `· ${job.km} km away` : ''}
                  </div>
                  <h3 className="text-lg font-bold text-[#17365D] leading-snug">
                    {job.title}
                  </h3>
                  <div className="text-xs font-bold text-[#5F6B76] mt-0.5">
                    {job.org}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#DCE3EA] flex items-center justify-between text-xs">
                  <span className="text-[#5F6B76] font-semibold">
                    {currentLang === 'bho' ? 'वेतन / कमाई' : currentLang === 'en' ? 'Estimated Pay' : 'संभावित वेतन / आय'}
                  </span>
                  <span className="font-extrabold text-[#17365D]">{job.pay}</span>
                </div>

                <p className="text-xs text-[#5F6B76] leading-relaxed line-clamp-2">
                  <strong className="text-[#17365D]">
                    {currentLang === 'bho' ? 'पात्रता:' : currentLang === 'en' ? 'Eligibility:' : 'योग्यता:'}
                  </strong>{' '}
                  {job.eligibility}
                </p>
              </div>

              <div className="pt-3 border-t border-[#DCE3EA] flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectDetail(job)}
                  className="text-xs font-extrabold text-[#245A91] hover:underline inline-flex items-center gap-1 min-h-[44px] items-center"
                >
                  <span>
                    {currentLang === 'bho'
                      ? 'योग्यता व आवेदन देखीं'
                      : currentLang === 'en'
                      ? 'View Eligibility & Apply'
                      : 'योग्यता देखें व आवेदन करें'}
                  </span>
                  <Icon name="arrow" size={14} />
                </button>

                <button
                  onClick={() => onShortlistToggle(job.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 min-h-[44px] ${
                    isSaved
                      ? 'bg-[#17365D] text-white border-[#17365D]'
                      : 'bg-white text-[#5F6B76] border-[#DCE3EA] hover:border-[#245A91]'
                  }`}
                >
                  <Icon name="bookmark" size={13} />
                  <span>
                    {isSaved
                      ? currentLang === 'bho' ? 'सुरक्षित' : currentLang === 'en' ? 'Saved' : 'सहेजा गया'
                      : currentLang === 'bho' ? 'सहेजीं' : currentLang === 'en' ? 'Shortlist' : 'सहेजें'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}

        {!isLoadingFirestore && filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-[#F5F7FA] rounded-2xl border border-[#DCE3EA] p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 text-[#5F6B76] mx-auto flex items-center justify-center">
              <Icon name="briefcase" size={24} />
            </div>
            <h3 className="text-base font-bold text-[#17365D]">
              {selectedDistrict === 'all'
                ? 'कोई अवसर नहीं मिला'
                : `${selectedDistrict} जिले में अभी कोई नया अवसर नहीं है`}
            </h3>
            <p className="text-xs text-[#5F6B76] max-w-md mx-auto">
              {currentLang === 'bho'
                ? 'फ़िल्टर बदल के देखीं या नज़दीकी ज़िला के अवसर देखीं।'
                : 'फ़िल्टर बदलकर देखें या "समस्त जिले" का चयन करें ताकि आसपास के अवसर दिख सकें।'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => handleSelectDistrictChange('all')}
                className="px-4 py-2 rounded-xl bg-[#245A91] text-white text-xs font-bold hover:bg-[#17365D]"
              >
                समस्त जिले के अवसर देखें
              </button>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-white border border-[#DCE3EA] text-xs font-bold text-[#17365D]"
              >
                फ़िल्टर रीसेट करें
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Government Schemes for this district */}
      {locationData?.schemes && locationData.schemes.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[#DCE3EA] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#245A91] mb-1">
                सरकारी योजनाएं व अनुदान · Government Support
              </div>
              <h2 className="text-2xl font-extrabold text-[#17365D]">
                {selectedDistrict !== 'all' ? selectedDistrict : 'जिले'} के लिए सक्रिय सरकारी योजनाएं
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locationData.schemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} lang={currentLang} />
            ))}
          </div>
        </section>
      )}

      {/* District Selection Modal */}
      {showDistrictModal && (
        <div className="fixed inset-0 z-50 bg-[#17365D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE3EA] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#DCE3EA] pb-3">
              <div className="flex items-center gap-2">
                <Icon name="mapPin" size={20} className="text-[#245A91]" />
                <h3 className="text-lg font-bold text-[#17365D]">
                  {currentLang === 'bho' ? 'जिला के चयन करीं' : 'जिला का चयन करें'}
                </h3>
              </div>
              <button
                onClick={() => setShowDistrictModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5F6B76]">
              {currentLang === 'bho'
                ? 'चयनित जिला के अनुसार सभी उपलब्ध अवसर देखावल जाई।'
                : 'चयनित जिले के अनुसार सभी उपलब्ध अवसर दिखाए जाएंगे।'}
            </p>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <button
                onClick={() => handleSelectDistrictChange('all')}
                className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                  selectedDistrict === 'all'
                    ? 'bg-[#17365D] text-white border-[#17365D]'
                    : 'bg-[#F5F7FA] text-[#17365D] border-[#DCE3EA] hover:border-[#245A91]'
                }`}
              >
                <span>🌍 समस्त जिले (All India Opportunities)</span>
                {selectedDistrict === 'all' && <span>✓</span>}
              </button>

              {POPULAR_INDIAN_REGIONS.map((stateGroup) => (
                <div key={stateGroup.state} className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-[#245A91] uppercase tracking-wider">
                    {stateGroup.state} ({stateGroup.stateHi})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {stateGroup.districts.map((d) => {
                      const isSelected = selectedDistrict.toLowerCase() === d.name.toLowerCase();
                      return (
                        <button
                          key={d.name}
                          onClick={() => handleSelectDistrictChange(d.name)}
                          className={`p-2 rounded-xl border text-xs text-left transition-all ${
                            isSelected
                              ? 'bg-[#245A91] text-white font-bold border-[#245A91]'
                              : 'bg-white text-[#202B36] border-[#DCE3EA] hover:border-[#245A91]'
                          }`}
                        >
                          <div className="font-bold leading-tight">{d.name}</div>
                          <div className="text-[10px] opacity-80">{d.hi}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#DCE3EA] flex justify-end">
              <button
                onClick={() => setShowDistrictModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
