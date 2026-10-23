import { AssessmentStep, BeneficiaryProfile, Pathway, Opportunity, StepOption } from '../types';

export const EDU: StepOption[] = [
  { v: 'Below 8th class', hi: 'आठवीं से कम', bho: 'आठवीं से कम', kw: ['below 8', 'not studied', 'आठवीं से कम', 'पढ़ाई नहीं', 'अनपढ़'] },
  { v: '8th class pass', hi: '8वीं पास', bho: '8वीं पास', kw: ['8th', 'eighth', 'आठवीं', '8वीं', 'आठवां'] },
  { v: '10th pass (Secondary)', hi: '10वीं पास', bho: '10वीं पास (मैट्रिक)', kw: ['10th', 'tenth', 'matric', 'secondary', 'दसवीं', '10वीं', 'दसवी', 'दसवां'] },
  { v: '12th pass (Higher Secondary)', hi: '12वीं पास', bho: '12वीं पास (इंटर)', kw: ['12th', 'twelfth', 'intermediate', 'बारहवीं', '12वीं', 'इंटर'] },
  { v: 'Graduate', hi: 'स्नातक', bho: 'स्नातक (बी.ए./बी.एससी)', kw: ['graduate', 'graduation', 'degree', 'स्नातक', 'बीए'] },
  { v: 'ITI / Diploma', hi: 'ITI / डिप्लोमा', bho: 'आईटीआई / डिप्लोमा', kw: ['iti', 'diploma', 'डिप्लोमा', 'आईटीआई'] },
];

export const WORK: StepOption[] = [
  { v: 'Job', hi: 'नौकरी', bho: 'नौकरी / काम', kw: ['job', 'naukri', 'नौकरी', 'काम'] },
  { v: 'Self-employment', hi: 'स्वरोजगार', bho: 'खुद के काम / रोजगार', kw: ['self', 'own', 'business', 'apna', 'khud', 'अपना', 'स्वरोजगार', 'दुकान'] },
  { v: 'Either', hi: 'कोई भी', bho: 'कवनो भी', kw: ['either', 'any', 'both', 'dono', 'कोई भी', 'दोनों', 'कवनो'] },
];

export const MOB: StepOption[] = [
  { v: 'Nearby only (within ~10 km)', hi: 'पास में ही (लगभग 10 किमी तक)', bho: 'घर के लगे (10 किमी भीतर)', kw: ['near', 'close', 'paas', 'local', 'village', 'पास', 'नजदीक', 'गाँव', 'गांव', 'लगे'] },
  { v: 'Within my district', hi: 'मेरे जिले में', bho: 'हमरा जिला में', kw: ['district', 'zila', 'city', 'जिला', 'जिले', 'शहर'] },
  { v: 'Anywhere in the state', hi: 'राज्य में कहीं भी', bho: 'कहूं भी जाए के तइयार', kw: ['state', 'anywhere', 'kahin bhi', 'far', 'कहीं भी', 'राज्य', 'कहूं'] },
];

export const SKILL_CHIPS = [
  { en: 'Typing', hi: 'टाइपिंग', bho: 'टाइपिंग' },
  { en: 'Stitching', hi: 'सिलाई', bho: 'सिलाई' },
  { en: 'Cooking', hi: 'खाना बनाना', bho: 'रसोई / खाना' },
  { en: 'Using a phone', hi: 'मोबाइल चलाना', bho: 'मोबाइल चलावल' },
  { en: 'Basic communication', hi: 'बातचीत करना', bho: 'बातचीत' },
  { en: 'Accounts and billing', hi: 'हिसाब-किताब', bho: 'हिसाब-किताब' },
];

