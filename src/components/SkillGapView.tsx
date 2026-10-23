import React, { useState } from 'react';
import { Icon } from './Icons';
import { BeneficiaryProfile, Pathway } from '../types';
import { PATHWAYS } from '../data/mockData';
import { splitList } from '../services/recommendationEngine';

interface SkillGapViewProps {
  profile: BeneficiaryProfile;
  go: (route: string) => void;
}

export const SkillGapView: React.FC<SkillGapViewProps> = ({ profile, go }) => {
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>(PATHWAYS[0].id);
  const selectedPathway = PATHWAYS.find((p) => p.id === selectedPathwayId) || PATHWAYS[0];

  const userSkills = splitList(profile.skills).map((s) => s.toLowerCase());

  // Analyze skill overlap vs gap
  const matchedSkills: string[] = [];
  const gapSkills: string[] = [];

  selectedPathway.skillTags.forEach((tag) => {
    // Only pick english unique tags for clean display
    if (/^[a-zA-Z\s]+$/.test(tag)) {
      if (userSkills.some((us) => us.includes(tag.toLowerCase()) || tag.toLowerCase().includes(us))) {
        if (!matchedSkills.includes(tag)) matchedSkills.push(tag);
      } else {
        if (!gapSkills.includes(tag)) gapSkills.push(tag);
      }
    }
  });

  const readinessScore = Math.round(
    (matchedSkills.length / Math.max(1, matchedSkills.length + gapSkills.length)) * 100
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DCE3EA] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9822B]/15 text-[#D9822B] mb-2">
            <Icon name="layers" size={14} />
            <span>NSQF Readiness &amp; Bridge Modules</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#17365D]">
            Skill-Gap Analysis · कौशल अंतर विश्लेषण
          </h1>
          <p className="text-sm text-[#5F6B76] mt-1">
            Compare your current abilities against required competencies for NSQF-aligned pathways.
          </p>
        </div>

        <button
          onClick={() => go('assessment')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245A91] text-white text-xs font-bold hover:bg-[#17365D] transition-colors shadow-sm"
        >
          <Icon name="edit" size={16} />
          Update Skills in Profile
        </button>
      </div>

      {/* Pathway Switcher */}
      <div className="flex items-center gap-2 pb-6 overflow-x-auto text-xs font-bold">
        {PATHWAYS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPathwayId(p.id)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              selectedPathwayId === p.id
                ? 'bg-[#17365D] text-white shadow-sm'
                : 'bg-[#F5F7FA] text-[#5F6B76] border border-[#DCE3EA] hover:border-[#245A91]'
            }`}
          >
            {p.name} (NSQF Level {p.nsqf})
          </button>
        ))}
      </div>

      {/* Readiness Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white border border-[#DCE3EA] rounded-2xl shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#5F6B76] uppercase tracking-wider">
            Pathway Readiness
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#17365D] font-['Bricolage_Grotesque']">
              {readinessScore}%
            </span>
            <span className="text-xs text-[#287D73] font-semibold">
              {readinessScore > 50 ? 'Strong foundation' : 'Foundation to build'}
            </span>
          </div>
          <div className="w-full bg-[#F5F7FA] h-2 rounded-full overflow-hidden border border-[#DCE3EA]">
            <div
              className="bg-[#287D73] h-full rounded-full"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
        </div>

        <div className="p-6 bg-white border border-[#DCE3EA] rounded-2xl shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#5F6B76] uppercase tracking-wider">
            Skills You Already Have
          </div>
          <div className="text-4xl font-extrabold text-[#287D73] font-['Bricolage_Grotesque']">
            {matchedSkills.length}
          </div>
          <p className="text-xs text-[#5F6B76]">
            Transferable skills identified from your spoken assessment.
          </p>
        </div>

        <div className="p-6 bg-white border border-[#DCE3EA] rounded-2xl shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#5F6B76] uppercase tracking-wider">
            Bridge Modules Needed
          </div>
          <div className="text-4xl font-extrabold text-[#D9822B] font-['Bricolage_Grotesque']">
            {gapSkills.length}
          </div>
          <p className="text-xs text-[#5F6B76]">
            Estimated {selectedPathway.duration.split(' (')[0]} of targeted training.
          </p>
        </div>
      </div>

      {/* Side-by-Side Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Acquired Skills */}
        <div className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#287D73] font-bold text-base">
            <Icon name="check" size={18} />
            <span>Skills You Already Have (पहले से मौजूद हुनर)</span>
          </div>

          <div className="space-y-2">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((s) => (
                <div
                  key={s}
                  className="p-3 bg-[#F5F7FA] border border-[#DCE3EA] rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-[#17365D] capitalize">{s}</span>
                  <span className="text-[11px] font-semibold text-[#287D73]">✓ Verified Match</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#5F6B76] italic">
                None of your current skills directly overlap with this pathway yet. Training starts from the absolute basics.
              </p>
            )}
          </div>
        </div>

        {/* Bridge Skills */}
        <div className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#D9822B] font-bold text-base">
            <Icon name="bulb" size={18} />
            <span>Recommended Bridge Modules (सीखने योग्य कौशल)</span>
          </div>

          <div className="space-y-2">
            {gapSkills.map((s, idx) => (
              <div
                key={s}
                className="p-3 bg-[#F5F7FA] border border-[#DCE3EA] rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-[#17365D] capitalize">{s}</span>
                  <div className="text-[10px] text-[#5F6B76]">
                    Covered in Stage {Math.min(3, idx + 1)} of {selectedPathway.name}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#D9822B]">Recommended</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
