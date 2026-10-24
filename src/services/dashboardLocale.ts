import { SupportedLanguage, StepOption, EvaluatedPathway, Pathway, Opportunity, GovernmentScheme } from '../types';
import { PATHWAY_HI } from '../data/pathwayHindi';

type Row = { hi: string; bho: string; en: string; hin: string };

const D = {
  // --- navigation / breadcrumbs
  crumbHome: { hi: 'मुख्य पृष्ठ', bho: 'मुख्य पन्ना', en: 'Home', hin: 'Home' },
  crumbDash: { hi: 'आजीविका डैशबोर्ड', bho: 'आजीविका डैशबोर्ड', en: 'Livelihood Dashboard', hin: 'Livelihood Dashboard' },
  portalLabel: { hi: 'नागरिक सेवा पोर्टल', bho: 'नागरिक सेवा पोर्टल', en: 'Citizen Services Portal', hin: 'Citizen Services Portal' },
  menu: { hi: 'मेनू', bho: 'मेनू', en: 'Menu', hin: 'Menu' },
  navOverview: { hi: 'सारांश', bho: 'सारांश', en: 'Overview', hin: 'Overview' },
  navHub: { hi: 'मेरा जिला', bho: 'हमार जिला', en: 'My District', hin: 'Mera Zila' },
  navSchemes: { hi: 'सरकारी योजनाएं', bho: 'सरकारी योजना', en: 'Govt. Schemes', hin: 'Sarkari Yojana' },
  navPathways: { hi: 'कौशल मार्ग', bho: 'कौशल रास्ता', en: 'Skill Pathways', hin: 'Skill Pathways' },
  navRoadmap: { hi: 'रोडमैप', bho: 'रोडमैप', en: 'Roadmap', hin: 'Roadmap' },
  navOpenings: { hi: 'रोजगार अवसर', bho: 'रोजगार के मौका', en: 'Job Openings', hin: 'Job Openings' },
  navCenters: { hi: 'प्रशिक्षण केंद्र', bho: 'ट्रेनिंग केंद्र', en: 'Training Centers', hin: 'Training Centers' },

  // --- welcome / profile
  hello: { hi: 'नमस्ते', bho: 'प्रणाम', en: 'Hello', hin: 'Namaste' },
  planTag: { hi: 'व्यक्तिगत आजीविका योजना', bho: 'रउआ आजीविका योजना', en: 'Personalized livelihood plan', hin: 'Aapki personal livelihood plan' },
  planSub: {
    hi: 'आपकी शिक्षा, रुचि और स्थान के आधार पर बनाई गई योजना।',
    bho: 'रउआ पढ़ाई, रुचि अउर जगह के हिसाब से बनल योजना।',
    en: 'Built from your education, interests and location.',
    hin: 'Aapki padhai, ruchi aur location ke hisaab se banayi gayi yojana.',
  },
  demoNote: {
    hi: 'यह नमूना (डेमो) प्रोफ़ाइल है। अपनी जानकारी देने के लिए "फिर से जानकारी दें" दबाएँ।',
    bho: 'ई नमूना (डेमो) प्रोफ़ाइल बा। आपन जानकारी देवे खातिर "फेर से जानकारी दीं" दबाईं।',
    en: 'This is a sample (demo) profile. Tap "Give your details" to see your own roadmap.',
    hin: 'Yeh sample (demo) profile hai. Apni jaankari dene ke liye "Apni jaankari dein" dabayein.',
  },
  aiSummary: { hi: 'एआई विश्लेषण', bho: 'एआई विश्लेषण', en: 'AI analysis', hin: 'AI analysis' },
  aiField: { hi: 'सुझाया क्षेत्र', bho: 'सुझावल क्षेत्र', en: 'Suggested field', hin: 'Suggested field' },
  aiReady: { hi: 'तैयारी', bho: 'तइयारी', en: 'Readiness', hin: 'Readiness' },
  listenRoadmap: { hi: 'रोडमैप सुनें', bho: 'रोडमैप सुनीं', en: 'Listen to roadmap', hin: 'Roadmap suniye' },
  stopListen: { hi: 'रोकें', bho: 'रोकीं', en: 'Stop', hin: 'Roko' },
  editProfile: { hi: 'प्रोफ़ाइल बदलें', bho: 'प्रोफ़ाइल बदलीं', en: 'Edit profile', hin: 'Profile badlein' },
  exportBtn: { hi: 'डाउनलोड करें', bho: 'डाउनलोड करीं', en: 'Download', hin: 'Download karein' },
  retake: { hi: 'फिर से जानकारी दें', bho: 'फेर से जानकारी दीं', en: 'Give your details again', hin: 'Dobara jaankari dein' },
  chipEdu: { hi: 'शिक्षा', bho: 'पढ़ाई', en: 'Education', hin: 'Education' },
  chipLoc: { hi: 'स्थान', bho: 'जगह', en: 'Location', hin: 'Location' },
  chipWork: { hi: 'काम का प्रकार', bho: 'काम के तरीका', en: 'Work type', hin: 'Work type' },
  chipTop: { hi: 'सबसे अच्छा मेल', bho: 'सबसे बढ़िया मेल', en: 'Top match', hin: 'Top match' },
  showDetails: { hi: 'पूरी जानकारी देखें', bho: 'पूरा जानकारी देखीं', en: 'Show all details', hin: 'Poori details dekhein' },
  hideDetails: { hi: 'जानकारी छिपाएँ', bho: 'जानकारी छिपाईं', en: 'Hide details', hin: 'Details chhupayein' },
  dSkills: { hi: 'मौजूदा हुनर', bho: 'मौजूदा हुनर', en: 'Current skills', hin: 'Current skills' },
  dInterests: { hi: 'रुचि', bho: 'रुचि', en: 'Interests', hin: 'Interests' },
  dOccupation: { hi: 'अभी का काम', bho: 'अभी के काम', en: 'Current work', hin: 'Current work' },
  dMobility: { hi: 'कितनी दूर जा सकते हैं', bho: 'केतना दूर जा सकीलें', en: 'Travel range', hin: 'Travel range' },
  notShared: { hi: 'नहीं बताया', bho: 'नइखे बतावल', en: 'Not shared', hin: 'Not shared' },
  beneficiary: { hi: 'लाभार्थी', bho: 'लाभार्थी', en: 'Beneficiary', hin: 'Beneficiary' },

  // --- KPI cards
  kpiTop: { hi: 'सबसे अच्छा कौशल मार्ग', bho: 'सबसे बढ़िया कौशल रास्ता', en: 'Best skill match', hin: 'Best skill match' },
  kpiProgress: { hi: 'रोडमैप प्रगति', bho: 'रोडमैप प्रगति', en: 'Roadmap progress', hin: 'Roadmap progress' },
  kpiOpenings: { hi: 'पास के अवसर', bho: 'लगे के मौका', en: 'Openings near you', hin: 'Openings near you' },
  kpiCenters: { hi: 'प्रशिक्षण केंद्र', bho: 'ट्रेनिंग केंद्र', en: 'Training centers', hin: 'Training centers' },
  kpiSchemes: { hi: 'सरकारी योजनाएं', bho: 'सरकारी योजना', en: 'Govt. schemes', hin: 'Sarkari yojana' },
  stagesOf: { hi: '{n} / 3 चरण पूरे', bho: '{n} / 3 चरण पूरा', en: '{n} of 3 stages done', hin: '{n} / 3 stages complete' },
  nearbyOf: { hi: '{a} नज़दीक · कुल {b}', bho: '{a} लगे · कुल {b}', en: '{a} nearby · {b} in total', hin: '{a} nearby · {b} total' },
  nsqfLevel: { hi: 'NSQF स्तर', bho: 'NSQF स्तर', en: 'NSQF Level', hin: 'NSQF Level' },
  inDistrict: { hi: 'आपके जिले में', bho: 'रउआ जिला में', en: 'in your district', hin: 'aapke zila mein' },

  // --- district hub
  hubTitle: { hi: 'मेरा जिला: आजीविका केंद्र', bho: 'हमार जिला: आजीविका केंद्र', en: 'My district livelihood hub', hin: 'Mera zila: livelihood hub' },
  liveAi: { hi: 'एआई से लाइव', bho: 'एआई से लाइव', en: 'Live via Gemini AI', hin: 'Live via Gemini AI' },
  curated: { hi: 'जाँचा हुआ डेटा', bho: 'जाँचल डेटा', en: 'Verified curated data', hin: 'Verified curated data' },
  updated: { hi: 'अपडेट', bho: 'अपडेट', en: 'Updated', hin: 'Updated' },
  detectGps: { hi: 'जीपीएस से स्थान पता करें', bho: 'जीपीएस से जगह पता करीं', en: 'Detect my location (GPS)', hin: 'GPS se location pata karein' },
  detecting: { hi: 'खोज रहे हैं...', bho: 'खोज रहल बानी...', en: 'Detecting...', hin: 'Dhoondh rahe hain...' },
  changeDistrict: { hi: 'जिला बदलें', bho: 'जिला बदलीं', en: 'Change district', hin: 'Zila badlein' },
  closeBtn: { hi: 'बंद करें', bho: 'बंद करीं', en: 'Close', hin: 'Band karein' },
  refreshAi: { hi: 'एआई से ताज़ा करें', bho: 'एआई से ताजा करीं', en: 'Refresh with AI', hin: 'AI se refresh karein' },
  refreshing: { hi: 'लोड हो रहा है...', bho: 'लोड हो रहल बा...', en: 'Loading...', hin: 'Loading...' },
  selectDistrict: { hi: 'राज्य और जिला चुनें', bho: 'राज्य अउर जिला चुनीं', en: 'Choose state and district', hin: 'State aur zila chunein' },
  gpsHint: {
    hi: 'जीपीएस न चले तो सीधे अपने जिले पर दबाएँ',
    bho: 'जीपीएस ना चले त सीधे आपन जिला पर दबाईं',
    en: 'If GPS does not work, just tap your district',
    hin: 'GPS na chale to seedha apna zila chunein',
  },
  coverage: { hi: 'स्थानीय दायरा', bho: 'स्थानीय दायरा', en: 'Local coverage', hin: 'Local coverage' },
  covPrecise: {
    hi: 'सटीक जीपीएस स्थान{m} · आसपास के रोजगार और केंद्र दिखाए जा रहे हैं',
    bho: 'सटीक जीपीएस जगह{m} · आसपास के रोजगार अउर केंद्र देखावल जा रहल बा',
    en: 'Precise GPS fix{m} · showing jobs and centers around you',
    hin: 'Precise GPS fix{m} · aas-paas ke jobs aur centers dikh rahe hain',
  },
  covDistrict: {
    hi: 'जिला स्तर · {loc} के रोजगार, केंद्र और योजनाएं',
    bho: 'जिला स्तर · {loc} के रोजगार, केंद्र अउर योजना',
    en: 'District level · jobs, centers and schemes across {loc}',
    hin: 'District level · {loc} ke jobs, centers aur schemes',
  },
  covState: { hi: 'राज्य स्तर का दायरा', bho: 'राज्य स्तर के दायरा', en: 'State-level coverage', hin: 'State-level coverage' },
  confidence: { hi: '{n}% भरोसा', bho: '{n}% भरोसा', en: '{n}% confidence', hin: '{n}% confidence' },
  topSectors: { hi: 'यहाँ के मुख्य काम-धंधे', bho: 'इहाँ के मुख्य काम-धंधा', en: 'Main local sectors', hin: 'Main local sectors' },
  avgWage: { hi: 'औसत मासिक कमाई', bho: 'औसत मासिक कमाई', en: 'Average monthly pay', hin: 'Average monthly pay' },
  openVac: { hi: 'खाली पद', bho: 'खाली पद', en: 'Open vacancies', hin: 'Open vacancies' },
  notAvailable: { hi: 'जानकारी उपलब्ध नहीं', bho: 'जानकारी नइखे', en: 'Not available yet', hin: 'Not available yet' },

  // --- schemes
  schemesTitle: { hi: 'आपके जिले की सरकारी योजनाएं', bho: 'रउआ जिला के सरकारी योजना', en: 'Government schemes for your district', hin: 'Aapke zila ki sarkari yojanayein' },
  benefit: { hi: 'लाभ', bho: 'फायदा', en: 'Benefit', hin: 'Benefit' },
  eligible: { hi: 'कौन आवेदन कर सकता है', bho: 'के आवेदन कर सकेला', en: 'Who can apply', hin: 'Kaun apply kar sakta hai' },
  applyAt: { hi: 'कहाँ आवेदन करें', bho: 'कहाँ आवेदन करीं', en: 'Where to apply', hin: 'Kahan apply karein' },
  schemeFallbackNote: {
    hi: 'सामान्य जानकारी। सही शर्तें और रकम के लिए नज़दीकी CSC केंद्र या जिला उद्योग केंद्र से पूछें। "एआई से ताज़ा करें" दबाकर अपने जिले की योजनाएं देखें।',
    bho: 'सामान्य जानकारी। सही शर्त अउर रकम खातिर लगे के CSC केंद्र या जिला उद्योग केंद्र से पूछीं। "एआई से ताजा करीं" दबाके आपन जिला के योजना देखीं।',
    en: 'General information. Ask your nearest CSC or District Industries Centre for exact rules and amounts, or tap "Refresh with AI" to load schemes for your district.',
    hin: 'General jaankari. Sahi rules aur amount ke liye nazdeeki CSC ya District Industries Centre se poochhein, ya "AI se refresh karein" dabayein.',
  },

  // --- training centers
  centersTitle: { hi: 'पास के प्रशिक्षण केंद्र', bho: 'लगे के ट्रेनिंग केंद्र', en: 'Training centers near you', hin: 'Aas-paas ke training centers' },
  seeAll: { hi: 'सभी देखें', bho: 'सब देखीं', en: 'See all', hin: 'Sab dekhein' },
  noCenters: { hi: 'अभी केंद्रों की सूची उपलब्ध नहीं है। "एआई से ताज़ा करें" दबाएँ।', bho: 'अभी केंद्र के सूची नइखे। "एआई से ताजा करीं" दबाईं।', en: 'No centers loaded yet. Tap "Refresh with AI".', hin: 'Abhi centers ki list nahi hai. "AI se refresh karein" dabayein.' },

  // --- pathways
  pathTag: { hi: 'साफ़ और पारदर्शी मिलान', bho: 'साफ अउर पारदर्शी मिलान', en: 'Transparent matching', hin: 'Transparent matching' },
  pathTitle: { hi: 'आपके लिए सुझाए गए कौशल मार्ग', bho: 'रउआ खातिर सुझावल कौशल रास्ता', en: 'Skill pathways suggested for you', hin: 'Aapke liye skill pathways' },
  rec: { hi: 'सुझाव', bho: 'सुझाव', en: 'Recommendation', hin: 'Recommendation' },
  whyBtn: { hi: 'यह क्यों सुझाया गया?', bho: 'ई काहे सुझावल गइल?', en: 'Why this recommendation?', hin: 'Yeh kyon suggest hua?' },
  viewRoad: { hi: 'रोडमैप देखें', bho: 'रोडमैप देखीं', en: 'View roadmap', hin: 'Roadmap dekhein' },
  breakdown: { hi: 'अंकों का हिसाब (अधिकतम 100)', bho: 'अंक के हिसाब (अधिकतम 100)', en: 'Score breakdown (max 100)', hin: 'Score breakdown (max 100)' },
  fitPrefix: { hi: 'यह इसलिए सुझाया गया: ', bho: 'ई एह खातिर सुझावल गइल: ', en: '', hin: '' },
  fitGeneric: { hi: 'आपकी प्रोफ़ाइल के लिए एक सामान्य विकल्प।', bho: 'रउआ प्रोफ़ाइल खातिर एगो सामान्य विकल्प।', en: 'Shown as a general option for your profile.', hin: 'Aapki profile ke liye ek general option.' },
  and: { hi: ' और ', bho: ' अउर ', en: ' and ', hin: ' aur ' },

  // --- roadmap
  roadTag: { hi: 'चरणबद्ध योजना', bho: 'चरण-दर-चरण योजना', en: 'Structured steps', hin: 'Step-by-step plan' },
  roadTitle: { hi: 'आपका सीखने का रोडमैप', bho: 'रउआ सीखे के रोडमैप', en: 'Your learning roadmap', hin: 'Aapka learning roadmap' },
  roadSub: {
    hi: 'चुने हुए मार्ग के तीन चरण। हर चरण पूरा होने पर "पूरा हुआ" दबाएँ।',
    bho: 'चुनल रास्ता के तीन चरण। हर चरण पूरा होखे पर "पूरा भइल" दबाईं।',
    en: 'Three stages for your chosen pathway. Tap "Mark done" as you finish each one.',
    hin: 'Chune hue pathway ke teen stages. Har stage ke baad "Mark done" dabayein.',
  },
  stage: { hi: 'चरण', bho: 'चरण', en: 'Stage', hin: 'Stage' },
  markDone: { hi: 'पूरा हुआ दबाएँ', bho: 'पूरा भइल दबाईं', en: 'Mark done', hin: 'Mark done' },
  completed: { hi: 'पूरा हुआ', bho: 'पूरा भइल', en: 'Completed', hin: 'Completed' },
  stageDone: { hi: 'बधाई! यह चरण पूरा हुआ।', bho: 'बधाई! ई चरण पूरा भइल।', en: 'Congratulations! Stage completed.', hin: 'Badhai! Yeh stage poora hua.' },
  stagesDoneLine: { hi: '{n} में से {c} चरण पूरे', bho: '{n} में से {c} चरण पूरा', en: '{c} of {n} stages completed', hin: '{n} mein se {c} stages complete' },

  // --- openings
  openTag: { hi: '{loc} के अवसर', bho: '{loc} के मौका', en: 'Openings in {loc}', hin: '{loc} ke openings' },
  openTitle: { hi: 'आपके पास के रोजगार और स्वरोजगार', bho: 'रउआ लगे के रोजगार अउर स्वरोजगार', en: 'Jobs and self-employment near you', hin: 'Aapke paas ke jobs aur self-employment' },
  filterAll: { hi: 'सभी', bho: 'सब', en: 'All', hin: 'All' },
  filterJob: { hi: 'नौकरी', bho: 'नौकरी', en: 'Jobs', hin: 'Jobs' },
  filterSelf: { hi: 'स्वरोजगार', bho: 'स्वरोजगार', en: 'Self-employment', hin: 'Self-employment' },
  typeJob: { hi: 'नौकरी', bho: 'नौकरी', en: 'Job', hin: 'Job' },
  typeSelf: { hi: 'स्वरोजगार', bho: 'स्वरोजगार', en: 'Self-employment', hin: 'Self-employment' },
  typeTraining: { hi: 'प्रशिक्षण', bho: 'ट्रेनिंग', en: 'Training', hin: 'Training' },
  colRole: { hi: 'काम / संस्था', bho: 'काम / संस्था', en: 'Role / Organisation', hin: 'Role / Organisation' },
  colType: { hi: 'प्रकार', bho: 'प्रकार', en: 'Type', hin: 'Type' },
  colPlace: { hi: 'जगह और दूरी', bho: 'जगह अउर दूरी', en: 'Place and distance', hin: 'Place and distance' },
  colPay: { hi: 'कमाई', bho: 'कमाई', en: 'Pay', hin: 'Pay' },
  colAction: { hi: 'कार्रवाई', bho: 'कार्रवाई', en: 'Actions', hin: 'Actions' },
  away: { hi: 'लगभग {n} किमी दूर', bho: 'लगभग {n} किमी दूर', en: 'About {n} km away', hin: 'Lagbhag {n} km door' },
  atLoc: { hi: 'आपके स्थान पर', bho: 'रउआ जगह पर', en: 'At your location', hin: 'Aapke location par' },
  outRange: { hi: 'आपके दायरे से बाहर', bho: 'रउआ दायरा से बाहर', en: 'Outside your travel range', hin: 'Aapke range ke bahar' },
  verified: { hi: 'जाँचा हुआ', bho: 'जाँचल', en: 'Verified', hin: 'Verified' },
  details: { hi: 'जानकारी', bho: 'जानकारी', en: 'Details', hin: 'Details' },
  saveBtn: { hi: 'सहेजें', bho: 'सहेजीं', en: 'Save', hin: 'Save' },
  savedBtn: { hi: 'सहेजा गया', bho: 'सहेजल गइल', en: 'Saved', hin: 'Saved' },
  listen: { hi: 'सुनें', bho: 'सुनीं', en: 'Listen', hin: 'Suniye' },
  noJobs: { hi: 'इस चयन में अभी कोई अवसर नहीं है।', bho: 'एह चयन में अभी कवनो मौका नइखे।', en: 'No openings in this selection yet.', hin: 'Is selection mein abhi koi opening nahi hai.' },
  savedToast: { hi: 'अवसर सहेज लिया गया।', bho: 'मौका सहेज लिहल गइल।', en: 'Saved to your shortlist.', hin: 'Shortlist mein save ho gaya.' },
  removedToast: { hi: 'सहेजी सूची से हटा दिया गया।', bho: 'सहेजल सूची से हटा दिहल गइल।', en: 'Removed from your shortlist.', hin: 'Shortlist se hata diya gaya.' },

  // --- account banner
  accTitle: { hi: 'जीविका एआई आपका खाता बना देगा', bho: 'जीविका एआई रउआ खाता बना दी', en: 'JeevikaAI can create your account', hin: 'JeevikaAI aapka account bana dega' },
  accBody: {
    hi: 'कुछ लिखना नहीं है। सिर्फ़ मोबाइल नंबर और 4 अंक का PIN बताइए। फिर आपकी जानकारी सुरक्षित रहेगी और आप किसी भी फ़ोन से लौट सकेंगे।',
    bho: 'कुछ लिखे के नइखे। बस मोबाइल नंबर अउर 4 अंक के PIN बताईं। फेर रउआ जानकारी सुरक्षित रही अउर कवनो फोन से लौट सकब।',
    en: 'Nothing to write. Just say your mobile number and a 4-digit PIN. Your details stay safe and you can return from any phone.',
    hin: 'Kuch likhna nahi hai. Bas mobile number aur 4 ank ka PIN bataiye. Phir aapki jaankari surakshit rahegi aur aap kisi bhi phone se wapas aa sakte hain.',
  },
  accCreate: { hi: 'मेरा खाता बनाइए', bho: 'हमार खाता बनाईं', en: 'Create my account', hin: 'Mera account banaiye' },
  accLogin: { hi: 'पहले से खाता है? लॉगिन', bho: 'पहिले से खाता बा? लॉगिन', en: 'Have an account? Log in', hin: 'Account hai? Login' },
  accSaved: { hi: 'खाता सुरक्षित', bho: 'खाता सुरक्षित', en: 'Account saved', hin: 'Account saved' },

  // --- misc
  sourceNote: {
    hi: 'ये अवसर व अंक उदाहरण के तौर पर हैं। आवेदन से पहले केंद्र या कार्यालय से पुष्टि कर लें।',
    bho: 'ई मौका अउर अंक उदाहरण खातिर बा। आवेदन से पहिले केंद्र या कार्यालय से पुष्टि क लीं।',
    en: 'Listings and scores are illustrative. Please confirm with the center or office before applying.',
    hin: 'Listings aur scores sirf udaharan ke liye hain. Apply karne se pehle center ya office se confirm karein.',
  },
} satisfies Record<string, Row>;

