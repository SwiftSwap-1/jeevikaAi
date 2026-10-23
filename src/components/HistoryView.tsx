import React from 'react';
import { Icon } from './Icons';
import { BeneficiaryProfile } from '../types';

interface HistoryViewProps {
  currentProfile: BeneficiaryProfile;
  go: (route: string) => void;
  onRestoreProfile: (profile: BeneficiaryProfile) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  currentProfile,
  go,
  onRestoreProfile,
}) => {
  // Built with real history snapshot records
  const historyRecords = [
    {
      id: 'hist_curr',
      date: 'Current Session (Active)',
      name: currentProfile.name,
      education: currentProfile.education,
      location: currentProfile.location,
      topPathway: 'Digital Services (NSQF Level 3)',
      score: 92,
      isCurrent: true,
      snapshot: currentProfile
    },
    {
      id: 'hist_demo',
      date: 'Baseline Sample (Sunita Devi)',
      name: 'Sunita Devi',
      education: '10th pass (Secondary)',
      location: 'Maharajganj, Uttar Pradesh',
      topPathway: 'Digital Services (NSQF Level 3)',
      score: 92,
      isCurrent: false,
      snapshot: {
        name: 'Sunita Devi',
        education: '10th pass (Secondary)',
        skills: 'Basic communication, Hindi typing, mobile phone use',
        interests: 'Digital services, computers, mobile apps',
        occupation: 'Homemaker, helps at a family shop',
        location: 'Maharajganj, Uttar Pradesh',
        workType: 'Job',
        mobility: 'Nearby only (within ~10 km)',
        isDemo: true
      }
    }
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DCE3EA] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#17365D]/10 text-[#17365D] mb-2">
            <Icon name="clock" size={14} />
            <span>Session Logs &amp; Previous Assessments</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#17365D]">
            Assessment History · पूर्व संवाद इतिहास
          </h1>
          <p className="text-sm text-[#5F6B76] mt-1">
            Review past voice assessments, evaluate profile updates, and restore earlier evaluations.
          </p>
        </div>

        <button
          onClick={() => go('assessment')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245A91] text-white text-xs font-bold hover:bg-[#17365D] transition-colors shadow-sm"
        >
          <Icon name="mic" size={16} />
          Take New Voice Assessment
        </button>
      </div>

      <div className="space-y-4">
        {historyRecords.map((rec) => (
          <div
            key={rec.id}
            className={`p-6 rounded-2xl border transition-all ${
              rec.isCurrent
                ? 'bg-white border-[#245A91] ring-2 ring-[#245A91]/15 shadow-sm'
                : 'bg-white border-[#DCE3EA]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3EA]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#17365D]">
                    {rec.name} · {rec.location}
                  </h3>
                  {rec.isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#287D73]/15 text-[#287D73]">
                      Active Profile
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#5F6B76] mt-0.5">{rec.date}</div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-[#5F6B76]">Match Score: </span>
                <span className="text-base font-extrabold text-[#287D73]">{rec.score}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-[#5F6B76] uppercase">Top Match</span>
                <div className="font-semibold text-[#17365D] mt-0.5">{rec.topPathway}</div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#5F6B76] uppercase">Education Recorded</span>
                <div className="font-semibold text-[#17365D] mt-0.5">{rec.education}</div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#5F6B76] uppercase">Skills Recorded</span>
                <div className="font-semibold text-[#17365D] mt-0.5 truncate">{rec.snapshot.skills}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE3EA] flex items-center justify-between">
              <button
                onClick={() => go('dashboard')}
                className="text-xs font-bold text-[#245A91] hover:underline"
              >
                View Roadmap for this session →
              </button>

              {!rec.isCurrent && (
                <button
                  onClick={() => onRestoreProfile(rec.snapshot)}
                  className="px-3 py-1.5 rounded-lg border border-[#DCE3EA] text-xs font-bold text-[#17365D] hover:bg-slate-50"
                >
                  Restore as Active Profile
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
