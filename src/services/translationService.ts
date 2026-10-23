import { SupportedLanguage } from '../types';

export const t = (key: string, lang: SupportedLanguage = 'hi'): string => {
  const dictionary: Record<string, Record<SupportedLanguage, string>> = {
    // Nav & Bottom Nav
    'nav.home': { hi: 'मुख्य पृष्ठ', bho: 'मुख्य पन्ना', en: 'Home', hin: 'Home' },
    'nav.roadmap': { hi: 'रोडमैप', bho: 'रोडमैप', en: 'Roadmap', hin: 'Roadmap' },
    'nav.jobs': { hi: 'नौकरी', bho: 'रोजगार', en: 'Jobs', hin: 'Jobs' },
    'nav.training': { hi: 'प्रशिक्षण', bho: 'प्रशिक्षण', en: 'Training', hin: 'Training' },
    'nav.skillGap': { hi: 'कौशल अंतर', bho: 'कौशल अंतर', en: 'Skill Gap', hin: 'Skill Gap' },
    'nav.saved': { hi: 'सहेजे', bho: 'सहेजल', en: 'Saved', hin: 'Saved' },
    'nav.faq': { hi: 'सहायता', bho: 'मदद', en: 'Help & FAQ', hin: 'Help & FAQ' },
    'nav.profile': { hi: 'प्रोफाइल', bho: 'प्रोफाइल', en: 'Profile', hin: 'Profile' },
    'nav.history': { hi: 'इतिहास', bho: 'इतिहास', en: 'History', hin: 'History' },
    'nav.admin': { hi: 'प्रशासनिक पोर्टल', bho: 'प्रशासनिक पोर्टल', en: 'Admin Portal', hin: 'Admin Portal' },

    // Buttons & Actions
    'btn.voiceAssessment': { hi: 'बोलकर शुरू करें', bho: 'बोल के शुरू करीं', en: 'Voice Assessment', hin: 'Voice Assessment (Voice Se Shuru Karein)' },
    'btn.save': { hi: 'सुरक्षित करें', bho: 'सुरक्षित करीं', en: 'Save Changes', hin: 'Save Changes' },
    'btn.dashboard': { hi: 'डैशबोर्ड देखें', bho: 'डैशबोर्ड देखीं', en: 'View Dashboard', hin: 'View Dashboard' },
    'btn.exploreJobs': { hi: 'नौकरी के अवसर देखें', bho: 'रोजगार देखीं', en: 'Explore Job Openings', hin: 'Explore Job Openings' },
    'btn.exploreTraining': { hi: 'प्रशिक्षण केंद्र देखें', bho: 'प्रशिक्षण केंद्र देखीं', en: 'Explore Training Centers', hin: 'Explore Training Centers' },
    'btn.exportPdf': { hi: 'रोडमैप PDF डाउनलोड करें', bho: 'रोडमैップ PDF डाउनलोड करीं', en: 'Export Roadmap PDF', hin: 'Export Roadmap PDF' },
    'btn.audioSummary': { hi: 'रोडमैप सुनें (Audio)', bho: 'रोडमैप सुनीं (Audio)', en: 'Listen Roadmap (Audio)', hin: 'Listen Roadmap (Audio)' },

    // Status & Labels
    'lbl.autoSaved': { hi: 'सभी बदलाव स्वतः सुरक्षित (Auto-saved)', bho: 'सब बदलाव अपने आप सुरक्षित', en: 'Auto-saved to device & cloud', hin: 'Auto-saved to device & cloud' },
    'lbl.dashboard': { hi: 'आपका आजीविका रोडमैप', bho: 'रउआ आजीविका रोडमैप', en: 'Your Livelihood Roadmap', hin: 'Your Livelihood Roadmap' },
    'lbl.opportunities': { hi: 'सत्यापित रोजगार अवसर', bho: 'सत्यापित रोजगार अवसर', en: 'Verified Employment Opportunities', hin: 'Verified Employment Opportunities' },
    'lbl.trainingCenters': { hi: 'कौशल प्रशिक्षण केंद्र (PMKVY / RSETI)', bho: 'प्रशिक्षण केंद्र (PMKVY / RSETI)', en: 'Vocational Training Centers (PMKVY / RSETI)', hin: 'Vocational Training Centers (PMKVY / RSETI)' },
    'lbl.profileSettings': { hi: 'प्रोफ़ाइल प्रबंधन व प्राथमिकताएँ', bho: 'प्रोफ़ाइल प्रबंधन', en: 'Profile Settings & Preferences', hin: 'Profile Settings & Preferences' },
    'lbl.matchScore': { hi: 'मेल स्कोर', bho: 'मेल स्कोर', en: 'NSQF Match Score', hin: 'NSQF Match Score' },
    'lbl.distance': { hi: 'दूरी / सीमा', bho: 'दूरी', en: 'Distance / Travel Range', hin: 'Distance / Travel Range' },
    'lbl.salary': { hi: 'अनुमानित आय', bho: 'कमाई', en: 'Estimated Pay', hin: 'Estimated Pay' },
    'lbl.eligibility': { hi: 'पात्रता', bho: 'योग्यता', en: 'Eligibility', hin: 'Eligibility' },

    // Opportunities View
    'opp.badge': { hi: 'हाइपरलोकल आजीविका निर्देशिका', bho: 'हाइपरलोकल आजीविका निर्देशिका', en: 'Hyperlocal Livelihood Directory', hin: 'Hyperlocal Livelihood Directory' },
    'opp.title': { hi: 'रोजगार एवं स्वरोजगार के अवसर', bho: 'रोजगार एवं स्वरोजगार के अवसर', en: 'Livelihood & Work Opportunities', hin: 'Livelihood & Work Opportunities' },
    'opp.subtitle': { hi: '', bho: '', en: '', hin: '' },
    'opp.calculateScore': { hi: 'मेल स्कोर गणना करें', bho: 'मेल स्कोर गणना करीं', en: 'Calculate Match Score', hin: 'Calculate Match Score' },
    'opp.tabAll': { hi: 'सभी अवसर', bho: 'सब अवसर', en: 'All Openings', hin: 'All Openings' },
    'opp.tabNearby': { hi: 'पास में (≤ 10 किमी)', bho: 'लगे (≤ 10 किमी)', en: 'Nearby (≤ 10 km)', hin: 'Nearby (≤ 10 km)' },
    'opp.tabDistrict': { hi: 'जिला (≤ 40 किमी)', bho: 'जिला (≤ 40 किमी)', en: 'District (≤ 40 km)', hin: 'District (≤ 40 km)' },
    'opp.tabSelf': { hi: 'स्वरोजगार', bho: 'स्वरोजगार', en: 'Self-Employment', hin: 'Self-Employment' },
    'opp.searchPlaceholder': { hi: 'नौकरी या स्थान खोजें...', bho: 'नौकरी या स्थान खोजें...', en: 'Search job or location...', hin: 'Search job or location...' },

    // Training View
    'train.badge': { hi: 'सरकारी और प्रमाणित कौशल केंद्र', bho: 'सरकारी अउर प्रमाणित कौशल केंद्र', en: 'Government & Certified Vocational Centers', hin: 'Government & Certified Vocational Centers' },
    'train.title': { hi: 'प्रशिक्षण एवं कौशल केंद्र', bho: 'प्रशिक्षण एवं कौशल केंद्र', en: 'Training Opportunities & Centers', hin: 'Training Opportunities & Centers' },
    'train.subtitle': { hi: '', bho: '', en: '', hin: '' },
    'train.matchVoice': { hi: 'बोलकर मैच करें', bho: 'बोल के मैच करीं', en: 'Match via Voice Assessment', hin: 'Match via Voice Assessment' },
    'train.tabAll': { hi: 'सभी केंद्र', bho: 'सब केंद्र', en: 'All Centers', hin: 'All Centers' },
    'train.tabDigital': { hi: 'डिजिटल और आईटी', bho: 'डिजिटल अउर आईटी', en: 'Digital & IT', hin: 'Digital & IT' },
    'train.tabTailoring': { hi: 'सिलाई और परिधान', bho: 'सिलाई अउर परिधान', en: 'Tailoring & Garment', hin: 'Tailoring & Garment' },
    'train.tabSolar': { hi: 'सोलर और बिजली', bho: 'सोलर अउर बिजली', en: 'Solar & Electrical', hin: 'Solar & Electrical' },
    'train.tabRetail': { hi: 'रिटेल और बिक्री', bho: 'रिटेल अउर बिक्री', en: 'Retail & Sales', hin: 'Retail & Sales' },

    // Footer
    'footer.desc': {
      hi: 'जीविका एआई एक सुलभ, वॉइस-फर्स्ट आजीविका और कौशल खोज मंच है जो भाषा बाधाओं या सीमित डिजिटल साक्षरता वाले लोगों के लिए बनाया गया है।',
      bho: 'जीविका एआई एगो सुलभ आजीविका अउर कौशल खोज मंच बा।',
      en: 'JeevikaAI is an accessible, voice-first livelihood and skill discovery platform designed for people who face language barriers or limited digital literacy.',
      hin: 'JeevikaAI is an accessible, voice-first livelihood and skill discovery platform designed for people who face language barriers or limited digital literacy.'
    },
    'footer.tagline': { hi: 'वॉइस-फर्स्ट नागरिक आजीविका खोज', bho: 'वॉइस-फर्स्ट आजीविका खोज', en: 'Voice-First Civic Livelihood Discovery', hin: 'Voice-First Civic Livelihood Discovery' },
    'footer.navTitle': { hi: 'नेविगेशन (Navigation)', bho: 'नेविगेशन', en: 'Navigation', hin: 'Navigation' },
    'footer.legalTitle': { hi: 'कानूनी और सहायता (Legal & Support)', bho: 'कानूनी अउर मदद', en: 'Legal & Support', hin: 'Legal & Support' },
    'footer.disclaimer': {
      hi: 'अस्वीकरण: जीविका एआई एक स्वतंत्र सार्वजनिक-हित मंच है। प्रोफ़ाइल, कौशल सिफ़ारिशें, पाठ्यक्रम विवरण, एनएसक्यूएफ स्तर और नौकरी लिस्टिंग केवल सांकेतिक डेमो डेटा हैं। यह किसी भी सरकारी निकाय का आधिकारिक समर्थन या कानूनी संबंध नहीं दर्शाते हैं।',
      bho: 'अस्वीकरण: जीविका एआई एगो स्वतंत्र सार्वजनिक-हित मंच बा।',
      en: 'Disclaimer: JeevikaAI is an independent public-interest platform. Profiles, skill recommendations, course details, NSQF levels, and job listings are illustrative demo data and curated directory entries. They are not official government certifications or guaranteed job placements.',
      hin: 'Disclaimer: JeevikaAI is an independent public-interest platform. Profiles, skill recommendations, course details, NSQF levels, and job listings are illustrative demo data and curated directory entries.'
    },
  };

  return dictionary[key]?.[lang] || dictionary[key]?.['hi'] || key;
};
