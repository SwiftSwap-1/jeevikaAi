import { BeneficiaryProfile, Pathway, EvaluatedPathway, Opportunity, ScoringFactor } from '../types';
import { PATHWAYS, EDU, JOBS, STAGE_TITLES } from '../data/mockData';

export const mobKey = (v?: string): 'near' | 'district' | 'state' => {
  if (!v) return 'near';
  if (v.includes('Nearby') || v.includes('पास') || v.includes('लगे')) return 'near';
  if (v.includes('district') || v.includes('जिला')) return 'district';
  return 'state';
};

export const REACH_KM: Record<'near' | 'district' | 'state', number> = {
  near: 10,
  district: 40,
  state: Infinity,
};

export const listOf = (a: string[]) => a.join(', ');

export function evaluatePathway(p: Pathway, prof: BeneficiaryProfile): EvaluatedPathway {
  const interests = (prof.interests || '').toLowerCase();
  const skillsTxt = ((prof.skills || '') + ' ' + (prof.occupation || '')).toLowerCase();

  const iHits = p.interestTags.filter((t) => interests.includes(t.toLowerCase()));
  const sHits = p.skillTags.filter((t) => skillsTxt.includes(t.toLowerCase()));

  const factors: ScoringFactor[] = [
    { k: 'base', label: 'Starting point', pts: 30, note: 'Every pathway starts from the same base score.' }
  ];

  if (iHits.length > 0) {
    const pts = 12 * Math.min(iHits.length, 3);
    factors.push({
      k: 'interest',
      label: 'Your interests',
      pts,
      short: 'matches your interest in ' + listOf(iHits.slice(0, 2)),
      note: 'You mentioned ' + listOf(iHits) + ', which this pathway builds on.'
    });
  } else {
    factors.push({
      k: 'interest',
      label: 'Your interests',
      pts: 0,
      note: 'No direct match with the interests you shared.'
    });
  }

  if (sHits.length > 0) {
    const pts = 6 * Math.min(sHits.length, 3);
    factors.push({
      k: 'skills',
      label: 'Skills you already have',
      pts,
      short: 'builds on your skills in ' + listOf(sHits.slice(0, 2)),
      note: 'Your profile includes ' + listOf(sHits) + ', which help in this pathway.'
    });
  } else {
    factors.push({
      k: 'skills',
      label: 'Skills you already have',
      pts: 0,
      note: 'None of your listed skills overlap yet. Training would start from the basics.'
    });
  }

  const ei = Math.max(0, EDU.findIndex((e) => e.v === prof.education));
  if (ei >= p.minEdu) {
    factors.push({
      k: 'edu',
      label: 'Education',
      pts: 8,
      short: 'suits your education level',
      note: 'Your education (' + (EDU[ei]?.v || prof.education) + ') meets the usual entry level.'
    });
  } else {
    factors.push({
      k: 'edu',
      label: 'Education',
      pts: -6,
      note: 'This pathway usually expects ' + (EDU[p.minEdu]?.v || 'higher qualification') + ' or above.'
    });
  }

  const pref = prof.workType;
  const has = (k: 'job' | 'self') => p.workTypes.includes(k);

  if (pref === 'Job' || pref === 'नौकरी' || pref === 'नौकरी / काम') {
    factors.push(has('job')
      ? { k: 'work', label: 'Work type', pts: 8, short: 'leads to jobs', note: 'You prefer a job and this pathway leads to salaried roles.' }
      : { k: 'work', label: 'Work type', pts: 0, note: 'This pathway mostly leads to self-employment.' }
    );
  } else if (pref === 'Self-employment' || pref === 'स्वरोजगार' || pref === 'खुद के काम / रोजगार') {
    factors.push(has('self')
      ? { k: 'work', label: 'Work type', pts: 8, short: 'can lead to your own work', note: 'You prefer self-employment and this pathway supports it.' }
      : { k: 'work', label: 'Work type', pts: 0, note: 'This pathway mostly leads to salaried roles.' }
    );
  } else {
    factors.push({
      k: 'work',
      label: 'Work type',
      pts: has('job') && has('self') ? 8 : 5,
      short: has('job') && has('self') ? 'offers both jobs and self-employment' : null,
      note: has('job') && has('self') ? 'You are open to either, and this pathway offers both.' : 'You are open to either, and this pathway offers one of them.'
    });
  }

  const mk = mobKey(prof.mobility);
  const mt = {
    near: { local: 8, regional: 0 },
    district: { local: 6, regional: 4 },
    state: { local: 4, regional: 8 },
  };
  const mpts = mt[mk][p.reach];
  const mnote = p.reach === 'local'
    ? (mk === 'near' ? 'Most work for this pathway is available close to home, which matches your nearby preference.' : 'Work for this pathway is available locally, and you can also travel further.')
    : (mk === 'near' ? 'Installation work can involve travel beyond your nearby preference.' : 'This pathway involves travel, which fits your wider travel range.');

  factors.push({
    k: 'mobility',
    label: 'Travel range',
    pts: mpts,
    short: mpts >= 8 ? (p.reach === 'local' ? 'can be done close to home' : 'fits your travel range') : null,
    note: mnote
  });

  factors.push({
    k: 'demand',
    label: 'Local demand signal',
    pts: p.demand,
    note: p.demandNote + '. This is an illustrative signal, not live data.'
  });

  const raw = factors.reduce((s, x) => s + x.pts, 0);
  const score = Math.max(20, Math.min(98, raw));

  const order = ['interest', 'skills', 'mobility', 'work', 'edu'];
  const shorts = order
    .map((k) => factors.find((x) => x.k === k))
    .filter((x): x is ScoringFactor => Boolean(x && x.pts > 0 && x.short))
    .slice(0, 2)
    .map((x) => x.short);

  const fit = shorts.length
    ? 'Fits because it ' + shorts.join(' and ') + '.'
    : 'Shown as a general option for your profile.';

  return { ...p, score, raw, factors, fit };
}

