import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { ShowcaseProduct, AppView } from '../types';
import { mediaStorageService } from '../services/cloudinaryService';

interface LocalBusinessShowcaseProps {
  onNotify: (msg: string) => void;
  go: (view: AppView | string) => void;
  userPhone?: string;
  userName?: string;
  userLocation?: string;
}

export const LocalBusinessShowcase: React.FC<LocalBusinessShowcaseProps> = ({
  onNotify,
  go,
}) => {
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProducts = async () => {
    setLoading(true);
    const data = await mediaStorageService.getShowcaseProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <section className="py-12 bg-slate-50/70 border-b border-[#DCE3EA]" id="local-showcase">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#287D73]/10 text-[#287D73] mb-2">
              <Icon name="check" size={13} />
              <span>ग्रामीण उत्पाद प्रदर्शनी · Local Business Showcase</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#17365D] tracking-tight">
              स्थानीय स्वरोजगार व हस्तशिल्प बाज़ार
            </h2>
            <p className="text-sm text-[#5F6B76] max-w-xl mt-1">
              ग्रामीण हुनरमंद, स्वयं सहायता समूह एवं महिला उद्यमी अपने उत्पादों की तस्वीरें यहाँ सीधे अपलोड कर सकते हैं।
            </p>
          </div>

          <button
            onClick={() => go('business-upload')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#287D73] hover:bg-[#1E6058] text-white font-extrabold text-sm shadow-md transition-all active:scale-95 flex-shrink-0"
          >
            <span>+ अपना उत्पाद जोड़ें</span>
          </button>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#DCE3EA] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Product Image */}
                <div className="h-52 bg-slate-100 relative overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-md">
                    {p.category}
                  </span>
                  {p.price && (
                    <span className="absolute bottom-3 right-3 px-3 py-1 rounded-xl text-xs font-black bg-[#17365D] text-white shadow-md">
                      {p.price}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#17365D] leading-snug line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#5F6B76] mt-1.5 line-clamp-2 leading-relaxed">
                      {p.description || 'हस्तनिर्मित ग्रामीण उत्पाद।'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#5F6B76]">
                    <div>
                      <div className="font-bold text-[#17365D]">{p.artisanName}</div>
                      <div className="text-[11px] flex items-center gap-1 text-slate-500">
                        <Icon name="pin" size={11} />
                        <span>{p.location}</span>
                      </div>
                    </div>
                    {p.contactPhone && (
                      <a
                        href={`tel:${p.contactPhone.replace(/\s+/g, '')}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#287D73] hover:text-white font-bold text-xs text-[#17365D] transition-colors flex items-center gap-1"
                        title="संपर्क करें"
                      >
                        <span>संपर्क</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