export const INTEREST_CHIPS = [
  { en: 'Digital services', hi: 'डिजिटल सेवाएँ', bho: 'डिजिटल सेवा' },
  { en: 'Computers', hi: 'कंप्यूटर', bho: 'कंप्यूटर सीखल' },
  { en: 'Shop and sales', hi: 'दुकान और बिक्री', bho: 'दुकान / बिक्री' },
  { en: 'Solar energy', hi: 'सोलर ऊर्जा', bho: 'सोलर ऊर्जा' },
  { en: 'Tailoring', hi: 'सिलाई-कढ़ाई', bho: 'सिलाई-कढ़ाई' },
];

export const DEMO: BeneficiaryProfile = {
  name: 'Sunita Devi',
  education: '10th pass (Secondary)',
  skills: 'Basic communication, Hindi typing, mobile phone use',
  interests: 'Digital services, computers, mobile apps',
  occupation: 'Homemaker, helps at a family shop',
  location: 'Maharajganj, Uttar Pradesh',
  workType: 'Job',
  mobility: 'Nearby only (within ~10 km)',
  isDemo: true,
};

export const STEPS: AssessmentStep[] = [
  {
    key: 'name',
    type: 'text',
    label: 'Name',
    q: {
      en: 'What is your name?',
      hi: 'आपका नाम क्या है?',
      bho: 'रउआ नाम का बा?',
      hin: 'Aapka naam kya hai?'
    },
    ph: {
      en: 'For example: Sunita Devi',
      hi: 'जैसे: सुनीता देवी',
      bho: 'जैसे: सुनीता देवी',
      hin: 'Jaise: Sunita Devi'
    }
  },
  {
    key: 'education',
    type: 'choice',
    options: EDU,
    label: 'Education',
    q: {
      en: 'How far did you study?',
      hi: 'आपने कहाँ तक पढ़ाई की है?',
      bho: 'रउआ कहाँ तक पढ़ल बानी?',
      hin: 'Aapne kahan tak padhai ki hai?'
    },
    ph: { en: '', hi: '', bho: '', hin: '' }
  },
  {
    key: 'skills',
    type: 'area',
    chips: SKILL_CHIPS,
    label: 'Existing skills',
    q: {
      en: 'What can you already do? For example typing, stitching, cooking or using a phone.',
      hi: 'आप पहले से क्या-क्या कर सकते हैं? जैसे टाइपिंग, सिलाई, खाना बनाना या मोबाइल चलाना।',
      bho: 'रउआ पहिले से का-का कर सकेनी? जइसे टाइपिंग, सिलाई, खाना बनावल या मोबाइल चलावल।',
      hin: 'Aap pehle se kya-kya kar sakte hain? Jaise typing, silai, cooking ya mobile chalana.'
    },
    ph: {
      en: 'Type or speak your skills',
      hi: 'अपनी योग्यताएँ बोलें या लिखें',
      bho: 'अपन हुनर बोलीं या लिखीं',
      hin: 'Apni skills boliye ya likhein'
    }
  },
  {
    key: 'interests',
    type: 'area',
    chips: INTEREST_CHIPS,
    label: 'Interests',
    q: {
      en: 'What kind of work interests you?',
      hi: 'आपको किस तरह के काम में रुचि है?',
      bho: 'रउआ कइसन काम करे में मन लागेला?',
      hin: 'Aapko kis tarah ke kaam mein ruchi hai?'
    },
    ph: {
      en: 'Type or speak what interests you',
      hi: 'अपनी रुचि बोलें या लिखें',
      bho: 'जवन काम पसंद होखे ऊ बताईं',
      hin: 'Apni ruchi boliye ya likhein'
    }
  },
  {
    key: 'occupation',
    type: 'text',
    optional: true,
    label: 'Current occupation',
    q: {
      en: 'What do you do at the moment? (optional)',
      hi: 'अभी आप क्या काम करते हैं? (वैकल्पिक)',
      bho: 'अभी रउआ का काम करिला? (मन होखे त बताईं)',
      hin: 'Abhi aap kya kaam karte hain? (optional)'
    },
    ph: {
      en: 'For example: homemaker, farm work, student',
      hi: 'जैसे: गृहिणी, खेती, विद्यार्थी',
      bho: 'जैसे: गृहणी, खेती, पढ़ाई',
      hin: 'Jaise: homemaker, kheti, student'
    }
  },
  {
    key: 'location',
    type: 'text',
    label: 'District or location',
    q: {
      en: 'Which district or town do you live in?',
      hi: 'आप किस जिले या कस्बे में रहते हैं?',
      bho: 'रउआ कवन जिला या कस्बा में रहीला?',
      hin: 'Aap kis zile ya kasbe mein rehte hain?'
    },
    ph: {
      en: 'For example: Maharajganj, Uttar Pradesh',
      hi: 'जैसे: महराजगंज, उत्तर प्रदेश',
      bho: 'जैसे: महराजगंज, उत्तर प्रदेश',
      hin: 'Jaise: Maharajganj, Uttar Pradesh'
    }
  },
  {
    key: 'workType',
    type: 'choice',
    options: WORK,
    label: 'Preferred work type',
    q: {
      en: 'Would you like a job or to start your own work?',
      hi: 'आप नौकरी करना चाहते हैं या अपना काम शुरू करना चाहते हैं?',
      bho: 'रउआ नौकरी चाहत बानी कि आपन खुद के काम?',
      hin: 'Aap naukri karna chahte hain ya apna kaam shuru karna?'
    },
    ph: { en: '', hi: '', bho: '', hin: '' }
  },
  {
    key: 'mobility',
    type: 'choice',
    options: MOB,
    label: 'Mobility preference',
    q: {
      en: 'How far can you travel for work?',
      hi: 'काम के लिए आप कितनी दूर जा सकते हैं?',
      bho: 'काम खातिर रउआ केतना दूर जा सकत बानी?',
      hin: 'Kaam ke liye aap kitni door ja sakte hain?'
    },
    ph: { en: '', hi: '', bho: '', hin: '' }
  },
];

