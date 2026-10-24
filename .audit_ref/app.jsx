const { useState, useEffect, useRef, useMemo } = React;

/* ================= Icons ================= */
const ICONS = {
  mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  arrowR: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
  arrowL: <><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>,
  check: <path d="M20 6 9 17l-5-5"/>,
  globe: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></>,
  briefcase: <><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
  cap: <><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>,
  chev: <path d="m6 9 6 6 6-6"/>,
  bulb: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  scissors: <><circle cx="6" cy="6" r="3"/><path d="M8.1 8.1 12 12"/><path d="M20 4 8.1 15.9"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></>,
  store: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
  monitor: <><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2"/>,
  keyboard: <><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 13h10"/></>,
  edit: <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>,
  clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  rupee: <><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3"/><path d="M9 13c6.7 0 6.7-10 0-10"/></>,
  layers: <><path d="m12 2-10 5 10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></>,
  info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  x: <path d="M18 6 6 18M6 6l12 12"/>,
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L8 14.2 3 9.3l6.9-1L12 2Z"/>,
  copy: <><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  route: <><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></>,
};
function Icon({ name, size = 20, sw = 2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', ...style }}>
      {ICONS[name]}
    </svg>
  );
}

/* ================= Logo ================= */
function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={Math.round(size * 44 / 48)} viewBox="0 0 48 44" fill="none" aria-hidden="true">
      <path d="M19 41C19 41 6 28 6 18a13 13 0 0 1 26 0C32 28 19 41 19 41Z" fill="#1479BD"/>
      <circle cx="19" cy="18" r="8.5" fill="#fff"/>
      <rect x="17.1" y="12.2" width="3.8" height="7.2" rx="1.9" fill="#163A63"/>
      <path d="M14.9 17.6a4.1 4.1 0 0 0 8.2 0" stroke="#163A63" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M19 21.7v2" stroke="#163A63" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M30.5 12 40 8.5 43 21.5 36 32.5M43 21.5 31.5 24" stroke="#18A999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="40" cy="8.5" r="3" fill="#18A999"/>
      <circle cx="43" cy="21.5" r="2.6" fill="#18A999"/>
      <circle cx="36" cy="32.5" r="2.4" fill="#18A999"/>
    </svg>
  );
}
function Logo({ onClick, inverse }) {
  return (
    <button className={'logo' + (inverse ? ' inverse' : '')} onClick={onClick} aria-label="JeevikaAI home">
      <LogoMark />
      <span className="logo-text">Jeevika<b>AI</b></span>
    </button>
  );
}

/* ================= Data ================= */
const EDU = [
  { v: 'Below 8th class', hi: 'आठवीं से कम', kw: ['below 8', 'not studied', 'आठवीं से कम', 'पढ़ाई नहीं'] },
  { v: '8th class pass', hi: '8वीं पास', kw: ['8th', 'eighth', 'आठवीं', '8वीं'] },
  { v: '10th pass (Secondary)', hi: '10वीं पास', kw: ['10th', 'tenth', 'matric', 'secondary', 'दसवीं', '10वीं', 'दसवी'] },
  { v: '12th pass (Higher Secondary)', hi: '12वीं पास', kw: ['12th', 'twelfth', 'intermediate', 'बारहवीं', '12वीं'] },
  { v: 'Graduate', hi: 'स्नातक', kw: ['graduate', 'graduation', 'degree', 'स्नातक'] },
  { v: 'ITI / Diploma', hi: 'ITI / डिप्लोमा', kw: ['iti', 'diploma', 'डिप्लोमा'] },
];
const WORK = [
  { v: 'Job', hi: 'नौकरी', kw: ['job', 'naukri', 'नौकरी'] },
  { v: 'Self-employment', hi: 'स्वरोजगार', kw: ['self', 'own', 'business', 'apna', 'khud', 'अपना', 'स्वरोजगार'] },
  { v: 'Either', hi: 'कोई भी', kw: ['either', 'any', 'both', 'dono', 'कोई भी', 'दोनों'] },
];
const MOB = [
  { v: 'Nearby only (within ~10 km)', hi: 'पास में ही (लगभग 10 किमी तक)', kw: ['near', 'close', 'paas', 'local', 'village', 'पास', 'नजदीक', 'गाँव', 'गांव'] },
  { v: 'Within my district', hi: 'मेरे जिले में', kw: ['district', 'zila', 'city', 'जिला', 'जिले', 'शहर'] },
  { v: 'Anywhere in the state', hi: 'राज्य में कहीं भी', kw: ['state', 'anywhere', 'kahin bhi', 'far', 'कहीं भी', 'राज्य'] },
];
const SKILL_CHIPS = [
  { en: 'Typing', hi: 'टाइपिंग' }, { en: 'Stitching', hi: 'सिलाई' }, { en: 'Cooking', hi: 'खाना बनाना' },
  { en: 'Using a phone', hi: 'मोबाइल चलाना' }, { en: 'Basic communication', hi: 'बातचीत करना' }, { en: 'Accounts and billing', hi: 'हिसाब-किताब' },
];
const INTEREST_CHIPS = [
  { en: 'Digital services', hi: 'डिजिटल सेवाएँ' }, { en: 'Computers', hi: 'कंप्यूटर' }, { en: 'Shop and sales', hi: 'दुकान और बिक्री' },
  { en: 'Solar energy', hi: 'सोलर ऊर्जा' }, { en: 'Tailoring', hi: 'सिलाई-कढ़ाई' },
];

const DEMO = {
  name: 'Sunita Devi',
  education: '10th pass (Secondary)',
  skills: 'Basic communication, Hindi typing, mobile phone use',
  interests: 'Digital services, computers, mobile apps',
  occupation: 'Homemaker, helps at a family shop',
  location: 'Maharajganj, Uttar Pradesh',
  workType: 'Job',
  mobility: 'Nearby only (within ~10 km)',
};
const FIELDS = Object.keys(DEMO);
const isDemoProfile = (p) => FIELDS.every((k) => (p[k] || '') === DEMO[k]);

