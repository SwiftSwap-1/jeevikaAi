import React, { useState } from 'react';
import { Icon } from './Icons';
import { Opportunity, SupportedLanguage, LocationLivelihoodData, BeneficiaryProfile } from '../types';
import { JOBS } from '../data/mockData';
import { t } from '../services/translationService';

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

export const TrainingView: React.FC<TrainingViewProps> = ({
  onShortlistToggle,
  shortlist,
  onSelectDetail,
  go,
  currentLang,
  locationData,
  userProfile,
}) => {
  const [filterPathway, setFilterPathway] = useState<string>('all');

  // Use localized training centers if available, or fall back to JOBS training items
  const trainingItems: Opportunity[] =
    locationData && locationData.trainingCenters && locationData.trainingCenters.length > 0
      ? locationData.trainingCenters
      : JOBS.filter((j) => j.type === 'Training');

  const filtered = trainingItems.filter(
    (t) => filterPathway === 'all' || t.path === filterPathway
  );

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

        <button
          onClick={() => go('assessment')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245A91] text-white text-xs font-bold hover:bg-[#17365D] transition-colors shadow-sm"
        >
          <Icon name="mic" size={16} />
          {t('train.matchVoice', currentLang)}
        </button>
      </div>

      {/* Systematic Profile Location Synced Banner */}
      <div className="bg-gradient-to-r from-[#F0FDF4] to-[#E3F1FA] border border-[#287D73]/25 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#287D73] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Icon name="cap" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#5F6B76] uppercase tracking-wider">
                {currentLang === 'bho'
                  ? 'रउआ प्रोफ़ाइल के अनुसार सरकारी ट्रेनिंग केंद्र'
                  : currentLang === 'en'
                  ? 'Certified Centers (Profile Synced)'
                  : 'आपकी प्रोफ़ाइल के अनुसार प्रमाणित ट्रेनिंग केंद्र'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#287D73]/15 text-[#287D73] border border-[#287D73]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#287D73] animate-pulse" />
                {currentLang === 'bho' ? 'सक्रिय' : currentLang === 'en' ? 'Active & Synced' : 'सक्रिय व सिंक'}
              </span>
            </div>
            <div className="text-base font-extrabold text-[#17365D]">
              📍 {locationData?.location || userProfile?.location || 'Maharajganj, Uttar Pradesh'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {Boolean(trainingItems?.length) && (
            <span className="text-xs text-[#5F6B76] font-medium hidden md:inline">
              {trainingItems.length} मान्यता प्राप्त केंद्र उपलब्ध
            </span>
          )}
          <button
            onClick={() => go('dashboard')}
            className="px-3.5 py-2 rounded-xl border border-[#DCE3EA] bg-white text-xs font-bold text-[#17365D] hover:bg-[#F5F7FA] transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Icon name="user" size={14} />
            <span>
              {currentLang === 'bho'
                ? 'डैशबोर्ड में बदलीं'
                : currentLang === 'en'
                ? 'Manage in Dashboard'
                : 'डैशबोर्ड से बदलें'}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-6 overflow-x-auto text-xs font-bold">
        {[
          { id: 'all', label: t('train.tabAll', currentLang) },
          { id: 'digital', label: t('train.tabDigital', currentLang) },
          { id: 'tailoring', label: t('train.tabTailoring', currentLang) },
          { id: 'solar', label: t('train.tabSolar', currentLang) },
          { id: 'retail', label: t('train.tabRetail', currentLang) }
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

      {/* Training Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => {
          const isBookmarked = Boolean(shortlist[item.id]);

          return (
            <div
              key={item.id}
              className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#245A91] transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#287D73]/15 text-[#287D73] flex items-center gap-1">
                    <Icon name="check" size={12} />
                    Verified Institution
                  </span>
                  <span className="text-[11px] text-[#5F6B76] font-medium">
                    Verified: {item.lastVerifiedDate}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#17365D] leading-snug">
                    {item.title}
                  </h3>
                  <div className="text-xs text-[#5F6B76] font-semibold mt-0.5">
                    {item.org}
                  </div>
                </div>

                <div className="text-xs text-[#5F6B76] flex items-center gap-1.5">
                  <Icon name="mapPin" size={14} className="text-[#245A91]" />
                  <span>{item.loc} ({item.km} km away)</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#DCE3EA] text-xs font-bold text-[#17365D]">
                  {item.pay}
                </div>

                <p className="text-xs text-[#5F6B76] leading-relaxed">
                  <strong className="text-[#17365D]">Eligibility:</strong> {item.eligibility}
                </p>
              </div>

              <div className="pt-3 border-t border-[#DCE3EA] flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectDetail(item)}
                  className="text-xs font-extrabold text-[#245A91] hover:underline inline-flex items-center gap-1"
                >
                  <span>View Details &amp; Apply</span>
                  <Icon name="arrow" size={14} />
                </button>

                <button
                  onClick={() => onShortlistToggle(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                    isBookmarked
                      ? 'bg-[#17365D] text-white border-[#17365D]'
                      : 'bg-white text-[#5F6B76] border-[#DCE3EA] hover:border-[#245A91]'
                  }`}
                >
                  <Icon name="bookmark" size={13} />
                  <span>{isBookmarked ? 'Saved' : 'Shortlist'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};
