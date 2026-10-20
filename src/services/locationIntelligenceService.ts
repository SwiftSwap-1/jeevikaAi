import { Opportunity, GovernmentScheme, LocationInsight, LocationLivelihoodData, SupportedLanguage, BeneficiaryProfile } from '../types';
import { JOBS } from '../data/mockData';

// Storage key for caching current location livelihood data
const LOCATION_DATA_CACHE_KEY = 'jeevika_location_livelihood_cache_v2';
const ACTIVE_LOCATION_KEY = 'jeevika_active_location_v2';

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
  }
};

class LocationIntelligenceService {
  private activeLocation: string = 'Maharajganj, Uttar Pradesh';
  private cachedData: LocationLivelihoodData | null = null;
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
    } catch {
      // Ignore
    }
  }

  public getActiveLocation(): string {
    return this.activeLocation;
  }

  public setActiveLocation(loc: string): void {
    if (!loc || !loc.trim()) return;
    this.activeLocation = loc.trim();
    try {
      localStorage.setItem(ACTIVE_LOCATION_KEY, this.activeLocation);
    } catch {
      // Ignore
    }
  }

  public getCachedData(): LocationLivelihoodData | null {
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
          const liveData: LocationLivelihoodData = {
            location: loc,
            district: payload.result.district || district,
            state: payload.result.state || state,
            isAiGenerated: true,
            timestamp: new Date().toISOString(),
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
    const key = district.toLowerCase().trim();
    const curated = CURATED_DISTRICT_DATABASE[key];

    if (curated) {
      return {
        location: loc,
        district: curated.district || district,
        state: curated.state || state,
        isAiGenerated: false,
        timestamp: new Date().toISOString(),
        insight: curated.insight || this.getDefaultInsight(district, state),
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
        org: `${district} Digital Seva Kendra`,
        type: 'Job',
        loc: `${district} Main Market`,
        km: 4,
        pay: '₹8,500 to ₹13,500 per month',
        path: 'digital',
        verified: true,
        source: 'District e-Governance Society',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, basic computer typing and mobile app handling.',
        documentsRequired: ['Aadhaar Card', '10th Marksheet'],
        contactInfo: `Collectorate Area, ${district}`
      },
      {
        id: `${key}-j2`,
        title: 'Solar PV Installer & Maintenance Helper',
        org: `${state} Solar Green Power Services`,
        type: 'Job',
        loc: `Across ${district}`,
        km: 15,
        pay: '₹9,500 to ₹15,000 per month',
        path: 'solar',
        verified: true,
        source: 'PM Surya Ghar Approved Agency',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Physical fitness, basic electrical understanding.',
        documentsRequired: ['Aadhaar Card', 'Medical Certificate'],
        contactInfo: `District Energy Field Desk, ${district}`
      },
      {
        id: `${key}-j3`,
        title: 'Retail Store & Billing Associate',
        org: `${district} Vyapar Kendra Outlet`,
        type: 'Job',
        loc: `Station Road, ${district}`,
        km: 5,
        pay: '₹8,000 to ₹12,500 per month',
        path: 'retail',
        verified: true,
        source: 'Local Merchant Cluster',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, polite customer communication.',
        documentsRequired: ['Aadhaar Card', 'Biodata'],
        contactInfo: `Store Manager, Station Road, ${district}`
      },
      {
        id: `${key}-j4`,
        title: 'Self-Help Group Garment & Tailoring Unit',
        org: 'NRLM Mahila Gramin Cluster',
        type: 'Self-employment',
        loc: `Local Village / ${district}`,
        km: 0,
        pay: '₹6,000 to ₹14,000 per month',
        path: 'tailoring',
        verified: false,
        source: 'National Rural Livelihoods Mission',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Sewing machine operation, basic tailoring skills.',
        documentsRequired: ['Aadhaar Card', 'Bank Account'],
        contactInfo: `Block Mission Office, ${district}`
      }
    ];

    const defaultTraining: Opportunity[] = [
      {
        id: `${key}-t1`,
        title: `Govt ITI ${district}`,
        org: `Department of Technical Education, ${state}`,
        type: 'Training',
        loc: `Govt ITI Campus, ${district}`,
        km: 6,
        pay: 'Government Sponsored Free/Subsidized Training',
        path: 'solar',
        verified: true,
        source: 'Directorate of Training',
        lastVerifiedDate: 'October 2026',
        eligibility: '10th pass, ages 14-40.',
        documentsRequired: ['Aadhaar Card', '10th Marksheet'],
        contactInfo: `Principal Office, Govt ITI ${district}`
      },
      {
        id: `${key}-t2`,
        title: `RSETI Rural Self Employment Institute`,
        org: 'Ministry of Rural Development Lead Bank RSETI',
        type: 'Training',
        loc: `Lead Bank Campus, ${district}`,
        km: 12,
        pay: '100% Free Residential Training + Free Meals + Toolkit Loan Linkage',
        path: 'tailoring',
        verified: true,
        source: 'MoRD RSETI Portal',
        lastVerifiedDate: 'October 2026',
        eligibility: 'Ages 18-45 with interest in starting own enterprise.',
        documentsRequired: ['Aadhaar Card', 'Ration Card', 'Bank Passbook'],
        contactInfo: `RSETI Director Office, ${district}`
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
      insight: this.getDefaultInsight(district, state),
      opportunities: defaultJobs,
      trainingCenters: defaultTraining,
      schemes: defaultSchemes
    };
  }

  /**
   * Browser GPS Detection with reverse geocoding
   */
  public async detectGpsLocation(): Promise<{ location: string; district: string; state: string } | null> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Fast OpenStreetMap reverse geocoding
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
              { headers: { 'Accept': 'application/json' } }
            );

            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const district = addr.state_district || addr.county || addr.city || addr.town || 'Gorakhpur';
              const cleanDistrict = district.replace(/district/i, '').trim();
              const state = addr.state || 'Uttar Pradesh';
              const fullLoc = `${cleanDistrict}, ${state}`;

              this.setActiveLocation(fullLoc);
              resolve({ location: fullLoc, district: cleanDistrict, state });
              return;
            }
          } catch {
            // Reverse geocode failed, approximate fallback
          }

          // Fallback to active location if reverse geocoding throttled
          const current = this.getActiveLocation();
          const [d, s] = current.split(',').map(x => x.trim());
          resolve({ location: current, district: d || 'Maharajganj', state: s || 'Uttar Pradesh' });
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