const STEPS = [
  { key: 'name', type: 'text', label: 'Name',
    q: { en: 'What is your name?', hi: 'आपका नाम क्या है?', hin: 'Aapka naam kya hai?' },
    ph: { en: 'For example: Sunita Devi', hi: 'जैसे: सुनीता देवी', hin: 'Jaise: Sunita Devi' } },
  { key: 'education', type: 'choice', options: EDU, label: 'Education',
    q: { en: 'How far did you study?', hi: 'आपने कहाँ तक पढ़ाई की है?', hin: 'Aapne kahan tak padhai ki hai?' } },
  { key: 'skills', type: 'area', chips: SKILL_CHIPS, label: 'Existing skills',
    q: { en: 'What can you already do? For example typing, stitching, cooking or using a phone.', hi: 'आप पहले से क्या-क्या कर सकते हैं? जैसे टाइपिंग, सिलाई, खाना बनाना या मोबाइल चलाना।', hin: 'Aap pehle se kya-kya kar sakte hain? Jaise typing, silai, cooking ya mobile chalana.' },
    ph: { en: 'Type or tap the skills you have', hi: 'अपनी योग्यताएँ लिखें या चुनें', hin: 'Apni skills likhein ya chunein' } },
  { key: 'interests', type: 'area', chips: INTEREST_CHIPS, label: 'Interests',
    q: { en: 'What kind of work interests you?', hi: 'आपको किस तरह के काम में रुचि है?', hin: 'Aapko kis tarah ke kaam mein ruchi hai?' },
    ph: { en: 'Type or tap what interests you', hi: 'अपनी रुचि लिखें या चुनें', hin: 'Apni ruchi likhein ya chunein' } },
  { key: 'occupation', type: 'text', optional: true, label: 'Current occupation',
    q: { en: 'What do you do at the moment? (optional)', hi: 'अभी आप क्या काम करते हैं? (वैकल्पिक)', hin: 'Abhi aap kya kaam karte hain? (optional)' },
    ph: { en: 'For example: homemaker, farm work, student', hi: 'जैसे: गृहिणी, खेती, विद्यार्थी', hin: 'Jaise: homemaker, kheti, student' } },
  { key: 'location', type: 'text', label: 'District or location',
    q: { en: 'Which district or town do you live in?', hi: 'आप किस जिले या कस्बे में रहते हैं?', hin: 'Aap kis zile ya kasbe mein rehte hain?' },
    ph: { en: 'For example: Maharajganj, Uttar Pradesh', hi: 'जैसे: महराजगंज, उत्तर प्रदेश', hin: 'Jaise: Maharajganj, Uttar Pradesh' } },
  { key: 'workType', type: 'choice', options: WORK, label: 'Preferred work type',
    q: { en: 'Would you like a job or to start your own work?', hi: 'आप नौकरी करना चाहते हैं या अपना काम शुरू करना चाहते हैं?', hin: 'Aap naukri karna chahte hain ya apna kaam shuru karna?' } },
  { key: 'mobility', type: 'choice', options: MOB, label: 'Mobility preference',
    q: { en: 'How far can you travel for work?', hi: 'काम के लिए आप कितनी दूर जा सकते हैं?', hin: 'Kaam ke liye aap kitni door ja sakte hain?' } },
];
const LANGS = [
  { k: 'hi', label: 'हिन्दी', sub: 'Hindi', code: 'hi-IN' },
  { k: 'en', label: 'English', sub: 'English', code: 'en-IN' },
  { k: 'hin', label: 'Hinglish', sub: 'Hindi + English', code: 'en-IN' },
];
const EXAMPLES = {
  hi: [
    { q: 'आपका नाम क्या है?', a: 'मेरा नाम सुनीता देवी है।', en: 'What is your name? / My name is Sunita Devi.' },
    { q: 'आपको किस तरह के काम में रुचि है?', a: 'मुझे कंप्यूटर और मोबाइल पर काम सीखना है।', en: 'What work interests you? / I want to learn work on computers and mobiles.' },
    { q: 'काम के लिए आप कितनी दूर जा सकते हैं?', a: 'मैं अपने गाँव के पास ही काम करना चाहती हूँ।', en: 'How far can you travel? / I want to work near my village.' },
  ],
  hin: [
    { q: 'Aapka naam kya hai?', a: 'Mera naam Sunita Devi hai.', en: 'What is your name? / My name is Sunita Devi.' },
    { q: 'Aapko kis tarah ke kaam mein ruchi hai?', a: 'Mujhe computer aur mobile ka kaam seekhna hai.', en: 'What work interests you? / I want to learn computer and mobile work.' },
    { q: 'Kaam ke liye aap kitni door ja sakte hain?', a: 'Main gaon ke paas hi kaam karna chahti hoon.', en: 'How far can you travel? / I want to work near my village.' },
  ],
};

/* Skill pathways: illustrative demo data, not official course listings */
const PATHWAYS = [
  { id: 'digital', name: 'Digital Services', hi: 'डिजिटल सेवाएँ', role: 'Digital Service Assistant or Data Entry Operator', icon: 'monitor',
    duration: '3 months (about 240 hours)', nsqf: 3, minEdu: 2, workTypes: ['job', 'self'], reach: 'local', demand: 10,
    demandNote: 'Towns and villages need more help with online forms, bill payment and e-services',
    interestTags: ['digital', 'computer', 'mobile', 'online', 'internet', 'typing', 'data entry', 'डिजिटल', 'कंप्यूटर', 'मोबाइल', 'इंटरनेट', 'ऑनलाइन', 'टाइपिंग'],
    skillTags: ['typing', 'computer', 'mobile', 'phone', 'internet', 'communication', 'excel', 'टाइपिंग', 'कंप्यूटर', 'मोबाइल', 'बातचीत'],
    stages: [
      ['Computer and phone basics', 'Learn to use a computer and smartphone with confidence. Practise typing in Hindi and English and stay safe online.', 'Weeks 1 to 4'],
      ['Online services practice', 'Practise online forms, bill payment, digital payments and simple spreadsheets with a mentor.', 'Weeks 5 to 9'],
      ['Find your first role', 'Apply for assistant roles at service counters, or plan a small digital seva counter of your own.', 'Weeks 10 to 12'],
    ] },
  { id: 'retail', name: 'Retail Operations', hi: 'रिटेल संचालन', role: 'Retail Sales Associate', icon: 'store',
    duration: '2 months (about 160 hours)', nsqf: 3, minEdu: 1, workTypes: ['job', 'self'], reach: 'local', demand: 6,
    demandNote: 'Local markets and stores keep hiring counter and billing staff',
    interestTags: ['retail', 'shop', 'sales', 'selling', 'customer', 'market', 'store', 'dukaan', 'दुकान', 'बिक्री', 'ग्राहक'],
    skillTags: ['communication', 'customer', 'sales', 'shop', 'store', 'billing', 'accounts', 'selling', 'हिसाब', 'दुकान', 'बातचीत'],
    stages: [
      ['Customer service basics', 'Learn greeting, listening and product knowledge. Practise explaining prices and handling common questions.', 'Weeks 1 to 3'],
      ['Counter and stock skills', 'Practise billing apps, stock counting, shelf display and handling returns politely.', 'Weeks 4 to 6'],
      ['Find your first role', 'Apply for shop assistant or billing roles nearby, or run a small store counter.', 'Weeks 7 to 8'],
    ] },
  { id: 'solar', name: 'Solar PV Installation', hi: 'सोलर पैनल इंस्टॉलेशन', role: 'Solar PV Installer Helper', icon: 'sun',
    duration: '3 to 4 months (about 300 hours)', nsqf: 4, minEdu: 2, workTypes: ['job'], reach: 'regional', demand: 12,
    demandNote: 'Rooftop solar installations are growing across the region',
    interestTags: ['solar', 'electric', 'wiring', 'energy', 'repair', 'सोलर', 'बिजली', 'ऊर्जा'],
    skillTags: ['wiring', 'electric', 'repair', 'technical', 'tools', 'सोलर', 'बिजली'],
    stages: [
      ['Safety and electrical basics', 'Learn site safety, working at height and basic electrical ideas such as current, voltage and wiring.', 'Weeks 1 to 5'],
      ['Panel mounting and wiring', 'Practise mounting panels, cable routing and inverter connections under supervision.', 'Weeks 6 to 13'],
      ['Join an installation crew', 'Start as a helper with a regional installer and grow towards a technician role.', 'Weeks 14 to 16'],
    ] },
  { id: 'tailoring', name: 'Tailoring and Garment Making', hi: 'सिलाई और परिधान निर्माण', role: 'Sewing Machine Operator or Home Tailor', icon: 'scissors',
    duration: '3 months (about 240 hours)', nsqf: 3, minEdu: 0, workTypes: ['job', 'self'], reach: 'local', demand: 2,
    demandNote: 'Steady local demand for blouses, uniforms and alterations',
    interestTags: ['tailor', 'stitch', 'sewing', 'silai', 'garment', 'embroidery', 'सिलाई', 'कढ़ाई', 'दर्जी'],
    skillTags: ['stitch', 'sewing', 'tailor', 'silai', 'embroidery', 'सिलाई', 'कढ़ाई'],
    stages: [
      ['Machine and measurement basics', 'Learn machine handling, taking measurements and basic stitches.', 'Weeks 1 to 4'],
      ['Cutting and finishing', 'Practise cutting, blouse and uniform patterns, and neat finishing.', 'Weeks 5 to 9'],
      ['Take your first orders', 'Start home-based orders or work as a helper at a local tailoring shop.', 'Weeks 10 to 12'],
    ] },
];
const STAGE_TITLES = ['Start Learning', 'Build Skills', 'Explore Opportunities'];

