import {
  Opportunity,
  GovernmentScheme,
  LocationInsight,
  LocationLivelihoodData,
  SupportedLanguage,
  BeneficiaryProfile,
  LocationAccuracyLevel,
  LocationAccuracyInfo,
} from '../types';
import { JOBS } from '../data/mockData';

// Storage key for caching current location livelihood data
const LOCATION_DATA_CACHE_KEY = 'jeevika_location_livelihood_cache_v2';
const ACTIVE_LOCATION_KEY = 'jeevika_active_location_v2';
const ACCURACY_STORAGE_KEY = 'jeevika_location_accuracy_v2';

export interface LocationDetectionResult {
  location: string;
  district: string;
  state: string;
  accuracyLevel: LocationAccuracyLevel;
  confidenceScore: number;
  accuracyMeters?: number;
  latitude?: number;
  longitude?: number;
  locality?: string;
  pincode?: string;
  source: 'gps' | 'manual' | 'cache' | 'default';
  description: string;
}

export interface IndianStateDistricts {
  state: string;
  stateHi: string;
  districts: { name: string; hi: string }[];
}

export const POPULAR_INDIAN_REGIONS: IndianStateDistricts[] = [
  {
    state: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    districts: [
      { name: 'Maharajganj', hi: 'महराजगंज' },
      { name: 'Gorakhpur', hi: 'गोरखपुर' },
      { name: 'Varanasi', hi: 'वाराणसी' },
      { name: 'Lucknow', hi: 'लखनऊ' },
      { name: 'Prayagraj', hi: 'प्रयागराज' },
      { name: 'Ayodhya', hi: 'अयोध्या' },
      { name: 'Azamgarh', hi: 'आजमगढ़' },
      { name: 'Basti', hi: 'बस्ती' },
      { name: 'Deoria', hi: 'देवरिया' },
      { name: 'Kushinagar', hi: 'कुशीनगर' },
      { name: 'Mirzapur', hi: 'मिर्ज़ापुर' },
      { name: 'Kanpur Nagar', hi: 'कानपुर नगर' },
      { name: 'Agra', hi: 'आगरा' },
      { name: 'Bareilly', hi: 'बरेली' },
      { name: 'Meerut', hi: 'मेरठ' },
    ],
  },
  {
    state: 'Bihar',
    stateHi: 'बिहार',
    districts: [
      { name: 'Patna', hi: 'पटना' },
      { name: 'Gaya', hi: 'गया' },
      { name: 'Muzaffarpur', hi: 'मुजफ्फरपुर' },
      { name: 'Bhagalpur', hi: 'भागलपुर' },
      { name: 'Darbhanga', hi: 'दरभंगा' },
      { name: 'Purnia', hi: 'पूर्णिया' },
      { name: 'Samastipur', hi: 'समस्तीपुर' },
      { name: 'Saran (Chhapra)', hi: 'सारण (छपरा)' },
      { name: 'Siwan', hi: 'सीवान' },
      { name: 'Gopalganj', hi: 'गोपालगंज' },
      { name: 'Vaishali', hi: 'वैशाली' },
      { name: 'Begusarai', hi: 'बेगूसराय' },
      { name: 'Nalanda', hi: 'नालंदा' },
    ],
  },
  {
    state: 'Madhya Pradesh',
    stateHi: 'मध्य प्रदेश',
    districts: [
      { name: 'Bhopal', hi: 'भोपाल' },
      { name: 'Indore', hi: 'इंदौर' },
      { name: 'Gwalior', hi: 'ग्वालियर' },
      { name: 'Jabalpur', hi: 'जबलपुर' },
      { name: 'Ujjain', hi: 'उज्जैन' },
      { name: 'Rewa', hi: 'रीवा' },
      { name: 'Satna', hi: 'सतना' },
      { name: 'Sagar', hi: 'सागर' },
    ],
  },
  {
    state: 'Rajasthan',
    stateHi: 'राजस्थान',
    districts: [
      { name: 'Jaipur', hi: 'जयपुर' },
      { name: 'Jodhpur', hi: 'जोधपुर' },
      { name: 'Udaipur', hi: 'उदयपुर' },
      { name: 'Kota', hi: 'कोटा' },
      { name: 'Bikaner', hi: 'बीकानेर' },
      { name: 'Ajmer', hi: 'अजमेर' },
      { name: 'Alwar', hi: 'अलवर' },
    ],
  },
  {
    state: 'Jharkhand',
    stateHi: 'झारखंड',
    districts: [
      { name: 'Ranchi', hi: 'राँची' },
      { name: 'Dhanbad', hi: 'धनबाद' },
      { name: 'Jamshedpur (East Singhbhum)', hi: 'जमशेदपुर' },
      { name: 'Bokaro', hi: 'बोकारो' },
      { name: 'Deoghar', hi: 'देवघर' },
      { name: 'Hazaribagh', hi: 'हजारीबाग' },
    ],
  },
  {
    state: 'Maharashtra',
    stateHi: 'महाराष्ट्र',
    districts: [
      { name: 'Mumbai Suburban', hi: 'मुंबई' },
      { name: 'Pune', hi: 'पुणे' },
      { name: 'Nagpur', hi: 'नागपुर' },
      { name: 'Nashik', hi: 'नासिक' },
      { name: 'Chhatrapati Sambhajinagar', hi: 'छत्रपति संभाजीनगर' },
      { name: 'Thane', hi: 'ठाणे' },
    ],
  },
  {
    state: 'Haryana',
    stateHi: 'हरियाणा',
    districts: [
      { name: 'Gurugram', hi: 'गुरुग्राम' },
      { name: 'Faridabad', hi: 'फरीदाबाद' },
      { name: 'Hisar', hi: 'हिसार' },
      { name: 'Karnal', hi: 'करनाल' },
      { name: 'Rohtak', hi: 'रोहतक' },
      { name: 'Panipat', hi: 'पानीपत' },
    ],
  },
  {
    state: 'West Bengal',
    stateHi: 'पश्चिम बंगाल',
    districts: [
      { name: 'Kolkata', hi: 'कोलकाता' },
      { name: 'Howrah', hi: 'हावड़ा' },
      { name: 'North 24 Parganas', hi: 'उत्तर 24 परगना' },
      { name: 'Siliguri (Darjeeling)', hi: 'सिलीगुड़ी' },
      { name: 'Murshidabad', hi: 'मुर्शिदाबाद' },
      { name: 'Asansol (Paschim Bardhaman)', hi: 'आसनसोल' },
    ],
  },
  {
    state: 'Delhi NCR',
    stateHi: 'दिल्ली एनसीआर',
    districts: [
      { name: 'North East Delhi', hi: 'उत्तर पूर्व दिल्ली' },
      { name: 'South Delhi', hi: 'दक्षिण दिल्ली' },
      { name: 'West Delhi', hi: 'पश्चिम दिल्ली' },
      { name: 'East Delhi', hi: 'पूर्वी दिल्ली' },
      { name: 'Noida (Gautam Buddha Nagar)', hi: 'नोएडा' },
      { name: 'Ghaziabad', hi: 'गाजियाबाद' },
    ],
  },
];

/**
 * Curated high-fidelity district fallback data when Gemini API is offline or initial load
 */
