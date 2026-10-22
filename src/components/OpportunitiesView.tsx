import React, { useState } from 'react';
import { Icon } from './Icons';
import { Opportunity, SupportedLanguage, LocationLivelihoodData, BeneficiaryProfile } from '../types';
import { JOBS } from '../data/mockData';
import { t } from '../services/translationService';

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

  // Use localized opportunities if available, or fall back to pre-seeded JOBS
  const availableOpportunities: Opportunity[] =
    locationData && locationData.opportunities && locationData.opportunities.length > 0
      ? locationData.opportunities
      : JOBS.filter((j) => j.type !== 'Training');

  const filtered = availableOpportunities.filter((j) => {
    if (j.type === 'Training') return false; // Shown in Training section
    if (activeTab === 'nearby' && j.km > 10) return false;
    if (activeTab === 'district' && j.km > 40) return false;
    if (activeTab === 'self' && j.type !== 'Self-employment') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.loc.toLowerCase().includes(q) ||
        j.org.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

        <button
          onClick={() => go('assessment')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245A91] text-white text-xs font-bold hover:bg-[#17365D] transition-colors shadow-sm"
        >
          <Icon name="mic" size={16} />
          {t('opp.calculateScore', currentLang)}
        </button>
      </div>

      {/* Systematic Profile Location Synced Banner */}
      <div className="bg-gradient-to-r from-[#F5F7FA] to-[#E3F1FA] border border-[#245A91]/20 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#245A91] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Icon name="map" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#5F6B76] uppercase tracking-wider">
                {currentLang === 'bho'
                  ? 'रउआ प्रोफ़ाइल के अनुसार स्थान'
                  : currentLang === 'en'
                  ? 'Profile Location (Auto-Synced)'
                  : 'आपकी प्रोफ़ाइल के अनुसार स्थान'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {currentLang === 'bho' ? 'सक्रिय' : currentLang === 'en' ? 'Active & Synced' : 'सक्रिय व सिंक'}
              </span>
            </div>
            <div className="text-base font-extrabold text-[#17365D]">
              📍 {locationData?.location || userProfile?.location || 'Maharajganj, Uttar Pradesh'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {Boolean(availableOpportunities?.length) && (
            <span className="text-xs text-[#5F6B76] font-medium hidden md:inline">
              {availableOpportunities.length} स्थानीय अवसर उपलब्ध
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

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('opp.searchPlaceholder', currentLang)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#DCE3EA] bg-white focus:outline-none focus:border-[#245A91]"
          />
        </div>
      </div>

      {/* Opportunity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((job) => {
          const isSaved = Boolean(shortlist[job.id]);
          return (
            <div
              key={job.id}
              className="bg-white border border-[#DCE3EA] rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#17365D]/10 text-[#17365D]">
                    <Icon name="briefcase" size={12} />
                    <span>{job.type}</span>
                  </span>
                  {job.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Icon name="check" size={12} />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#287D73] mb-1">
                    {job.km} km away · {job.loc}
                  </div>
                  <h3 className="text-lg font-bold text-[#17365D] leading-snug">
                    {job.title}
                  </h3>
                  <div className="text-xs font-bold text-[#5F6B76] mt-0.5">
                    {job.org}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#DCE3EA] flex items-center justify-between text-xs">
                  <span className="text-[#5F6B76] font-semibold">Estimated Pay</span>
                  <span className="font-extrabold text-[#17365D]">{job.pay}</span>
                </div>

                <p className="text-xs text-[#5F6B76] leading-relaxed line-clamp-2">
                  <strong className="text-[#17365D]">Eligibility:</strong> {job.eligibility}
                </p>
              </div>

              <div className="pt-3 border-t border-[#DCE3EA] flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectDetail(job)}
                  className="text-xs font-extrabold text-[#245A91] hover:underline inline-flex items-center gap-1"
                >
                  <span>View Eligibility &amp; Apply</span>
                  <Icon name="arrow" size={14} />
                </button>

                <button
                  onClick={() => onShortlistToggle(job.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                    isSaved
                      ? 'bg-[#17365D] text-white border-[#17365D]'
                      : 'bg-white text-[#5F6B76] border-[#DCE3EA] hover:border-[#245A91]'
                  }`}
                >
                  <Icon name="bookmark" size={13} />
                  <span>{isSaved ? 'Saved' : 'Shortlist'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#5F6B76] text-xs">
            No opportunities found matching your search. Try resetting filters.
          </div>
        )}
      </div>

      {/* Active Government Schemes for this location */}
      {locationData?.schemes && locationData.schemes.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[#DCE3EA] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#17365D]/10 text-[#17365D] mb-1">
                <span>🏛️</span>
                <span>सरकारी योजनाएं व अनुदान (Government Support)</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#17365D]">
                {locationData.district || 'जिले'} के लिए सक्रिय सरकारी योजनाएं
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locationData.schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-[#F8FAFC] border border-[#DCE3EA] rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#245A91]/10 text-[#245A91] font-bold text-[10px] uppercase">
                      {scheme.category}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700">
                      {scheme.financialSupport}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#17365D]">
                    {scheme.hiName || scheme.name}
                  </h3>
                  <p className="text-xs text-[#5F6B76] leading-relaxed">
                    {scheme.benefit}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#DCE3EA] text-[11px] text-[#5F6B76]">
                  <span className="font-semibold text-[#17365D]">आवेदन स्थल: </span>
                  <span>{scheme.applyOffice}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
