import React, { useState, useMemo } from 'react';
import { Icon } from './Icons';
import {
  BeneficiaryProfile,
  SupportedLanguage,
  Opportunity,
  AppView,
  SummaryModalData,
  LocationLivelihoodData,
} from '../types';
import { AppUser } from '../services/firebase';
import { rankPaths, rankJobs, buildSummary, slug } from '../services/recommendationEngine';
import { EDU, WORK, MOB } from '../data/mockData';
import { speechService } from '../services/speechService';
import { storageService } from '../services/storageService';
import { locationIntelligenceService, POPULAR_INDIAN_REGIONS } from '../services/locationIntelligenceService';
import {
  dt,
  optionLabel,
  pathwayName,
  pathwayRole,
  stageText,
  STAGE_TITLES_L10N,
  localizeDuration,
  fitText,
  factorLabel,
  factorNote,
  opportunityTypeLabel,
  distanceLabel,
  schemeName,
  FALLBACK_SCHEMES,
  isEnglishLike,
} from '../services/dashboardLocale';

interface DashboardProps {
  profile: BeneficiaryProfile;
  hasAssessment: boolean;
  currentLang: SupportedLanguage;
  go: (view: AppView, sectionId?: string) => void;
  onNotify: (msg: string) => void;
  onOpenSummary: (summaryData: SummaryModalData) => void;
  onSelectDetail: (opp: Opportunity) => void;
  onUpdateProfile?: (updated: BeneficiaryProfile) => void;
  onLocationChange?: (newLoc: string) => void;
  locationData?: LocationLivelihoodData | null;
  onRefreshLocationAi?: () => void;
  isRefreshingLocationData?: boolean;
  shortlist?: Record<string, boolean>;
  onShortlistToggle?: (id: string) => void;
  currentUser?: AppUser | null;
  onOpenAccount?: (mode: 'create' | 'login') => void;
}