const CURATED_DISTRICT_DATABASE: Record<string, Partial<LocationLivelihoodData>> = {
  'maharajganj': {
    district: 'Maharajganj',
    state: 'Uttar Pradesh',
    insight: {
      district: 'Maharajganj',
      state: 'Uttar Pradesh',
      economicHub: 'Agro-processing, Cross-Border Trade & Rural Digital Seva',
      topSectors: ['Agro Logistics & Rice Milling', 'Digital CSC Centers', 'Rooftop Solar', 'Garment & Tailoring'],
      averageMonthlyWage: '₹8,500 - ₹14,000',
      activeSchemesCount: 7,
      openVacanciesCount: 38,
      verifiedCentersCount: 3,
      summary: 'भारत-नेपाल सीमा क्षेत्र में कृषि लॉजिस्टिक्स, सोलर पंप इंस्टॉलेशन और सीएससी डिजिटल केंद्रों की भारी मांग है।',
    },
    opportunities: [
      {
        id: 'mg-j1',
        title: 'CSC Digital Seva Assistant',
        org: 'District Common Service Centre Network',
        type: 'Job',
        loc: 'Civil Lines, Maharajganj Town',
        km: 3,
        pay: '₹8,500 to ₹12,000 per month',
        path: 'digital',
        verified: true,
        source: 'District e-Governance Society (DeGS)',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, basic computer typing and smartphone handling.',
        documentsRequired: ['Aadhaar Card', '10th Marksheet', 'Bank Passbook'],
        contactInfo: 'District CSC Office, Collectorate Campus'
      },
      {
        id: 'mg-j2',
        title: 'Solar Rooftop & Tube-well Helper',
        org: 'Purvanchal Solar Energy Solutions',
        type: 'Job',
        loc: 'Nichlaul & Maharajganj Rural',
        km: 12,
        pay: '₹9,500 to ₹14,500 per month',
        path: 'solar',
        verified: true,
        source: 'PM Surya Ghar Approved Agency',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Physically fit, comfortable with ladder/roof climbing.',
        documentsRequired: ['Aadhaar Card', 'Medical Fitness Certificate'],
        contactInfo: 'Field Manager: Nichlaul Road Office'
      },
      {
        id: 'mg-j3',
        title: 'Boutique & Readymade Tailoring Cluster',
        org: 'Prerna Mahila Self-Help Cluster',
        type: 'Self-employment',
        loc: 'Ghughli / Maharajganj',
        km: 8,
        pay: '₹6,000 to ₹13,000 per month (per piece)',
        path: 'tailoring',
        verified: true,
        source: 'NRLM District Mission Management Unit',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Basic sewing machine operation, stitching school uniforms/blouses.',
        documentsRequired: ['Aadhaar Card', 'SHG Member ID (optional)'],
        contactInfo: 'Block Mission Manager, Ghughli'
      },
      {
        id: 'mg-j4',
        title: 'Agro-Mandi Retail & Billing Executive',
        org: 'Kisan Krishi Seva Kendra',
        type: 'Job',
        loc: 'Anandnagar (Pharenda), Maharajganj',
        km: 18,
        pay: '₹9,000 to ₹13,500 per month',
        path: 'retail',
        verified: true,
        source: 'Local Mandi Vyapar Mandal',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th or 12th pass, basic arithmetic and stock counting.',
        documentsRequired: ['Aadhaar Card', 'Resume/Biodata'],
        contactInfo: 'Mandi Gate No. 2, Pharenda'
      }
    ],
    trainingCenters: [
      {
        id: 'mg-t1',
        title: 'Govt ITI Maharajganj (Technical & Electrician Trades)',
        org: 'Department of Vocational Education & Skill Development UP',
        type: 'Training',
        loc: 'Shikarpur Road, Maharajganj',
        km: 4,
        pay: 'Free Government Training + UP Free Laptop/Tablet Scheme',
        path: 'solar',
        verified: true,
        source: 'NCVT / SCVT Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, age 14 to 40 years.',
        documentsRequired: ['Aadhaar Card', '10th Certificate', 'Caste/Income Certificate (if applicable)'],
        contactInfo: 'Principal Office, Govt ITI Maharajganj'
      },
      {
        id: 'mg-t2',
        title: 'PMKVY Kaushal Kendra (Digital Literacy & Data Entry)',
        org: 'Pradhan Mantri Kaushal Vikas Yojana',
        type: 'Training',
        loc: 'College Road, Maharajganj',
        km: 2,
        pay: '100% Free Government Course + Skill India Certificate',
        path: 'digital',
        verified: true,
        source: 'NSDC Skill India Digital',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Ages 18-35, 8th or 10th pass.',
        documentsRequired: ['Aadhaar Card', 'School Leaving Certificate'],
        contactInfo: 'Center Head, PMKK Maharajganj'
      },
      {
        id: 'mg-t3',
        title: 'RSETI Gorakhpur-Maharajganj (Sewing & Mobile Repair)',
        org: 'Lead Bank Rural Self Employment Training Institute',
        type: 'Training',
        loc: 'Union Bank RSETI Campus, Gorakhpur Road',
        km: 25,
        pay: 'Free Residential Course + Free Meals + Bank Loan Linkage',
        path: 'tailoring',
        verified: true,
        source: 'Ministry of Rural Development (MoRD)',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Rural youth ages 18-45 with intent to start own business.',
        documentsRequired: ['Aadhaar Card', 'Ration Card', 'Bank Passbook'],
        contactInfo: 'RSETI Director, Campus Desk'
      }
    ],
    schemes: [
      {
        id: 'sch-1',
        name: 'PM Vishwakarma Yojana',
        hiName: 'प्रधानमंत्री विश्वकर्मा योजना',
        benefit: '₹15,000 टूलकिट ई-वाउचर + ₹3 लाख तक का 5% ब्याज पर बिना गारंटी लोन',
        eligibility: '18 पारंपरिक कारीगर एवं शिल्पकार (दर्जी, लोहार, बढ़ई, राजमिस्त्री आदि)',
        applyOffice: 'नजदीकी CSC केंद्र या ग्राम पंचायत सचिवालय',
        category: 'toolkit',
        financialSupport: '₹15,000 टूलकिट अनुदान + ₹500/दिन प्रशिक्षण वजीफा'
      },
      {
        id: 'sch-2',
        name: 'UP One District One Product (ODOP) Toolkit Scheme',
        hiName: 'उत्तर प्रदेश एक जिला एक उत्पाद (ODOP) योजना',
        benefit: 'मुफ्त आधुनिक टूलकिट और 25% तक वित्तीय अनुदान',
        eligibility: 'जिले के पारंपरिक उद्योग से जुड़े स्थानीय कामगार एवं हस्तशिल्पी',
        applyOffice: 'जिला उद्योग एवं उद्यम प्रोत्साहन केंद्र (DIC), महराजगंज',
        category: 'state',
        financialSupport: '₹25,000 तक टूलकिट + व्यवसाय हेतु मार्जिन मनी'
      },
      {
        id: 'sch-3',
        name: 'Pradhan Mantri Mudra Yojana (PMMY)',
        hiName: 'प्रधानमंत्री मुद्रा योजना (शिशु/किशोर/तरुण)',
        benefit: '₹50,000 से ₹10 लाख तक बिना किसी कोलेटरल (गारंटी) के व्यापार लोन',
        eligibility: 'नया व्यवसाय शुरू करने या बढ़ाने वाले ग्रामीण व शहरी नागरिक',
        applyOffice: 'किसी भी राष्ट्रीयकृत बैंक (PNB, SBI, Baroda) शाखा में',
        category: 'loan',
        financialSupport: 'शिशु लोन: ₹50,000 तक मात्र 3 दिन में स्वीकृत'
      }
    ]
  },
  'patna': {
    district: 'Patna',
    state: 'Bihar',
    insight: {
      district: 'Patna',
      state: 'Bihar',
      economicHub: 'IT Services, Retail Logistics, Healthcare & E-Commerce Delivery',
      topSectors: ['E-Commerce Logistics & Last-Mile Delivery', 'Digital Services & BPO', 'Retail Mall Staff', 'Solar Rooftop & Technical Repair'],
      averageMonthlyWage: '₹10,500 - ₹18,000',
      activeSchemesCount: 9,
      openVacanciesCount: 84,
      verifiedCentersCount: 6,
      summary: 'पटना में लॉजिस्टिक्स, रिटेल आउटलेट्स, कंप्यूटर ऑपरेटर और मुख्यमंत्री उद्यमी योजना के तहत स्वरोजगार के बेहतरीन अवसर हैं।',
    },
    opportunities: [
      {
        id: 'pt-j1',
        title: 'Delivery Executive & Logistics Partner',
        org: 'Flipkart & Zomato Regional Hub Patna',
        type: 'Job',
        loc: 'Boring Road / Bailey Road, Patna',
        km: 5,
        pay: '₹12,000 to ₹18,000 per month + Fuel Allowance',
        path: 'retail',
        verified: true,
        source: 'Patna Logistics Hub',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, two-wheeler driving license, smartphone handling.',
        documentsRequired: ['Aadhaar Card', 'Driving License', 'Bank Passbook'],
        contactInfo: 'Hub Manager, Kankarbagh Main Hub'
      },
      {
        id: 'pt-j2',
        title: 'Data Entry & Billing Associate',
        org: 'Patna MedCity & Diagnostic Chain',
        type: 'Job',
        loc: 'Rajendra Nagar, Patna',
        km: 4,
        pay: '₹11,000 to ₹16,000 per month',
        path: 'digital',
        verified: true,
        source: 'Bihar Skill Development Mission Registry',
        lastVerifiedDate: 'October 2026',
        eligibility: '12th pass, Hindi/English typing speed 25+ wpm.',
        documentsRequired: ['Aadhaar Card', '12th Certificate'],
        contactInfo: 'HR Desk, Rajendra Nagar Branch'
      },
      {
        id: 'pt-j3',
        title: 'Solar Technician & Rooftop Installer',
        org: 'Bihar Renewable Energy Agency (BREDA) Approved Partner',
        type: 'Job',
        loc: 'Patna City & Danapur',
        km: 9,
        pay: '₹11,500 to ₹17,000 per month',
        path: 'solar',
        verified: true,
        source: 'BREDA Vendor Cluster',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th/ITI, basic electrical knowledge, safe height handling.',
        documentsRequired: ['Aadhaar Card', 'ITI or High School Certificate'],
        contactInfo: 'BREDA Field Desk, Bailey Road'
      }
    ],
    trainingCenters: [
      {
        id: 'pt-t1',
        title: 'Govt ITI Digha (Premier Skill Institute)',
        org: 'Directorate of Employment & Training, Govt of Bihar',
        type: 'Training',
        loc: 'Digha Ghat, Patna',
        km: 7,
        pay: 'Free / Nominal Fee with State Skill Stipend',
        path: 'solar',
        verified: true,
        source: 'NCVT Portal Bihar',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass with Science/Maths.',
        documentsRequired: ['Aadhaar Card', '10th Marksheet', 'Residential Certificate of Bihar'],
        contactInfo: 'ITI Digha Campus Desk'
      },
      {
        id: 'pt-t2',
        title: 'Bihar Kushal Yuva Program (KYP) Center',
        org: 'Bihar Skill Development Mission (BSDM)',
        type: 'Training',
        loc: 'Kankarbagh Community Center, Patna',
        km: 3,
        pay: '100% Free (Refundable ₹1000 security upon completion)',
        path: 'digital',
        verified: true,
        source: 'BSDM 7 Nischay Program',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Bihar resident, 10th or 12th pass, age 15-28.',
        documentsRequired: ['Aadhaar Card', 'Matric Certificate', 'Bank Account'],
        contactInfo: 'Block Education Officer / KYP Center Desk'
      }
    ],
    schemes: [
      {
        id: 'sch-bi-1',
        name: 'Mukhyamantri Udyami Yojana (Bihar)',
        hiName: 'बिहार मुख्यमंत्री उद्यमी योजना (SC/ST/EBC/महिला/युवा)',
        benefit: '₹10 लाख तक की परियोजना लागत (₹5 लाख 100% अनुदान/माफ + ₹5 लाख 1% ब्याज पर लोन)',
        eligibility: 'बिहार का मूल निवासी, 12th/ITI/डिप्लोमा पास, उम्र 18-50 वर्ष',
        applyOffice: 'udyami.bihar.gov.in ऑनलाइन पोर्टल या जिला उद्योग केंद्र (DIC) पटना',
        category: 'state',
        financialSupport: '₹5 लाख सीधे सरकारी सब्सिडी'
      },
      {
        id: 'sch-bi-2',
        name: 'Kushal Yuva Program (KYP)',
        hiName: 'कुशल युवा कार्यक्रम (BSDM)',
        benefit: 'कंप्यूटर साक्षरता, अंग्रेजी व हिन्दी संवाद कौशल और सॉफ्ट स्किल्स की 240 घंटे की मुफ्त ट्रेनिंग',
        eligibility: '10वीं या 12वीं पास बिहार के युवा',
        applyOffice: 'जिला निबंधन एवं परामर्श केंद्र (DRCC) पटना',
        category: 'state',
        financialSupport: 'निःशुल्क सरकारी प्रशिक्षण व प्रमाण-पत्र'
      }
    ]
  },
  'varanasi': {
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    insight: {
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      economicHub: 'Silk Handloom, Zari Craft, Heritage Tourism, Wooden Toys & Modern Logistics',
      topSectors: ['Banarasi Silk & Textile Fashion', 'Hospitality & Tourism Services', 'Digital E-Commerce & Retail', 'Electric Vehicle & Solar Maintenance'],
      averageMonthlyWage: '₹9,500 - ₹16,500',
      activeSchemesCount: 8,
      openVacanciesCount: 62,
      verifiedCentersCount: 5,
      summary: 'वाराणसी में पारंपरिक रेशम बुनाई, विश्वकर्मा योजना के तहत टूलकिट व लोन, और पर्यटन व डिजिटल सेवाओं के ढेरों अवसर उपलब्ध हैं।',
    },
    opportunities: [
      {
        id: 'vns-j1',
        title: 'Master Tailor & Boutique Finishing Artist',
        org: 'Banaras Craft Weaver Cooperative',
        type: 'Job',
        loc: 'Chowk & Sigra, Varanasi',
        km: 4,
        pay: '₹10,000 to ₹17,000 per month',
        path: 'tailoring',
        verified: true,
        source: 'Weavers Service Centre Varanasi',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Experience in blouse cutting, designer suit finishing, or embroidery.',
        documentsRequired: ['Aadhaar Card', 'Sample work demonstration'],
        contactInfo: 'Weaver Hub Sigra, Varanasi'
      },
      {
        id: 'vns-j2',
        title: 'Customer Service & Billing Executive',
        org: 'Kashi Vishwanath Corridor Retail Arcade',
        type: 'Job',
        loc: 'Godowlia / Dashashwamedh, Varanasi',
        km: 5,
        pay: '₹9,500 to ₹15,000 per month',
        path: 'retail',
        verified: true,
        source: 'Varanasi Smart City Merchant Association',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, polite Hindi/Bhojpuri communication, basic digital billing.',
        documentsRequired: ['Aadhaar Card', '10th Certificate'],
        contactInfo: 'Merchant Association Desk, Godowlia'
      }
    ],
    trainingCenters: [
      {
        id: 'vns-t1',
        title: 'Govt ITI Karaundi (Leading ITI in Purvanchal)',
        org: 'Department of Vocational Training UP',
        type: 'Training',
        loc: 'Karaundi, Near BHU Campus, Varanasi',
        km: 6,
        pay: 'Govt Subsidized Technical Courses + Apprenticeship Linkage',
        path: 'solar',
        verified: true,
        source: 'Govt ITI Karaundi',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass with Science/Maths.',
        documentsRequired: ['Aadhaar Card', 'High School Marksheet'],
        contactInfo: 'Govt ITI Campus, Karaundi'
      },
      {
        id: 'vns-t2',
        title: 'Union Bank RSETI Varanasi',
        org: 'Union Bank of India Rural Self Employment Training Institute',
        type: 'Training',
        loc: 'Shivpur, Varanasi',
        km: 8,
        pay: 'Free Residential Course + Meals + Mudra Loan Support',
        path: 'tailoring',
        verified: true,
        source: 'MoRD RSETI Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Ages 18-45, intent for self-employment.',
        documentsRequired: ['Aadhaar Card', 'Ration Card', 'Passport Photos'],
        contactInfo: 'RSETI Director, Shivpur Branch'
      }
    ],
    schemes: [
      {
        id: 'vns-sch-1',
        name: 'PM Vishwakarma Scheme (Weavers & Tailors Focus)',
        hiName: 'प्रधानमंत्री विश्वकर्मा योजना (वाराणसी क्लस्टर)',
        benefit: '₹15,000 टूलकिट वाउचर + ₹3 लाख रियायती ऋण + आधुनिक तकनीक ट्रेनिंग',
        eligibility: 'हथकरघा बुनकर, दर्जी, लकड़ी के खिलौना निर्माता',
        applyOffice: 'वीवर्स सर्विस सेंटर चौकाघाट या नजदीकी CSC केंद्र',
        category: 'toolkit',
        financialSupport: '₹15,000 सीधे बैंक में टूलकिट हेतु'
      }
    ]
  },
  'ghaziabad': {
    district: 'Ghaziabad',
    state: 'Uttar Pradesh',
    insight: {
      district: 'Ghaziabad',
      state: 'Uttar Pradesh',
      economicHub: 'Industrial Manufacturing, E-Commerce Logistics, Electronics & NCR Retail Corridor',
      topSectors: ['E-Commerce Logistics & Warehousing', 'Digital CSC & BPO Centers', 'Rooftop Solar & Technical Repair', 'Retail & Mall Operations'],
      averageMonthlyWage: '₹12,000 - ₹22,000',
      activeSchemesCount: 9,
      openVacanciesCount: 95,
      verifiedCentersCount: 6,
      summary: 'गाजियाबाद-एनसीआर में साहिबाबाद, कविनगर एवं मोहन नगर औद्योगिक क्षेत्रों में लॉजिस्टिक्स, डिजिटल ऑपरेटर, सोलर और रिटेल में व्यापक रोजगार उपलब्ध हैं।',
    },
    opportunities: [
      {
        id: 'gzb-j1',
        title: 'E-Commerce Logistics & Hub Associate',
        org: 'NCR Warehousing & Delivery Logistics Hub',
        type: 'Job',
        loc: 'Sahibabad Industrial Area, Ghaziabad',
        km: 4,
        pay: '₹13,500 to ₹19,500 per month',
        path: 'retail',
        verified: true,
        source: 'District Employment Exchange Ghaziabad',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th/12th pass, inventory counting and smartphone app handling.',
        documentsRequired: ['Aadhaar Card', '10th Marksheet', 'Bank Passbook'],
        contactInfo: 'Logistics Facility Desk, Site 4, Sahibabad'
      },
      {
        id: 'gzb-j2',
        title: 'CSC Digital Seva Partner & Banking Mitra',
        org: 'District e-Governance Society Ghaziabad',
        type: 'Job',
        loc: 'RDC Raj Nagar & Navyug Market, Ghaziabad',
        km: 3,
        pay: '₹11,000 to ₹17,000 per month',
        path: 'digital',
        verified: true,
        source: 'DeGS Ghaziabad Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: '12th pass, Hindi/English computer typing and Aadhaar portal knowledge.',
        documentsRequired: ['Aadhaar Card', '12th Certificate'],
        contactInfo: 'District CSC Operations Desk, Collectorate Compound'
      },
      {
        id: 'gzb-j3',
        title: 'Rooftop Solar Installation & Maintenance Technician',
        org: 'NCR Green Energy Solutions (PM Surya Ghar Approved)',
        type: 'Job',
        loc: 'Kavi Nagar & Meerut Road Industrial Area, Ghaziabad',
        km: 6,
        pay: '₹12,500 to ₹18,500 per month',
        path: 'solar',
        verified: true,
        source: 'PM Surya Ghar Approved Vendor Cluster',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Physical fitness, basic electrical or ITI wireman training.',
        documentsRequired: ['Aadhaar Card', 'Medical Certificate'],
        contactInfo: 'Solar Technical Office, Meerut Road'
      },
      {
        id: 'gzb-j4',
        title: 'Garment & Boutique Cluster Production Associate',
        org: 'Ghaziabad Apparel & Hosiery Association',
        type: 'Self-employment',
        loc: 'Loni Industrial Area & Mohan Nagar, Ghaziabad',
        km: 8,
        pay: '₹9,000 to ₹16,000 per month',
        path: 'tailoring',
        verified: true,
        source: 'District Industries Center (DIC) Ghaziabad',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Industrial sewing machine handling, cutting, and finishing.',
        documentsRequired: ['Aadhaar Card', 'Proof of experience'],
        contactInfo: 'Apparel Association Office, Loni Road'
      }
    ],
    trainingCenters: [
      {
        id: 'gzb-t1',
        title: 'Govt ITI Ghaziabad (Premier Technical Campus)',
        org: 'Directorate of Training & Employment UP',
        type: 'Training',
        loc: 'Sector 23, Sanjay Nagar, Ghaziabad',
        km: 4,
        pay: '100% Free Govt Course + Dual Training with Industry Stipend',
        path: 'solar',
        verified: true,
        source: 'NCVT / SCVT UP Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, age 14 to 40.',
        documentsRequired: ['Aadhaar Card', '10th Marksheet', 'Domicile Certificate'],
        contactInfo: 'Principal Office, Govt ITI Sanjay Nagar, Ghaziabad'
      },
      {
        id: 'gzb-t2',
        title: 'PMKVY Kaushal Kendra (Digital & Hardware Lab)',
        org: 'Skill India Mission Training Hub',
        type: 'Training',
        loc: 'Near Old Bus Stand, GT Road, Ghaziabad',
        km: 3,
        pay: 'Free Government-Sponsored Training with NSDC Certification',
        path: 'digital',
        verified: true,
        source: 'Skill India Digital Hub',
        lastVerifiedDate: 'October 2026',
        eligibility: '8th or 10th pass, ages 18-35.',
        documentsRequired: ['Aadhaar Card', 'Education Proof'],
        contactInfo: 'Centre Director, PMKK GT Road'
      },
      {
        id: 'gzb-t3',
        title: 'RSETI PNB Lead Bank Training Center',
        org: 'Punjab National Bank Rural Self Employment Training Institute',
        type: 'Training',
        loc: 'PNB Regional Office, Hapur Road, Ghaziabad',
        km: 7,
        pay: 'Free Residential Skilling + Free Meals + Mudra Loan Linkage',
        path: 'tailoring',
        verified: true,
        source: 'MoRD RSETI Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Youth and women ages 18-45.',
        documentsRequired: ['Aadhaar Card', 'Ration Card', 'Bank Passbook'],
        contactInfo: 'RSETI Director, Hapur Road Campus'
      }
    ],
    schemes: [
      {
        id: 'gzb-sch-1',
        name: 'PM Vishwakarma Yojana (Ghaziabad DIC)',
        hiName: 'प्रधानमंत्री विश्वकर्मा योजना',
        benefit: '₹15,000 टूलकिट अनुदान + ₹3 लाख तक रियायती लोन (5% ब्याज दर)',
        eligibility: '18 पारंपरिक दस्तकार एवं कारीगर',
        applyOffice: 'जिला उद्योग केंद्र (DIC) कविनगर या नजदीकी CSC केंद्र, गाजियाबाद',
        category: 'toolkit',
        financialSupport: '₹15,000 टूलकिट अनुदान + ₹500/दिन वजीफा'
      },
      {
        id: 'gzb-sch-2',
        name: 'UP Mukhyamantri Yuva Swarojgar Yojana',
        hiName: 'उत्तर प्रदेश मुख्यमंत्री युवा स्वरोजगार योजना',
        benefit: 'उद्योग हेतु ₹25 लाख व सेवा क्षेत्र हेतु ₹10 लाख तक परियोजना लोन (25% मार्जिन मनी सब्सिडी)',
        eligibility: '10वीं पास उत्तर प्रदेश निवासी, उम्र 18-40 वर्ष',
        applyOffice: 'जिला उद्योग एवं उद्यम प्रोत्साहन केंद्र, गाजियाबाद',
        category: 'state',
        financialSupport: '₹6.25 लाख तक मार्जिन मनी अनुदान'
      },
      {
        id: 'gzb-sch-3',
        name: 'Pradhan Mantri Mudra Yojana (PMMY)',
        hiName: 'प्रधानमंत्री मुद्रा योजना (PMMY)',
        benefit: '₹50,000 से ₹10 लाख तक बिना गारंटी व्यवसाय ऋण',
        eligibility: 'छोटे व्यापारी, वर्कशॉप संचालक व सेवा प्रदाता',
        applyOffice: 'गाजियाबाद की किसी भी बैंक शाखा में',
        category: 'loan',
        financialSupport: 'बिना कोलेटरल 7 दिनों में स्वीकृति'
      }
    ]
  },
  'gorakhpur': {
    district: 'Gorakhpur',
    state: 'Uttar Pradesh',
    insight: {
      district: 'Gorakhpur',
      state: 'Uttar Pradesh',
      economicHub: 'GIDA Industrial Area, AIIMS Healthcare Corridor, Terracotta ODOP & Agro Trade',
      topSectors: ['GIDA Industrial Manufacturing', 'Healthcare & Hospital Logistics', 'Terracotta & Readymade Garments', 'Digital Seva & Retail'],
      averageMonthlyWage: '₹9,500 - ₹16,000',
      activeSchemesCount: 8,
      openVacanciesCount: 72,
      verifiedCentersCount: 5,
      summary: 'गोरखपुर में GIDA औद्योगिक क्षेत्र, टेराकोटा क्लस्टर और एम्स कॉरिडोर में तकनीकी, डिजिटल और उत्पादन से जुड़े व्यापक अवसर हैं।',
    },
    opportunities: [
      {
        id: 'gkp-j1',
        title: 'Industrial Machine & Packaging Operator',
        org: 'GIDA Industrial Manufacturing Cluster',
        type: 'Job',
        loc: 'GIDA Sector 13, Gorakhpur',
        km: 12,
        pay: '₹11,000 to ₹16,500 per month',
        path: 'retail',
        verified: true,
        source: 'GIDA Industries Association',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th/12th pass, willingness to learn production machinery.',
        documentsRequired: ['Aadhaar Card', 'High School Marksheet'],
        contactInfo: 'GIDA Administrative Building, Gorakhpur'
      },
      {
        id: 'gkp-j2',
        title: 'CSC E-District & Banking Mitra',
        org: 'District e-Governance Society Gorakhpur',
        type: 'Job',
        loc: 'Golghar / Civil Lines, Gorakhpur',
        km: 4,
        pay: '₹9,500 to ₹14,000 per month',
        path: 'digital',
        verified: true,
        source: 'DeGS Gorakhpur Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, basic computer typing and mobile operations.',
        documentsRequired: ['Aadhaar Card', 'Bank Passbook'],
        contactInfo: 'Collectorate Compound, Gorakhpur'
      },
      {
        id: 'gkp-j3',
        title: 'Solar Technical & Panel Installation Helper',
        org: 'Purvanchal Vidyut & Solar Power Solutions',
        type: 'Job',
        loc: 'Medical College Road, Gorakhpur',
        km: 7,
        pay: '₹10,000 to ₹15,500 per month',
        path: 'solar',
        verified: true,
        source: 'PM Surya Ghar Purvanchal Cluster',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Physically fit, comfortable with rooftop work.',
        documentsRequired: ['Aadhaar Card', 'Medical Certificate'],
        contactInfo: 'Purvanchal Solar Desk, Mohaddipur'
      }
    ],
    trainingCenters: [
      {
        id: 'gkp-t1',
        title: 'Govt ITI Charphatak, Gorakhpur',
        org: 'Directorate of Vocational Training UP',
        type: 'Training',
        loc: 'Charphatak Road, Gorakhpur',
        km: 5,
        pay: 'Govt Free/Subsidized Training + Placement Linkage',
        path: 'solar',
        verified: true,
        source: 'NCVT Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass.',
        documentsRequired: ['Aadhaar Card', '10th Certificate'],
        contactInfo: 'Campus Office, Charphatak ITI'
      },
      {
        id: 'gkp-t2',
        title: 'RSETI Lead Bank Training Institute (Union Bank)',
        org: 'Union Bank of India RSETI Gorakhpur',
        type: 'Training',
        loc: 'Near GIDA Campus, Gorakhpur',
        km: 14,
        pay: '100% Free Residential Course + Free Meals + Toolkit Loan Linkage',
        path: 'tailoring',
        verified: true,
        source: 'MoRD RSETI Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Ages 18-45.',
        documentsRequired: ['Aadhaar Card', 'Ration Card'],
        contactInfo: 'RSETI Director, Campus Desk'
      }
    ],
    schemes: [
      {
        id: 'gkp-sch-1',
        name: 'UP ODOP Terracotta & Craft Scheme',
        hiName: 'उत्तर प्रदेश एक जिला एक उत्पाद (ODOP) गोरखपुर',
        benefit: 'मुफ्त आधुनिक टूलकिट और 25% तक वित्तीय सब्सिडी',
        eligibility: 'पारंपरिक शिल्पकार एवं हस्तशिल्पी',
        applyOffice: 'जिला उद्योग केंद्र (DIC), गोरखपुर',
        category: 'state',
        financialSupport: '₹25,000 टूलकिट अनुदान'
      }
    ]
  }
};

