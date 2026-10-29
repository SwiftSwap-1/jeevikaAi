import React from 'react';
import { Icon } from './Icons';
import { Opportunity } from '../types';
import { JOBS } from '../data/mockData';

interface SavedViewProps {
  shortlist: Record<string, boolean>;
  onShortlistToggle: (id: string) => void;
  onSelectDetail: (opp: Opportunity) => void;
  go: (route: string) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  shortlist,
  onShortlistToggle,
  onSelectDetail,
  go,
}) => {
  const savedOpportunities = JOBS.filter((j) => Boolean(shortlist[j.id]));

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DCE3EA] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9822B]/15 text-[#D9822B] mb-2">
            <Icon name="star" size={14} className="fill-[#D9822B]" />
            <span>Personal Bookmarks</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#17365D]">
            Saved Opportunities &amp; Pathways · सहेजे गए अवसर
          </h1>
        </div>

        <button
          onClick={() => go('opportunities')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] text-xs font-bold hover:bg-slate-50 transition-colors"
        >
          <Icon name="search" size={14} />
          Explore More Opportunities
        </button>
      </div>

      {savedOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      opp.type === 'Job'
                        ? 'bg-[#E3F1FA] text-[#245A91]'
                        : opp.type === 'Training'
                        ? 'bg-[#287D73]/15 text-[#287D73]'
                        : 'bg-[#FFF4DB] text-[#D9822B]'
                    }`}
                  >
                    {opp.type}
                  </span>
                  <button
                    onClick={() => onShortlistToggle(opp.id)}
                    className="text-xs text-[#9E2A2B] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Icon name="x" size={12} /> Remove
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#17365D] leading-snug">
                    {opp.title}
                  </h3>
                  <div className="text-xs text-[#5F6B76] font-semibold mt-0.5">
                    {opp.org}
                  </div>
                </div>

                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA] text-xs space-y-1">
                  <div className="flex items-center gap-2 text-[#17365D] font-bold">
                    <Icon name="pin" size={14} />
                    <span>{opp.loc} ({opp.km} km away)</span>
                  </div>
                  <div className="text-[#287D73] font-bold">
                    {opp.pay}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#DCE3EA] flex items-center justify-between">
                <button
                  onClick={() => onSelectDetail(opp)}
                  className="text-xs font-bold text-[#245A91] hover:underline"
                >
                  View Details &amp; Application Criteria →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-[#DCE3EA] rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F5F7FA] text-[#5F6B76] flex items-center justify-center mx-auto">
            <Icon name="star" size={28} />
          </div>
          <h3 className="text-lg font-bold text-[#17365D]">No opportunities saved yet</h3>
          <p className="text-xs text-[#5F6B76] max-w-sm mx-auto">
            While exploring jobs, self-employment ideas, or training programs, tap the "Shortlist" button to save them here for quick review.
          </p>
          <button
            onClick={() => go('opportunities')}
            className="px-5 py-2.5 rounded-xl bg-[#245A91] text-white text-xs font-bold shadow-sm"
          >
            Browse Opportunities
          </button>
        </div>
      )}
    </main>
  );
};
