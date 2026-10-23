import React from 'react';
import { Icon } from './Icons';
import { Opportunity } from '../types';

interface OpportunityDetailModalProps {
  opp: Opportunity | null;
  onClose: () => void;
  onShortlistToggle: (id: string) => void;
  isShortlisted: boolean;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opp,
  onClose,
  onShortlistToggle,
  isShortlisted,
}) => {
  if (!opp) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#17365D]/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#DCE3EA] rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Opportunity Details"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#DCE3EA]">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                opp.type === 'Job'
                  ? 'bg-[#E3F1FA] text-[#245A91]'
                  : opp.type === 'Training'
                  ? 'bg-[#287D73]/15 text-[#287D73]'
                  : 'bg-[#FFF4DB] text-[#D9822B]'
              }`}
            >
              {opp.type}
            </span>
            {opp.verified && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#287D73]/15 text-[#287D73] flex items-center gap-1">
                <Icon name="check" size={12} /> Verified
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5F6B76] hover:bg-slate-100"
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <div>
            <h2 className="text-xl font-bold text-[#17365D]">{opp.title}</h2>
            <div className="text-xs font-semibold text-[#5F6B76] mt-0.5">
              {opp.org}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
            <div>
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase">Location</span>
              <div className="font-bold text-[#17365D] mt-0.5">{opp.loc} ({opp.km} km)</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase">Pay / Stipend</span>
              <div className="font-bold text-[#287D73] mt-0.5">{opp.pay}</div>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-[#17365D]">Eligibility Criteria</h4>
            <p className="text-[#5F6B76] leading-relaxed">{opp.eligibility}</p>
          </div>

          {opp.documentsRequired && opp.documentsRequired.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-[#17365D]">Required Documents</h4>
              <ul className="list-disc pl-5 space-y-1 text-[#5F6B76]">
                {opp.documentsRequired.map((doc, idx) => (
                  <li key={idx}>{doc}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1 p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
            <h4 className="font-bold text-[#17365D]">Source &amp; Verification</h4>
            <div className="text-xs text-[#5F6B76]">
              Source: <strong>{opp.source}</strong> (Last verified: {opp.lastVerifiedDate})
            </div>
            {opp.contactInfo && (
              <div className="text-xs text-[#17365D] pt-1">
                <strong>How to apply / Contact:</strong> {opp.contactInfo}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DCE3EA] flex items-center justify-between gap-3 bg-white">
          <button
            onClick={() => onShortlistToggle(opp.id)}
            className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              isShortlisted
                ? 'bg-[#FFF4DB] border-[#EBCB7A] text-[#D9822B]'
                : 'border-[#DCE3EA] text-[#5F6B76] hover:border-[#245A91]'
            }`}
          >
            <Icon name="star" size={14} className={isShortlisted ? 'fill-[#D9822B]' : ''} />
            <span>{isShortlisted ? 'Shortlisted' : 'Save to Shortlist'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#245A91] text-white text-xs font-bold hover:bg-[#17365D]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