/**
 * Normalizes any Hindi or English district/location string to standard database key
 */
export function normalizeDistrictKey(districtStr: string): string {
  if (!districtStr) return 'maharajganj';
  let s = districtStr.toLowerCase().trim();
  s = s.replace(/ज़िला|जिला|district|शहर|city|town/gi, '').trim();

  if (s.includes('ghaziabad') || s.includes('गाजियाबाद') || s.includes('ग़ाज़ियाबाद')) return 'ghaziabad';
  if (s.includes('gorakhpur') || s.includes('गोरखपुर')) return 'gorakhpur';
  if (s.includes('lucknow') || s.includes('लखनऊ')) return 'lucknow';
  if (s.includes('varanasi') || s.includes('वाराणसी') || s.includes('बनारस') || s.includes('kashi')) return 'varanasi';
  if (s.includes('patna') || s.includes('पटना')) return 'patna';
  if (s.includes('noida') || s.includes('नोएडा') || s.includes('gautam buddha')) return 'ghaziabad';
  if (s.includes('delhi') || s.includes('दिल्ली')) return 'ghaziabad';
  if (s.includes('kanpur') || s.includes('कानपुर')) return 'ghaziabad';
  if (s.includes('maharajganj') || s.includes('महराजगंज')) return 'maharajganj';

  return s.replace(/[^a-z0-9]/g, '') || 'maharajganj';
}

