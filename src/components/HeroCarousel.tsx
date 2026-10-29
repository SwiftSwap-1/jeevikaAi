import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icons';
import { HeroSlide, AppView } from '../types';
import { mediaStorageService, DEFAULT_HERO_SLIDES } from '../services/cloudinaryService';

interface HeroCarouselProps {
  go: (view: AppView) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ go }) => {
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const refreshSlides = () => {
      mediaStorageService.getHeroSlides().then((res) => {
        if (isMounted) {
          setSlides(res);
        }
      });
    };

    refreshSlides();

    // Subscribe to live Firestore media updates for real-time cross-device sync
    const unsubscribe = mediaStorageService.subscribeMediaAssets(() => {
      refreshSlides();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slides.length]);

  const validSlides = (slides || []).filter(Boolean);
  if (!validSlides.length) return null;

  const current = validSlides[currentIndex] || validSlides[0];
  if (!current) return null;

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border-2 border-[#17365D]/15 shadow-xl bg-[#0F233D] group transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="ग्रामीण आजीविका एवं कौशल गैलरी"
    >
      {/* Device-optimized responsive height container (Mobile, Tablet, Desktop) */}
      <div className="relative h-[210px] xs:h-[250px] sm:h-[290px] md:h-[330px] lg:h-[360px] w-full overflow-hidden bg-slate-900">
        {validSlides.map((slide, idx) => slide ? (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={slide.imageUrl || ''}
              alt={slide.title || 'Banner'}
              className="w-full h-full object-cover object-center transform transition-transform duration-1000 ease-out"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent hidden sm:block" />
          </div>
        ) : null)}

        {/* Top Badges */}
        <div className="absolute top-2.5 sm:top-3.5 left-3 sm:left-4 z-20 flex items-center gap-2">
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-[#287D73] text-white shadow-md flex items-center gap-1.5 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
            <span>{current?.tag || 'कौशल विकास'}</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-white/90 backdrop-blur-md border border-white/20">
            {currentIndex + 1} / {validSlides.length}
          </span>
        </div>

        {/* Slide Caption Bottom Box */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 z-20 text-white flex items-end justify-between gap-3">
          <div className="max-w-lg space-y-0.5 sm:space-y-1">
            <h3 className="text-base sm:text-xl font-black text-white drop-shadow-md tracking-tight leading-snug">
              {current?.title}
            </h3>
            {(() => {
              const cleanSub = (current.subtitle || '')
                .replace(/admin-uploaded/gi, '')
                .replace(/^banner\s*[•·]?\s*/gi, '')
                .replace(/[•·]\s*banner/gi, '')
                .replace(/^[•·\s]+|[•·\s]+$/g, '')
                .trim();
              const displaySub = cleanSub || 'जीविका प्रमाणित अवसर';
              return displaySub && !displaySub.startsWith('#') ? (
                <p className="text-[11px] sm:text-xs text-white/90 font-medium line-clamp-1 sm:line-clamp-2 drop-shadow-sm">
                  {displaySub}
                </p>
              ) : null;
            })()}
          </div>

          {current.ctaUrl ? (
            <a
              href={current.ctaUrl}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-[#17365D] text-[11px] sm:text-xs font-black shadow-md transition-all active:scale-95 flex-shrink-0 mb-0.5"
            >
              <span>{current.ctaLabel || 'अवसर देखें'}</span>
              <Icon name="arrowR" size={12} />
            </a>
          ) : current.linkView ? (
            <button
              onClick={() => go(current.linkView!)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-[#17365D] text-[11px] sm:text-xs font-black shadow-md transition-all active:scale-95 flex-shrink-0 mb-0.5"
            >
              <span>अवसर देखें</span>
              <Icon name="arrowR" size={12} />
            </button>
          ) : null}
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/25 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 active:scale-90 shadow-lg"
        >
          <span className="text-base font-bold">‹</span>
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/25 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 active:scale-90 shadow-lg"
        >
          <span className="text-base font-bold">›</span>
        </button>

        {/* Indicators Bar */}
        <div className="absolute bottom-2.5 right-3 sm:right-6 z-30 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-6 bg-[#00e0ff]' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
