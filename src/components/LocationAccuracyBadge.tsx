import React, { useState } from 'react';
import { Icon } from './Icons';
import { LocationAccuracyLevel, SupportedLanguage } from '../types';

interface LocationAccuracyBadgeProps {
  level?: LocationAccuracyLevel;
  confidenceScore?: number;
  accuracyMeters?: number;
  locality?: string;
  source?: 'gps' | 'manual' | 'cache' | 'default';
  variant?: 'badge' | 'card' | 'inline';
  isDarkBackground?: boolean;
  currentLang?: SupportedLanguage;
  onReDetect?: () => void;
  isDetecting?: boolean;
  className?: string;
}

export const LocationAccuracyBadge: React.FC<LocationAccuracyBadgeProps> = ({
  level = 'District-level',
  confidenceScore = 85,
  accuracyMeters,
  locality,
  source = 'default',
  variant = 'badge',
  isDarkBackground = false,
  currentLang = 'hi',
  onReDetect,
  isDetecting = false,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Confidence score normalization
  const score = Math.max(1, Math.min(100, Math.round(confidenceScore || (level === 'Precise' ? 95 : level === 'District-level' ? 85 : 60))));

  // Config based on accuracy level
  const config = {
    'Precise': {
      labelEn: 'Precise',
      labelHi: 'सटीक (Precise)',
      labelBho: 'सटीक (Precise)',
      shortLabel: 'Precise',
      tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-300',
      tagColorDark: 'text-emerald-200 bg-emerald-500/20 border-emerald-400/40',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      iconName: 'target',
      descriptionEn: `High precision GPS fix (${accuracyMeters ? `±${accuracyMeters}m` : 'sub-100m'})${locality ? ` for ${locality}` : ''}. Local jobs and training centers within 5–15 km are precisely mapped.`,
      descriptionHi: `उच्च परिशुद्धता जीपीएस फिक्स (${accuracyMeters ? `±${accuracyMeters} मीटर` : '100 मीटर के भीतर'})${locality ? ` (${locality})` : ''}। 5–15 किमी के भीतर के स्थानीय रोजगार व प्रशिक्षण केंद्र सटीक रूप से मैप किए गए हैं।`,
      descriptionBho: `एकदम सटीक जीपीएस (${accuracyMeters ? `±${accuracyMeters} मीटर` : 'सटीक दूरी'})${locality ? ` (${locality})` : ''}। पास के ट्रेनिंग सेंटर अउर काम सटीक दूरी पर देखाई।`,
    },
    'District-level': {
      labelEn: 'District-level',
      labelHi: 'जिला स्तर (District)',
      labelBho: 'जिला स्तर (District)',
      shortLabel: 'District-level',
      tagColor: 'text-blue-800 bg-blue-50 border-blue-300',
      tagColorDark: 'text-sky-200 bg-sky-500/20 border-sky-400/40',
      barColor: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      iconName: 'pin',
      descriptionEn: 'City/District administrative centroid. Opportunities and certified government institutes (RSETI, PMKK, ITI) across the entire district are prioritized.',
      descriptionHi: 'जिला प्रशासनिक सीमा। पूरे जिले में स्थित सरकारी संस्थान (RSETI, PMKK, ITI), जन सेवा केंद्र व अवसर प्राथमिकता पर उपलब्ध हैं।',
      descriptionBho: 'जिला स्तर के दायरा। पूरा जिला के सरकारी संस्थान अउर योजना के जानकारी शामिल बा।',
    },
    'State-level': {
      labelEn: 'State-level',
      labelHi: 'राज्य स्तर (State)',
      labelBho: 'राज्य स्तर (State)',
      shortLabel: 'State-level',
      tagColor: 'text-amber-800 bg-amber-50 border-amber-300',
      tagColorDark: 'text-amber-200 bg-amber-500/20 border-amber-400/40',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      iconName: 'compass',
      descriptionEn: 'State-wide regional estimation. For precise nearby matching and actual distances, tap "Detect My Location" or choose your specific district.',
      descriptionHi: 'राज्य स्तर का अनुमान। सटीक स्थानीय परिणाम और वास्तविक दूरी देखने के लिए "Detect My Location" दबाएं या अपना जिला चुनें।',
      descriptionBho: 'राज्य स्तर के अनुमान। सटीक दूरी देखे खातिर "Detect My Location" दबाईं या जिला चुनीं।',
    },
  }[level] || {
    labelEn: 'District-level',
    labelHi: 'जिला स्तर',
    labelBho: 'जिला स्तर',
    shortLabel: 'District-level',
    tagColor: 'text-blue-800 bg-blue-50 border-blue-300',
    tagColorDark: 'text-sky-200 bg-sky-500/20 border-sky-400/40',
    barColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    iconName: 'pin',
    descriptionEn: 'District-level standard precision.',
    descriptionHi: 'जिला स्तर मानक परिशुद्धता।',
    descriptionBho: 'जिला स्तर मानक परिशुद्धता।',
  };

  const getLocalizedDesc = () => {
    if (currentLang === 'bho') return config.descriptionBho;
    if (currentLang === 'en') return config.descriptionEn;
    return config.descriptionHi;
  };

  const getLocalizedLabel = () => {
    if (currentLang === 'en') return config.labelEn;
    if (currentLang === 'bho') return config.labelBho;
    return config.labelHi;
  };

  // Detailed Card Variant (for Hyperlocal District section in Dashboard)
  if (variant === 'card') {
    return (
      <div className={`p-4 rounded-2xl border transition-all ${isDarkBackground ? 'bg-white/10 border-white/20 text-white' : 'bg-white/95 border-[#DCE3EA] shadow-xs text-[#202B36]'} ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${isDarkBackground ? config.tagColorDark : config.tagColor}`}>
                <Icon name={config.iconName} size={12} />
                <span>{getLocalizedLabel()}</span>
              </span>
              <span className="text-[11px] font-bold text-[#5F6B76] dark:text-white/70">
                · {score}% {currentLang === 'en' ? 'Confidence' : 'विश्वास स्तर'}
              </span>
            </div>

            <div className="text-xs font-semibold text-[#17365D] dark:text-white mt-1">
              {getLocalizedDesc()}
            </div>
          </div>

          {onReDetect && (
            <button
              onClick={onReDetect}
              disabled={isDetecting}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0 border cursor-pointer ${isDarkBackground ? 'bg-white/15 hover:bg-white/25 border-white/20 text-white' : 'bg-[#F5F7FA] hover:bg-[#E9ECEF] border-[#DCE3EA] text-[#17365D]'}`}
              title={currentLang === 'en' ? 'Re-detect GPS location' : 'जीपीएस पुनः पहचानें'}
            >
              <Icon name={isDetecting ? 'refresh' : 'target'} size={14} className={isDetecting ? 'animate-spin' : ''} />
              <span className="hidden sm:inline text-[11px]">{isDetecting ? 'खोज रहे हैं...' : 'री-डिटेक्ट'}</span>
            </button>
          )}
        </div>

        {/* Multi-tier Confidence Gauge Strip */}
        <div className="mt-3 pt-3 border-t border-[#DCE3EA]/50 dark:border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#5F6B76] dark:text-white/70">
            <span>सटीकता पैमाना (Accuracy Tier)</span>
            <span className="font-extrabold text-[#17365D] dark:text-white">{score}% Score</span>
          </div>

          {/* 3-Tier Step Track */}
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            {/* Tier 1: State */}
            <div className={`p-1.5 rounded-lg border text-center transition-all ${level === 'State-level' ? 'bg-amber-100/90 border-amber-400 text-amber-900 font-extrabold shadow-xs' : 'bg-slate-100/60 border-slate-200 text-slate-500 font-medium'}`}>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[10px]">🗺️</span>
                <span>State</span>
              </div>
              <div className="text-[9px] opacity-75">~60% Conf.</div>
            </div>

            {/* Tier 2: District */}
            <div className={`p-1.5 rounded-lg border text-center transition-all ${level === 'District-level' ? 'bg-blue-100/90 border-blue-400 text-blue-900 font-extrabold shadow-xs' : 'bg-slate-100/60 border-slate-200 text-slate-500 font-medium'}`}>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[10px]">📍</span>
                <span>District</span>
              </div>
              <div className="text-[9px] opacity-75">~85% Conf.</div>
            </div>

            {/* Tier 3: Precise */}
            <div className={`p-1.5 rounded-lg border text-center transition-all ${level === 'Precise' ? 'bg-emerald-100/90 border-emerald-400 text-emerald-900 font-extrabold shadow-xs' : 'bg-slate-100/60 border-slate-200 text-slate-500 font-medium'}`}>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[10px]">🎯</span>
                <span>Precise</span>
              </div>
              <div className="text-[9px] opacity-75">95%+ (GPS)</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interactive Badge Variant (for Hero bars, headers, and quick chips)
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
          isDarkBackground ? config.tagColorDark : config.tagColor
        }`}
        aria-label={`Location precision: ${level}, confidence ${score}%`}
        title={`Accuracy: ${level} (${score}% confidence)`}
      >
        <span className="relative flex h-2 w-2">
          {level === 'Precise' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.barColor}`} />
        </span>
        <Icon name={config.iconName} size={11} />
        <span className="font-extrabold">{config.shortLabel}</span>
        <span className="opacity-90 font-medium text-[10px] ml-0.5">· {score}%</span>
      </button>

      {/* Popover / Tooltip on Click or Hover */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute top-full left-0 mt-2 z-50 w-72 p-3.5 bg-white text-[#202B36] rounded-2xl shadow-xl border border-[#DCE3EA] text-xs space-y-2 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-[#DCE3EA]">
            <div className="flex items-center gap-1.5 font-extrabold text-[#17365D]">
              <Icon name={config.iconName} size={14} className={config.textColor} />
              <span>{getLocalizedLabel()}</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#17365D] text-white">
              {score}% Confidence
            </span>
          </div>

          <p className="text-[11px] text-[#5F6B76] leading-relaxed">
            {getLocalizedDesc()}
          </p>

          {locality && (
            <div className="p-1.5 rounded-lg bg-[#F5F7FA] text-[10px] text-[#17365D] font-medium flex items-center gap-1">
              <Icon name="pin" size={10} className="text-[#245A91]" />
              <span>पहचाना गया मोहल्ला/गाँव: <strong className="font-bold">{locality}</strong></span>
            </div>
          )}

          {/* Mini progress bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] font-bold text-[#5F6B76]">
              <span>विश्वास स्कोर</span>
              <span>{score} / 100</span>
            </div>
            <div className="w-full bg-[#E9ECEF] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${config.barColor}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {onReDetect && (
            <button
              onClick={() => {
                setShowTooltip(false);
                onReDetect();
              }}
              disabled={isDetecting}
              className="w-full mt-2 py-1.5 px-2 rounded-xl bg-[#287D73] text-white text-[11px] font-bold hover:bg-[#1E6058] transition-colors flex items-center justify-center gap-1"
            >
              <Icon name={isDetecting ? 'refresh' : 'target'} size={12} className={isDetecting ? 'animate-spin' : ''} />
              <span>{isDetecting ? 'स्थान खोज रहे हैं...' : 'जीपीएस से पुनः पहचानें (Precise GPS)'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