/**
 * Centroid coordinates for popular districts to render the map immediately
 */
export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  maharajganj: { lat: 27.1439, lng: 83.5619 },
  gorakhpur: { lat: 26.7606, lng: 83.3732 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  prayagraj: { lat: 25.4358, lng: 81.8463 },
  ayodhya: { lat: 26.7922, lng: 82.1998 },
  basti: { lat: 26.8000, lng: 82.7667 },
  deoria: { lat: 26.5000, lng: 83.7800 },
  kushinagar: { lat: 26.7400, lng: 83.8900 },
  azamgarh: { lat: 26.0680, lng: 83.1840 },
  mirzapur: { lat: 25.1337, lng: 82.5644 },
  kanpurnagar: { lat: 26.4499, lng: 80.3319 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  agra: { lat: 27.1767, lng: 78.0081 },
  meerut: { lat: 28.9845, lng: 77.7064 },
  bareilly: { lat: 28.3670, lng: 79.4304 },
  noida: { lat: 28.5355, lng: 77.3910 },
  patna: { lat: 25.5941, lng: 85.1376 },
  gaya: { lat: 24.7914, lng: 85.0002 },
  muzaffarpur: { lat: 26.1209, lng: 85.3647 },
  bhagalpur: { lat: 25.2425, lng: 86.9842 },
  darbhanga: { lat: 26.1542, lng: 85.8918 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  dhanbad: { lat: 23.7957, lng: 86.4304 },
  jamshedpur: { lat: 22.8046, lng: 86.2029 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
};

export function getDistrictCoordinates(districtStr?: string): { lat: number; lng: number } {
  if (!districtStr) return { lat: 28.6692, lng: 77.4538 };
  const key = normalizeDistrictKey(districtStr);
  return DISTRICT_COORDINATES[key] || { lat: 26.8467, lng: 80.9462 };
}

class LocationIntelligenceService {
  private activeLocation: string = 'Maharajganj, Uttar Pradesh';
  private cachedData: LocationLivelihoodData | null = null;
  private currentAccuracy: LocationAccuracyInfo | null = null;
  private listeners: ((data: LocationLivelihoodData) => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const savedLoc = localStorage.getItem(ACTIVE_LOCATION_KEY);
      if (savedLoc) {
        this.activeLocation = savedLoc;
      }
      const cached = localStorage.getItem(LOCATION_DATA_CACHE_KEY);
      if (cached) {
        this.cachedData = JSON.parse(cached);
      }
      const savedAcc = localStorage.getItem(ACCURACY_STORAGE_KEY);
      if (savedAcc) {
        this.currentAccuracy = JSON.parse(savedAcc);
      }
    } catch {
      // Ignore
    }
  }

  public getActiveLocation(): string {
    return this.activeLocation;
  }

  public setActiveLocation(loc: string, accuracyInfo?: LocationAccuracyInfo): void {
    if (!loc || !loc.trim()) return;
    this.activeLocation = loc.trim();
    try {
      localStorage.setItem(ACTIVE_LOCATION_KEY, this.activeLocation);
      if (accuracyInfo) {
        this.currentAccuracy = accuracyInfo;
        localStorage.setItem(ACCURACY_STORAGE_KEY, JSON.stringify(accuracyInfo));
      }
    } catch {
      // Ignore
    }
  }

  public getLocationAccuracy(): LocationAccuracyInfo {
    if (this.currentAccuracy) {
      if (typeof this.currentAccuracy.latitude !== 'number' || typeof this.currentAccuracy.longitude !== 'number') {
        const coords = getDistrictCoordinates(this.activeLocation);
        this.currentAccuracy.latitude = coords.lat;
        this.currentAccuracy.longitude = coords.lng;
      }
      return this.currentAccuracy;
    }
    try {
      const saved = localStorage.getItem(ACCURACY_STORAGE_KEY);
      if (saved) {
        this.currentAccuracy = JSON.parse(saved);
        if (this.currentAccuracy && (typeof this.currentAccuracy.latitude !== 'number' || typeof this.currentAccuracy.longitude !== 'number')) {
          const coords = getDistrictCoordinates(this.activeLocation);
          this.currentAccuracy.latitude = coords.lat;
          this.currentAccuracy.longitude = coords.lng;
        }
        return this.currentAccuracy!;
      }
    } catch {
      // Ignore
    }
    const coords = getDistrictCoordinates(this.activeLocation);
    return {
      level: 'District-level',
      confidenceScore: 85,
      latitude: coords.lat,
      longitude: coords.lng,
      source: 'default',
      description: 'जिला स्तर मानक परिशुद्धता (District-level standard)'
    };
  }

  public setLocationAccuracy(info: LocationAccuracyInfo): void {
    this.currentAccuracy = info;
    try {
      localStorage.setItem(ACCURACY_STORAGE_KEY, JSON.stringify(info));
    } catch {
      // Ignore
    }
  }

  public setManualDistrict(districtName: string, stateName: string): LocationAccuracyInfo {
    const fullLoc = `${districtName}, ${stateName}`;
    const coords = getDistrictCoordinates(districtName);
    const info: LocationAccuracyInfo = {
      level: 'District-level',
      confidenceScore: 88,
      source: 'manual',
      latitude: coords.lat,
      longitude: coords.lng,
      description: `मैनुअल चयन: ${districtName} (${stateName})`
    };
    this.setActiveLocation(fullLoc, info);
    return info;
  }

  public getCachedData(locationOverride?: string): LocationLivelihoodData | null {
    const loc = (locationOverride && locationOverride.trim()) || this.activeLocation;
    if (this.cachedData && loc) {
      const activeKey = normalizeDistrictKey(loc);
      const cachedKey = normalizeDistrictKey(this.cachedData.location || '');
      if (activeKey !== cachedKey) {
        const parts = loc.split(',').map((p) => p.trim());
        return this.buildFallbackData(loc, parts[0] || 'Ghaziabad', parts[1] || 'Uttar Pradesh');
      }
    }
    return this.cachedData;
  }

  public subscribe(cb: (data: LocationLivelihoodData) => void): () => void {
    this.listeners.push(cb);
    if (this.cachedData) {
      cb(this.cachedData);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(data: LocationLivelihoodData) {
    this.cachedData = data;
    try {
      localStorage.setItem(LOCATION_DATA_CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignore
    }
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('Location listener error:', e);
      }
    });
  }

  /**
   * Generates or fetches actual location-based livelihood data.
   * Calls the Gemini API backend proxy (/api/generate-location-data),
   * with graceful fallback to curated local datasets.
   */
  public async fetchLocationData(
    targetLocation?: string,
    currentLang: SupportedLanguage = 'hi',
    userProfile?: BeneficiaryProfile | null
  ): Promise<LocationLivelihoodData> {
    const loc = (targetLocation || this.activeLocation || 'Maharajganj, Uttar Pradesh').trim();
    this.setActiveLocation(loc);

    const parts = loc.split(',').map((p) => p.trim());
    const district = parts[0] || 'Maharajganj';
    const state = parts[1] || 'Uttar Pradesh';

    // 1. Try Live Gemini API Backend Proxy
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/generate-location-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: loc,
          district,
          state,
          language: currentLang,
          existingProfile: userProfile || {}
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const payload = await res.json();
        if (payload && payload.result && !payload.fallback) {
          const accuracy = this.getLocationAccuracy();
          const liveData: LocationLivelihoodData = {
            location: loc,
            district: payload.result.district || district,
            state: payload.result.state || state,
            isAiGenerated: true,
            timestamp: new Date().toISOString(),
            accuracyLevel: accuracy.level,
            confidenceScore: accuracy.confidenceScore,
            accuracyMeters: accuracy.accuracyMeters,
            insight: payload.result.insight || this.getDefaultInsight(district, state),
            opportunities: payload.result.opportunities || [],
            trainingCenters: payload.result.trainingCenters || [],
            schemes: payload.result.schemes || []
          };
          this.notify(liveData);
          return liveData;
        }
      }
    } catch (err) {
      console.warn('Live location API fetch fell back to curated engine:', err);
    }

    // 2. Curated Match Fallback
    const fallbackData = this.buildFallbackData(loc, district, state);
    this.notify(fallbackData);
    return fallbackData;
  }

  private getDefaultInsight(district: string, state: string): LocationInsight {
    return {
      district,
      state,
      economicHub: `${district} Local Commerce & Agro Hub`,
      topSectors: ['Digital CSC Services', 'Retail & Mandi Operations', 'Rooftop Solar & Electrical', 'Micro-Enterprise & Tailoring'],
      averageMonthlyWage: '₹9,000 - ₹15,500',
      activeSchemesCount: 6,
      openVacanciesCount: 42,
      verifiedCentersCount: 4,
      summary: `${district} (${state}) में युवाओं और महिलाओं के लिए पीएम विश्वकर्मा, कौशल विकास और स्थानीय डिजिटल सेवाओं में अच्छे अवसर उपलब्ध हैं।`,
    };
  }

  private buildFallbackData(loc: string, district: string, state: string): LocationLivelihoodData {
    const key = normalizeDistrictKey(district);
    const curated = CURATED_DISTRICT_DATABASE[key];
    const accuracy = this.getLocationAccuracy();
    const cleanDistrict = district.replace(/ज़िला|जिला|district/gi, '').trim() || district;
    const coords = getDistrictCoordinates(district);
    const lat = accuracy.latitude || coords.lat;
    const lng = accuracy.longitude || coords.lng;

    if (curated) {
      return {
        location: loc,
        district: curated.district || cleanDistrict,
        state: curated.state || state,
        isAiGenerated: false,
        timestamp: new Date().toISOString(),
        accuracyLevel: accuracy.level,
        confidenceScore: accuracy.confidenceScore,
        accuracyMeters: accuracy.accuracyMeters,
        latitude: lat,
        longitude: lng,
        insight: curated.insight || this.getDefaultInsight(cleanDistrict, state),
        opportunities: curated.opportunities || [],
        trainingCenters: curated.trainingCenters || [],
        schemes: curated.schemes || []
      };
    }

    // Generic dynamic adaptation for any Indian district entered
    const defaultJobs: Opportunity[] = [
      {
        id: `${key}-j1`,
        title: 'CSC Digital Seva Assistant',
        org: `${cleanDistrict} Digital Seva Kendra`,
        type: 'Job',
        loc: `${cleanDistrict} Main Market`,
        km: 4,
        pay: '₹8,500 to ₹13,500 per month',
        path: 'digital',
        verified: true,
        source: 'District e-Governance Society',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, basic computer typing and mobile app handling.',
        documentsRequired: ['Aadhaar Card', '10th Marksheet'],
        contactInfo: `Collectorate Area, ${cleanDistrict}`
      },
      {
        id: `${key}-j2`,
        title: 'Solar PV Installer & Maintenance Helper',
        org: `${state} Solar Green Power Services`,
        type: 'Job',
        loc: `Across ${cleanDistrict}`,
        km: 15,
        pay: '₹9,500 to ₹15,000 per month',
        path: 'solar',
        verified: true,
        source: 'PM Surya Ghar Approved Agency',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Physical fitness, basic electrical understanding.',
        documentsRequired: ['Aadhaar Card', 'Medical Certificate'],
        contactInfo: `District Energy Field Desk, ${cleanDistrict}`
      },
      {
        id: `${key}-j3`,
        title: 'Retail Store & Billing Associate',
        org: `${cleanDistrict} Vyapar Kendra Outlet`,
        type: 'Job',
        loc: `Station Road, ${cleanDistrict}`,
        km: 5,
        pay: '₹8,000 to ₹12,500 per month',
        path: 'retail',
        verified: true,
        source: 'Local Merchant Cluster',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, polite customer communication.',
        documentsRequired: ['Aadhaar Card', 'Biodata'],
        contactInfo: `Store Manager, Station Road, ${cleanDistrict}`
      },
      {
        id: `${key}-j4`,
        title: 'Self-Help Group Garment & Tailoring Unit',
        org: 'NRLM Mahila Gramin Cluster',
        type: 'Self-employment',
        loc: `Local Village / ${cleanDistrict}`,
        km: 0,
        pay: '₹6,000 to ₹14,000 per month',
        path: 'tailoring',
        verified: false,
        source: 'National Rural Livelihoods Mission',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Sewing machine operation, basic tailoring skills.',
        documentsRequired: ['Aadhaar Card', 'Bank Account'],
        contactInfo: `Block Mission Office, ${cleanDistrict}`
      }
    ];

    const defaultTraining: Opportunity[] = [
      {
        id: `${key}-t1`,
        title: `Govt ITI ${cleanDistrict}`,
        org: `Department of Technical Education, ${state}`,
        type: 'Training',
        loc: `Govt ITI Campus, ${cleanDistrict}`,
        km: 6,
        pay: 'Government Sponsored Free/Subsidized Training',
        path: 'solar',
        verified: true,
        source: 'Directorate of Training',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, ages 14-40.',
        documentsRequired: ['Aadhaar Card', '10th Marksheet'],
        contactInfo: `Principal Office, Govt ITI ${cleanDistrict}`
      },
      {
        id: `${key}-t2`,
        title: `RSETI Rural Self Employment Institute`,
        org: 'Ministry of Rural Development Lead Bank RSETI',
        type: 'Training',
        loc: `Lead Bank Campus, ${cleanDistrict}`,
        km: 12,
        pay: '100% Free Residential Training + Free Meals + Toolkit Loan Linkage',
        path: 'tailoring',
        verified: true,
        source: 'MoRD RSETI Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Ages 18-45 with interest in starting own enterprise.',
        documentsRequired: ['Aadhaar Card', 'Ration Card', 'Bank Passbook'],
        contactInfo: `RSETI Director Office, ${cleanDistrict}`
      }
    ];

    const defaultSchemes: GovernmentScheme[] = [
      {
        id: 'sch-gen-1',
        name: 'PM Vishwakarma Yojana',
        hiName: 'प्रधानमंत्री विश्वकर्मा योजना',
        benefit: '₹15,000 का टूलकिट ई-वाउचर + ₹3 लाख तक रियायती लोन (5% ब्याज दर)',
        eligibility: '18 पारंपरिक ट्रेड के कारीगर (दर्जी, बढ़ई, लोहार, कुम्हार, राजमिस्त्री आदि)',
        applyOffice: `नजदीकी CSC केंद्र या जिला उद्योग केंद्र (DIC) ${district}`,
        category: 'toolkit',
        financialSupport: '₹15,000 टूलकिट अनुदान + ₹500/दिन वजीफा'
      },
      {
        id: 'sch-gen-2',
        name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
        hiName: 'पीएम कौशल विकास योजना 4.0',
        benefit: 'निःशुल्क इंडस्ट्री-मान्यता प्राप्त सर्टिफिकेट, ऑन-द-जॉब ट्रेनिंग और प्लेसमेंट सहायता',
        eligibility: '8वीं/10वीं/12वीं पास स्कूल/कॉलेज ड्रॉपआउट या नए हुनर की चाह रखने वाले युवा',
        applyOffice: `Skill India Digital Hub या PMKK केंद्र ${district}`,
        category: 'central',
        financialSupport: 'निःशुल्क सरकारी प्रशिक्षण व प्रमाणन'
      },
      {
        id: 'sch-gen-3',
        name: 'Pradhan Mantri Mudra Yojana (PMMY)',
        hiName: 'प्रधानमंत्री मुद्रा योजना',
        benefit: '₹50,000 (शिशु) से ₹10 लाख (तरुण) तक बिना गारंटी व्यवसाय ऋण',
        eligibility: 'छोटे दुकानदार, टेलर, मरम्मत कार्यशाला, डिजिटल केंद्र संचालक',
        applyOffice: `किसी भी बैंक शाखा या उद्यमी मित्र पोर्टल, ${district}`,
        category: 'loan',
        financialSupport: 'बिना कोलेटरल 7-10 दिनों में ऋण स्वीकृति'
      }
    ];

    return {
      location: loc,
      district,
      state,
      isAiGenerated: false,
      timestamp: new Date().toISOString(),
      accuracyLevel: accuracy.level,
      confidenceScore: accuracy.confidenceScore,
      accuracyMeters: accuracy.accuracyMeters,
      latitude: lat,
      longitude: lng,
      insight: this.getDefaultInsight(district, state),
      opportunities: defaultJobs,
      trainingCenters: defaultTraining,
      schemes: defaultSchemes
    };
  }

  /**
   * Browser GPS Detection with high-precision reverse geocoding,
   * confidence scoring and accuracy level identification.
   */
  public async detectGpsLocation(): Promise<LocationDetectionResult | null> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            const accuracyMeters = Math.round(accuracy || 45);

            // Fast OpenStreetMap reverse geocoding with zoom=14 for neighborhood/village accuracy
            let addr: any = {};
            let isGeocoded = false;
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
                { headers: { 'Accept': 'application/json' } }
              );
              if (res.ok) {
                const data = await res.json();
                addr = data.address || {};
                isGeocoded = true;
              }
            } catch {
              // Nominatim fetch failed or throttled
            }

            const rawDistrict = addr.state_district || addr.county || addr.city || addr.town || addr.municipality;
            const locality = addr.village || addr.suburb || addr.neighbourhood || addr.residential || addr.hamlet || addr.road;
            const pincode = addr.postcode;
            const state = addr.state || 'Uttar Pradesh';

            let cleanDistrict = rawDistrict ? rawDistrict.replace(/district/i, '').trim() : '';

            // Fallback district if address was vague
            if (!cleanDistrict) {
              const current = this.getActiveLocation();
              const [d] = current.split(',').map((x) => x.trim());
              cleanDistrict = d || 'Gorakhpur';
            }

            const fullLoc = `${cleanDistrict}, ${state}`;

            // Calculate confidence score and precision category
            let accuracyLevel: LocationAccuracyLevel = 'District-level';
            let confidenceScore = 85;
            let description = '';

            if (accuracyMeters <= 150 || (locality && accuracyMeters <= 600)) {
              accuracyLevel = 'Precise';
              // 90% - 98% confidence
              confidenceScore = Math.max(90, Math.min(98, Math.round(100 - accuracyMeters / 25)));
              description = `सटीक जीपीएस स्थान (±${accuracyMeters}m)${locality ? ` · ${locality}` : ''}`;
            } else if (accuracyMeters <= 8000 && isGeocoded) {
              accuracyLevel = 'District-level';
              // 78% - 88% confidence
              confidenceScore = Math.max(78, Math.min(88, Math.round(90 - (accuracyMeters - 150) / 500)));
              description = `जिला प्रशासनिक दायरा (±${Math.round(accuracyMeters / 1000)}km) · ${cleanDistrict}`;
            } else {
              accuracyLevel = 'State-level';
              confidenceScore = isGeocoded ? 65 : 55;
              description = `राज्य स्तर अनुमान (State-level) · ${state}`;
            }

            const accuracyInfo: LocationAccuracyInfo = {
              level: accuracyLevel,
              confidenceScore,
              accuracyMeters,
              latitude,
              longitude,
              locality,
              pincode,
              source: 'gps',
              description,
            };

            this.setActiveLocation(fullLoc, accuracyInfo);

            const result: LocationDetectionResult = {
              location: fullLoc,
              district: cleanDistrict,
              state,
              accuracyLevel,
              confidenceScore,
              accuracyMeters,
              latitude,
              longitude,
              locality,
              pincode,
              source: 'gps',
              description,
            };

            resolve(result);
            return;
          } catch (err) {
            console.warn('Geolocation parsing failed:', err);
          }

          // Fallback to active location if reverse geocoding throttled
          const current = this.getActiveLocation();
          const [d, s] = current.split(',').map((x) => x.trim());
          const districtFallback = d || 'Maharajganj';
          const stateFallback = s || 'Uttar Pradesh';
          const defaultAccuracy = this.getLocationAccuracy();

          resolve({
            location: current,
            district: districtFallback,
            state: stateFallback,
            accuracyLevel: defaultAccuracy.level,
            confidenceScore: defaultAccuracy.confidenceScore,
            accuracyMeters: defaultAccuracy.accuracyMeters,
            source: 'cache',
            description: defaultAccuracy.description || 'कैश्ड स्थान',
          });
        },
        (error) => {
          reject(error);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }
}

export const locationIntelligenceService = new LocationIntelligenceService();