/* Sample opportunities: fictional, illustrative, not live listings */
const JOBS = [
  { id: 'j1', title: 'Digital Service Assistant', org: 'Community service counter', type: 'Job', loc: 'Maharajganj town', km: 4, pay: '₹8,000 to ₹12,000 per month', path: 'digital' },
  { id: 'j2', title: 'Data Entry Operator (part-time)', org: 'Local coaching centre', type: 'Job', loc: 'Maharajganj town', km: 6, pay: '₹6,000 to ₹9,000 per month', path: 'digital' },
  { id: 'j3', title: 'Start a Digital Seva Counter', org: 'Self-employment idea', type: 'Self-employment', loc: 'Your own village or ward', km: 0, pay: '₹8,000 to ₹18,000 per month (varies)', path: 'digital' },
  { id: 'j4', title: 'Retail Sales Associate', org: 'General store', type: 'Job', loc: 'Maharajganj market', km: 3, pay: '₹7,000 to ₹10,000 per month', path: 'retail' },
  { id: 'j5', title: 'Billing Counter Executive', org: 'Supermarket outlet', type: 'Job', loc: 'Gorakhpur city', km: 55, pay: '₹10,000 to ₹14,000 per month', path: 'retail' },
  { id: 'j6', title: 'Solar Installation Helper', org: 'Regional solar installer', type: 'Job', loc: 'Across Maharajganj district', km: 35, pay: '₹9,000 to ₹14,000 per month', path: 'solar' },
  { id: 'j7', title: 'Home Tailoring Orders', org: 'Self-employment idea', type: 'Self-employment', loc: 'Your own home', km: 0, pay: '₹5,000 to ₹12,000 per month (varies)', path: 'tailoring' },
];

/* ================= Rule-based matching (transparent, no model) ================= */
const mobKey = (v) => ((v || '').includes('Nearby') ? 'near' : (v || '').includes('district') ? 'district' : 'state');
const REACH_KM = { near: 10, district: 40, state: Infinity };
const listOf = (a) => a.join(', ');

