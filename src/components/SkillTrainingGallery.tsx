import React, { useState } from 'react';
import { Icon } from './Icons';
import { AppView } from '../types';

interface SkillTrainingGalleryProps {
  go: (view: AppView) => void;
}

interface GalleryItem {
  id: string;
  title: string;
  category: 'tailoring' | 'solar' | 'computer' | 'agriculture' | 'electric';
  categoryLabel: string;
  imageUrl: string;
  nsqf: string;
  duration: string;
  centersCount: number;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal_1',
    title: 'सिलाई मशीन ऑपरेटर व परिधान निर्माण',
    category: 'tailoring',
    categoryLabel: 'सिलाई व कढ़ाई',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    nsqf: 'Level 4',
    duration: '3 माह (240 घंटे)',
    centersCount: 8,
  },
  {
    id: 'gal_2',
    title: 'कंप्यूटर साक्षरता, टाइपिंग व डिजिटल सेवा',
    category: 'computer',
    categoryLabel: 'डिजिटल कौशल',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    nsqf: 'Level 3',
    duration: '2 माह (180 घंटे)',
    centersCount: 12,
  },
  {
    id: 'gal_3',
    title: 'सोलर रूफटॉप इंस्टॉलेशन व इन्वर्टर रिपेयर',
    category: 'solar',
    categoryLabel: 'सोलर ऊर्जा',
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    nsqf: 'Level 4',
    duration: '3 माह (300 घंटे)',
    centersCount: 6,
  },
  {
    id: 'gal_4',
    title: 'जैविक खेती, बागवानी व डेयरी पशुपालन',
    category: 'agriculture',
    categoryLabel: 'कृषि व डेयरी',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80',
    nsqf: 'Level 3',
    duration: '1 माह (120 घंटे)',
    centersCount: 5,
  },
  {
    id: 'gal_5',
    title: 'घरेलू वायरिंग, मोटर वाइंडिंग व विद्युत उपकरण मरम्मत',
    category: 'electric',
    categoryLabel: 'विद्युत तकनीशियन',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    nsqf: 'Level 4',
    duration: '3 माह (250 घंटे)',
    centersCount: 7,
  },
  {
    id: 'gal_6',
    title: 'मिट्टी शिल्प, टेराकोटा एवं कुम्हारी कला',
    category: 'tailoring',
    categoryLabel: 'हस्तशिल्प',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    nsqf: 'Level 3',
    duration: '2 माह (160 घंटे)',
    centersCount: 4,
  },
];

export const SkillTrainingGallery: React.FC<SkillTrainingGalleryProps> = ({ go }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filtered = selectedFilter === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((g) => g.category === selectedFilter);

  return (
    <section className="py-12 bg-white border-b border-[#DCE3EA]" id="training-gallery">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#17365D]/10 text-[#17365D] mb-2">
              <Icon name="cap" size={13} />
              <span>कौशल प्रशिक्षण गैलरी · Skill Training Visuals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#17365D] tracking-tight">
              सिलाई, कंप्यूटर, सोलर एवं स्वरोजगार प्रशिक्षण
            </h2>
            <p className="text-sm text-[#5F6B76] max-w-xl mt-1">
              सरकारी कौशल विकास केंद्रों (PMKVY/RSETI) में संचालित रोजगारपरक प्रशिक्षण ट्रेडों की तस्वीरें।
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
            { id: 'all', label: 'सभी ट्रेड (All)' },
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

        {/* Gallery Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#DCE3EA] overflow-hidden bg-white shadow-xs hover:shadow-md transition-all group flex flex-col"
            >
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-[#17365D]/85 text-white backdrop-blur-md">
                  {item.categoryLabel}
                </span>
                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 text-[#17365D] shadow-xs">
                  {item.nsqf}
                </span>
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#17365D] leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-[#5F6B76] mt-2">
                    <span>⏱ {item.duration}</span>
                    <span>📍 {item.centersCount} केंद्र सक्रिय</span>
                  </div>
                </div>

                <button
                  onClick={() => go('training')}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#17365D] hover:text-white border border-[#DCE3EA] text-[#17365D] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Icon name="cap" size={14} />
                  <span>प्रशिक्षण केंद्र विवरण</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
