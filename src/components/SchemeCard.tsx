import React, { useState } from 'react';
import { GovernmentScheme, SupportedLanguage } from '../types';
import { DEFAULT_SCHEME_IMAGE } from '../services/locationIntelligenceService';
import { dt, schemeName, isEnglishLike } from '../services/dashboardLocale';
import { Icon } from './Icons';

interface SchemeCardProps {
  scheme: GovernmentScheme;
  lang: SupportedLanguage;
}

const CATEGORY_LABELS: Record<GovernmentScheme['category'], Record<SupportedLanguage, string>> = {
  central: {
    hi: 'केंद्रीय योजना',
    bho: 'केंद्रीय योजना',
    en: 'Central Scheme',
    hin: 'Central Scheme',
  },
  state: {
    hi: 'राज्य योजना',
    bho: 'राज्य योजना',
    en: 'State Scheme',
    hin: 'State Scheme',
  },
  toolkit: {
    hi: 'टूलकिट व प्रशिक्षण अनुदान',
    bho: 'टूलकिट अउर ट्रेनिंग अनुदान',
    en: 'Toolkit & Training Grant',
    hin: 'Toolkit & Training Grant',
  },
  loan: {
    hi: 'स्वरोजगार ऋण योजना',
    bho: 'स्वरोजगार लोन योजना',
    en: 'Business Loan Scheme',
    hin: 'Business Loan Scheme',
  },
};

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, lang }) => {
  const [expanded, setExpanded] = useState(false);

  const schemeImg = scheme.imageUrl || DEFAULT_SCHEME_IMAGE;
  const title = schemeName(scheme, lang);
  const primaryBenefit = scheme.financialSupport || scheme.benefit;
  const hasSecondaryBenefit =
    Boolean(scheme.benefit) &&
    Boolean(scheme.financialSupport) &&
    scheme.benefit.trim() !== scheme.financialSupport.trim();

  const categoryText =
    CATEGORY_LABELS[scheme.category]?.[lang] ||
    CATEGORY_LABELS.central[lang] ||
    scheme.category;

  const moreLabel =
    lang === 'bho'
      ? expanded
        ? 'कम देखीं'
        : 'पूरा विवरण देखीं'
      : isEnglishLike(lang)
      ? expanded
        ? 'Show less'
        : 'View full eligibility & details'
      : expanded
      ? 'संक्षिप्त करें'
      : 'पात्रता व पूरी जानकारी देखें';

  return (
    <article className="rounded-2xl border border-[#DCE3EA] bg-white flex flex-col overflow-hidden transition-colors hover:border-[#245A91]">
      {/* Compact Top Media Header */}
      <div className="w-full h-32 sm:h-36 bg-slate-100 relative overflow-hidden flex-none border-b border-[#DCE3EA]/60">
        <img
          src={schemeImg}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_SCHEME_IMAGE;
          }}
        />
      </div>

      {/* Card Body: Prioritizes High-Value Metadata */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Quiet Unboxed Metadata Kicker */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#5F6B76]">
          <span>{categoryText}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#287D73] font-semibold">
            {lang === 'bho' ? 'सक्रिय' : isEnglishLike(lang) ? 'Verified' : 'सक्रिय योजना'}
          </span>
        </div>

        {/* Primary Scheme Title */}
        <h3
          className={`text-base font-extrabold text-[#17365D] leading-snug ${
            expanded ? '' : 'line-clamp-2'
          }`}
          title={title}
        >
          {title}
        </h3>

        {/* High-Value Metadata: Key Benefit / Financial Support */}
        <div className="pt-0.5">
          <div className="text-xs font-semibold text-[#5F6B76]">{dt('benefit', lang)}</div>
          <p
            className={`text-sm font-bold text-[#287D73] leading-snug mt-0.5 ${
              expanded ? '' : 'line-clamp-2'
            }`}
          >
            {primaryBenefit}
          </p>
          {expanded && hasSecondaryBenefit && (
            <p className="text-xs text-[#202B36] leading-relaxed mt-1">{scheme.benefit}</p>
          )}
        </div>

        {/* Secondary Metadata: Eligibility (Truncated on mobile unless expanded) */}
        {scheme.eligibility && (
          <div className="text-xs">
            <span className="font-semibold text-[#245A91]">{dt('eligible', lang)}: </span>
            <span
              className={`text-[#5F6B76] leading-relaxed ${
                expanded ? 'block mt-0.5' : 'line-clamp-1'
              }`}
            >
              {scheme.eligibility}
            </span>
          </div>
        )}

        {/* Actionable Footer: Where to Apply + Expand Toggle */}
        <div className="mt-auto pt-2.5 border-t border-[#DCE3EA] flex flex-col gap-2">
          <div className="text-xs">
            <span className="font-semibold text-[#5F6B76]">{dt('applyAt', lang)}: </span>
            <span
              className={`font-bold text-[#17365D] ${
                expanded ? 'block mt-0.5' : 'line-clamp-1'
              }`}
            >
              {scheme.applyOffice}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="min-h-10 w-full px-3 py-1.5 rounded-lg bg-[#F5F7FA] hover:bg-slate-200/70 text-xs font-bold text-[#17365D] flex items-center justify-between transition-colors"
          >
            <span>{moreLabel}</span>
            <Icon
              name="chev"
              size={14}
              className={`text-[#245A91] transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>
    </article>
  );
};