function evaluate(p, prof) {
  const interests = (prof.interests || '').toLowerCase();
  const skillsTxt = ((prof.skills || '') + ' ' + (prof.occupation || '')).toLowerCase();
  const iHits = p.interestTags.filter((t) => interests.includes(t));
  const sHits = p.skillTags.filter((t) => skillsTxt.includes(t));
  const f = [{ k: 'base', label: 'Starting point', pts: 30, note: 'Every pathway starts from the same base score.' }];

  if (iHits.length) {
    f.push({ k: 'interest', label: 'Your interests', pts: 12 * Math.min(iHits.length, 3), short: 'matches your interest in ' + listOf(iHits.slice(0, 2)),
      note: 'You mentioned ' + listOf(iHits) + ', which this pathway builds on.' });
  } else f.push({ k: 'interest', label: 'Your interests', pts: 0, note: 'No direct match with the interests you shared.' });

  if (sHits.length) {
    f.push({ k: 'skills', label: 'Skills you already have', pts: 6 * Math.min(sHits.length, 3), short: 'builds on your skills in ' + listOf(sHits.slice(0, 2)),
      note: 'Your profile includes ' + listOf(sHits) + ', which help in this pathway.' });
  } else f.push({ k: 'skills', label: 'Skills you already have', pts: 0, note: 'None of your listed skills overlap yet. Training would start from the basics.' });

  const ei = Math.max(0, EDU.findIndex((e) => e.v === prof.education));
  if (ei >= p.minEdu) f.push({ k: 'edu', label: 'Education', pts: 8, short: 'suits your education level', note: 'Your education (' + EDU[ei].v + ') meets the usual entry level.' });
  else f.push({ k: 'edu', label: 'Education', pts: -6, note: 'This pathway usually expects ' + EDU[p.minEdu].v + ' or above.' });

  const pref = prof.workType, has = (k) => p.workTypes.includes(k);
  if (pref === 'Job') f.push(has('job')
    ? { k: 'work', label: 'Work type', pts: 8, short: 'leads to jobs', note: 'You prefer a job and this pathway leads to salaried roles.' }
    : { k: 'work', label: 'Work type', pts: 0, note: 'This pathway mostly leads to self-employment.' });
  else if (pref === 'Self-employment') f.push(has('self')
    ? { k: 'work', label: 'Work type', pts: 8, short: 'can lead to your own work', note: 'You prefer self-employment and this pathway supports it.' }
    : { k: 'work', label: 'Work type', pts: 0, note: 'This pathway mostly leads to salaried roles.' });
  else f.push({ k: 'work', label: 'Work type', pts: has('job') && has('self') ? 8 : 5, short: has('job') && has('self') ? 'offers both jobs and self-employment' : null,
    note: has('job') && has('self') ? 'You are open to either, and this pathway offers both.' : 'You are open to either, and this pathway offers one of them.' });

  const mk = mobKey(prof.mobility);
  const mt = { near: { local: 8, regional: 0 }, district: { local: 6, regional: 4 }, state: { local: 4, regional: 8 } };
  const mpts = mt[mk][p.reach];
  const mnote = p.reach === 'local'
    ? (mk === 'near' ? 'Most work for this pathway is available close to home, which matches your nearby preference.' : 'Work for this pathway is available locally, and you can also travel further.')
    : (mk === 'near' ? 'Installation work can involve travel beyond your nearby preference.' : 'This pathway involves travel, which fits your wider travel range.');
  f.push({ k: 'mobility', label: 'Travel range', pts: mpts, short: mpts >= 8 ? (p.reach === 'local' ? 'can be done close to home' : 'fits your travel range') : null, note: mnote });

  f.push({ k: 'demand', label: 'Local demand signal', pts: p.demand, note: p.demandNote + '. This is an illustrative signal, not live data.' });

  const raw = f.reduce((s, x) => s + x.pts, 0);
  const score = Math.max(20, Math.min(98, raw));
  const order = ['interest', 'skills', 'mobility', 'work', 'edu'];
  const shorts = order.map((k) => f.find((x) => x.k === k)).filter((x) => x && x.pts > 0 && x.short).slice(0, 2).map((x) => x.short);
  const fit = shorts.length ? 'Fits because it ' + shorts.join(' and ') + '.' : 'Shown as a general option for your profile.';
  return { ...p, score, raw, factors: f, fit };
}
const rankPaths = (prof) => PATHWAYS.map((p) => evaluate(p, prof)).sort((a, b) => b.score - a.score);
function rankJobs(prof, ranked) {
  const sc = Object.fromEntries(ranked.map((p) => [p.id, p.score]));
  const lim = REACH_KM[mobKey(prof.mobility)];
  return JOBS.map((j) => ({ ...j, score: sc[j.path] || 0, inRange: j.km <= lim }))
    .sort((a, b) => (b.inRange - a.inRange) || (b.score - a.score) || (a.km - b.km));
}
const PREVIEW = rankPaths(DEMO);
const PREVIEW_JOBS = rankJobs(DEMO, PREVIEW).slice(0, 2);
const pathName = (id) => (PATHWAYS.find((p) => p.id === id) || {}).name || '';
const splitList = (s) => (s || '').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
const slug = (s) => (s || 'beneficiary').trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'beneficiary';
const kmLabel = (j) => (j.km === 0 ? 'At your location' : 'About ' + j.km + ' km away');

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildSummary(profile, ranked, jobs, selId, shortlist) {
  const L = [];
  const sel = ranked.find((p) => p.id === selId) || ranked[0];
  L.push('JEEVIKAAI LIVELIHOOD SUMMARY');
  L.push('DEMO PROTOTYPE | Knight Coders');
  L.push('Generated: ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
  L.push('');
  L.push('IMPORTANT: Recommendations, course details, NSQF levels and job listings in this');
  L.push('summary are illustrative demo data. They are not verified live listings or');
  L.push('official certifications.' + (profile.isDemo ? ' The beneficiary below is fictional sample data.' : ''));
  L.push('');
  L.push('BENEFICIARY PROFILE');
  L.push('Name: ' + profile.name);
  L.push('Location: ' + profile.location);
  L.push('Education: ' + profile.education);
  L.push('Existing skills: ' + (profile.skills || 'Not shared'));
  L.push('Interests: ' + (profile.interests || 'Not shared'));
  L.push('Current occupation: ' + (profile.occupation || 'Not shared'));
  L.push('Preferred work type: ' + profile.workType);
  L.push('Mobility preference: ' + profile.mobility);
  L.push('');
  L.push('TOP SKILL PATHWAYS (rule-based demo scoring, not a trained model)');
  ranked.slice(0, 3).forEach((p, i) => {
    L.push((i + 1) + '. ' + p.name + ' - fit score ' + p.score + '/100');
    L.push('   Role: ' + p.role);
    L.push('   Duration: ' + p.duration);
    L.push('   Sample NSQF level: ' + p.nsqf);
    L.push('   ' + p.fit);
    p.factors.filter((x) => x.k !== 'base').forEach((x) => L.push('   - ' + x.label + ' (' + (x.pts > 0 ? '+' : '') + x.pts + '): ' + x.note));
    L.push('');
  });
  L.push('LEARNING ROADMAP: ' + sel.name);
  sel.stages.forEach((s, i) => L.push((i + 1) + '. ' + STAGE_TITLES[i] + ' (' + s[2] + '): ' + s[0] + '. ' + s[1]));
  L.push('');
  L.push('SAMPLE LOCAL OPPORTUNITIES (illustrative)');
  jobs.forEach((j) => L.push('- ' + j.title + ' | ' + j.org + ' | ' + j.type + ' | ' + j.loc + ' | ' + kmLabel(j) + ' | ' + j.pay + (j.inRange ? '' : ' | Outside your nearby range') + (shortlist[j.id] ? ' | SHORTLISTED' : '')));
  L.push('');
  L.push('Built by Team Knight Coders. Prototype for vocational discovery.');
  return L.join('\n');
}

/* ================= Small shared pieces ================= */
function Wave({ on, n = 9 }) {
  return (
    <div className={'wave' + (on ? ' on' : '')} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <i key={i} style={{ animationDelay: (i * 0.09) + 's', height: on ? undefined : (6 + ((i * 5) % 4) * 3) + 'px' }} />
      ))}
    </div>
  );
}
function Ring({ value, size = 64 }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={'Fit score ' + value + ' out of 100'} style={{ flex: 'none' }}>
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" style={{ stroke: 'var(--line)' }} />
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 32 32)" style={{ stroke: 'var(--teal)' }} />
      <text x="32" y="38" textAnchor="middle" fontSize="18" fontWeight="700" style={{ fill: 'var(--ink)', fontFamily: 'var(--f-display)' }}>{value}</text>
    </svg>
  );
}

/* ================= Nav / Footer ================= */
function Nav({ route, go }) {
  const [open, setOpen] = useState(false);
  const act = (r, s) => { setOpen(false); go(r, s); };
  return (
    <>
      <div className="ribbon">
        <div className="wrap">
          <span className="badge">DEMO PROTOTYPE | Knight Coders</span>
          <span className="hide-sm">Fictional sample data. Not an official government service.</span>
        </div>
      </div>
      <header className="nav">
        <div className="wrap nav-in">
          <Logo onClick={() => act('home')} />
          <nav className="nav-links" aria-label="Main">
            <button aria-current={route === 'home' ? 'page' : undefined} onClick={() => act('home')}>Home</button>
            <button onClick={() => act('home', 'how')}>How It Works</button>
            <button aria-current={route === 'dashboard' ? 'page' : undefined} onClick={() => act('dashboard', 'opps')}>Opportunities</button>
          </nav>
          <button className="btn btn-primary btn-sm nav-cta" onClick={() => act('assessment')}>Start Assessment</button>
          <button className="menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
        <div className={'nav-panel' + (open ? ' open' : '')}>
          <div className="wrap">
            <button onClick={() => act('home')}>Home</button>
            <button onClick={() => act('home', 'how')}>How It Works</button>
            <button onClick={() => act('dashboard', 'opps')}>Opportunities</button>
            <button className="btn btn-primary" style={{ color: '#fff' }} onClick={() => act('assessment')}>Start Assessment</button>
          </div>
        </div>
      </header>
    </>
  );
}
function Footer({ go }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Logo inverse onClick={() => go('home')} />
            <p>Voice-Based Livelihood &amp; Skill Assistant. Helping people find skills, training and nearby work in their own language.</p>
          </div>
          <div>
            <div className="team">Team Knight Coders</div>
            <p style={{ marginTop: 6 }}>Voice-first Livelihood Assistant</p>
          </div>
        </div>
        <p className="fine">
          Disclaimer: JeevikaAI is a demo prototype. Profiles, skill recommendations, course details, NSQF levels and job listings are fictional or illustrative sample data. They are not verified live listings or official certifications, and nothing here is approved by or affiliated with any government body.
        </p>
      </div>
    </footer>
  );
}

