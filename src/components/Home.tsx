import React, { useState } from 'react';
import { Icon } from './Icons';
import { DEMO, PATHWAYS } from '../data/mockData';
import { evaluatePathway, rankJobs } from '../services/recommendationEngine';
import { AppView, SupportedLanguage } from '../types';
import { PWAInstallStatusButton } from './PWAInstallStatusButton';
import { VoiceStartModal } from './VoiceStartModal';

interface HomeProps {
  go: (view: AppView, sectionId?: string) => void;
  onLoadDemo: () => void;
  onStartVoiceAssessment?: (lang: SupportedLanguage) => void;
  currentLang?: SupportedLanguage;
}

export const Home: React.FC<HomeProps> = ({
  go,
  onLoadDemo,
  onStartVoiceAssessment,
  currentLang = 'hi',
}) => {
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const previewPaths = PATHWAYS.map((p) => evaluatePathway(p, DEMO)).sort((a, b) => b.score - a.score);
  const previewJobs = rankJobs(DEMO, previewPaths).slice(0, 2);

  const handleStartVoice = () => {
    setShowVoiceModal(true);
  };

  const handleConfirmVoice = (lang: SupportedLanguage) => {
    setShowVoiceModal(false);
    if (onStartVoiceAssessment) {
      onStartVoiceAssessment(lang);
    } else {
      go('assessment');
    }
  };

  const pillars = [
    {
      icon: 'mic',
      color: 'bg-[#17365D]/10 text-[#17365D]',
      title: 'Automatic Spoken Dialogue',
      desc: 'No forms to fill out. The assistant asks questions aloud and automatically advances as you speak in Hindi, Bhojpuri, or English.',
      tags: ['Voice-First', 'Bhojpuri + Hindi', 'Text Alternative']
    },
    {
      icon: 'layers',
      color: 'bg-[#287D73]/15 text-[#287D73]',
      title: 'NSQF-Aligned Skill Roadmaps',
      desc: 'Transparent scoring algorithms map your existing abilities to certified National Skills Qualifications Framework pathways.',
      tags: ['Explainable Scores', 'NSQF Levels 3-4', 'Stage Milestones']
    },
    {
      icon: 'pin',
      color: 'bg-[#D9822B]/15 text-[#D9822B]',
      title: 'Verified Local Opportunities',
      desc: 'Connecting you with certified PMKVY training centers, community seva counters, and nearby micro-enterprises within your travel range.',
      tags: ['Nearby (≤10 km)', 'District (≤40 km)', 'Verified Listings']
    }
  ];

  return (
    <main>
      {/* Voice Start Confirmation Popup */}
      <VoiceStartModal
        isOpen={showVoiceModal}
        currentLang={currentLang}
        onClose={() => setShowVoiceModal(false)}
        onConfirm={handleConfirmVoice}
      />

      {/* Civic White & Navy Hero Section */}
      <section className="bg-white border-b border-[#DCE3EA] py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#F5F7FA] text-[#17365D] border border-[#DCE3EA]">
                <span className="w-2 h-2 rounded-full bg-[#287D73]" />
                <span>Voice-First Livelihood &amp; Skill Guidance</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#17365D] tracking-tight leading-[1.15]">
                <span>Your Skills.</span>{' '}
                <span className="text-[#245A91] block sm:inline">Your Language.</span>{' '}
                <span className="block text-[#17365D]">Your Livelihood.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#5F6B76] max-w-xl leading-relaxed">
                JeevikaAI bridges the digital barrier through natural spoken conversation in Hindi, Bhojpuri, and English. Speak your skills, education, and interests to receive structured training pathways and verified nearby opportunities.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <button
                  onClick={handleStartVoice}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#245A91] hover:bg-[#17365D] text-white font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  <Icon name="mic" size={18} />
                  <span>Start Voice Assessment (बोलकर शुरू करें)</span>
                </button>

                <button
                  onClick={() => go('opportunities')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#DCE3EA] hover:border-[#17365D] bg-white text-[#17365D] font-bold text-sm transition-colors"
                >
                  <span>Explore Jobs &amp; Training</span>
                  <Icon name="arrowR" size={16} />
                </button>
              </div>

              {/* Install App Button Checking Device Installation Status */}
              <div className="pt-1">
                <PWAInstallStatusButton />
              </div>

              {/* Proof / Assurance Points */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-xs font-semibold text-[#5F6B76]">
                <div className="flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-[#287D73]" />
                  <span>Free to use · No registration required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-[#287D73]" />
                  <span>Auditory readout for non-readers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-[#287D73]" />
                  <span>Installable offline-capable PWA</span>
                </div>
              </div>
            </div>

            {/* Right Clean Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="bg-[#F5F7FA] border border-[#DCE3EA] rounded-2xl p-6 shadow-sm space-y-5">
                {/* Beneficiary Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#17365D] text-white flex items-center justify-center font-bold text-base font-['Bricolage_Grotesque']">
                      S
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#17365D]">Sunita Devi</div>
                      <div className="text-xs text-[#5F6B76] flex items-center gap-1">
                        <Icon name="pin" size={12} /> Maharajganj, Uttar Pradesh
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF4DB] text-[#D9822B] border border-[#EBCB7A]">
                    Sample Roadmap
                  </span>
                </div>

                {/* Spoken Quote Bubble */}
                <div className="p-3 bg-white rounded-xl border border-[#DCE3EA] text-xs space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#245A91] flex items-center gap-1">
                    <Icon name="mic" size={12} /> Recognized Spoken Response
                  </div>
                  <div className="font-semibold text-[#202B36]">
                    “हम 10वीं पास बानी अउर गाँव के लगे कंप्यूटर काम सीखल चाहिला”
                  </div>
                </div>

                {/* Recommended Skill Pathways */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                    Top Matched Pathway
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-[#DCE3EA] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#17365D]">
                        {previewPaths[0].name}
                      </div>
                      <div className="text-xs text-[#5F6B76]">
                        {previewPaths[0].duration.split(' (')[0]} · Sample NSQF Level {previewPaths[0].nsqf}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-[#5F6B76]">Match: </span>
                      <span className="text-sm font-extrabold text-[#287D73]">{previewPaths[0].score}%</span>
                    </div>
                  </div>
                </div>

                {/* Nearby Livelihood Listings */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
                    Local Openings Near You
                  </div>
                  <div className="space-y-1.5">
                    {previewJobs.map((j) => (
                      <div
                        key={j.id}
                        className="p-2.5 bg-white rounded-xl border border-[#DCE3EA] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#17365D]">{j.title}</div>
                          <div className="text-[11px] text-[#5F6B76]">{j.loc} · {j.km} km</div>
                        </div>
                        <div className="font-bold text-[#287D73] text-[11px]">
                          {j.pay.split(' per')[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Demo Launcher */}
                <button
                  onClick={onLoadDemo}
                  className="w-full py-2.5 rounded-xl border border-[#DCE3EA] bg-white text-xs font-bold text-[#17365D] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Icon name="user" size={14} />
                  Load Sunita Devi's Full Roadmap
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-[#F5F7FA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <div className="text-xs uppercase font-extrabold tracking-widest text-[#245A91] mb-1">
              Public Service Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17365D]">
              Designed for First-Time Digital Citizens
            </h2>
            <p className="text-sm text-[#5F6B76] mt-2">
              JeevikaAI removes barriers of language, typing literacy, and bureaucratic forms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-sm space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.color}`}>
                  <Icon name={p.icon} size={20} />
                </div>
                <h3 className="text-base font-bold text-[#17365D]">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6B76] leading-relaxed">
                  {p.desc}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5F7FA] text-[#5F6B76] border border-[#DCE3EA]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four Step Roadmap */}
      <section className="py-16 bg-white border-t border-[#DCE3EA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <div className="text-xs uppercase font-extrabold tracking-widest text-[#245A91] mb-1">
              Structured Methodology
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17365D]">
              From Spoken Dialogue to Certified Next Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '01', title: 'Spoken Assessment', desc: 'Answer 8 simple questions by voice in Hindi, Bhojpuri, or English.' },
              { n: '02', title: 'Profile Extraction', desc: 'Skills, schooling, and travel preferences are structured without form-filling.' },
              { n: '03', title: 'Transparent Scoring', desc: 'NSQF pathways are evaluated with clear, explainable factor breakdowns.' },
              { n: '04', title: 'Local Connection', desc: 'Find certified training programs (PMKVY/RSETI) and nearby openings.' },
            ].map((step) => (
              <div
                key={step.n}
                className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#DCE3EA] space-y-2"
              >
                <span className="font-['Bricolage_Grotesque'] text-2xl font-black text-[#245A91]">
                  {step.n}
                </span>
                <h4 className="font-bold text-sm text-[#17365D]">
                  {step.title}
                </h4>
                <p className="text-xs text-[#5F6B76] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