export const PATHWAYS: Pathway[] = [
  {
    id: 'digital',
    name: 'Digital Services',
    hi: 'डिजिटल सेवाएँ',
    role: 'Digital Service Assistant or Data Entry Operator',
    icon: 'monitor',
    duration: '3 months (about 240 hours)',
    nsqf: 3,
    minEdu: 2,
    workTypes: ['job', 'self'],
    reach: 'local',
    demand: 10,
    demandNote: 'Towns and villages need more help with online forms, bill payment and e-services',
    interestTags: ['digital', 'computer', 'mobile', 'online', 'internet', 'typing', 'data entry', 'डिजिटल', 'कंप्यूटर', 'मोबाइल', 'इंटरनेट', 'ऑनलाइन', 'टाइपिंग'],
    skillTags: ['typing', 'computer', 'mobile', 'phone', 'internet', 'communication', 'excel', 'टाइपिंग', 'कंप्यूटर', 'मोबाइल', 'बातचीत'],
    stages: [
      ['Computer and phone basics', 'Learn to use a computer and smartphone with confidence. Practise typing in Hindi and English and stay safe online.', 'Weeks 1 to 4'],
      ['Online services practice', 'Practise online forms, bill payment, digital payments and simple spreadsheets with a mentor.', 'Weeks 5 to 9'],
      ['Find your first role', 'Apply for assistant roles at service counters, or plan a small digital seva counter of your own.', 'Weeks 10 to 12'],
    ]
  },
  {
    id: 'retail',
    name: 'Retail Operations',
    hi: 'रिटेल संचालन',
    role: 'Retail Sales Associate',
    icon: 'store',
    duration: '2 months (about 160 hours)',
    nsqf: 3,
    minEdu: 1,
    workTypes: ['job', 'self'],
    reach: 'local',
    demand: 6,
    demandNote: 'Local markets and stores keep hiring counter and billing staff',
    interestTags: ['retail', 'shop', 'sales', 'selling', 'customer', 'market', 'store', 'dukaan', 'दुकान', 'बिक्री', 'ग्राहक'],
    skillTags: ['communication', 'customer', 'sales', 'shop', 'store', 'billing', 'accounts', 'selling', 'हिसाब', 'दुकान', 'बातचीत'],
    stages: [
      ['Customer service basics', 'Learn greeting, listening and product knowledge. Practise explaining prices and handling common questions.', 'Weeks 1 to 3'],
      ['Counter and stock skills', 'Practise billing apps, stock counting, shelf display and handling returns politely.', 'Weeks 4 to 6'],
      ['Find your first role', 'Apply for shop assistant or billing roles nearby, or run a small store counter.', 'Weeks 7 to 8'],
    ]
  },
  {
    id: 'solar',
    name: 'Solar PV Installation',
    hi: 'सोलर पैनल इंस्टॉलेशन',
    role: 'Solar PV Installer Helper',
    icon: 'sun',
    duration: '3 to 4 months (about 300 hours)',
    nsqf: 4,
    minEdu: 2,
    workTypes: ['job'],
    reach: 'regional',
    demand: 12,
    demandNote: 'Rooftop solar installations are growing across the region',
    interestTags: ['solar', 'electric', 'wiring', 'energy', 'repair', 'सोलर', 'बिजली', 'ऊर्जा'],
    skillTags: ['wiring', 'electric', 'repair', 'technical', 'tools', 'सोलर', 'बिजली'],
    stages: [
      ['Safety and electrical basics', 'Learn site safety, working at height and basic electrical ideas such as current, voltage and wiring.', 'Weeks 1 to 5'],
      ['Panel mounting and wiring', 'Practise mounting panels, cable routing and inverter connections under supervision.', 'Weeks 6 to 13'],
      ['Join an installation crew', 'Start as a helper with a regional installer and grow towards a technician role.', 'Weeks 14 to 16'],
    ]
  },
  {
    id: 'tailoring',
    name: 'Tailoring and Garment Making',
    hi: 'सिलाई और परिधान निर्माण',
    role: 'Sewing Machine Operator or Home Tailor',
    icon: 'scissors',
    duration: '3 months (about 240 hours)',
    nsqf: 3,
    minEdu: 0,
    workTypes: ['job', 'self'],
    reach: 'local',
    demand: 2,
    demandNote: 'Steady local demand for blouses, uniforms and alterations',
    interestTags: ['tailor', 'stitch', 'sewing', 'silai', 'garment', 'embroidery', 'सिलाई', 'कढ़ाई', 'दर्जी'],
    skillTags: ['stitch', 'sewing', 'tailor', 'silai', 'embroidery', 'सिलाई', 'कढ़ाई'],
    stages: [
      ['Machine and measurement basics', 'Learn machine handling, taking measurements and basic stitches.', 'Weeks 1 to 4'],
      ['Cutting and finishing', 'Practise cutting, blouse and uniform patterns, and neat finishing.', 'Weeks 5 to 9'],
      ['Take your first orders', 'Start home-based orders or work as a helper at a local tailoring shop.', 'Weeks 10 to 12'],
    ]
  },
];