/* ================= Home ================= */
function Preview() {
  return (
    <div className="preview-wrap">
      <div className="voice-chip">
        <span className="vc-icon"><Icon name="mic" size={16} /></span>
        <div>
          <div className="vc-label">Sample voice input</div>
          <div className="vc-text" lang="hi">“मुझे कंप्यूटर सीखना है”</div>
        </div>
        <Wave on n={5} />
      </div>
      <div className="preview">
        <div className="pv-head">
          <div className="avatar">S</div>
          <div>
            <div className="pv-name">Sunita Devi</div>
            <div className="pv-meta"><Icon name="pin" size={13} /> Maharajganj, UP</div>
          </div>
          <span className="tag tag-warn">Fictional sample</span>
        </div>
        <div className="pv-label">Skill match</div>
        {PREVIEW.slice(0, 3).map((p) => (
          <div className="bar-row" key={p.id}>
            <span>{p.name}</span><span>{p.score}%</span>
            <div className="bar"><i style={{ width: p.score + '%' }} /></div>
          </div>
        ))}
        <div className="pv-label">Recommended training</div>
        <div className="pv-row">
          <span className="icon-tile tile-blue"><Icon name="cap" size={18} /></span>
          <div><b>{PREVIEW[0].name}</b><small>{PREVIEW[0].duration.split(' (')[0]} · Sample NSQF Level {PREVIEW[0].nsqf}</small></div>
        </div>
        <div className="pv-label">Opportunities near you</div>
        {PREVIEW_JOBS.map((j) => (
          <div className="pv-row" key={j.id}>
            <span className="icon-tile tile-teal"><Icon name="briefcase" size={18} /></span>
            <div><b>{j.title}</b><small>{j.loc} · {j.km} km</small></div>
            <span className="pay">{j.pay.split(' per')[0].replace(' to ', ' – ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Home({ go }) {
  const features = [
    { icon: 'mic', tile: 'tile-blue', title: 'Multilingual Voice Assistant', text: 'Speak in Hindi, English or Hinglish. Where voice is not available, typing works just as well.', chips: ['Hindi', 'English', 'Hinglish'] },
    { icon: 'layers', tile: 'tile-teal', title: 'NSQF-Aligned Skill Pathways', text: 'See training routes with duration, a sample NSQF level and a clear explanation of why each one fits.', chips: ['Explainable', 'Illustrative levels'] },
    { icon: 'pin', tile: 'tile-navy', title: 'Hyperlocal Opportunities', text: 'Jobs and self-employment ideas sorted by what is near you and how far you are willing to travel.', chips: ['Jobs', 'Self-employment'] },
  ];
  const steps = [
    { icon: 'mic', t: 'Speak', d: 'Answer a few simple questions by voice or text.' },
    { icon: 'user', t: 'Build Profile', d: 'Your skills, interests and preferences are gathered.' },
    { icon: 'search', t: 'Discover Skills', d: 'Matching pathways appear, each with its reasons.' },
    { icon: 'pin', t: 'Find Opportunities', d: 'See nearby work that fits your travel range.' },
  ];
  return (
    <main>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow-light"><Icon name="globe" size={16} /> Voice-Based Livelihood &amp; Skill Assistant</span>
            <h1 className="hero-title"><span>Your Skills.</span> <span>Your Language.</span> <span>Your Livelihood.</span></h1>
            <p className="hero-sub">JeevikaAI listens in your language, understands what you can do and what you want to do, then suggests skill training and nearby work or self-employment options built around you.</p>
            <div className="cta-row">
              <button className="btn btn-teal" onClick={() => go('assessment')}><Icon name="mic" size={20} /> Start Voice Assessment</button>
              <button className="btn btn-light" onClick={() => go('dashboard', 'opps')}>Explore Opportunities <Icon name="arrowR" size={18} /></button>
            </div>
            <ul className="proof">
              <li><Icon name="check" size={16} /> Hindi, English and Hinglish</li>
              <li><Icon name="check" size={16} /> No sign-up needed</li>
              <li><Icon name="check" size={16} /> Voice or text</li>
            </ul>
          </div>
          <Preview />
        </div>
      </section>

      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">What JeevikaAI does</div>
            <h2>Built for people who are new to digital tools</h2>
          </div>
          <div className="grid-3">
            {features.map((f) => (
              <article className="card" key={f.title}>
                <span className={'icon-tile ' + f.tile}><Icon name={f.icon} size={24} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <div className="chips">{f.chips.map((c) => <span className="chip" key={c}>{c}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section band" id="how">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">How it works</div>
            <h2>From a spoken answer to a local plan in four steps</h2>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li className="step" key={s.t}>
                <div className="step-top">
                  <span className="icon-tile tile-blue"><Icon name={s.icon} size={22} /></span>
                  <span className="step-n">{i + 1}</span>
                </div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>See the full demo in under two minutes</h2>
              <p>Load the fictional beneficiary Sunita Devi, step through the questions and open the roadmap.</p>
            </div>
            <button className="btn btn-teal" onClick={() => go('assessment')}><Icon name="mic" size={20} /> Start Voice Assessment</button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ================= Assessment ================= */
function Assessment({ go, initial, onSubmit, notify }) {
  const blank = { name: '', education: '', skills: '', interests: '', occupation: '', location: '', workType: '', mobility: '' };
  const [lang, setLang] = useState('en');
  const [answers, setAnswers] = useState(() => {
    const a = { ...blank };
    if (initial) FIELDS.forEach((k) => { a[k] = initial[k] || ''; });
    return a;
  });
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('voice');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [voiceMsg, setVoiceMsg] = useState({ kind: 'idle', text: '' });
  const recRef = useRef(null);
  const stepRef = useRef(0);
  const inputRef = useRef(null);
  const SR = useMemo(() => window.SpeechRecognition || window.webkitSpeechRecognition || null, []);
  const S = STEPS[step];
  const L = LANGS.find((l) => l.k === lang);
  const set = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));

  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => {
    if (recRef.current) { try { recRef.current.abort(); } catch (e) {} recRef.current = null; }
    setListening(false); setHeard(''); setVoiceMsg({ kind: 'idle', text: '' });
  }, [step, lang]);
  useEffect(() => () => { if (recRef.current) { try { recRef.current.abort(); } catch (e) {} } }, []);

  function applyHeard(t) {
    const s = STEPS[stepRef.current];
    if (s.type === 'choice') {
      const low = t.toLowerCase();
      let best = null, bestN = 0;
      s.options.forEach((o) => { const n = o.kw.filter((k) => low.includes(k.toLowerCase())).length; if (n > bestN) { best = o; bestN = n; } });
      if (best) { set(s.key, best.v); setVoiceMsg({ kind: 'idle', text: 'Understood: ' + best.v + '. Please check it on the right.' }); }
      else setVoiceMsg({ kind: 'warn', text: 'We heard you, but could not match that to an option. Please tap one on the right.' });
    } else if (s.key === 'name') {
      set('name', t.replace(/^(my name is|mera naam|मेरा नाम)\s+/i, '').replace(/\s+(hai|है)\.?$/i, '').trim());
    } else set(s.key, t);
  }

  function startListening() {
    setMode('voice');
    if (!SR) { setVoiceMsg({ kind: 'err', text: 'Voice capture is not supported in this browser, so nothing can be recorded. Please type your answer on the right.' }); return; }
    if (recRef.current) { try { recRef.current.abort(); } catch (e) {} }
    let rec;
    try { rec = new SR(); } catch (e) { setVoiceMsg({ kind: 'err', text: 'Could not start voice capture. Please type your answer.' }); return; }
    rec.lang = L.code; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    let got = false;
    rec.onstart = () => { setListening(true); setVoiceMsg({ kind: 'live', text: 'Listening. Speak your answer now.' }); };
    rec.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + ' ';
      t = t.trim();
      if (!t) return;
      got = true; setHeard(t);
      if (e.results[e.results.length - 1].isFinal) applyHeard(t);
    };
    rec.onerror = (e) => {
      const c = e && e.error;
      const m = c === 'not-allowed' || c === 'service-not-allowed' ? 'Microphone access is blocked in this view, so nothing was recorded. Use Continue with Text instead.'
        : c === 'no-speech' ? 'No speech was detected. Try again, or type your answer.'
        : c === 'audio-capture' ? 'No microphone was found on this device. Please type your answer.'
        : c === 'network' ? 'The speech service could not be reached. Please type your answer.'
        : c === 'aborted' ? null : 'Voice capture failed (' + (c || 'unknown') + '). Please type your answer.';
      if (m) setVoiceMsg({ kind: 'err', text: m });
    };
    rec.onend = () => {
      setListening(false);
      if (recRef.current === rec) recRef.current = null;
      setVoiceMsg((v) => (v.kind === 'live'
        ? { kind: 'idle', text: got ? 'Captured. Check the answer on the right and edit it if needed.' : 'Nothing was captured. Try again, or type your answer.' }
        : v));
    };
    recRef.current = rec;
    try { rec.start(); } catch (err) { recRef.current = null; setVoiceMsg({ kind: 'err', text: 'Could not start voice capture. Please type your answer.' }); }
  }
  function stopListening() { if (recRef.current) { try { recRef.current.stop(); } catch (e) {} } }
  function toText() {
    stopListening(); setMode('text');
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 30);
  }
  function loadDemo() {
    setAnswers({ ...DEMO }); setStep(0);
    notify('Demo beneficiary loaded: Sunita Devi (fictional). Press Next to review each answer.');
  }
  function toggleChip(label) {
    const arr = splitList(answers[S.key]);
    set(S.key, (arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label]).join(', '));
  }

  const val = answers[S.key] || '';
  const canNext = S.optional || val.trim().length > 0;
  const last = step === STEPS.length - 1;
  const next = () => { if (!canNext) return; if (last) onSubmit({ ...answers, isDemo: isDemoProfile(answers) }); else setStep(step + 1); };
  const labelFor = (o) => (lang === 'hi' ? o.hi : o.v);
  const qText = S.q[lang];
  const showEn = lang !== 'en';

  let statusText = voiceMsg.text;
  if (!statusText) statusText = !SR ? 'Voice capture is not supported in this browser. Type your answers using the fields on the right.' : 'Tap the microphone or Start Listening, then speak. You can always type instead.';
  const statusKind = voiceMsg.kind === 'idle' && !SR ? 'warn' : voiceMsg.kind;

  return (
    <main className="wrap assess">
      <button className="back-link" onClick={() => go('home')}><Icon name="arrowL" size={18} /> Back to home</button>
      <div className="assess-head">
        <div>
          <h1>Voice Assessment</h1>
          <p>Answer eight short questions in your own language. Use your voice or type, whichever is easier.</p>
        </div>
        <button className="btn btn-ghost" onClick={loadDemo}><Icon name="user" size={18} /> Load Demo Beneficiary <span className="tag tag-warn">Fictional</span></button>
      </div>

      <div className="assess-grid">
        <section className="card stage" aria-label="Voice input">
          <div className="seg" role="radiogroup" aria-label="Language">
            {LANGS.map((l) => (
              <button key={l.k} role="radio" aria-checked={lang === l.k} onClick={() => setLang(l.k)}>
                <span lang={l.k === 'hi' ? 'hi' : undefined}>{l.label}</span><small>{l.sub}</small>
              </button>
            ))}
          </div>
          <div className="mic-wrap">
            <button className={'mic ' + (listening ? 'live' : 'idle')} onClick={listening ? stopListening : startListening}
              aria-label={listening ? 'Stop listening' : 'Start listening'} aria-pressed={listening}>
              <Icon name={listening ? 'stop' : 'mic'} size={52} sw={1.8} />
            </button>
          </div>
          <Wave on={listening} />
          <div className={'status ' + statusKind} role="status" aria-live="polite">{statusText}</div>
          {heard && (
            <div className="heard"><small>What the browser heard</small><span lang={lang === 'hi' ? 'hi' : undefined}>“{heard}”</span></div>
          )}
          <div className="stage-actions">
            <button className="btn btn-teal" onClick={startListening} disabled={listening}><Icon name="mic" size={18} /> Start Listening</button>
            <button className="btn btn-ghost" onClick={stopListening} disabled={!listening}><Icon name="stop" size={18} /> Stop Listening</button>
            <button className={'btn ' + (mode === 'text' ? 'btn-primary' : 'btn-ghost')} onClick={toText}><Icon name="keyboard" size={18} /> Continue with Text</button>
          </div>
        </section>

        <section className="card convo" aria-label="Questionnaire">
          <div className="progress">
            <span>Question {step + 1} of {STEPS.length}</span>
            <div className="prog-bar" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={step + 1}><i style={{ width: ((step + 1) / STEPS.length * 100) + '%' }} /></div>
          </div>
          <div className="bubble">
            <span className="who">JeevikaAI asks · {S.label}</span>
            <b lang={lang === 'hi' ? 'hi' : undefined}>{qText}</b>
            {showEn && <span className="sub-en">{S.q.en}</span>}
          </div>

          <div>
            {S.type === 'choice' ? (
              <div className="choices" role="radiogroup" aria-label={S.label}>
                {S.options.map((o) => (
                  <button key={o.v} className="choice" role="radio" aria-checked={val === o.v} onClick={() => set(S.key, o.v)}>
                    <span className="dot">{val === o.v && <Icon name="check" size={12} sw={3} />}</span>
                    <span lang={lang === 'hi' ? 'hi' : undefined}>{labelFor(o)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <label className="lbl" htmlFor="answer">Your answer{voiceMsg.kind === 'idle' && heard ? ' (edit if needed)' : ''}</label>
                {S.type === 'area' ? (
                  <textarea id="answer" ref={inputRef} className="field" value={val} onChange={(e) => set(S.key, e.target.value)} placeholder={S.ph[lang]} />
                ) : (
                  <input id="answer" ref={inputRef} className="field" value={val} onChange={(e) => set(S.key, e.target.value)} placeholder={S.ph[lang]}
                    onKeyDown={(e) => { if (e.key === 'Enter') next(); }} />
                )}
                {S.chips && (
                  <div className="chips" style={{ marginTop: 12 }}>
                    {S.chips.map((c) => {
                      const label = lang === 'hi' ? c.hi : c.en;
                      return <button key={c.en} className="chip" aria-pressed={splitList(val).includes(label)} onClick={() => toggleChip(label)}>{label}</button>;
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="nav-row">
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={step === 0}><Icon name="arrowL" size={18} /> Back</button>
            <div className="dots" aria-hidden="true">{STEPS.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
            <button className="btn btn-primary" onClick={next} disabled={!canNext}>{last ? 'See my roadmap' : 'Next'} <Icon name="arrowR" size={18} /></button>
          </div>
        </section>
      </div>

      {lang !== 'en' && (
        <section className="card examples" aria-label="Example conversation">
          <h3>{lang === 'hi' ? 'Example Hindi conversation' : 'Example Hinglish conversation'}</h3>
          <p className="muted">Scripted examples that show how answers can sound. These are not recordings.</p>
          <div className="ex-grid">
            {EXAMPLES[lang].map((x) => (
              <div className="ex-card" key={x.q}>
                <div className="q" lang={lang === 'hi' ? 'hi' : undefined}>{x.q}</div>
                <div className="a" lang={lang === 'hi' ? 'hi' : undefined}>{x.a}</div>
                <small>{x.en}</small>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/* ================= Dashboard ================= */
function Dashboard({ profile, hasAssessment, go, notify, openSummary }) {
  const ranked = useMemo(() => rankPaths(profile), [profile]);
  const top = ranked.slice(0, 3);
  const jobs = useMemo(() => rankJobs(profile, ranked), [profile, ranked]);
  const [open, setOpen] = useState({});
  const [sel, setSel] = useState(top[0].id);
  const [done, setDone] = useState({});
  const [filter, setFilter] = useState('All');
  const [short, setShort] = useState({});
  const selP = ranked.find((p) => p.id === sel) || top[0];
  const doneN = [0, 1, 2].filter((i) => done[selP.id + i]).length;
  const shown = jobs.filter((j) => filter === 'All' || j.type === filter);
  const nShort = Object.values(short).filter(Boolean).length;

  async function download() {
    const text = buildSummary(profile, ranked, jobs, sel, short);
    const fname = 'JeevikaAI-summary-' + slug(profile.name) + '.txt';
    try {
      const d = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
      if (d) { await d.save({ filename: fname, data: text }); notify('Summary saved as ' + fname); return; }
    } catch (e) {
      if (e && e.code === 'declined') { notify('Download cancelled.'); return; }
    }
    openSummary({ text, fname });
  }

  return (
    <main>
      <div className="wrap">
        <div className="dash-head">
          <div>
            <div className="eyebrow">Personalised for {profile.name}</div>
            <h1>Your Livelihood Roadmap</h1>
            <p className="hi-sub" lang="hi">आपका आजीविका रोडमैप</p>
          </div>
          <div className="dash-actions">
            <button className="btn btn-primary" onClick={() => scrollToId('roadmap')}><Icon name="route" size={18} /> View Learning Roadmap</button>
            <button className="btn btn-ghost" onClick={() => scrollToId('opps')}><Icon name="briefcase" size={18} /> Explore Jobs</button>
            <button className="btn btn-ghost" onClick={download}><Icon name="download" size={18} /> Download Summary</button>
          </div>
        </div>
        <div className="notice" role="note">
          <Icon name="info" size={18} />
          <span>
            All recommendations, course details, NSQF levels and job listings on this page are illustrative demo data. They are not verified live listings or official certifications.
            {profile.isDemo && ' Sunita Devi is a fictional beneficiary.'}
            {!hasAssessment && ' You have not taken the assessment yet, so this page shows the sample beneficiary.'}
          </span>
        </div>

        <div className="dash-grid">
          <aside className="card profile" aria-label="Beneficiary profile">
            <div className="pv-head">
              <div className="avatar lg">{(profile.name || '?').trim().charAt(0).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '1.3rem' }}>{profile.name}</h2>
                <div className="pv-meta"><Icon name="pin" size={13} /> {profile.location}</div>
              </div>
            </div>
            {profile.isDemo && <span className="tag tag-warn">Fictional sample data</span>}
            <dl className="prof-list">
              <div><dt>Education</dt><dd>{profile.education}</dd></div>
              <div><dt>Existing skills</dt><dd><div className="chips">{splitList(profile.skills).map((s) => <span className="chip" key={s}>{s}</span>)}{!splitList(profile.skills).length && 'Not shared'}</div></dd></div>
              <div><dt>Interests</dt><dd><div className="chips">{splitList(profile.interests).map((s) => <span className="chip" key={s}>{s}</span>)}{!splitList(profile.interests).length && 'Not shared'}</div></dd></div>
              <div><dt>Current occupation</dt><dd>{profile.occupation || 'Not shared'}</dd></div>
              <div><dt>Preferred work</dt><dd>{profile.workType}</dd></div>
              <div><dt>Mobility</dt><dd>{profile.mobility}</dd></div>
            </dl>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => go('assessment')}><Icon name="edit" size={18} /> Change Profile</button>
          </aside>

          <div className="stack">
            <section id="paths" aria-label="Suggested skill pathways">
              <div className="block-head">
                <div>
                  <h2>Suggested skill pathways</h2>
                  <p>Scored with transparent rules from your answers, not a trained model. Open any card to see every factor.</p>
                </div>
              </div>
              <div className="stack">
                {top.map((p, i) => (
                  <article className="card path-card" key={p.id}>
                    <div className="path-top">
                      <span className={'icon-tile ' + (i === 0 ? 'tile-teal' : i === 1 ? 'tile-blue' : 'tile-navy')}><Icon name={p.icon} size={24} /></span>
                      <div className="grow">
                        <div className="rank">Recommendation {i + 1}</div>
                        <h3>{p.name}</h3>
                        <div className="muted" lang="hi">{p.hi} · {p.role}</div>
                      </div>
                      <Ring value={p.score} />
                    </div>
                    <div className="path-meta">
                      <span className="tag tag-mute"><Icon name="clock" size={13} /> {p.duration}</span>
                      <span className="tag"><Icon name="layers" size={13} /> Sample NSQF Level {p.nsqf}</span>
                      <span className="tag tag-warn">Illustrative demo data</span>
                    </div>
                    <p className="fit">{p.fit}</p>
                    <div className="path-actions">
                      <button className="btn btn-ghost btn-sm" aria-expanded={!!open[p.id]} onClick={() => setOpen({ ...open, [p.id]: !open[p.id] })}>
                        <Icon name="bulb" size={16} /> Why this recommendation? <Icon name="chev" size={16} style={{ transform: open[p.id] ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => { setSel(p.id); scrollToId('roadmap'); }}><Icon name="route" size={16} /> View Learning Roadmap</button>
                    </div>
                    {open[p.id] && (
                      <div className="why">
                        {p.factors.map((x) => (
                          <div className="factor" key={x.k}>
                            <b>{x.label}</b>
                            <span className={'pts' + (x.pts < 0 ? ' neg' : '')}>{x.pts > 0 ? '+' : x.pts < 0 ? '−' : ''}{Math.abs(x.pts)}</span>
                            <div className="bar"><i style={{ width: Math.max(0, x.pts) / 36 * 100 + '%', animationDuration: '.5s' }} /></div>
                            <p>{x.note}</p>
                          </div>
                        ))}
                        <div className="total">
                          Total {p.raw}{p.raw > 98 ? ', capped at 98 because this is an estimate and not a guarantee' : ''}. Every score comes from the rules above, so a different answer in the assessment changes the result.
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section id="roadmap" className="card" aria-label="Learning roadmap">
              <div className="block-head" style={{ marginBottom: 12 }}>
                <div>
                  <h2>Your learning roadmap</h2>
                  <p>Illustrative three-stage plan for the pathway you pick. Mark each stage as done to track progress.</p>
                </div>
              </div>
              <div className="tabs" role="group" aria-label="Choose pathway">
                {top.map((p) => <button key={p.id} aria-pressed={sel === p.id} onClick={() => setSel(p.id)}>{p.name}</button>)}
              </div>
              <div className="timeline">
                {selP.stages.map((s, i) => {
                  const k = selP.id + i, isDone = !!done[k];
                  return (
                    <div className={'stage-card' + (isDone ? ' done' : '')} key={k}>
                      <span className="k">Stage {i + 1} · {STAGE_TITLES[i]}</span>
                      <h4>{s[0]}</h4>
                      <p>{s[1]}</p>
                      <span className="wk">{s[2]}</span>
                      <button className={'btn btn-sm ' + (isDone ? 'btn-teal' : 'btn-ghost')} aria-pressed={isDone} onClick={() => setDone({ ...done, [k]: !isDone })}>
                        <Icon name="check" size={16} /> {isDone ? 'Done' : 'Mark as done'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="road-progress">
                <span>{doneN} of 3 stages done</span>
                <div className="prog-bar"><i style={{ width: (doneN / 3 * 100) + '%' }} /></div>
              </div>
            </section>

            <section id="opps" aria-label="Local opportunities">
              <div className="block-head">
                <div>
                  <h2>Local opportunities</h2>
                  <p>Sample listings sorted by fit and distance. They are fictional and not live vacancies.{nShort ? ' ' + nShort + ' shortlisted.' : ''}</p>
                </div>
                <div className="filters" role="group" aria-label="Filter by work type">
                  {['All', 'Job', 'Self-employment'].map((f) => <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}
                </div>
              </div>
              {shown.length ? (
                <div className="opp-grid">
                  {shown.map((j) => (
                    <article className={'card opp' + (j.inRange ? '' : ' far')} key={j.id}>
                      <div className="opp-top">
                        <span className={'tag ' + (j.type === 'Job' ? '' : 'tag-teal')}>{j.type}</span>
                        <span className="tag tag-warn">Sample listing</span>
                        {!j.inRange && <span className="tag tag-mute">Outside your travel range</span>}
                      </div>
                      <div>
                        <h3>{j.title}</h3>
                        <div className="org">{j.org}</div>
                      </div>
                      <div className="opp-facts">
                        <div><Icon name="pin" size={16} /> {j.loc} · {kmLabel(j)}</div>
                        <div><Icon name="rupee" size={16} /> {j.pay}</div>
                      </div>
                      <div className="opp-foot">
                        <span className="chip">{pathName(j.path)}</span>
                        <button className="btn btn-ghost btn-sm star" aria-pressed={!!short[j.id]} onClick={() => setShort({ ...short, [j.id]: !short[j.id] })}>
                          <Icon name="star" size={16} /> {short[j.id] ? 'Shortlisted' : 'Shortlist'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="empty">No sample listings for this filter. Choose All to see every listing.</div>}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ================= App ================= */
function SummaryModal({ data, onClose, notify }) {
  const preRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  async function copy() {
    try { await navigator.clipboard.writeText(data.text); notify('Summary copied.'); return; } catch (e) {}
    try {
      const r = document.createRange(); r.selectNodeContents(preRef.current);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      notify('Text selected. Press copy on your device.');
    } catch (e) {}
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Summary" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Your summary</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button>
        </div>
        <pre ref={preRef}>{data.text}</pre>
        <div className="modal-foot">
          <button className="btn btn-primary btn-sm" onClick={copy}><Icon name="copy" size={16} /> Copy text</button>
          <span className="muted" style={{ alignSelf: 'center', fontSize: '.85rem' }}>File saving is not available in this view. Copy the text instead.</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState('home');
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState('');
  const [summary, setSummary] = useState(null);
  const pending = useRef(null);
  const timer = useRef(null);

  const notify = (m) => {
    setToast(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 4200);
  };
  const go = (r, sec) => {
    if (r === route) {
      if (sec && document.getElementById(sec)) scrollToId(sec); else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    pending.current = sec || null;
    setRoute(r);
  };
  useEffect(() => {
    const id = pending.current; pending.current = null;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = id && document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); else window.scrollTo({ top: 0, behavior: 'auto' });
    }));
  }, [route]);

  const active = profile || { ...DEMO, isDemo: true };
  return (
    <>
      <Nav route={route} go={go} />
      {route === 'home' && <Home go={go} />}
      {route === 'assessment' && <Assessment go={go} initial={profile} notify={notify} onSubmit={(p) => { setProfile(p); go('dashboard'); }} />}
      {route === 'dashboard' && <Dashboard key={JSON.stringify(active)} profile={active} hasAssessment={!!profile} go={go} notify={notify} openSummary={setSummary} />}
      <Footer go={go} />
      {summary && <SummaryModal data={summary} onClose={() => setSummary(null)} notify={notify} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