export function rankPaths(prof: BeneficiaryProfile): EvaluatedPathway[] {
  return PATHWAYS.map((p) => evaluatePathway(p, prof)).sort((a, b) => b.score - a.score);
}

export function rankJobs(
  prof: BeneficiaryProfile,
  ranked: EvaluatedPathway[],
  sourceJobs?: Opportunity[]
): Opportunity[] {
  let jobList: Opportunity[];
  if (sourceJobs && sourceJobs.length > 0) {
    jobList = sourceJobs;
  } else {
    // Dynamically localize fallback jobs to user's district if sourceJobs is not yet supplied
    const rawLoc = prof.location ? prof.location.split(',')[0].replace(/ज़िला|जिला|district/gi, '').trim() : '';
    const userDistrict = rawLoc && rawLoc.toLowerCase() !== 'maharajganj' ? rawLoc : null;
    jobList = userDistrict
      ? JOBS.map((j) => ({
          ...j,
          loc: j.loc.replace(/Maharajganj town/gi, `${userDistrict} Market`).replace(/Maharajganj/gi, userDistrict),
          org: j.org.replace(/Maharajganj/gi, userDistrict),
          source: j.source.replace(/Maharajganj/gi, userDistrict),
          contactInfo: j.contactInfo ? j.contactInfo.replace(/Maharajganj/gi, userDistrict) : undefined,
        }))
      : JOBS;
  }
  const sc = Object.fromEntries(ranked.map((p) => [p.id, p.score]));
  const lim = REACH_KM[mobKey(prof.mobility)] ?? 50;
  return jobList.map((j) => ({
    ...j,
    score: j.score ?? sc[j.path] ?? 50,
    inRange: typeof j.km === 'number' ? j.km <= lim : true
  })).sort((a, b) => {
    const rangeDiff = (b.inRange ? 1 : 0) - (a.inRange ? 1 : 0);
    if (rangeDiff !== 0) return rangeDiff;
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (a.km ?? 0) - (b.km ?? 0);
  });
}

export const pathName = (id: string): string => {
  return (PATHWAYS.find((p) => p.id === id) || {}).name || '';
};

export const splitList = (s?: string): string[] => {
  return (s || '').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
};

export const slug = (s?: string): string => {
  return (s || 'beneficiary').trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'beneficiary';
};

export const kmLabel = (j: Opportunity): string => {
  return j.km === 0 ? 'At your location' : `About ${j.km} km away`;
};

export function buildSummary(
  profile: BeneficiaryProfile,
  ranked: EvaluatedPathway[],
  jobs: Opportunity[],
  selId: string,
  shortlist: Record<string, boolean>
): string {
  const lines: string[] = [];
  const sel = ranked.find((p) => p.id === selId) || ranked[0];

  lines.push('JEEVIKAAI LIVELIHOOD SUMMARY');
  lines.push('VOICE-FIRST CIVIC LIVELIHOOD ROADMAP');
  lines.push('Generated: ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
  lines.push('');
  lines.push('IMPORTANT: Recommendations, course details, NSQF levels and job listings in this');
  lines.push('summary are illustrative demo data. They are not verified live listings or');
  lines.push('official certifications.' + (profile.isDemo ? ' The beneficiary below is fictional sample data.' : ''));
  lines.push('');
  lines.push('BENEFICIARY PROFILE');
  lines.push('Name: ' + profile.name);
  lines.push('Location: ' + profile.location);
  lines.push('Education: ' + profile.education);
  lines.push('Existing skills: ' + (profile.skills || 'Not shared'));
  lines.push('Interests: ' + (profile.interests || 'Not shared'));
  lines.push('Current occupation: ' + (profile.occupation || 'Not shared'));
  lines.push('Preferred work type: ' + profile.workType);
  lines.push('Mobility preference: ' + profile.mobility);
  lines.push('');
  lines.push('TOP SKILL PATHWAYS (rule-based demo scoring, not a trained model)');
  ranked.slice(0, 3).forEach((p, i) => {
    lines.push(`${i + 1}. ${p.name} - fit score ${p.score}/100`);
    lines.push(`   Role: ${p.role}`);
    lines.push(`   Duration: ${p.duration}`);
    lines.push(`   Sample NSQF level: ${p.nsqf}`);
    lines.push(`   ${p.fit}`);
    p.factors
      .filter((x) => x.k !== 'base')
      .forEach((x) => lines.push(`   - ${x.label} (${x.pts > 0 ? '+' : ''}${x.pts}): ${x.note}`));
    lines.push('');
  });
  lines.push('LEARNING ROADMAP: ' + sel.name);
  sel.stages.forEach((s, i) => lines.push(`${i + 1}. ${STAGE_TITLES[i]} (${s[2]}): ${s[0]}. ${s[1]}`));
  lines.push('');
  lines.push('SAMPLE LOCAL OPPORTUNITIES (illustrative)');
  jobs.forEach((j) => {
    lines.push(
      `- ${j.title} | ${j.org} | ${j.type} | ${j.loc} | ${kmLabel(j)} | ${j.pay}` +
      (j.inRange ? '' : ' | Outside your nearby range') +
      (shortlist[j.id] ? ' | SHORTLISTED' : '')
    );
  });
  lines.push('');
  lines.push('Generated by JeevikaAI — an independent vocational and skilling roadmap platform.');
  return lines.join('\n');
}