export type DashKey = keyof typeof D;

export function dt(key: DashKey, lang: SupportedLanguage, vars?: Record<string, string | number>): string {
  const row = D[key] as Row;
  let s = row[lang] ?? row.hi;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export const isEnglishLike = (lang: SupportedLanguage) => lang === 'en' || lang === 'hin';

/** Pick the localized label for a stored choice value (education / work type / mobility). */
export function optionLabel(options: StepOption[], value: string | undefined, lang: SupportedLanguage): string {
  if (!value) return '';
  const opt = options.find((o) => o.v === value || o.hi === value || o.bho === value);
  if (!opt) return value;
  if (lang === 'bho') return opt.bho || opt.hi;
  if (lang === 'hi') return opt.hi;
  return opt.v;
}

export const STAGE_TITLES_L10N: Record<SupportedLanguage, [string, string, string]> = {
  hi: ['सीखना शुरू करें', 'हुनर बनाएँ', 'अवसर खोजें'],
  bho: ['सीखल शुरू करीं', 'हुनर बनाईं', 'मौका खोजीं'],
  en: ['Start Learning', 'Build Skills', 'Explore Opportunities'],
  hin: ['Seekhna shuru karein', 'Hunar banayein', 'Mauka dhoondhein'],
};

export function pathwayName(p: Pathway, lang: SupportedLanguage): string {
  return isEnglishLike(lang) ? p.name : p.hi;
}

export function pathwayRole(p: Pathway, lang: SupportedLanguage): string {
  if (isEnglishLike(lang)) return p.role;
  return PATHWAY_HI[p.id]?.role || p.role;
}

export function stageText(p: Pathway, idx: number, lang: SupportedLanguage): { title: string; desc: string; when: string } {
  const [title, desc, when] = p.stages[idx];
  const hi = PATHWAY_HI[p.id]?.stages[idx];
  return {
    title: !isEnglishLike(lang) && hi ? hi[0] : title,
    desc: !isEnglishLike(lang) && hi ? hi[1] : desc,
    when: localizeWeeks(when, lang),
  };
}

export function localizeWeeks(s: string, lang: SupportedLanguage): string {
  if (isEnglishLike(lang)) return s;
  return s.replace(/Weeks (\d+) to (\d+)/i, 'सप्ताह $1 से $2');
}

export function localizeDuration(s: string, lang: SupportedLanguage): string {
  if (isEnglishLike(lang)) return s;
  const month = lang === 'bho' ? 'महीना' : 'महीने';
  return s
    .replace(/(\d+) to (\d+) months?/i, `$1 से $2 ${month}`)
    .replace(/(\d+) months?/i, `$1 ${month}`)
    .replace(/about (\d+) hours/i, 'लगभग $1 घंटे');
}

const FACTOR_LABEL: Record<string, Row> = {
  base: { hi: 'शुरुआती अंक', bho: 'शुरुआती अंक', en: 'Starting point', hin: 'Starting point' },
  interest: { hi: 'आपकी रुचि', bho: 'रउआ रुचि', en: 'Your interests', hin: 'Aapki ruchi' },
  skills: { hi: 'आपके मौजूदा हुनर', bho: 'रउआ मौजूदा हुनर', en: 'Skills you already have', hin: 'Aapke current skills' },
  edu: { hi: 'पढ़ाई', bho: 'पढ़ाई', en: 'Education', hin: 'Education' },
  work: { hi: 'काम का प्रकार', bho: 'काम के तरीका', en: 'Work type', hin: 'Work type' },
  mobility: { hi: 'आने-जाने का दायरा', bho: 'आवे-जाए के दायरा', en: 'Travel range', hin: 'Travel range' },
  demand: { hi: 'इलाके में माँग', bho: 'इलाका में माँग', en: 'Local demand', hin: 'Local demand' },
};

export function factorLabel(k: string, fallback: string, lang: SupportedLanguage): string {
  const row = FACTOR_LABEL[k];
  return row ? row[lang] : fallback;
}

/** Localized one-line reason for a scoring factor (English users keep the engine's original note). */
export function factorNote(k: string, pts: number, original: string, lang: SupportedLanguage): string {
  if (isEnglishLike(lang)) return original;
  const bho = lang === 'bho';
  switch (k) {
    case 'base':
      return bho ? 'हर रास्ता इहें से शुरू होला।' : 'हर मार्ग यहीं से शुरू होता है।';
    case 'interest':
      return pts > 0
        ? (bho ? 'रउआ बतावल रुचि से मेल खाला।' : 'आपकी बताई रुचि से मेल खाता है।')
        : (bho ? 'बतावल रुचि से सीधा मेल नइखे।' : 'बताई गई रुचि से सीधा मेल नहीं है।');
    case 'skills':
      return pts > 0
        ? (bho ? 'रउआ मौजूदा हुनर एमें काम आई।' : 'आपके मौजूदा हुनर इसमें काम आएँगे।')
        : (bho ? 'अभी हुनर मेल नइखे खात; सीखल बुनियादी से शुरू होई।' : 'अभी हुनर मेल नहीं खाते; सीखना बुनियादी स्तर से शुरू होगा।');
    case 'edu':
      return pts > 0
        ? (bho ? 'रउआ पढ़ाई एह कोर्स खातिर ठीक बा।' : 'आपकी पढ़ाई इस कोर्स के लिए ठीक है।')
        : (bho ? 'एह कोर्स में आमतौर पर एसे ऊँच पढ़ाई चाहीं।' : 'इस कोर्स में आमतौर पर इससे ऊँची पढ़ाई चाहिए।');
    case 'work':
      return pts > 0
        ? (bho ? 'रउआ काम के पसंद से मेल खाला।' : 'आपकी काम की पसंद से मेल खाता है।')
        : (bho ? 'रउआ काम के पसंद से कम मेल बा।' : 'आपकी काम की पसंद से कम मेल है।');
    case 'mobility':
      return pts >= 6
        ? (bho ? 'रउआ आवे-जाए के दायरा में बइठेला।' : 'आपके आने-जाने के दायरे में बैठता है।')
        : (bho ? 'एमें तनी दूर आवे-जाए के पड़ सकेला।' : 'इसमें कुछ दूर आना-जाना पड़ सकता है।');
    case 'demand':
      return bho
        ? 'इलाका में माँग के अनुमान (उदाहरण खातिर, लाइव आँकड़ा ना हS)।'
        : 'इलाके में माँग का अनुमान (उदाहरण के लिए, लाइव आँकड़ा नहीं)।';
    default:
      return original;
  }
}

const FIT_PHRASE: Record<string, { hi: string; bho: string }> = {
  interest: { hi: 'आपकी रुचि से मेल खाता है', bho: 'रउआ रुचि से मेल खाला' },
  skills: { hi: 'आपके हुनर पर आगे बढ़ता है', bho: 'रउआ हुनर पर आगे बढ़ेला' },
  mobility: { hi: 'आपके आने-जाने के दायरे में है', bho: 'रउआ आवे-जाए के दायरा में बा' },
  work: { hi: 'आपकी काम की पसंद से मेल खाता है', bho: 'रउआ काम के पसंद से मेल खाला' },
  edu: { hi: 'आपकी पढ़ाई के अनुसार ठीक है', bho: 'रउआ पढ़ाई के हिसाब से ठीक बा' },
};

export function fitText(p: EvaluatedPathway, lang: SupportedLanguage): string {
  if (isEnglishLike(lang)) return p.fit;
  const order = ['interest', 'skills', 'mobility', 'work', 'edu'];
  const phrases = order
    .map((k) => p.factors.find((f) => f.k === k))
    .filter((f) => f && f.pts > 0 && f.short)
    .slice(0, 2)
    .map((f) => FIT_PHRASE[f!.k][lang === 'bho' ? 'bho' : 'hi']);
  if (!phrases.length) return dt('fitGeneric', lang);
  return dt('fitPrefix', lang) + phrases.join(dt('and', lang)) + (lang === 'bho' ? '।' : '।');
}

export function opportunityTypeLabel(type: Opportunity['type'], lang: SupportedLanguage): string {
  if (type === 'Job') return dt('typeJob', lang);
  if (type === 'Self-employment') return dt('typeSelf', lang);
  return dt('typeTraining', lang);
}

export function distanceLabel(km: number | undefined, lang: SupportedLanguage): string {
  if (!km) return dt('atLoc', lang);
  return dt('away', lang, { n: km });
}

export function schemeName(s: GovernmentScheme, lang: SupportedLanguage): string {
  return isEnglishLike(lang) ? s.name : s.hiName || s.name;
}

/** General, widely known national schemes shown only when no district-specific list has loaded. */
export const FALLBACK_SCHEMES: GovernmentScheme[] = [
  {
    id: 'fb-vishwakarma',
    name: 'PM Vishwakarma',
    hiName: 'पीएम विश्वकर्मा योजना',
    benefit: 'Skill training, toolkit support and concessional credit for traditional artisans and craftspeople.',
    eligibility: 'Artisans and craftspeople in listed traditional trades (such as tailors, carpenters, potters).',
    applyOffice: 'Nearest Common Service Centre (CSC)',
    category: 'central',
    financialSupport: 'Toolkit support and low-interest loans',
  },
  {
    id: 'fb-pmkvy',
    name: 'PMKVY (Skill India)',
    hiName: 'पीएमकेवीवाई (स्किल इंडिया)',
    benefit: 'Short-term skill training with a government-recognised certificate.',
    eligibility: 'Young people and job seekers; rules differ by course.',
    applyOffice: 'Skill India Digital Hub or nearest PMKVY training center',
    category: 'central',
    financialSupport: 'Free or subsidised training',
  },
  {
    id: 'fb-mudra',
    name: 'PM Mudra Yojana',
    hiName: 'पीएम मुद्रा योजना',
    benefit: 'Collateral-free loans for starting or growing a small business.',
    eligibility: 'Small and micro business owners and people planning to start one.',
    applyOffice: 'Any bank branch or the Udyamimitra portal',
    category: 'loan',
    financialSupport: 'Business loans (Shishu, Kishore, Tarun categories)',
  },
];