const Ring: React.FC<{ value: number; size?: number; label: string }> = ({ value, size = 64, label }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${label}: ${value}/100`} className="flex-none">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-[#DCE3EA]" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 32 32)"
        className="stroke-[#287D73]"
      />
      <text x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="800" className="fill-[#17365D]">
        {value}
      </text>
    </svg>
  );
};

const SectionHead: React.FC<{ tag?: string; title: string; right?: React.ReactNode; icon?: string }> = ({ tag, title, right, icon }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
    <div className="flex items-start gap-3 min-w-0">
      {icon && (
        <span className="mt-0.5 w-10 h-10 rounded-xl bg-[#17365D] text-white flex items-center justify-center flex-none">
          <Icon name={icon} size={20} />
        </span>
      )}
      <div className="min-w-0">
        {tag && <div className="text-[11px] uppercase font-extrabold tracking-widest text-[#245A91]">{tag}</div>}
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#17365D] leading-tight">{title}</h2>
      </div>
    </div>
    {right}
  </div>
);

const Panel: React.FC<{ id?: string; children: React.ReactNode; className?: string }> = ({ id, children, className = '' }) => (
  <section id={id} className={`bg-white border border-[#DCE3EA] rounded-2xl shadow-xs p-4 sm:p-6 scroll-mt-28 ${className}`}>
    {children}
  </section>
);

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  hasAssessment,
  currentLang,
  go,
  onNotify,
  onOpenSummary,
  onSelectDetail,
  onUpdateProfile,
  onLocationChange,
  locationData,
  onRefreshLocationAi,
  isRefreshingLocationData = false,
  shortlist: shortlistProp,
  onShortlistToggle,
  currentUser,
  onOpenAccount,
}) => {
  const L = currentLang;
  const rankedPaths = useMemo(() => rankPaths(profile), [profile]);
  const topPaths = rankedPaths.slice(0, 3);
  const jobs = useMemo(
    () => rankJobs(profile, rankedPaths, locationData?.opportunities),
    [profile, rankedPaths, locationData?.opportunities]
  );

  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});
  const [selectedPathId, setSelectedPathId] = useState<string>(topPaths[0]?.id || rankedPaths[0]?.id);
  const [doneStages, setDoneStages] = useState<Record<string, boolean>>(() => storageService.loadProgress());
  const [jobFilter, setJobFilter] = useState<'All' | 'Job' | 'Self-employment'>('All');
  const [localShortlist, setLocalShortlist] = useState<Record<string, boolean>>(() => storageService.loadShortlist());
  const shortlist = shortlistProp ?? localShortlist;
  const [isReadingRoadmap, setIsReadingRoadmap] = useState(false);
  const [readingJobId, setReadingJobId] = useState<string | null>(null);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showDistrictSelector, setShowDistrictSelector] = useState(false);
  const [selectedStateIndex, setSelectedStateIndex] = useState(0);
  const [celebratedStageKey, setCelebratedStageKey] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const displayName = profile.name && profile.name.trim() ? profile.name.trim() : dt('beneficiary', L);
  const displayInitial = displayName.charAt(0).toUpperCase();
  const locationLabel = profile.location || locationData?.district || '';
  const districtShort = (locationData?.district || locationLabel.split(',')[0] || '').trim();

  const currentAccuracy = useMemo(() => {
    if (profile.locationAccuracy && profile.locationConfidence) {
      return {
        level: profile.locationAccuracy,
        confidenceScore: profile.locationConfidence,
        accuracyMeters: profile.locationAccuracyMeters,
        locality: undefined as string | undefined,
      };
    }
    if (locationData?.accuracyLevel && locationData?.confidenceScore) {
      return {
        level: locationData.accuracyLevel,
        confidenceScore: locationData.confidenceScore,
        accuracyMeters: locationData.accuracyMeters,
        locality: undefined as string | undefined,
      };
    }
    const a = locationIntelligenceService.getLocationAccuracy();
    return { level: a.level, confidenceScore: a.confidenceScore, accuracyMeters: a.accuracyMeters, locality: a.locality };
  }, [profile.locationAccuracy, profile.locationConfidence, profile.locationAccuracyMeters, locationData]);

  const handleDetectLocation = async () => {
    if (isDetectingLocation) return;
    setIsDetectingLocation(true);
    onNotify(dt('detecting', L));
    try {
      const res = await locationIntelligenceService.detectGpsLocation();
      if (res && res.location) {
        onUpdateProfile?.({
          ...profile,
          location: res.location,
          locationAccuracy: res.accuracyLevel,
          locationConfidence: res.confidenceScore,
          locationAccuracyMeters: res.accuracyMeters,
        });
        onLocationChange?.(res.location);
        onNotify(`📍 ${res.location} (${res.confidenceScore}%)`);
      }
    } catch (err: any) {
      const isDenied = err?.code === 1 || err?.message?.toLowerCase?.().includes('denied');
      onNotify(
        isDenied
          ? (L === 'en' || L === 'hin'
              ? 'Location permission was denied. Please choose your district below.'
              : 'स्थान की अनुमति नहीं मिली। कृपया नीचे से अपना जिला चुनें।')
          : (L === 'en' || L === 'hin'
              ? 'Could not detect your location. Please choose your district below.'
              : 'स्थान का पता नहीं चल सका। कृपया नीचे से अपना जिला चुनें।')
      );
      setShowDistrictSelector(true);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSelectDistrict = (districtName: string, stateName: string) => {
    const accuracyInfo = locationIntelligenceService.setManualDistrict(districtName, stateName);
    const newLoc = `${districtName}, ${stateName}`;
    onUpdateProfile?.({
      ...profile,
      location: newLoc,
      locationAccuracy: accuracyInfo.level,
      locationConfidence: accuracyInfo.confidenceScore,
      locationAccuracyMeters: undefined,
    });
    onLocationChange?.(newLoc);
    setShowDistrictSelector(false);
    onNotify(`📍 ${newLoc}`);
  };

  const selectedPathway = rankedPaths.find((p) => p.id === selectedPathId) || topPaths[0] || rankedPaths[0];
  const completedCount = [0, 1, 2].filter((i) => doneStages[selectedPathway.id + i]).length;
  const filteredJobs = jobs.filter((j) => jobFilter === 'All' || j.type === jobFilter);
  const nearbyCount = jobs.filter((j) => j.inRange).length;
  const schemes = locationData?.schemes?.length ? locationData.schemes : FALLBACK_SCHEMES;
  const schemesAreFallback = !locationData?.schemes?.length;
  const centers = locationData?.trainingCenters || [];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleWhy = (id: string) => setExpandedWhy((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleStageDone = (key: string) => {
    const willBeDone = !doneStages[key];
    const updated = { ...doneStages, [key]: willBeDone };
    setDoneStages(updated);
    storageService.saveProgress(updated);
    if (willBeDone) {
      speechService.playAudioCue('success');
      setCelebratedStageKey(key);
      onNotify('🎉 ' + dt('stageDone', L));
      setTimeout(() => setCelebratedStageKey(null), 2200);
    }
  };

  const toggleShortlist = (id: string) => {
    if (onShortlistToggle) {
      onShortlistToggle(id);
      return;
    }
    const updated = { ...localShortlist, [id]: !localShortlist[id] };
    setLocalShortlist(updated);
    storageService.saveShortlist(updated);
    onNotify(updated[id] ? dt('savedToast', L) : dt('removedToast', L));
  };

  const stopAllSpeech = () => {
    speechService.stopSpeaking();
    setIsReadingRoadmap(false);
    setReadingJobId(null);
  };

  const handleReadAloudRoadmap = () => {
    if (isReadingRoadmap) {
      stopAllSpeech();
      return;
    }
    stopAllSpeech();
    const loc = locationLabel || (L === 'bho' ? 'रउआ इलाका' : 'आपके क्षेत्र');
    const name = pathwayName(selectedPathway, L);
    const st = [0, 1, 2].map((i) => stageText(selectedPathway, i, L));
    const dur = localizeDuration(selectedPathway.duration, L);
    const ai = profile.aiAnalysis?.summary ? profile.aiAnalysis.summary + (L === 'en' || L === 'hin' ? '. ' : '। ') : '';
    const top = filteredJobs[0];
    let text = '';
    if (L === 'bho') {
      text = `प्रणाम ${displayName}! रउआ पढ़ाई, हुनर अउर ${loc} के हिसाब से रोडमैप तइयार बा। ${ai}` +
        `रउआ खातिर सबसे बढ़िया कौशल बा ${name}। मेल ${selectedPathway.score} प्रतिशत बा अउर ई ${dur} के बा। ` +
        `पहिला चरण: ${st[0].title}। दूसर चरण: ${st[1].title}। तीसर चरण: ${st[2].title}। ` +
        (top ? `रउआ लगे ${filteredJobs.length} मौका बा, जइसे ${top.title}। ` : '') +
        'हर चरण पूरा होखे पर पूरा भइल दबाईं।';
    } else if (L === 'en') {
      text = `Hello ${displayName}! Your roadmap for ${loc} is ready. ${ai}` +
        `Your best skill match is ${name} with a fit score of ${selectedPathway.score} percent. It takes ${dur}. ` +
        `Stage 1: ${st[0].title}. Stage 2: ${st[1].title}. Stage 3: ${st[2].title}. ` +
        (top ? `There are ${filteredJobs.length} openings for you, including ${top.title}. ` : '') +
        'Tap mark done as you finish each stage.';
    } else if (L === 'hin') {
      text = `Namaste ${displayName}! ${loc} ke liye aapka roadmap taiyaar hai. ${ai}` +
        `Aapke liye sabse accha skill hai ${name}, match ${selectedPathway.score} percent. Training ${dur} ki hai. ` +
        `Stage 1: ${st[0].title}. Stage 2: ${st[1].title}. Stage 3: ${st[2].title}. ` +
        (top ? `Aapke liye ${filteredJobs.length} openings hain, jaise ${top.title}. ` : '') +
        'Har stage ke baad mark done dabayein.';
    } else {
      text = `नमस्ते ${displayName}! ${loc} के अनुसार आपका रोडमैप तैयार है। ${ai}` +
        `आपके लिए सबसे अच्छा कौशल है ${name}। मेल ${selectedPathway.score} प्रतिशत है और प्रशिक्षण ${dur} का है। ` +
        `पहला चरण: ${st[0].title}। दूसरा चरण: ${st[1].title}। तीसरा चरण: ${st[2].title}। ` +
        (top ? `आपके लिए ${filteredJobs.length} अवसर हैं, जैसे ${top.title}। ` : '') +
        'हर चरण पूरा होने पर पूरा हुआ दबाएँ।';
    }
    setIsReadingRoadmap(true);
    speechService.speak(text, L, () => setIsReadingRoadmap(false));
  };

  const handleReadJob = (job: Opportunity) => {
    if (readingJobId === job.id) {
      stopAllSpeech();
      return;
    }
    stopAllSpeech();
    const t = opportunityTypeLabel(job.type, L);
    const dist = distanceLabel(job.km, L);
    let text = '';
    if (isEnglishLike(L)) {
      text = `${job.title}. ${job.org}. ${t}. ${job.loc}, ${dist}. Pay: ${job.pay}.`;
    } else {
      text = `${job.title}। ${job.org}। ${t}। ${job.loc}, ${dist}। कमाई: ${job.pay}।`;
    }
    setReadingJobId(job.id);
    speechService.speak(text, L, () => setReadingJobId(null));
  };

  const handleDownload = () => {
    const text = buildSummary(profile, rankedPaths, jobs, selectedPathId, shortlist);
    onOpenSummary({
      text,
      fname: `JeevikaAI-Roadmap-${slug(displayName)}.txt`,
      profile,
      selectedPathway,
      jobs: filteredJobs,
    });
  };

  const navItems = [
    { id: 'overview-section', icon: 'compass', label: dt('navOverview', L) },
    { id: 'hub-section', icon: 'pin', label: dt('navHub', L) },
    { id: 'schemes-section', icon: 'shieldCheck', label: dt('navSchemes', L) },
    { id: 'pathways-section', icon: 'layers', label: dt('navPathways', L) },
    { id: 'roadmap-section', icon: 'route', label: dt('navRoadmap', L) },
    { id: 'opportunities-section', icon: 'briefcase', label: dt('navOpenings', L) },
    { id: 'centers-section', icon: 'cap', label: dt('navCenters', L) },
  ];

  const coverageText =
    currentAccuracy.level === 'Precise'
      ? dt('covPrecise', L, { m: currentAccuracy.accuracyMeters ? ` (±${currentAccuracy.accuracyMeters}m)` : '' })
      : currentAccuracy.level === 'District-level'
      ? dt('covDistrict', L, { loc: locationLabel || districtShort || '—' })
      : dt('covState', L);

  const eduText = optionLabel(EDU, profile.education, L) || dt('notShared', L);
  const workText = optionLabel(WORK, profile.workType, L) || dt('notShared', L);
  const mobText = optionLabel(MOB, profile.mobility, L) || dt('notShared', L);

  const kpiLabelClass = 'text-[11px] font-bold uppercase tracking-wider';

  return (
    <main className="bg-[#F5F7FA] min-h-screen">
      {/* Breadcrumb strip, like a government portal */}
      <div className="bg-white border-b border-[#DCE3EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5F6B76]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-medium">
            <button onClick={() => go('home')} className="hover:text-[#17365D] hover:underline">{dt('crumbHome', L)}</button>
            <span aria-hidden>›</span>
            <span className="text-[#17365D] font-bold">{dt('crumbDash', L)}</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#17365D]">
            <Icon name="shieldCheck" size={14} className="text-[#287D73]" />
            {dt('portalLabel', L)}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:grid lg:grid-cols-[230px_1fr] lg:gap-8">
        {/* Section navigation: sidebar on laptops, scrollable chips on phone and tablet */}
        <aside className="lg:sticky lg:top-24 lg:self-start mb-5 lg:mb-0">
          <nav
            aria-label={dt('menu', L)}
            className="hidden lg:block bg-white border border-[#DCE3EA] rounded-2xl p-2 shadow-xs"
          >
            <div className="px-3 pt-2 pb-1 text-[11px] font-extrabold uppercase tracking-widest text-[#5F6B76]">{dt('menu', L)}</div>
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollToSection(n.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#17365D] hover:bg-[#F5F7FA] text-left"
              >
                <Icon name={n.icon} size={18} className="text-[#245A91]" />
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <nav aria-label={dt('menu', L)} className="lg:hidden -mx-4 px-4 overflow-x-auto">
            <div className="flex gap-2 pb-1 w-max">
              {navItems.map((n) => (
                <button
                  key={n.id}
                  onClick={() => scrollToSection(n.id)}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full bg-white border border-[#DCE3EA] text-xs font-bold text-[#17365D] whitespace-nowrap"
                >
                  <Icon name={n.icon} size={14} className="text-[#245A91]" />
                  {n.label}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <div className="space-y-5 sm:space-y-6 min-w-0">
          {/* Welcome banner */}
          <section id="overview-section" className="scroll-mt-28 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-[#17365D] via-[#1E4373] to-[#245A91] text-white">
            <div className="gov-tricolor-line" />
            <div className="p-5 sm:p-7 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-extrabold text-2xl flex-none">
                    {displayInitial}
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-bold bg-white/15 border border-white/20">
                      <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                      {dt('planTag', L)}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight !text-white break-words">
                      {dt('hello', L)}, {displayName}!
                    </h1>
                    <p className="text-sm text-white/90 max-w-xl leading-relaxed">{dt('planSub', L)}</p>
                    {!hasAssessment && (
                      <p className="mt-2 text-xs sm:text-sm font-semibold bg-[#D9822B] text-white rounded-xl px-3 py-2 max-w-xl">
                        {dt('demoNote', L)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 lg:w-56 flex-none">
                  <button
                    onClick={handleReadAloudRoadmap}
                    aria-pressed={isReadingRoadmap}
                    className={`col-span-2 lg:col-span-1 min-h-12 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md ${
                      isReadingRoadmap ? 'bg-[#38BDF8] text-[#17365D]' : 'bg-white text-[#17365D] hover:bg-slate-100'
                    }`}
                  >
                    <Icon name={isReadingRoadmap ? 'volumeX' : 'volume2'} size={20} />
                    {isReadingRoadmap ? dt('stopListen', L) : dt('listenRoadmap', L)}
                  </button>
                  <button
                    onClick={() => go('profile')}
                    className="min-h-11 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/25 flex items-center justify-center gap-1.5"
                  >
                    <Icon name="edit" size={14} />
                    {dt('editProfile', L)}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="min-h-11 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/25 flex items-center justify-center gap-1.5"
                  >
                    <Icon name="download" size={14} />
                    {dt('exportBtn', L)}
                  </button>
                </div>
              </div>

              {profile.aiAnalysis?.summary && (
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-sm flex items-start gap-2.5">
                  <Icon name="sparkles" size={18} className="text-[#38BDF8] flex-none mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-extrabold text-[#7DD3FC] mr-1">{dt('aiSummary', L)}:</span>
                    <span>{profile.aiAnalysis.summary}</span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {profile.aiAnalysis.topCareerPathway && (
                        <span className="px-2 py-0.5 rounded-md bg-white/20 font-bold text-xs inline-flex items-center gap-1">
                          <Icon name="target" size={12} className="text-[#38BDF8]" />
                          <span>{dt('aiField', L)}: {profile.aiAnalysis.topCareerPathway}</span>
                        </span>
                      )}
                      {profile.aiAnalysis.readinessScore ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-100 font-bold text-xs inline-flex items-center gap-1">
                          <Icon name="zap" size={12} className="text-emerald-300" />
                          <span>{dt('aiReady', L)}: {profile.aiAnalysis.readinessScore}%</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 font-semibold">
                    <Icon name="cap" size={14} className="text-[#38BDF8]" />
                    {dt('chipEdu', L)}: {eduText}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 font-semibold">
                    <Icon name="pin" size={14} className="text-[#38BDF8]" />
                    {dt('chipLoc', L)}: {locationLabel || '—'}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 font-semibold">
                    <Icon name="store" size={14} className="text-[#38BDF8]" />
                    {dt('chipWork', L)}: {workText}
                  </span>
                </div>
                <button
                  onClick={() => setShowProfileDetails(!showProfileDetails)}
                  aria-expanded={showProfileDetails}
                  className="min-h-9 inline-flex items-center gap-1.5 text-xs font-bold text-white/95 hover:text-white underline underline-offset-4"
                >
                  {showProfileDetails ? dt('hideDetails', L) : dt('showDetails', L)}
                  <Icon name="chev" size={14} className={showProfileDetails ? 'rotate-180' : ''} />
                </button>
              </div>

              {showProfileDetails && (
                <div className="p-4 rounded-xl bg-white/10 border border-white/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  {[
                    [dt('dSkills', L), profile.skills],
                    [dt('dInterests', L), profile.interests],
                    [dt('dOccupation', L), profile.occupation],
                    [dt('dMobility', L), mobText],
                  ].map(([k, v]) => (
                    <div key={k as string} className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">{k}</div>
                      <div className="font-semibold mt-0.5 break-words">{v || dt('notShared', L)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Assisted account: JeevikaAI creates the account for people who cannot do it themselves */}
          {hasAssessment && onOpenAccount && (!currentUser || currentUser.isAnonymous) && !bannerDismissed && (
            <section
              id="account-banner"
              className="relative rounded-2xl border-2 border-[#287D73]/40 bg-[#287D73]/5 p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              <button
                onClick={() => setBannerDismissed(true)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#5F6B76] hover:text-[#17365D] flex items-center justify-center text-xs font-bold shadow-xs transition-colors"
                title="हटाएँ (Dismiss)"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
              <span className="w-12 h-12 rounded-xl bg-[#287D73] text-white flex items-center justify-center flex-none">
                <Icon name="user" size={24} />
              </span>
              <div className="flex-1 min-w-0 pr-6 md:pr-0">
                <h2 className="text-base sm:text-lg font-extrabold text-[#17365D]">{dt('accTitle', L)}</h2>
                <p className="text-sm text-[#5F6B76] mt-0.5">{dt('accBody', L)}</p>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:w-60 flex-none">
                <button
                  onClick={() => onOpenAccount('create')}
                  className="min-h-12 px-4 rounded-xl bg-[#287D73] hover:bg-[#1E6058] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Icon name="mic" size={18} />
                  {dt('accCreate', L)}
                </button>
                <button
                  onClick={() => onOpenAccount('login')}
                  className="min-h-11 px-4 rounded-xl border border-[#C5D1DD] bg-white text-[#17365D] text-sm font-bold"
                >
                  {dt('accLogin', L)}
                </button>
              </div>
            </section>
          )}

          {/* KPI row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <div className="col-span-2 xl:col-span-1 p-4 rounded-2xl bg-white border border-[#DCE3EA] shadow-xs flex items-center gap-3">
              <Ring value={topPaths[0]?.score || 0} size={56} label={dt('kpiTop', L)} />
              <div className="min-w-0">
                <div className={`${kpiLabelClass} text-[#287D73]`}>{dt('kpiTop', L)}</div>
                <div className="text-base font-extrabold text-[#17365D] leading-tight">{topPaths[0] && pathwayName(topPaths[0], L)}</div>
                <div className="text-xs text-[#5F6B76]">
                  {dt('nsqfLevel', L)} {topPaths[0]?.nsqf} · {topPaths[0] && localizeDuration(topPaths[0].duration, L).split('(')[0].split('(')[0].trim()}
                </div>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#DCE3EA] shadow-xs">
              <div className={`${kpiLabelClass} text-[#287D73]`}>{dt('kpiProgress', L)}</div>
              <div className="text-base font-extrabold text-[#17365D] mt-1">{dt('stagesOf', L, { n: completedCount })}</div>
              <div className="w-full bg-[#F5F7FA] h-2 rounded-full overflow-hidden mt-2 border border-[#DCE3EA]">
                <div className="bg-[#287D73] h-full rounded-full transition-all" style={{ width: `${(completedCount / 3) * 100}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#DCE3EA] shadow-xs">
              <div className={`${kpiLabelClass} text-[#245A91]`}>{dt('kpiOpenings', L)}</div>
              <div className="text-2xl font-extrabold text-[#17365D] mt-0.5">{jobs.length}</div>
              <div className="text-xs text-[#5F6B76]">{dt('nearbyOf', L, { a: nearbyCount, b: jobs.length })}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#DCE3EA] shadow-xs">
              <div className={`${kpiLabelClass} text-[#D9822B]`}>{dt('kpiSchemes', L)}</div>
              <div className="text-2xl font-extrabold text-[#17365D] mt-0.5">{schemes.length}</div>
              <div className="text-xs text-[#5F6B76]">{districtShort ? `${dt('inDistrict', L)}: ${districtShort}` : dt('inDistrict', L)}</div>
            </div>
          </div>

          {/* District hub */}
          <Panel id="hub-section">
            <SectionHead
              icon="pin"
              tag={dt('hubTitle', L)}
              title={locationLabel || '—'}
              right={
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                      locationData?.isAiGenerated
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <Icon name={locationData?.isAiGenerated ? 'sparkles' : 'check'} size={12} />
                    {locationData?.isAiGenerated ? dt('liveAi', L) : dt('curated', L)}
                  </span>
                  {locationData?.timestamp && (
                    <span className="text-[11px] text-[#5F6B76] font-medium">
                      {dt('updated', L)}: {new Date(locationData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              }
            />

            <div className="flex flex-wrap gap-2">
              <button
                id="detect-my-location-card-btn"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="min-h-12 px-4 rounded-xl bg-[#287D73] hover:bg-[#1E6058] text-white text-sm font-extrabold flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-75"
              >
                <Icon name={isDetectingLocation ? 'refresh' : 'target'} size={18} className={isDetectingLocation ? 'animate-spin' : ''} />
                {isDetectingLocation ? dt('detecting', L) : dt('detectGps', L)}
              </button>
              <button
                onClick={() => setShowDistrictSelector(!showDistrictSelector)}
                aria-expanded={showDistrictSelector}
                className="min-h-12 px-4 rounded-xl bg-white border border-[#C5D1DD] text-[#17365D] hover:bg-[#F5F7FA] text-sm font-bold flex items-center gap-2"
              >
                <Icon name="chev" size={16} className={showDistrictSelector ? 'rotate-180' : ''} />
                {showDistrictSelector ? dt('closeBtn', L) : dt('changeDistrict', L)}
              </button>
              {onRefreshLocationAi && (
                <button
                  onClick={onRefreshLocationAi}
                  disabled={isRefreshingLocationData}
                  className="min-h-12 px-4 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-bold flex items-center gap-2 disabled:opacity-70"
                >
                  <Icon name="sparkles" size={16} className={isRefreshingLocationData ? 'animate-spin' : ''} />
                  {isRefreshingLocationData ? dt('refreshing', L) : dt('refreshAi', L)}
                </button>
              )}
            </div>

            {showDistrictSelector && (
              <div className="mt-4 p-4 rounded-xl bg-[#F5F7FA] border border-[#DCE3EA] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#245A91]">{dt('selectDistrict', L)}</span>
                  <span className="text-xs text-[#5F6B76]">{dt('gpsHint', L)}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {POPULAR_INDIAN_REGIONS.map((region, idx) => (
                    <button
                      key={region.state}
                      onClick={() => setSelectedStateIndex(idx)}
                      className={`min-h-10 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${
                        selectedStateIndex === idx ? 'bg-[#17365D] text-white' : 'bg-white border border-[#DCE3EA] text-[#5F6B76] hover:bg-[#E9ECEF]'
                      }`}
                    >
                      {isEnglishLike(L) ? region.state : region.stateHi}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                  {POPULAR_INDIAN_REGIONS[selectedStateIndex]?.districts.map((dist) => {
                    const isCurrent = locationLabel.toLowerCase().includes(dist.name.toLowerCase());
                    return (
                      <button
                        key={dist.name}
                        onClick={() => handleSelectDistrict(dist.name, POPULAR_INDIAN_REGIONS[selectedStateIndex].state)}
                        className={`min-h-12 p-2.5 rounded-lg text-left border text-sm font-bold ${
                          isCurrent
                            ? 'border-[#287D73] bg-[#287D73]/10 text-[#287D73]'
                            : 'border-[#DCE3EA] bg-white hover:border-[#245A91] text-[#17365D]'
                        }`}
                      >
                        <div>{isEnglishLike(L) ? dist.name : dist.hi}</div>
                        <div className="text-[11px] text-[#5F6B76] font-medium">{isEnglishLike(L) ? dist.hi : dist.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 p-3.5 rounded-xl bg-[#F5F7FA] border border-[#DCE3EA] flex flex-wrap items-start justify-between gap-3 text-sm">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="p-1.5 rounded-lg bg-[#287D73]/15 text-[#287D73] flex-none">
                  <Icon name="target" size={16} />
                </span>
                <div className="min-w-0">
                  <span className="font-bold text-[#17365D]">{dt('coverage', L)}: </span>
                  <span className="text-[#5F6B76]">{coverageText}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[#17365D] text-white flex-none">
                {dt('confidence', L, { n: currentAccuracy.confidenceScore })}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-[#DCE3EA]">
                <div className={`${kpiLabelClass} text-[#287D73]`}>{dt('topSectors', L)}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(locationData?.insight?.topSectors?.length ? locationData.insight.topSectors : []).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200">
                      {s}
                    </span>
                  ))}
                  {!locationData?.insight?.topSectors?.length && <span className="text-xs text-[#5F6B76]">{dt('notAvailable', L)}</span>}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[#DCE3EA]">
                <div className={`${kpiLabelClass} text-[#245A91]`}>{dt('avgWage', L)}</div>
                <div className="text-lg font-extrabold text-[#17365D] mt-1">
                  {locationData?.insight?.averageMonthlyWage || dt('notAvailable', L)}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[#DCE3EA]">
                <div className={`${kpiLabelClass} text-[#17365D]`}>{dt('openVac', L)}</div>
                <div className="text-lg font-extrabold text-[#17365D] mt-1">
                  {locationData?.insight?.openVacanciesCount ?? jobs.length}
                </div>
              </div>
            </div>
          </Panel>

          {/* Schemes */}
          <Panel id="schemes-section">
            <SectionHead icon="shieldCheck" tag={districtShort} title={dt('schemesTitle', L)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {schemes.slice(0, 3).map((s) => (
                <article key={s.id} className="p-4 rounded-xl border border-[#DCE3EA] bg-[#FBFCFD] flex flex-col gap-2.5">
                  <h3 className="text-base font-extrabold text-[#17365D] leading-snug">{schemeName(s, L)}</h3>
                  <div className="text-sm">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#287D73]">{dt('benefit', L)}</div>
                    <p className="text-[#202B36]">{s.financialSupport || s.benefit}</p>
                  </div>
                  <div className="text-sm">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#245A91]">{dt('eligible', L)}</div>
                    <p className="text-[#5F6B76]">{s.eligibility}</p>
                  </div>
                  <div className="text-sm mt-auto pt-2 border-t border-[#DCE3EA]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#D9822B]">{dt('applyAt', L)}</div>
                    <p className="font-semibold text-[#17365D]">{s.applyOffice}</p>
                  </div>
                </article>
              ))}
            </div>
            {schemesAreFallback && <p className="mt-3 text-xs text-[#5F6B76]">{dt('schemeFallbackNote', L)}</p>}
          </Panel>

          {/* Pathways */}
          <section id="pathways-section" className="scroll-mt-28 space-y-3">
            <SectionHead
              tag={dt('pathTag', L)}
              title={dt('pathTitle', L)}
              right={
                <button
                  onClick={() => go('assessment')}
                  className="min-h-11 px-4 rounded-xl bg-[#245A91] text-white text-sm font-bold hover:bg-[#17365D] shadow-xs flex items-center justify-center gap-2"
                >
                  <Icon name="mic" size={16} />
                  {dt('retake', L)}
                </button>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPaths.map((p, index) => (
                <article key={p.id} className="bg-white border border-[#DCE3EA] rounded-2xl p-5 shadow-xs flex flex-col gap-4 hover:border-[#245A91] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-none ${
                        index === 0 ? 'bg-[#287D73]/15 text-[#287D73]' : index === 1 ? 'bg-[#245A91]/15 text-[#245A91]' : 'bg-[#17365D]/10 text-[#17365D]'
                      }`}
                    >
                      <Icon name={p.icon} size={24} />
                    </div>
                    <Ring value={p.score} label={dt('kpiTop', L)} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#287D73]">
                      {dt('rec', L)} #{index + 1}
                    </div>
                    <h3 className="text-lg font-extrabold text-[#17365D] leading-tight mt-0.5">{pathwayName(p, L)}</h3>
                    <div className="text-xs text-[#5F6B76] mt-0.5">{pathwayRole(p, L)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F5F7FA] text-[#5F6B76] border border-[#DCE3EA] flex items-center gap-1 font-medium">
                      <Icon name="clock" size={12} /> {localizeDuration(p.duration, L)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E3F1FA] text-[#245A91] flex items-center gap-1 font-semibold">
                      <Icon name="layers" size={12} /> {dt('nsqfLevel', L)} {p.nsqf}
                    </span>
                  </div>
                  <p className="text-sm text-[#202B36] leading-relaxed">{fitText(p, L)}</p>

                  <div className="space-y-2 mt-auto pt-3 border-t border-[#DCE3EA]">
                    <button
                      onClick={() => toggleWhy(p.id)}
                      aria-expanded={Boolean(expandedWhy[p.id])}
                      className="w-full min-h-11 px-3 rounded-xl border border-[#DCE3EA] text-sm font-bold text-[#17365D] hover:bg-[#F5F7FA] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Icon name="bulb" size={16} />
                        {dt('whyBtn', L)}
                      </span>
                      <Icon name="chev" size={14} className={expandedWhy[p.id] ? 'rotate-180' : ''} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPathId(p.id);
                        scrollToSection('roadmap-section');
                      }}
                      className="w-full min-h-11 px-3 rounded-xl bg-[#245A91] text-white text-sm font-bold hover:bg-[#17365D] flex items-center justify-center gap-2"
                    >
                      <Icon name="route" size={16} />
                      {dt('viewRoad', L)}
                    </button>
                    {expandedWhy[p.id] && (
                      <div className="mt-2 p-3 rounded-xl bg-[#F5F7FA] border border-dashed border-[#C5D1DD] space-y-2">
                        <div className="text-xs font-bold text-[#17365D]">{dt('breakdown', L)}: {p.score}/100</div>
                        {p.factors.map((f) => (
                          <div key={f.k} className="text-xs">
                            <div className="flex justify-between font-semibold">
                              <span>{factorLabel(f.k, f.label, L)}</span>
                              <span className={`tabular-nums ${f.pts < 0 ? 'text-[#9E2A2B]' : 'text-[#287D73]'}`}>{f.pts > 0 ? '+' : ''}{f.pts}</span>
                            </div>
                            <p className="text-[#5F6B76]">{factorNote(f.k, f.pts, f.note, L)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Roadmap */}
          <Panel id="roadmap-section">
            <SectionHead icon="route" tag={dt('roadTag', L)} title={dt('roadTitle', L)} />
            <p className="text-sm text-[#5F6B76] -mt-2 mb-4">{dt('roadSub', L)}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {topPaths.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPathId(p.id)}
                  aria-pressed={selectedPathId === p.id}
                  className={`min-h-11 px-4 rounded-xl text-sm font-bold ${
                    selectedPathId === p.id ? 'bg-[#17365D] text-white' : 'bg-[#F5F7FA] text-[#5F6B76] border border-[#DCE3EA] hover:bg-slate-200'
                  }`}
                >
                  {pathwayName(p, L)}
                </button>
              ))}
            </div>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((idx) => {
                const stageKey = selectedPathway.id + idx;
                const isDone = Boolean(doneStages[stageKey]);
                const st = stageText(selectedPathway, idx, L);
                return (
                  <li
                    key={stageKey}
                    className={`p-4 rounded-xl border flex flex-col gap-3 relative overflow-hidden ${
                      isDone ? 'border-[#287D73] bg-[#287D73]/5' : 'border-[#DCE3EA] bg-[#F5F7FA]'
                    }`}
                  >
                    {celebratedStageKey === stageKey && (
                      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center bg-[#287D73]/15">
                        <div className="bg-white text-[#287D73] px-3 py-2 rounded-xl shadow-xl border border-[#287D73]/30 font-extrabold text-xs flex items-center gap-1.5 animate-bounce">
                          <Icon name="sparkles" size={16} className="text-[#D9822B]" />
                          {dt('stageDone', L)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#287D73]">
                        {dt('stage', L)} {idx + 1} · {STAGE_TITLES_L10N[L][idx]}
                      </div>
                      <h4 className="text-base font-extrabold text-[#17365D] leading-snug mt-1">{st.title}</h4>
                      <p className="text-sm text-[#5F6B76] leading-relaxed mt-1">{st.desc}</p>
                    </div>
                    <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-[#DCE3EA]">
                      <span className="text-xs font-bold text-[#17365D]">{st.when}</span>
                      <button
                        onClick={() => toggleStageDone(stageKey)}
                        aria-pressed={isDone}
                        className={`min-h-11 inline-flex items-center gap-1.5 px-3.5 rounded-lg text-sm font-bold ${
                          isDone ? 'bg-[#287D73] text-white' : 'bg-white border border-[#C5D1DD] text-[#17365D] hover:border-[#287D73]'
                        }`}
                      >
                        <Icon name="check" size={16} />
                        {isDone ? dt('completed', L) : dt('markDone', L)}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="flex items-center gap-3 pt-4 text-sm font-bold text-[#5F6B76]">
              <span className="whitespace-nowrap">{dt('stagesDoneLine', L, { c: completedCount, n: 3 })}</span>
              <div className="flex-1 bg-[#F5F7FA] border border-[#DCE3EA] h-2 rounded-full overflow-hidden">
                <div className="bg-[#287D73] h-full rounded-full transition-all" style={{ width: `${(completedCount / 3) * 100}%` }} />
              </div>
            </div>
          </Panel>

          {/* Openings */}
          <Panel id="opportunities-section">
            <SectionHead
              icon="briefcase"
              tag={dt('openTag', L, { loc: districtShort || '—' })}
              title={dt('openTitle', L)}
              right={
                <div role="tablist" className="flex items-center gap-1 bg-[#F5F7FA] p-1 rounded-xl border border-[#DCE3EA] text-sm font-bold self-start">
                  {(['All', 'Job', 'Self-employment'] as const).map((f) => (
                    <button
                      key={f}
                      role="tab"
                      aria-selected={jobFilter === f}
                      onClick={() => setJobFilter(f)}
                      className={`min-h-10 px-3 rounded-lg ${jobFilter === f ? 'bg-white text-[#17365D] shadow-xs' : 'text-[#5F6B76] hover:text-[#202B36]'}`}
                    >
                      {f === 'All' ? dt('filterAll', L) : f === 'Job' ? dt('filterJob', L) : dt('filterSelf', L)}
                    </button>
                  ))}
                </div>
              }
            />

            {filteredJobs.length === 0 ? (
              <p className="text-sm text-[#5F6B76] py-6 text-center">{dt('noJobs', L)}</p>
            ) : (
              <>
                {/* Table for tablets and laptops */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-[#DCE3EA]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#17365D] text-white text-left">
                      <tr>
                        <th className="px-4 py-3 font-bold">{dt('colRole', L)}</th>
                        <th className="px-4 py-3 font-bold">{dt('colType', L)}</th>
                        <th className="px-4 py-3 font-bold">{dt('colPlace', L)}</th>
                        <th className="px-4 py-3 font-bold">{dt('colPay', L)}</th>
                        <th className="px-4 py-3 font-bold text-right">{dt('colAction', L)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE3EA]">
                      {filteredJobs.map((job, i) => {
                        const saved = Boolean(shortlist[job.id]);
                        return (
                          <tr key={job.id} className={`${i % 2 ? 'bg-[#FBFCFD]' : 'bg-white'} ${job.inRange ? '' : 'opacity-75'}`}>
                            <td className="px-4 py-3 align-top max-w-[260px]">
                              <div className="font-extrabold text-[#17365D] leading-snug">{job.title}</div>
                              <div className="text-xs text-[#5F6B76]">{job.org}</div>
                              {job.verified && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-[#287D73]">
                                  <Icon name="check" size={11} /> {dt('verified', L)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${job.type === 'Job' ? 'bg-[#E3F1FA] text-[#245A91]' : 'bg-[#287D73]/15 text-[#287D73]'}`}>
                                {opportunityTypeLabel(job.type, L)}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="font-semibold text-[#17365D]">{job.loc}</div>
                              <div className="text-xs text-[#5F6B76]">{distanceLabel(job.km, L)}</div>
                              {!job.inRange && <div className="text-[11px] text-[#9E2A2B] font-semibold">{dt('outRange', L)}</div>}
                            </td>
                            <td className="px-4 py-3 align-top font-bold text-[#287D73]">{job.pay}</td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleReadJob(job)}
                                  aria-label={`${dt('listen', L)}: ${job.title}`}
                                  className={`w-10 h-10 rounded-lg border flex items-center justify-center ${readingJobId === job.id ? 'bg-[#38BDF8] border-[#38BDF8] text-[#17365D]' : 'border-[#C5D1DD] text-[#245A91] hover:bg-[#F5F7FA]'}`}
                                >
                                  <Icon name={readingJobId === job.id ? 'volumeX' : 'volume2'} size={16} />
                                </button>
                                <button
                                  onClick={() => onSelectDetail(job)}
                                  className="min-h-10 px-3 rounded-lg border border-[#C5D1DD] text-xs font-bold text-[#245A91] hover:bg-[#F5F7FA]"
                                >
                                  {dt('details', L)}
                                </button>
                                <button
                                  onClick={() => toggleShortlist(job.id)}
                                  aria-pressed={saved}
                                  className={`min-h-10 px-3 rounded-lg text-xs font-bold flex items-center gap-1 ${saved ? 'bg-[#FFF4DB] text-[#B8691A] border border-[#EBCB7A]' : 'bg-white border border-[#C5D1DD] text-[#5F6B76] hover:border-[#245A91]'}`}
                                >
                                  <Icon name="star" size={13} className={saved ? 'fill-[#D9822B]' : ''} />
                                  {saved ? dt('savedBtn', L) : dt('saveBtn', L)}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cards for phones */}
                <div className="md:hidden grid grid-cols-1 gap-3">
                  {filteredJobs.map((job) => {
                    const saved = Boolean(shortlist[job.id]);
                    return (
                      <article key={job.id} className={`border rounded-xl p-4 space-y-3 ${job.inRange ? 'border-[#DCE3EA]' : 'border-dashed border-[#C5D1DD] opacity-80'}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${job.type === 'Job' ? 'bg-[#E3F1FA] text-[#245A91]' : 'bg-[#287D73]/15 text-[#287D73]'}`}>
                            {opportunityTypeLabel(job.type, L)}
                          </span>
                          {job.verified && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#287D73]">
                              <Icon name="check" size={11} /> {dt('verified', L)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-[#17365D] leading-snug">{job.title}</h4>
                          <div className="text-xs text-[#5F6B76]">{job.org}</div>
                        </div>
                        <div className="p-3 bg-[#F5F7FA] rounded-lg text-sm space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-[#17365D]">
                            <Icon name="pin" size={14} />
                            <span>{job.loc} · {distanceLabel(job.km, L)}</span>
                          </div>
                          {!job.inRange && <div className="text-xs text-[#9E2A2B] font-semibold">{dt('outRange', L)}</div>}
                          <div className="font-extrabold text-[#287D73]">{job.pay}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleReadJob(job)}
                            aria-label={`${dt('listen', L)}: ${job.title}`}
                            className={`min-h-11 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${readingJobId === job.id ? 'bg-[#38BDF8] border-[#38BDF8] text-[#17365D]' : 'border-[#C5D1DD] text-[#245A91]'}`}
                          >
                            <Icon name={readingJobId === job.id ? 'volumeX' : 'volume2'} size={16} />
                            {readingJobId === job.id ? dt('stopListen', L) : dt('listen', L)}
                          </button>
                          <button
                            onClick={() => onSelectDetail(job)}
                            className="min-h-11 rounded-lg border border-[#C5D1DD] text-xs font-bold text-[#245A91]"
                          >
                            {dt('details', L)}
                          </button>
                          <button
                            onClick={() => toggleShortlist(job.id)}
                            aria-pressed={saved}
                            className={`min-h-11 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${saved ? 'bg-[#FFF4DB] text-[#B8691A] border border-[#EBCB7A]' : 'bg-white border border-[#C5D1DD] text-[#5F6B76]'}`}
                          >
                            <Icon name="star" size={14} className={saved ? 'fill-[#D9822B]' : ''} />
                            {saved ? dt('savedBtn', L) : dt('saveBtn', L)}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
            <p className="mt-4 text-xs text-[#5F6B76]">{dt('sourceNote', L)}</p>
          </Panel>

          {/* Training centers */}
          <Panel id="centers-section">
            <SectionHead
              icon="cap"
              tag={districtShort}
              title={dt('centersTitle', L)}
              right={
                <button
                  onClick={() => go('training')}
                  className="min-h-11 px-4 rounded-xl bg-white border border-[#C5D1DD] text-[#17365D] hover:bg-[#F5F7FA] text-sm font-bold flex items-center justify-center gap-2 self-start"
                >
                  {dt('seeAll', L)}
                  <Icon name="arrowR" size={14} />
                </button>
              }
            />
            {centers.length === 0 ? (
              <p className="text-sm text-[#5F6B76]">{dt('noCenters', L)}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {centers.slice(0, 3).map((c) => (
                  <article key={c.id} className="p-4 rounded-xl border border-[#DCE3EA] flex flex-col gap-2">
                    <h3 className="text-base font-extrabold text-[#17365D] leading-snug">{c.title}</h3>
                    <div className="text-xs text-[#5F6B76]">{c.org}</div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[#17365D]">
                      <Icon name="pin" size={14} />
                      {c.loc} · {distanceLabel(c.km, L)}
                    </div>
                    <div className="text-sm font-bold text-[#287D73]">{c.pay}</div>
                    <button
                      onClick={() => onSelectDetail(c)}
                      className="mt-auto min-h-11 rounded-lg border border-[#C5D1DD] text-sm font-bold text-[#245A91] hover:bg-[#F5F7FA]"
                    >
                      {dt('details', L)}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </main>
  );
};
