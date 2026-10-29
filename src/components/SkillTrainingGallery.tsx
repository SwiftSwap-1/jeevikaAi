import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { AppView, MediaAssetRecord } from '../types';
import { mediaStorageService } from '../services/cloudinaryService';

interface SkillTrainingGalleryProps {
  go: (view: AppView) => void;
}

interface DefaultTradeCategory {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  nsqf: string;
  duration: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
}

const DEFAULT_TRADES: DefaultTradeCategory[] = [
  {
    id: 'tr_1',
    title: 'सिलाई मशीन ऑपरेटर व परिधान निर्माण',
    category: 'tailoring',
    categoryLabel: 'सिलाई व कढ़ाई',
    nsqf: 'NSQF Level 4',
    duration: '3 माह (240 घंटे)',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
    bgColor: 'bg-rose-50 border-rose-200',
    textColor: 'text-rose-700',
  },
  {
    id: 'tr_2',
    title: 'कंप्यूटर साक्षरता, टाइपिंग व डिजिटल सेवा',
    category: 'computer',
    categoryLabel: 'डिजिटल कौशल',
    nsqf: 'NSQF Level 3',
    duration: '2 माह (180 घंटे)',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    bgColor: 'bg-sky-50 border-sky-200',
    textColor: 'text-sky-700',
  },
  {
    id: 'tr_3',
    title: 'सोलर रूफटॉप इंस्टॉलेशन व इन्वर्टर रिपेयर',
    category: 'solar',
    categoryLabel: 'सोलर ऊर्जा',
    nsqf: 'NSQF Level 4',
    duration: '3 माह (300 घंटे)',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5c920ac3c?auto=format&fit=crop&w=800&q=80',
    bgColor: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-800',
  },
  {
    id: 'tr_4',
    title: 'घरेलू वायरिंग, मोटर वाइंडिंग व विद्युत मरम्मत',
    category: 'electric',
    categoryLabel: 'विद्युत तकनीशियन',
    nsqf: 'NSQF Level 4',
    duration: '3 माह (250 घंटे)',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    bgColor: 'bg-amber-100/60 border-amber-300',
    textColor: 'text-amber-900',
  },
  {
    id: 'tr_5',
    title: 'जैविक खेती, बागवानी व डेयरी पशुपालन',
    category: 'agriculture',
    categoryLabel: 'कृषि व डेयरी',
    nsqf: 'NSQF Level 3',
    duration: '1 माह (120 घंटे)',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    bgColor: 'bg-emerald-50 border-emerald-200',
    textColor: 'text-emerald-800',
  },
  {
    id: 'tr_6',
    title: 'रिटेल सेल्स एवं ग्राहक सेवा सहायक',
    category: 'retail',
    categoryLabel: 'रिटेल व्यापार',
    nsqf: 'NSQF Level 3',
    duration: '2 माह (160 घंटे)',
    imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
    bgColor: 'bg-indigo-50 border-indigo-200',
    textColor: 'text-indigo-800',
  },
];

export const SkillTrainingGallery: React.FC<SkillTrainingGalleryProps> = ({ go }) => {
  const [trainingMedia, setTrainingMedia] = useState<MediaAssetRecord[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    mediaStorageService.getMediaAssets().then((assets) => {
      if (isMounted) {
        const filtered = assets.filter((m) => m.folder === 'training');
        setTrainingMedia(filtered);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const hasAdminImages = trainingMedia.length > 0;

  return (
    <section className="py-12 bg-white border-b border-[#DCE3EA]" id="training-gallery">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#17365D]/10 text-[#17365D] mb-2">
              <Icon name="cap" size={13} />
              <span>कौशल प्रशिक्षण गैलरी · Verified Training Opportunities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#17365D] tracking-tight">
              सिलाई, कंप्यूटर, सोलर एवं स्वरोजगार प्रशिक्षण
            </h2>
            <p className="text-sm text-[#5F6B76] max-w-xl mt-1">
              सरकारी कौशल विकास केंद्रों (PMKVY/RSETI) में संचालित राष्ट्रीय कौशल योग्यता ढाँचा (NSQF) ट्रेड।
            </p>
          </div>

          <button
            onClick={() => go('training')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#DCE3EA] hover:border-[#17365D] bg-white font-bold text-xs text-[#17365D] transition-colors"
          >
            <span>सभी केंद्र देखें</span>
            <Icon name="arrowR" size={14} />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {[
            { id: 'all', label: 'सभी ट्रेड (All Trades)' },
            { id: 'tailoring', label: 'सिलाई व कढ़ाई' },
            { id: 'computer', label: 'कंप्यूटर व डिजिटल' },
            { id: 'solar', label: 'सोलर ऊर्जा' },
            { id: 'electric', label: 'इलेक्ट्रिकल' },
            { id: 'agriculture', label: 'कृषि व डेयरी' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedFilter === cat.id
                  ? 'bg-[#17365D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Display Admin Uploaded Training Images OR Clean Professional Trade Cards with Real Photos */}
        {hasAdminImages ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainingMedia.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-[#DCE3EA] overflow-hidden bg-white shadow-xs hover:shadow-md transition-all group flex flex-col"
              >
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img
                    src={m.url}
                    alt={m.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-[#17365D]/85 text-white backdrop-blur-md">
                    एडमिन प्रमाणित
                  </span>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#17365D] leading-snug line-clamp-2">
                      {m.name}
                    </h3>
                  </div>

                  {m.ctaUrl ? (
                    <a
                      href={m.ctaUrl}
                      className="w-full py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>{m.ctaLabel || 'विवरण देखें'}</span>
                      <Icon name="arrowR" size={14} />
                    </a>
                  ) : (
                    <button
                      onClick={() => go('training')}
                      className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#17365D] hover:text-white border border-[#DCE3EA] text-[#17365D] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Icon name="cap" size={14} />
                      <span>प्रशिक्षण केंद्र विवरण</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEFAULT_TRADES.filter(
              (t) => selectedFilter === 'all' || t.category === selectedFilter
            ).map((trade) => (
              <div
                key={trade.id}
                className="rounded-2xl border border-[#DCE3EA] overflow-hidden bg-white shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img
                    src={trade.imageUrl}
                    alt={trade.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-[#17365D]/85 text-white backdrop-blur-md shadow-sm">
                    {trade.nsqf}
                  </span>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${trade.textColor}`}>
                      {trade.categoryLabel}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#17365D] leading-snug">
                      {trade.title}
                    </h3>
                    <div className="text-xs text-[#5F6B76] font-medium flex items-center gap-1 pt-1">
                      <Icon name="clock" size={13} className="text-[#287D73]" />
                      <span>अवधि: {trade.duration}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => go('training')}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#17365D] hover:text-white border border-[#DCE3EA] text-[#17365D] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 mt-auto"
                  >
                    <Icon name="cap" size={14} />
                    <span>प्रशिक्षण केंद्र विवरण</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