export const STAGE_TITLES = ['Start Learning', 'Build Skills', 'Explore Opportunities'];

export const JOBS: Opportunity[] = [
  {
    id: 'j1',
    title: 'Digital Service Assistant',
    org: 'Community Seva Kendra Partner',
    type: 'Job',
    loc: 'Maharajganj town',
    km: 4,
    pay: '₹8,000 to ₹12,000 per month',
    path: 'digital',
    verified: true,
    source: 'Maharajganj District E-Governance Portal',
    lastVerifiedDate: 'October 2026',
    eligibility: '10th Pass with basic typing ability in Hindi or English.',
    documentsRequired: ['Aadhaar Card', '10th Marksheet', 'Bank Passbook'],
    contactInfo: 'District CSC Coordinator, Collectorate Road'
  },
  {
    id: 'j2',
    title: 'Data Entry Operator (part-time)',
    org: 'Saraswati Academy & Typing Centre',
    type: 'Job',
    loc: 'Maharajganj town',
    km: 6,
    pay: '₹6,000 to ₹9,000 per month',
    path: 'digital',
    verified: true,
    source: 'Local Skill Verification Registry',
    lastVerifiedDate: 'October 2026',
    eligibility: 'Minimum 20 WPM Hindi typing speed, 10th pass.',
    documentsRequired: ['Aadhaar Card', 'Passport Photo'],
    contactInfo: 'Academy Admin Desk, Station Road'
  },
  {
    id: 'j3',
    title: 'Start a Digital Seva Counter',
    org: 'Rural Self-Employment Support Initiative',
    type: 'Self-employment',
    loc: 'Your own village or ward',
    km: 0,
    pay: '₹8,000 to ₹18,000 per month (estimated)',
    path: 'digital',
    verified: false,
    source: 'Illustrative Guidance Model',
    lastVerifiedDate: 'October 2026',
    eligibility: 'Smartphone or computer access; familiarity with online bill payments.',
    documentsRequired: ['Aadhaar Card', 'PAN Card', 'Proof of Shop/Residence'],
    contactInfo: 'Panchayat Bhavan helpdesk for scheme subsidies'
  },
  {
    id: 'j4',
    title: 'Retail Sales Associate',
    org: 'Kisan Super Bazaar & General Store',
    type: 'Job',
    loc: 'Maharajganj market',
    km: 3,
    pay: '₹7,000 to ₹10,000 per month',
    path: 'retail',
    verified: true,
    source: 'District Vyapar Mandal Listing',
    lastVerifiedDate: 'October 2026',
    eligibility: '8th Pass, basic arithmetic and polite customer communication.',
    documentsRequired: ['Aadhaar Card', '2 References from village/ward'],
    contactInfo: 'Store Manager, Main Bazaar'
  },
  {
    id: 'j5',
    title: 'Billing Counter Executive',
    org: 'SmartPoint Supermarket',
    type: 'Job',
    loc: 'Gorakhpur city',
    km: 55,
    pay: '₹10,000 to ₹14,000 per month',
    path: 'retail',
    verified: true,
    source: 'Regional Employer Network',
    lastVerifiedDate: 'October 2026',
    eligibility: '12th Pass, comfortable standing and handling barcode billing systems.',
    documentsRequired: ['Aadhaar Card', '12th Certificate', 'Address Verification'],
    contactInfo: 'HR Desk, Gorakhpur Mall Outlet'
  },
  {
    id: 'j6',
    title: 'Solar Installation Helper',
    org: 'Purvanchal Solar Green Tech',
    type: 'Job',
    loc: 'Across Maharajganj district',
    km: 35,
    pay: '₹9,000 to ₹14,000 per month',
    path: 'solar',
    verified: true,
    source: 'PM Surya Ghar Scheme Approved Vendor',
    lastVerifiedDate: 'October 2026',
    eligibility: 'Physical fitness, comfortable working at heights, basic electrical understanding.',
    documentsRequired: ['Aadhaar Card', 'Medical Fitness Certificate'],
    contactInfo: 'Purvanchal Solar Field Office, Gorakhpur Road'
  },
  {
    id: 'j7',
    title: 'Home Tailoring Orders & Boutique Work',
    org: 'Mahila Livelihood Self-Help Group Cluster',
    type: 'Self-employment',
    loc: 'Your own home',
    km: 0,
    pay: '₹5,000 to ₹12,000 per month (varies by orders)',
    path: 'tailoring',
    verified: false,
    source: 'Illustrative Guidance Model',
    lastVerifiedDate: 'October 2026',
    eligibility: 'Basic sewing machine operation, taking measurements for blouses and suits.',
    documentsRequired: ['Self-Help Group (SHG) Passbook (if affiliated)'],
    contactInfo: 'Village SHG Leader / NRLM Mitra'
  },
  {
    id: 't1',
    title: 'PMKVY Digital Literacy & Data Entry Certification',
    org: 'Pradhan Mantri Kaushal Vikas Yojana Training Centre',
    type: 'Training',
    loc: 'District Skill Training Hall, Maharajganj',
    km: 5,
    pay: 'Free Government-Sponsored Training with Stipend',
    path: 'digital',
    verified: true,
    source: 'National Skill Development Corporation (NSDC)',
    lastVerifiedDate: 'October 2026',
    eligibility: 'Ages 18-35, minimum 8th class pass, valid Aadhaar card.',
    documentsRequired: ['Aadhaar Card', 'School Transfer Certificate or 10th Passbook'],
    contactInfo: 'Skill Development Center, Civil Lines'
  },
  {
    id: 't2',
    title: 'RSETI Sewing Machine & Boutique Craft Program',
    org: 'Rural Self Employment Training Institute',
    type: 'Training',
    loc: 'Lead Bank Training Campus, Gorakhpur',
    km: 48,
    pay: 'Free Residential Course + Toolkit Assistance',
    path: 'tailoring',
    verified: true,
    source: 'Ministry of Rural Development (MoRD)',
    lastVerifiedDate: 'October 2026',
    eligibility: 'Rural women and youth, basic literacy, interest in self-employment.',
    documentsRequired: ['Ration Card / BPL Card', 'Aadhaar Card', 'Bank Account details'],
    contactInfo: 'RSETI Director, Campus Desk'
  },
];

