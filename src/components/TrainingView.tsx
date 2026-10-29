import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './Icons';
import { Opportunity, SupportedLanguage, LocationLivelihoodData, BeneficiaryProfile } from '../types';
import { JOBS } from '../data/mockData';
import { t } from '../services/translationService';
import { contentService, OperationType, handleFirestoreError } from '../services/firebase';
import { speechService } from '../services/speechService';
import { POPULAR_INDIAN_REGIONS, locationIntelligenceService } from '../services/locationIntelligenceService';

interface TrainingViewProps {
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

interface EnrichedTrainingItem extends Opportunity {
  isLiveFirestore?: boolean;
  fromLocationData?: boolean;
}

export const TrainingView: React.FC<TrainingViewProps> = ({
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
  const [filterPathway, setFilterPathway] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time Firestore state
  const [firestoreTrainingCenters, setFirestoreTrainingCenters] = useState<Opportunity[]>([]);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState<boolean>(true);
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Audio narration state for low-literacy beneficiaries
  const [speakingItemId, setSpeakingItemId] = useState<string | null>(null);

  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  // District state (handles "Locality, District, State" or "District, State")
  const initialDistrict = useMemo(() => {
    if (locationData?.district) return locationData.district;
    if (userProfile?.location) {
      const parts = userProfile.location.split(',').map((p) => p.trim()).filter(Boolean);
      const dist = parts.length >= 3 ? parts[parts.length - 2] : parts[0];
      return dist || 'Maharajganj';
    }
    return 'Maharajganj';
  }, [locationData?.district, userProfile?.location]);

  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [showDistrictModal, setShowDistrictModal] = useState<boolean>(false);

  // Sync when locationData changes
  useEffect(() => {
    if (locationData?.district && locationData.district !== selectedDistrict) {
      setSelectedDistrict(locationData.district);
    } else if (!locationData?.district && initialDistrict && initialDistrict !== selectedDistrict) {
      setSelectedDistrict(initialDistrict);
    }
  }, [locationData?.district, initialDistrict]);

  const handleAutoDetectCurrentLocation = async () => {
    if (isDetectingGps) return;
    setIsDetectingGps(true);
    try {
      const detected = await locationIntelligenceService.detectGpsLocation();
      if (detected && detected.location) {
        setSelectedDistrict(detected.district || detected.location.split(',')[0].trim());
        if (onLocationChange) {
          onLocationChange(detected.location);
        }
      }
    } catch {
      // Ignore if permission denied
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Real-time subscription to 'training_centers' collection in Firestore
  useEffect(() => {
    let isSubscribed = true;
    setIsLoadingFirestore(true);

    let oppTraining: Opportunity[] = [];
    const unsubOpp = contentService.subscribe<Opportunity>(
      'opportunities',
      (items) => {
        if (!isSubscribed) return;
        oppTraining = (items || []).filter((item) => item.type === 'Training');
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'opportunities');
      }
    );

    const unsubCenters = contentService.subscribe<Opportunity>(
      'training_centers',
      (items) => {
        if (!isSubscribed) return;
        const combined = [...(items || []), ...oppTraining];
        const uniqueMap = new Map<string, Opportunity>();
        combined.forEach((c) => uniqueMap.set(c.id, c));
        setFirestoreTrainingCenters(Array.from(uniqueMap.values()));
        setIsLiveSyncing(true);
        setIsLoadingFirestore(false);
        setFirestoreError(null);
      },
      (err) => {
        if (!isSubscribed) return;
        setIsLoadingFirestore(false);
        handleFirestoreError(err, OperationType.LIST, 'training_centers');
        setFirestoreError(
          currentLang === 'bho'
            ? 'प्रशिक्षण केंद्र के लाइव डेटा सिंक धीमा बा, स्थानीय केंद्र देखावल जात बा।'
            : currentLang === 'en'
            ? 'Live Firestore training centers slow or offline; showing verified catalog.'
            : 'प्रशिक्षण केंद्रों का लाइव डेटा सिंक धीमा है, स्थानीय प्रमाणित केंद्र दिखाए जा रहे हैं।'
        );
      }
    );

    return () => {
      isSubscribed = false;
      unsubOpp();
      unsubCenters();
    };
  }, [currentLang]);

  // Merge Firestore training items with locationData / mock fallback
  const combinedTrainingItems = useMemo<EnrichedTrainingItem[]>(() => {
    const list: EnrichedTrainingItem[] = [];
    const seenKeys = new Set<string>();

    // 1. First add locationData training centers (already tailored to active location)
    if (locationData?.trainingCenters && locationData.trainingCenters.length > 0) {
      locationData.trainingCenters.forEach((item) => {
        const key = `${item.title.toLowerCase().trim()}|${item.org.toLowerCase().trim()}`;
        if (!seenKeys.has(key) && !seenKeys.has(item.id)) {
          seenKeys.add(key);
          seenKeys.add(item.id);
          list.push({
            ...item,
            km: typeof item.km === 'number' ? item.km : 6,
            isLiveFirestore: false,
            fromLocationData: true,
          });
        }
      });
    }

    // 2. Add real-time Firestore training items
    firestoreTrainingCenters.forEach((item) => {
      const key = `${item.title.toLowerCase().trim()}|${item.org.toLowerCase().trim()}`;
      if (!seenKeys.has(key) && !seenKeys.has(item.id)) {
        seenKeys.add(key);
        seenKeys.add(item.id);
        list.push({ ...item, isLiveFirestore: true, fromLocationData: false });
      }
    });

    // 3. Add seeded training centers
    JOBS.filter((j) => j.type === 'Training').forEach((item) => {
      const key = `${item.title.toLowerCase().trim()}|${item.org.toLowerCase().trim()}`;
      if (!seenKeys.has(key) && !seenKeys.has(item.id)) {
        seenKeys.add(key);
        seenKeys.add(item.id);
        list.push({ ...item, isLiveFirestore: false, fromLocationData: false });
      }
    });

    return list;
  }, [firestoreTrainingCenters, locationData]);

  // District matcher
  const matchesDistrict = (item: EnrichedTrainingItem, districtName: string): boolean => {
    if (!districtName || districtName === 'all' || districtName.toLowerCase() === 'all india') {
      return true;
    }
    if (
      item.fromLocationData &&
      (!locationData?.district ||
        locationData.district.toLowerCase().trim() === districtName.toLowerCase().trim() ||
        (locationData.location || '').toLowerCase().includes(districtName.toLowerCase().trim()))
    ) {
      return true;
    }
    const dLower = districtName.toLowerCase().trim();
    const locLower = (item.loc || '').toLowerCase();
    const titleLower = (item.title || '').toLowerCase();
    const orgLower = (item.org || '').toLowerCase();
    const explicitDistrict = ((item as any).district || '').toLowerCase();

    if (
      locLower.includes(dLower) ||
      titleLower.includes(dLower) ||
      orgLower.includes(dLower) ||
      explicitDistrict.includes(dLower)
    ) {
      return true;
    }
    if (locLower.includes('all india') || locLower.includes('statewide') || locLower.includes('anywhere')) {
      return true;
    }
    return false;
  };

  // Filtered training cards (with non-blank guarantee)
  const filtered = useMemo(() => {
    const applyPathwayAndSearch = (item: EnrichedTrainingItem, enforceDistrict: boolean) => {
      if (filterPathway !== 'all' && item.path !== filterPathway) {
        return false;
      }

      if (enforceDistrict && !matchesDistrict(item, selectedDistrict)) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.org.toLowerCase().includes(q) ||
          item.loc.toLowerCase().includes(q) ||
          (item.eligibility && item.eligibility.toLowerCase().includes(q))
        );
      }

      return true;
    };

    const strictMatches = combinedTrainingItems.filter((item) => applyPathwayAndSearch(item, true));
    if (strictMatches.length > 0 || searchQuery.trim()) {
      return strictMatches;
    }
    const locationDataMatches = combinedTrainingItems.filter(
      (item) => item.fromLocationData && applyPathwayAndSearch(item, false)
    );
    if (locationDataMatches.length > 0) {
      return locationDataMatches;
    }
    return combinedTrainingItems.filter((item) => applyPathwayAndSearch(item, false));
  }, [combinedTrainingItems, filterPathway, selectedDistrict, searchQuery, locationData]);

  // Audio narration handler for low-literacy users
  const handleListen = (item: Opportunity) => {
    if (speakingItemId === item.id) {
      speechService.stopSpeaking();
      setSpeakingItemId(null);
      return;
    }

    setSpeakingItemId(item.id);

    let textToSpeak = '';
    if (currentLang === 'bho') {
      textToSpeak = `प्रशिक्षण केंद्र: ${item.title}। संस्था: ${item.org}। कोर्स व सहायता: ${item.pay}। जगह: ${item.loc}। दूरी: ${item.km} किलोमीटर। पात्रता: ${item.eligibility}।`;
    } else if (currentLang === 'en') {
      textToSpeak = `Training Center: ${item.title}. Institute: ${item.org}. Program Support: ${item.pay}. Location: ${item.loc}, ${item.km} km away. Eligibility: ${item.eligibility}.`;
    } else {
      textToSpeak = `प्रशिक्षण केंद्र: ${item.title}। संस्थान: ${item.org}। कोर्स व भत्ता: ${item.pay}। स्थान: ${item.loc}। दूरी: ${item.km} किलोमीटर। पात्रता: ${item.eligibility}।`;
    }

    speechService.speak(textToSpeak, currentLang, () => {
      setSpeakingItemId(null);
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DCE3EA] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#287D73]/15 text-[#287D73] mb-2">
            <Icon name="cap" size={14} />
            <span>{t('train.badge', currentLang)}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#17365D]">
            {t('train.title', currentLang)}
          </h1>
        </div>
      </div>

      {/* Systematic Profile Location Synced Banner */}
      <div className="bg-gradient-to-r from-[#F0FDF4] via-[#E8F8F5] to-[#E3F1FA] border border-[#287D73]/25 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#287D73] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Icon name="cap" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#5F6B76] uppercase tracking-wider">
                  {currentLang === 'bho'
                    ? 'जिला अनुसार मान्यता प्राप्त केंद्र'
                    : currentLang === 'en'
                    ? 'Certified District Centers'
                    : 'जिला अनुसार मान्यता प्राप्त केंद्र'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#287D73]/15 text-[#287D73] border border-[#287D73]/30">
                  {filtered.length} केंद्र सक्रिय
                </span>
              </div>
              <div className="text-lg font-extrabold text-[#17365D] flex items-center gap-2">
                <Icon name="pin" size={18} className="text-[#287D73]" />
                <span>{selectedDistrict === 'all' ? 'समस्त जिले (All India)' : selectedDistrict}</span>
                {locationData?.state && selectedDistrict !== 'all' && (
                  <span className="text-xs text-[#5F6B76] font-normal">({locationData.state})</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleAutoDetectCurrentLocation}
              disabled={isDetectingGps}
              className="px-3.5 py-2 rounded-xl bg-[#287D73] hover:bg-[#17365D] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
              title="अपनी वर्तमान जीपीएस लोकेशन से प्रशिक्षण केंद्र सिंक करें"
            >
              <Icon name="mapPin" size={14} />
              <span>
                {isDetectingGps
                  ? 'लोकेशन खोजी जा रही है...'
                  : currentLang === 'en'
                  ? 'Sync Current GPS'
                  : 'वर्तमान लोकेशन सिंक करें'}
              </span>
            </button>

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

      {/* Fallback notification banner if Firestore is offline */}
      {firestoreError && (
        <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <Icon name="info" size={16} />
          <span>{firestoreError}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-2 pb-1 overflow-x-auto text-xs font-bold w-full sm:w-auto">
          {[
            { id: 'all', label: t('train.tabAll', currentLang) },
            { id: 'digital', label: t('train.tabDigital', currentLang) },
            { id: 'tailoring', label: t('train.tabTailoring', currentLang) },
            { id: 'solar', label: t('train.tabSolar', currentLang) },
            { id: 'retail', label: t('train.tabRetail', currentLang) },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterPathway(f.id)}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                filterPathway === f.id
                  ? 'bg-[#17365D] text-white shadow-sm'
                  : 'bg-[#F5F7FA] text-[#5F6B76] border border-[#DCE3EA] hover:border-[#245A91]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="केंद्र या कोर्स खोजें (Search center)..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#DCE3EA] bg-white focus:outline-none focus:border-[#287D73] pr-8"
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
            </div>
          ))}
        </div>
      )}

      {/* Training Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => {
          const isBookmarked = Boolean(shortlist[item.id]);
          const isAudioPlaying = speakingItemId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#287D73] transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#287D73]/15 text-[#287D73] flex items-center gap-1">
                      <Icon name="check" size={12} />
                      प्रमाणित केंद्र
                    </span>

                    {/* Live Firestore badge */}
                    {item.isLiveFirestore && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                        <span>नवीनतम केंद्र</span>
                      </span>
                    )}

                    {item.lastVerifiedDate && (
                      <span className="text-[11px] text-[#5F6B76] font-medium hidden sm:inline">
                        Verified: {item.lastVerifiedDate}
                      </span>
                    )}
                  </div>

                  {/* Audio Listen Button for Low-Literacy Beneficiaries */}
                  <button
                    onClick={() => handleListen(item)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                      isAudioPlaying
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-[#F5F7FA] text-[#17365D] hover:bg-[#EBF3FA] border border-[#DCE3EA]'
                    }`}
                    title="बोलकर सुनें (Listen to training center details in audio)"
                    aria-label="Listen center details"
                  >
                    <Icon name="volume2" size={14} />
                    <span>{isAudioPlaying ? 'बोल रहा है...' : 'सुनें'}</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#17365D] leading-snug">
                    {item.title}
                  </h3>
                  <div className="text-xs text-[#5F6B76] font-semibold mt-0.5">
                    {item.org}
                  </div>
                </div>

                <div className="text-xs font-bold text-[#287D73] flex items-center gap-1.5 flex-wrap">
                  <Icon name="mapPin" size={14} className="text-[#245A91]" />
                  <span>{item.loc}</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#287D73]/10 text-[#287D73] text-[11px] font-extrabold">
                    आपके स्थान से {typeof item.km === 'number' && item.km > 0 ? item.km : 6} km दूर
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#DCE3EA] text-xs font-bold text-[#17365D] flex items-center justify-between">
                  <span>{currentLang === 'bho' ? 'सुविधा / छात्रवृत्ति' : 'कोर्स शुल्क व सुविधा'}</span>
                  <span className="text-emerald-700 font-extrabold">{item.pay}</span>
                </div>

                <p className="text-xs text-[#5F6B76] leading-relaxed">
                  <strong className="text-[#17365D]">
                    {currentLang === 'bho' ? 'पात्रता:' : 'योग्यता / पात्रता:'}
                  </strong>{' '}
                  {item.eligibility}
                </p>
              </div>

              <div className="pt-3 border-t border-[#DCE3EA] flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => onSelectDetail(item)}
                  className="px-3.5 py-2 rounded-xl bg-[#287D73] text-white hover:bg-[#17365D] text-xs font-extrabold inline-flex items-center gap-1.5 min-h-[40px] transition-colors shadow-2xs"
                >
                  <Icon name="mapPin" size={13} />
                  <span>
                    {currentLang === 'bho'
                      ? 'मैप व नामांकन देखीं'
                      : currentLang === 'en'
                      ? 'View Map & Apply'
                      : 'मैप, रास्ता व नामांकन देखें'}
                  </span>
                </button>

                <button
                  onClick={() => onShortlistToggle(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 min-h-[40px] ${
                    isBookmarked
                      ? 'bg-[#17365D] text-white border-[#17365D]'
                      : 'bg-white text-[#5F6B76] border-[#DCE3EA] hover:border-[#245A91]'
                  }`}
                >
                  <Icon name="bookmark" size={13} />
                  <span>
                    {isBookmarked
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
              <Icon name="cap" size={24} />
            </div>
            <h3 className="text-base font-bold text-[#17365D]">
              {selectedDistrict === 'all'
                ? 'कोई प्रशिक्षण केंद्र नहीं मिला'
                : `${selectedDistrict} जिले में इस श्रेणी का कोई केंद्र नहीं मिला`}
            </h3>
            <p className="text-xs text-[#5F6B76] max-w-md mx-auto">
              {currentLang === 'bho'
                ? 'फ़िल्टर बदल के देखीं या नज़दीकी ज़िला के केंद्र देखीं।'
                : 'फ़िल्टर बदलकर देखें या "समस्त जिले" का चयन करें ताकि आसपास के सरकारी प्रशिक्षण केंद्र दिख सकें।'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => handleSelectDistrictChange('all')}
                className="px-4 py-2 rounded-xl bg-[#287D73] text-white text-xs font-bold hover:bg-[#17365D]"
              >
                समस्त जिले के केंद्र देखें
              </button>
              <button
                onClick={() => {
                  setFilterPathway('all');
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

      {/* District Selection Modal */}
      {showDistrictModal && (
        <div className="fixed inset-0 z-50 bg-[#17365D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE3EA] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#DCE3EA] pb-3">
              <div className="flex items-center gap-2">
                <Icon name="mapPin" size={20} className="text-[#287D73]" />
                <h3 className="text-lg font-bold text-[#17365D]">
                  {currentLang === 'bho' ? 'प्रशिक्षण केंद्र खातिर जिला चुनीं' : 'प्रशिक्षण केंद्र हेतु जिला चुनें'}
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
                ? 'चयनित जिला के अनुसार सभी मान्यता प्राप्त केंद्र देखावल जाई।'
                : 'चयनित जिले के अनुसार सभी मान्यता प्राप्त केंद्र दिखाए जाएंगे।'}
            </p>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <button
                onClick={() => handleSelectDistrictChange('all')}
                className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                  selectedDistrict === 'all'
                    ? 'bg-[#17365D] text-white border-[#17365D]'
                    : 'bg-[#F5F7FA] text-[#17365D] border-[#DCE3EA] hover:border-[#287D73]'
                }`}
              >
                <span>🌍 समस्त जिले (All India Training Centers)</span>
                {selectedDistrict === 'all' && <span>✓</span>}
              </button>

              {POPULAR_INDIAN_REGIONS.map((stateGroup) => (
                <div key={stateGroup.state} className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-[#287D73] uppercase tracking-wider">
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
                              ? 'bg-[#287D73] text-white font-bold border-[#287D73]'
                              : 'bg-white text-[#202B36] border-[#DCE3EA] hover:border-[#287D73]'
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
