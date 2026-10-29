import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from './Icons';
import { Opportunity, LocationAccuracyLevel } from '../types';

interface DistrictMiniMapProps {
  latitude?: number;
  longitude?: number;
  district?: string;
  state?: string;
  locality?: string;
  accuracyLevel?: LocationAccuracyLevel;
  accuracyMeters?: number;
  confidenceScore?: number;
  trainingCenters?: Opportunity[];
  opportunities?: Opportunity[];
  onReDetect?: () => void;
  isDetecting?: boolean;
}

export const DistrictMiniMap: React.FC<DistrictMiniMapProps> = ({
  latitude = 28.6692,
  longitude = 77.4538,
  district = 'ग़ाज़ियाबाद',
  state = 'Uttar Pradesh',
  locality,
  accuracyLevel = 'District-level',
  accuracyMeters,
  confidenceScore = 88,
  trainingCenters = [],
  onReDetect,
  isDetecting = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Safe coordinates
  const lat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : 28.6692;
  const lng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 77.4538;

  // Compute radius based on accuracy
  const radiusMeters = accuracyLevel === 'Precise'
    ? Math.max(120, Math.min(accuracyMeters || 200, 1500))
    : accuracyLevel === 'District-level'
    ? 5000
    : 15000;

  // Initial Zoom Level
  const zoomLevel = accuracyLevel === 'Precise' ? 14 : accuracyLevel === 'District-level' ? 12 : 9;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: zoomLevel,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      // Standard OSM Tile Layer with fast CDN
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 6,
      }).addTo(map);

      // Create a layer group for interactive markers and shapes
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;
      setMapLoaded(true);

      // Invalidate size once DOM stabilizes
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 200);

      return () => {
        clearTimeout(timer);
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch (err) {
      console.warn('Map initialization failed:', err);
    }
  }, []);

  // Update Markers & View when Coordinates or Centers change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // 1. Accuracy Circle (Approximate Area)
    const circle = L.circle([lat, lng], {
      radius: radiusMeters,
      color: '#287D73',
      weight: 2,
      opacity: 0.8,
      fillColor: '#287D73',
      fillOpacity: 0.14,
      dashArray: accuracyLevel === 'Precise' ? undefined : '5, 5',
    });
    circle.addTo(layer);

    // 2. User Pulse Pin Icon
    const userIconHtml = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: rgba(40, 125, 115, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: #287D73; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25); border: 2.5px solid #ffffff; font-size: 13px;">
          📍
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userIconHtml,
      className: 'user-pulse-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    const userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(layer);
    userMarker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #17365D; padding: 2px;">
        <div style="font-weight: 800; color: #287D73; margin-bottom: 2px;">📍 आपकी अनुमानित स्थिति (Your Location)</div>
        <div style="font-size: 13px; font-weight: 700;">${locality ? `${locality}, ` : ''}${district}</div>
        <div style="color: #5F6B76; font-size: 11px; margin-top: 3px;">${state} · ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</div>
        <div style="display: inline-block; margin-top: 5px; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 700; background: #E6F4F1; color: #1E6058;">
          ${accuracyLevel === 'Precise' ? `सटीक GPS (±${accuracyMeters || 100}m)` : `जिला स्तर दायरा (${confidenceScore}% विश्वास)`}
        </div>
      </div>
    `);

    // 3. Add Nearby Training Centers pins
    const centersToPlot = trainingCenters.slice(0, 4);
    centersToPlot.forEach((center, idx) => {
      // Offset positions slightly around the district centroid if exact coordinates not present
      const angle = (idx * (2 * Math.PI)) / Math.max(centersToPlot.length, 1);
      const distOffset = 0.018 + idx * 0.009;
      const centerLat = lat + Math.sin(angle) * distOffset;
      const centerLng = lng + Math.cos(angle) * distOffset;

      const centerIconHtml = `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 22px; height: 22px; border-radius: 8px; background: #17365D; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); border: 2px solid #ffffff; font-size: 11px;">
            🏛️
          </div>
        </div>
      `;

      const centerIcon = L.divIcon({
        html: centerIconHtml,
        className: 'center-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([centerLat, centerLng], { icon: centerIcon }).addTo(layer);
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 11px; color: #17365D; max-width: 200px;">
          <div style="font-weight: 800; color: #245A91;">🏛️ ${center.org || 'सरकारी कौशल केंद्र'}</div>
          <div style="font-weight: 700; margin-top: 2px;">${center.title}</div>
          <div style="color: #5F6B76; font-size: 10px; margin-top: 2px;">📍 ${center.loc} (लगभग ${center.km} km)</div>
          <div style="color: #287D73; font-weight: 700; font-size: 10px; margin-top: 3px;">${center.pay}</div>
        </div>
      `);
    });

    map.setView([lat, lng], zoomLevel, { animate: true });
  }, [lat, lng, district, state, locality, accuracyLevel, accuracyMeters, confidenceScore, trainingCenters, zoomLevel, radiusMeters]);

  // Handle Resize on Expand/Collapse
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoomLevel, { animate: true });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-emerald-200/90 shadow-sm overflow-hidden flex flex-col transition-all duration-300">
      {/* Map Control Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50/90 to-sky-50/80 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-[#287D73] text-white">
            <Icon name="map" size={13} />
          </span>
          <div>
            <span className="font-extrabold text-[#17365D]">
              स्थानीय मानचित्र · District Area Visualization
            </span>
            <span className="text-[11px] text-[#5F6B76] ml-1.5 hidden sm:inline">
              ({locality ? `${locality}, ` : ''}{district})
            </span>
          </div>
        </div>

        {/* Status Pill & Action Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-[#DCE3EA] text-[#17365D]">
            <span>📍</span>
            <span>{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
          </span>

          {accuracyLevel === 'Precise' ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              🎯 Precise GPS
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
              🏛️ District Centroid
            </span>
          )}

          {onReDetect && (
            <button
              onClick={onReDetect}
              disabled={isDetecting}
              className="p-1 rounded-lg bg-white hover:bg-slate-100 border border-[#DCE3EA] text-[#287D73] transition-colors cursor-pointer"
              title="GPS पुनः पहचानें (Re-detect GPS)"
            >
              <Icon name={isDetecting ? 'refresh' : 'target'} size={12} className={isDetecting ? 'animate-spin' : ''} />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-white hover:bg-slate-100 border border-[#DCE3EA] text-[#17365D] transition-colors cursor-pointer"
            title={isExpanded ? 'छोटा करें (Collapse)' : 'बड़ा करें (Expand)'}
          >
            <Icon name={isExpanded ? 'minimize' : 'maximize'} size={12} />
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full">
        <div
          ref={mapContainerRef}
          className={`w-full transition-all duration-300 z-10 ${
            isExpanded ? 'h-[360px]' : 'h-[200px] sm:h-[220px]'
          }`}
          style={{ minHeight: isExpanded ? '360px' : '200px' }}
        />

        {/* Floating In-Map Navigation Controls */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5 shadow-md">
          <button
            onClick={handleRecenter}
            className="w-7 h-7 rounded-lg bg-white/95 hover:bg-white border border-[#DCE3EA] text-[#287D73] flex items-center justify-center font-bold text-xs shadow-xs transition-colors cursor-pointer"
            title="मेरी स्थिति पर केंद्रित करें (Center to My Location)"
          >
            🎯
          </button>
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-lg bg-white/95 hover:bg-white border border-[#DCE3EA] text-[#17365D] flex items-center justify-center font-bold text-sm shadow-xs transition-colors cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-lg bg-white/95 hover:bg-white border border-[#DCE3EA] text-[#17365D] flex items-center justify-center font-bold text-sm shadow-xs transition-colors cursor-pointer"
            title="Zoom Out"
          >
            −
          </button>
        </div>

        {/* Floating Approximate Radius Info Badge */}
        <div className="absolute bottom-2 left-2 z-20 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-xs border border-emerald-200/90 text-[10px] font-bold text-[#17365D] shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#287D73] animate-pulse"></span>
          <span>
            {accuracyLevel === 'Precise'
              ? `अनुमानित क्षेत्र: ±${accuracyMeters || 150}m दायरा`
              : `अनुमानित क्षेत्र: ${district} जिला दायरा (~5 km)`}
          </span>
        </div>
      </div>

      {/* Mini Legend & Quick District Summary */}
      <div className="px-4 py-2 bg-slate-50/90 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5F6B76]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#287D73]"></span>
            <span className="font-semibold text-[#17365D]">आपकी स्थिति (You)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[#17365D]"></span>
            <span className="font-semibold text-[#17365D]">कौशल केंद्र (Institutes)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-1 rounded-full border border-dashed border-[#287D73] bg-[#287D73]/20"></span>
            <span>कवरेज दायरा (Coverage)</span>
          </span>
        </div>

        <div className="text-[10px] text-[#287D73] font-bold">
          {trainingCenters.length > 0 ? `${trainingCenters.length} नजदीकी केंद्र मैप पर दर्शाए गए हैं` : 'स्थानीय अवसर सक्रिय हैं'}
        </div>
      </div>
    </div>
  );
};