export const LANG_CONFIG = [
  { k: 'hi', label: 'हिन्दी', sub: 'Hindi', code: 'hi-IN' },
  { k: 'bho', label: 'भोजपुरी', sub: 'Bhojpuri', code: 'hi-IN' },
  { k: 'en', label: 'English', sub: 'English', code: 'en-IN' },
  { k: 'hin', label: 'Hinglish', sub: 'Hindi + English', code: 'en-IN' },
];

export const CONVERSATION_EXAMPLES = {
  hi: [
    { q: 'आपका नाम क्या है?', a: 'मेरा नाम सुनीता देवी है।', en: 'What is your name? / My name is Sunita Devi.' },
    { q: 'आपको किस तरह के काम में रुचि है?', a: 'मुझे कंप्यूटर और मोबाइल पर काम सीखना है।', en: 'What work interests you? / I want to learn computer and mobile work.' },
    { q: 'काम के लिए आप कितनी दूर जा सकते हैं?', a: 'मैं अपने गाँव के पास ही काम करना चाहती हूँ।', en: 'How far can you travel? / I want to work near my village.' },
  ],
  bho: [
    { q: 'रउआ नाम का बा?', a: 'हमार नाम सुनीता देवी बा।', en: 'What is your name? / My name is Sunita Devi.' },
    { q: 'रउआ कइसन काम करे में मन लागेला?', a: 'हमरा कंप्यूटर अउर मोबाइल पर काम सीखे के बा।', en: 'What work interests you? / I want to learn work on computer and mobile.' },
    { q: 'काम खातिर रउआ केतना दूर जा सकत बानी?', a: 'हम आपन गाँव के लगे ही काम करे के चाहिला।', en: 'How far can you travel? / I want to work near my village.' },
  ],
  hin: [
    { q: 'Aapka naam kya hai?', a: 'Mera naam Sunita Devi hai.', en: 'What is your name? / My name is Sunita Devi.' },
    { q: 'Aapko kis tarah ke kaam mein ruchi hai?', a: 'Mujhe computer aur mobile ka kaam seekhna hai.', en: 'What work interests you? / I want to learn computer and mobile work.' },
    { q: 'Kaam ke liye aap kitni door ja sakte hain?', a: 'Main gaon ke paas hi kaam karna chahti hoon.', en: 'How far can you travel? / I want to work near my village.' },
  ],
};
