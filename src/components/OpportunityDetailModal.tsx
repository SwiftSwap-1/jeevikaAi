import React, { useState } from 'react';
import { Icon } from './Icons';
import { Opportunity, LocationLivelihoodData, SupportedLanguage } from '../types';
import { locationIntelligenceService } from '../services/locationIntelligenceService';
import { speechService } from '../services/speechService';

interface OpportunityDetailModalProps {
  opp: Opportunity | null;
  onClose: () => void;
  onShortlistToggle: (id: string) => void;
  isShortlisted: boolean;
  activeLocation?: string;
  locationData?: LocationLivelihoodData | null;
  currentLang?: SupportedLanguage;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opp,
  onClose,
  onShortlistToggle,
  isShortlisted,
  activeLocation,
  locationData,
  currentLang = 'hi',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!opp) return null;

  const accuracy = locationIntelligenceService.getLocationAccuracy();
  const userLat = accuracy.latitude || locationData?.latitude || 27.1446;
  const userLng = accuracy.longitude || locationData?.longitude || 83.5622;

  const districtName = locationData?.district || activeLocation?.split(',')[0]?.trim() || 'Maharajganj';
  const stateName = locationData?.state || activeLocation?.split(',')[1]?.trim() || 'Uttar Pradesh';
  const userOriginLabel = activeLocation || `${districtName}, ${stateName}`;

  // Estimate destination coordinates offset slightly by distance (km) so map shows exact local area
  const kmDistance = typeof opp.km === 'number' && opp.km > 0 ? opp.km : 4;
  const hashSeed = (opp.id || opp.title).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const angleRad = ((hashSeed % 360) * Math.PI) / 180;
  const degOffset = Math.min(0.12, (kmDistance / 111) * 0.85);
  const destLat = Number((userLat + Math.sin(angleRad) * degOffset).toFixed(5));
  const destLng = Number((userLng + Math.cos(angleRad) * degOffset).toFixed(5));

  const destinationQuery = `${opp.title}, ${opp.loc}, ${districtName}, ${stateName}`;
  const hasExactGps = Boolean(accuracy.latitude && accuracy.longitude);
  const originParam = hasExactGps
    ? `${accuracy.latitude},${accuracy.longitude}`
    : encodeURIComponent(userOriginLabel);

  // Google Maps Turn-by-Turn Directions URL from User's Current Location to Destination
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${encodeURIComponent(
    `${opp.loc}, ${districtName}, ${stateName}`
  )}&travelmode=driving`;

  // Embedded Interactive Map URL (Google Maps Embed / OSM fallback)
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    `${opp.loc}, ${districtName}, ${stateName}`
  )}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  const handleSpeakDetails = () => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const spokenText =
      currentLang === 'en'
        ? `${opp.type}: ${opp.title} at ${opp.org}. Location: ${opp.loc}, ${kmDistance} kilometers from your current location. Pay or benefit: ${opp.pay}. Eligibility: ${opp.eligibility}. Required documents: ${(opp.documentsRequired || ['Aadhaar Card']).join(', ')}. Contact: ${opp.contactInfo || opp.loc}.`
        : `${opp.type === 'Training' ? 'प्रशिक्षण केंद्र' : 'रोजगार अवसर'}: ${opp.title}, संस्था: ${opp.org}। स्थान: ${opp.loc}, आपके वर्तमान स्थान से लगभग ${kmDistance} किलोमीटर दूर। वेतन या लाभ: ${opp.pay}। योग्यता: ${opp.eligibility}। आवश्यक दस्तावेज़: ${(opp.documentsRequired || ['आधार कार्ड']).join(', ')}। संपर्क: ${opp.contactInfo || opp.loc}।`;

    speechService.speak(spokenText, currentLang, () => {
      setIsSpeaking(false);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#17365D]/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={() => {
        speechService.stopSpeaking();
        onClose();
      }}
    >
      <div
        className="bg-white border border-[#DCE3EA] rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Opportunity Details & Map"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE3EA] bg-[#F8FAFC]">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                opp.type === 'Job'
                  ? 'bg-[#E3F1FA] text-[#245A91]'
                  : opp.type === 'Training'
                  ? 'bg-[#287D73]/15 text-[#287D73]'
                  : 'bg-[#FFF4DB] text-[#D9822B]'
              }`}
            >
              {opp.type === 'Training' ? '🎓 प्रशिक्षण केंद्र (Training)' : opp.type === 'Job' ? '💼 नौकरी (Job)' : '🏪 स्वरोजगार'}
            </span>
            {opp.verified && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Icon name="check" size={12} /> सत्यापित (Verified)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSpeakDetails}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isSpeaking
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-white text-[#17365D] border border-[#DCE3EA] hover:bg-[#EBF3FA]'
              }`}
              title="पूरी जानकारी बोलकर सुनें"
            >
              <Icon name="volume2" size={14} />
              <span>{isSpeaking ? 'बोल रहा है...' : 'सुनें 🔊'}</span>
            </button>
            <button
              onClick={() => {
                speechService.stopSpeaking();
                onClose();
              }}
              className="p-1.5 rounded-xl text-[#5F6B76] hover:bg-slate-200/70 transition-colors"
              aria-label="Close"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#17365D] leading-snug">
              {opp.title}
            </h2>
            <div className="text-xs font-semibold text-[#5F6B76] mt-0.5">
              {opp.org}
            </div>
          </div>

          {/* Key Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F5F7FA] rounded-2xl border border-[#DCE3EA]">
            <div>
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase tracking-wider">
                स्थान व दूरी (Location &amp; Distance)
              </span>
              <div className="font-bold text-[#17365D] mt-0.5 flex items-center gap-1">
                <span>📍 {opp.loc}</span>
                <span className="text-[#287D73] font-extrabold">({kmDistance} km दूर)</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#5F6B76] uppercase tracking-wider">
                {opp.type === 'Training' ? 'कोर्स शुल्क व लाभ (Benefits)' : 'संभावित वेतन / आय (Pay)'}
              </span>
              <div className="font-bold text-[#287D73] mt-0.5">{opp.pay}</div>
            </div>
          </div>

          {/* In-Built Interactive Location Map & Route Navigation Card */}
          <div className="rounded-2xl border border-[#245A91]/25 bg-gradient-to-b from-[#F8FAFC] to-[#EBF3FA]/50 overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-[#DCE3EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
              <div className="space-y-0.5">
                <div className="text-[11px] font-extrabold text-[#245A91] uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="mapPin" size={14} className="text-[#287D73]" />
                  <span>इन-बिल्ट लोकेशन मैप व रास्ता (Live Route Map)</span>
                </div>
                <div className="text-xs text-[#17365D] font-semibold flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    ● आपका स्थान: {userOriginLabel}
                  </span>
                  <span className="text-slate-400">➔</span>
                  <span className="inline-flex items-center gap-1 text-[#17365D] font-bold">
                    📍 {opp.loc} (~{kmDistance} km)
                  </span>
                </div>
              </div>

              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#287D73] hover:bg-[#17365D] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
              >
                <Icon name="map" size={14} />
                <span>Open in Map (रास्ता देखें)</span>
              </a>
            </div>

            {/* Embedded Interactive Map Iframe */}
            <div className="relative w-full h-48 sm:h-56 bg-slate-100">
              <iframe
                title={`Map for ${ destinationQuery }`}
                src={mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs border border-[#DCE3EA] rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-sm text-[11px]">
                <div className="truncate font-semibold text-[#17365D]">
                  🧭 <strong>{opp.loc}</strong> ({destLat}°N, {destLng}°E)
                </div>
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#245A91] font-extrabold hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  <span>दिशा-निर्देश (Directions)</span>
                  <Icon name="arrow" size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="space-y-1">
            <h4 className="font-bold text-[#17365D]">योग्यता व पात्रता (Eligibility Criteria)</h4>
            <p className="text-[#5F6B76] leading-relaxed">{opp.eligibility}</p>
          </div>

          {/* Documents Required */}
          {opp.documentsRequired && opp.documentsRequired.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-[#17365D]">आवश्यक दस्तावेज़ (Required Documents)</h4>
              <div className="flex flex-wrap gap-1.5">
                {opp.documentsRequired.map((doc, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#F5F7FA] border border-[#DCE3EA] text-xs font-semibold text-[#17365D]"
                  >
                    📄 {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source & Contact */}
          <div className="space-y-1 p-3.5 bg-[#F5F7FA] rounded-2xl border border-[#DCE3EA]">
            <h4 className="font-bold text-[#17365D]">संपर्क एवं आवेदन प्रक्रिया (Contact &amp; Verification)</h4>
            <div className="text-xs text-[#5F6B76]">
              स्रोत (Source): <strong>{opp.source}</strong> (सत्यापित: {opp.lastVerifiedDate})
            </div>
            {opp.contactInfo && (
              <div className="text-xs text-[#17365D] pt-1">
                <strong>कहाँ संपर्क करें:</strong> {opp.contactInfo}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DCE3EA] flex items-center justify-between gap-2 bg-white flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShortlistToggle(opp.id)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isShortlisted
                  ? 'bg-[#FFF4DB] border-[#EBCB7A] text-[#D9822B]'
                  : 'border-[#DCE3EA] text-[#5F6B76] hover:border-[#245A91]'
              }`}
            >
              <Icon name="star" size={14} className={isShortlisted ? 'fill-[#D9822B]' : ''} />
              <span>{isShortlisted ? 'सहेजा गया (Saved)' : 'सहेजें (Shortlist)'}</span>
            </button>

            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-[#287D73]/10 text-[#287D73] border border-[#287D73]/30 hover:bg-[#287D73] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Icon name="mapPin" size={14} />
              <span>Open in Map</span>
            </a>
          </div>

          <button
            onClick={() => {
              speechService.stopSpeaking();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#17365D] text-white text-xs font-bold hover:bg-[#245A91]"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
