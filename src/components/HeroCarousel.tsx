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
    mediaStorageService.getHeroSlides().then((res) => {
      if (isMounted && res && res.length > 0) {
        setSlides(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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

  if (!slides.length) return null;

  const current = slides[currentIndex];

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border-2 border-[#17365D]/15 shadow-xl bg-[#0F233D] group transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="ग्रामीण आजीविका एवं कौशल गैलरी"
    >
      {/* 16:9 or golden responsive aspect container */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-900">
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover object-center transform transition-transform duration-1000 ease-out"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent hidden sm:block" />
          </div>
        ))}

        {/* Top Badges */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold bg-[#287D73] text-white shadow-md flex items-center gap-1.5 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
            <span>{current.tag || 'कौशल विकास'}</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-black/50 text-white/90 backdrop-blur-md border border-white/20">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>

        {/* Slide Caption Bottom Box */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20 text-white">
          <div className="max-w-xl space-y-1 sm:space-y-1.5">
            <h3 className="text-lg sm:text-2xl font-black text-white drop-shadow-md tracking-tight leading-snug">
              {current.title}
            </h3>
            <p className="text-xs sm:text-sm text-white/90 font-medium line-clamp-2 drop-shadow-sm">
              {current.subtitle}
            </p>
          </div>

          {current.linkView && (
            <button
              onClick={() => go(current.linkView!)}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-[#17365D] text-xs font-black shadow-md transition-all active:scale-95"
            >
              <span>अवसर देखें</span>
              <Icon name="arrowR" size={13} />
            </button>
          )}
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
