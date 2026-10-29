import { AppView, BeneficiaryProfile, SupportedLanguage, Opportunity, LocationLivelihoodData } from '../types';
import { PATHWAYS, JOBS, DEMO } from '../data/mockData';
import { rankPaths, rankJobs, splitList } from './recommendationEngine';

export interface AssistantEngineResult {
  reply: string;
  spokenReply: string;
  targetView: AppView | null;
  actionHighlight?: string;
  profileUpdates?: Partial<BeneficiaryProfile> | null;
  isCardReadout: boolean;
  matchedIntent: boolean;
  cardType?: 'roadmap' | 'job' | 'training' | 'skill' | 'scheme' | null;
}

/**
 * Normalizes text for fast Indic (Devanagari) and English matching
 */
function cleanQuery(text: string): string {
  return text.toLowerCase().replace(/[?,.!/\\;:()""''।]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Intelligent Multilingual NLP & Live Screen Data Reader Engine for JeevikaAI
 * Reads actual present data from locationData & userProfile and supports natural conversational follow-ups.
 */
export function processLocalAssistantQuery(
  rawQuery: string,
  currentView: AppView,
  currentLang: SupportedLanguage,
  userProfile: BeneficiaryProfile | null,
  locationData?: LocationLivelihoodData | null
): AssistantEngineResult {
  const query = cleanQuery(rawQuery);
  const profile: BeneficiaryProfile = userProfile || DEMO;
  const isBhojpuri = currentLang === 'bho';
  const isEnglish = currentLang === 'en';
  const userLoc = locationData?.location || profile.location || 'Maharajganj, Uttar Pradesh';

  // Calculate current ranked pathways and jobs based on profile
  const rankedPathways = rankPaths(profile);
  const topPathway = rankedPathways[0] || PATHWAYS[0];
  const rankedOpportunities = rankJobs(profile, rankedPathways);

  // Live opportunities, training centers, and schemes currently present on the user's screen
  const liveJobs: Opportunity[] =
    locationData?.opportunities && locationData.opportunities.length > 0
      ? locationData.opportunities
      : rankedOpportunities.filter((j) => j.type !== 'Training');

  const liveTrainingCenters: Opportunity[] =
    locationData?.trainingCenters && locationData.trainingCenters.length > 0
      ? locationData.trainingCenters
      : JOBS.filter((j) => j.type === 'Training');

  const liveSchemes = locationData?.schemes && locationData.schemes.length > 0 ? locationData.schemes : null;

  // Detect conversational follow-up questions that should be answered by Live Gemini AI with chat history
  const isConversationalFollowUp =
    (query.includes('kaise') ||
      query.includes('कैसे') ||
      query.includes('kab') ||
      query.includes('कब') ||
      query.includes('kyu') ||
      query.includes('क्यों') ||
      query.includes('konsa') ||
      query.includes('kaunsa') ||
      query.includes('कौन सा') ||
      query.includes('कौनसी') ||
      query.includes('kitna') ||
      query.includes('कितना') ||
      query.includes('कितनी') ||
      query.includes('apply') ||
      query.includes('आवेदन कैसे') ||
      query.includes('document') ||
      query.includes('कागज') ||
      query.includes('दस्तावेज') ||
      query.includes('सलाह') ||
      query.includes('advice') ||
      query.includes('better') ||
      query.includes('अच्छा रहेगा') ||
      query.includes('बताओ इसके बारे में') ||
      query.includes('और बताओ')) &&
    !query.includes('पढ़ो') &&
    !query.includes('padho') &&
    !query.includes('सुनाओ') &&
    !query.includes('sunao') &&
    !query.includes('खोलो') &&
    !query.includes('open');

  // Common read / explain / tell verbs
  const isReadOrExplain =
    query.includes('padh') ||
    query.includes('padho') ||
    query.includes('padhiye') ||
    query.includes('पढ़') ||
    query.includes('पढ़ो') ||
    query.includes('पढ़िए') ||
    query.includes('पढ़के') ||
    query.includes('पढ़ कर') ||
    query.includes('read') ||
    query.includes('batao') ||
    query.includes('bataiye') ||
    query.includes('बताओ') ||
    query.includes('बताइए') ||
    query.includes('बताईं') ||
    query.includes('बताव') ||
    query.includes('tell') ||
    query.includes('explain') ||
    query.includes('samjhao') ||
    query.includes('समझाओ') ||
    query.includes('sunao') ||
    query.includes('सुनाओ') ||
    query.includes('सुनाईं') ||
    query.includes('details') ||
    query.includes('विवरण') ||
    query.includes('कार्ड') ||
    query.includes('card');

  // -------------------------------------------------------------------------
  // 0. "READ ALL DATA / READ CURRENT PAGE / SARA DATA PADHO"
  // -------------------------------------------------------------------------
  if (
    query.includes('sara data') ||
    query.includes('saara data') ||
    query.includes('पूरा डेटा') ||
    query.includes('सारा डेटा') ||
    query.includes('सब कुछ पढ़ो') ||
    query.includes('पूरा पेज') ||
    query.includes('पेज पढ़ो') ||
    query.includes('page padho') ||
    query.includes('read all') ||
    query.includes('read page') ||
    query.includes('सब पढ़ो') ||
    query.includes('सारा कार्ड')
  ) {
    const pName = topPathway.hi || topPathway.name;
    const j1 = liveJobs[0];
    const j2 = liveJobs[1];
    const t1 = liveTrainingCenters[0];
    const s1 = liveSchemes?.[0];

    const reply =
      `📋 **${userLoc} का संपूर्ण आजीविका डेटा सारांश:**\n\n` +
      `• **आपकी प्रोफ़ाइल:** ${profile.name} (${profile.education || '10वीं पास'}) · हुनर: ${profile.skills || 'सिलाई व डिजिटल'}\n` +
      `• **शीर्ष रोडमैप:** ${pName} (${topPathway.role}, NSQF स्तर ${topPathway.nsqf})\n` +
      (j1
        ? `• **प्रमुख नौकरियां:**\n  1. ${j1.title} (${j1.org}) — ${j1.pay} (${j1.loc}, ${j1.km || 4} km दूर)\n` +
          (j2 ? `  2. ${j2.title} (${j2.org}) — ${j2.pay} (${j2.loc}, ${j2.km || 6} km दूर)\n` : '')
        : '') +
      (t1 ? `• **प्रमुख प्रशिक्षण केंद्र:** ${t1.title} (${t1.loc}, ${t1.km || 5} km दूर) — ${t1.pay}\n` : '') +
      (s1 ? `• **प्रमुख सरकारी योजना:** ${s1.hiName || s1.name} — ${s1.benefit}` : '');

    const spokenReply =
      `${userLoc} के लिए आपके पेज का पूरा विवरण: आपकी प्रोफ़ाइल के अनुसार आपका मुख्य रोडमैप ${pName} है। ` +
      (j1
        ? `प्रमुख नौकरियों में पहला अवसर है ${j1.title}, संस्था ${j1.org}, वेतन ${j1.pay}, जो आपके स्थान से ${j1.km || 4} किलोमीटर दूर ${j1.loc} में है। `
        : '') +
      (j2 ? `दूसरा अवसर है ${j2.title}, वेतन ${j2.pay}। ` : '') +
      (t1 ? `प्रशिक्षण केंद्र में ${t1.title} आपके स्थान से ${t1.km || 5} किलोमीटर दूर उपलब्ध है। ` : '') +
      (s1 ? `साथ ही सरकारी योजनाओं में ${s1.hiName || s1.name} के अंतर्गत ${s1.benefit} उपलब्ध है।` : '');

    return {
      reply,
      spokenReply,
      targetView: null,
      isCardReadout: true,
      matchedIntent: true,
    };
  }

  // -------------------------------------------------------------------------
  // 1. CREATOR / IDENTITY INTENT
  // -------------------------------------------------------------------------
  if (
    query.includes('banaya') ||
    query.includes('banaye') ||
    query.includes('creator') ||
    query.includes('maker') ||
    query.includes('developer') ||
    query.includes('who made') ||
    query.includes('who created') ||
    query.includes('किसने बनाया') ||
    query.includes('कोन बनइले') ||
    query.includes('के बनवले बा')
  ) {
    const text = isBhojpuri
      ? 'हमरा के JeevikaAI Organization द्वारा बनावल गइल बा, ताकि रउआ आपन भाषा में रोजगार और हुनर के सही राह पा सकीं।'
      : isEnglish
      ? 'I was developed by JeevikaAI Organization to help citizens discover livelihood pathways, training centers, and government schemes in their own language.'
      : 'मुझे JeevikaAI Organization द्वारा बनाया गया है, ताकि हर नागरिक अपनी भाषा में आजीविका, कौशल और सरकारी योजनाओं की सही जानकारी पा सके।';

    return {
      reply: text,
      spokenReply: text,
      targetView: null,
      isCardReadout: false,
      matchedIntent: true,
    };
  }

  // -------------------------------------------------------------------------
  // 2. ROADMAP CARD READER & NAVIGATION ("रोडमैप पढ़ो", "रोडमैप बताओ", "मेरा रोडमैप")
  // -------------------------------------------------------------------------
  const isRoadmapQuery =
    query.includes('roadmap') ||
    query.includes('road map') ||
    query.includes('रोडमैप') ||
    query.includes('रोड मैप') ||
    query.includes('कैरियर') ||
    query.includes('करियर') ||
    query.includes('pathway') ||
    query.includes('मार्ग') ||
    query.includes('चरण') ||
    query.includes('stage') ||
    query.includes('stages') ||
    query.includes('kadam') ||
    query.includes('milestone');

  if (isRoadmapQuery && !isConversationalFollowUp) {
    const pName = topPathway.hi || topPathway.name;
    const stage1 = topPathway.stages[0];
    const stage2 = topPathway.stages[1];
    const stage3 = topPathway.stages[2];

    const reply = isEnglish
      ? `🗺️ **Livelihood Roadmap: ${topPathway.name} (${userLoc})**\n\n` +
        `• **Target Role:** ${topPathway.role}\n` +
        `• **Duration:** ${topPathway.duration} (NSQF Level ${topPathway.nsqf})\n` +
        `• **Estimated Earnings:** ${locationData?.insight?.averageMonthlyWage || '₹8,000 to ₹15,000'} / month\n\n` +
        `**3 Learning Stages:**\n` +
        `1. **${stage1[0]}** (${stage1[2]}): ${stage1[1]}\n` +
        `2. **${stage2[0]}** (${stage2[2]}): ${stage2[1]}\n` +
        `3. **${stage3[0]}** (${stage3[2]}): ${stage3[1]}`
      : `🗺️ **आपका आजीविका रोडमैप: ${pName} (${userLoc})**\n\n` +
        `• **लक्ष्य कार्य:** ${topPathway.role}\n` +
        `• **अवधि:** ${topPathway.duration} (NSQF स्तर ${topPathway.nsqf})\n` +
        `• **संभावित मासिक आय:** ${locationData?.insight?.averageMonthlyWage || '₹8,000 से ₹15,000'}\n\n` +
        `**3 मुख्य चरण:**\n` +
        `1. **${stage1[0]}** (${stage1[2]}): ${stage1[1]}\n` +
        `2. **${stage2[0]}** (${stage2[2]}): ${stage2[1]}\n` +
        `3. **${stage3[0]}** (${stage3[2]}): ${stage3[1]}`;

    const spokenReply = isEnglish
      ? `Here is your Roadmap for ${topPathway.name} in ${userLoc}. Your target role is ${topPathway.role}, duration ${topPathway.duration} at NSQF Level ${topPathway.nsqf}. Stage 1: ${stage1[0]}, ${stage1[1]}. Stage 2: ${stage2[0]}, ${stage2[1]}. Stage 3: ${stage3[0]}, ${stage3[1]}.`
      : `आपका आजीविका रोडमैप (${userLoc}): आपकी प्रोफ़ाइल के अनुसार आपका शीर्ष मार्ग ${pName} है। इसमें आप ${topPathway.role} बन सकते हैं। इसके तीन चरण हैं: पहला चरण, ${stage1[0]} — ${stage1[1]}। दूसरा चरण, ${stage2[0]} — ${stage2[1]}। और तीसरा चरण, ${stage3[0]} — ${stage3[1]}। इससे आप महीने में ${locationData?.insight?.averageMonthlyWage || '₹8,000 से ₹15,000'} कमा सकते हैं।`;

    return {
      reply,
      spokenReply,
      targetView: 'dashboard',
      actionHighlight: 'roadmap-section',
      isCardReadout: true,
      matchedIntent: true,
      cardType: 'roadmap',
    };
  }

  // -------------------------------------------------------------------------
  // 3. GOVERNMENT SCHEMES / YOJANA READER (Reads actual live schemes from locationData)
  // -------------------------------------------------------------------------
  const isSchemeQuery =
    query.includes('yojana') ||
    query.includes('योजना') ||
    query.includes('scheme') ||
    query.includes('schemes') ||
    query.includes('स्कीम') ||
    query.includes('sarkari') ||
    query.includes('सरकारी') ||
    query.includes('vishwakarma') ||
    query.includes('विश्वकर्मा') ||
    query.includes('mudra') ||
    query.includes('मुद्रा') ||
    query.includes('odop') ||
    query.includes('subsidy') ||
    query.includes('अनुदान');

  if (isSchemeQuery && !isConversationalFollowUp) {
    if (liveSchemes && liveSchemes.length > 0) {
      const lines = liveSchemes.map(
        (s, i) =>
          `${i + 1}. **${s.hiName || s.name}**\n   • लाभ: ${s.benefit}\n   • पात्रता: ${s.eligibility}\n   • कहाँ आवेदन करें: ${s.applyOffice}`
      );
      const spokenLines = liveSchemes.map(
        (s, i) =>
          `योजना ${i + 1}: ${s.hiName || s.name}। इसका लाभ है: ${s.benefit}। पात्रता: ${s.eligibility}। आवेदन का स्थान: ${s.applyOffice}।`
      );

      const reply = `🏛️ **${userLoc} के लिए सक्रिय सरकारी योजनाएं:**\n\n` + lines.join('\n\n');
      const spokenReply = `${userLoc} के लिए आपकी स्क्रीन पर उपलब्ध सरकारी योजनाएं: ` + spokenLines.join(' ');

      return {
        reply,
        spokenReply,
        targetView: currentView === 'opportunities' ? 'opportunities' : 'dashboard',
        actionHighlight: 'schemes-section',
        isCardReadout: true,
        matchedIntent: true,
        cardType: 'scheme',
      };
    }

    const reply =
      `🏛️ **${userLoc} के लिए प्रमुख सरकारी योजनाएं:**\n\n` +
      `1. **प्रधानमंत्री विश्वकर्मा योजना:** ₹15,000 टूलकिट अनुदान + ₹500/दिन प्रशिक्षण वजीफा + ₹3 लाख तक ऋण।\n` +
      `2. **एक जिला एक उत्पाद (ODOP) योजना:** ₹25,000 तक टूलकिट व मार्जिन मनी सब्सिडी।\n` +
      `3. **प्रधानमंत्री मुद्रा योजना:** ₹50,000 से ₹5 लाख तक बिना गारंटी स्वरोजगार ऋण।`;

    const spokenReply = `${userLoc} के लिए सरकारी योजनाएं: पहली है प्रधानमंत्री विश्वकर्मा योजना, जिसमें ₹15,000 टूलकिट अनुदान और ₹500 प्रतिदिन वजीफा मिलता है। दूसरी है एक जिला एक उत्पाद योजना, और तीसरी है प्रधानमंत्री मुद्रा योजना।`;

    return {
      reply,
      spokenReply,
      targetView: 'dashboard',
      actionHighlight: 'schemes-section',
      isCardReadout: true,
      matchedIntent: true,
      cardType: 'scheme',
    };
  }

  // -------------------------------------------------------------------------
  // 4. JOBS / NAUKARI CARD READER & NAVIGATION (Reads actual live jobs from locationData)
  // -------------------------------------------------------------------------
  const isJobQuery =
    query.includes('naukri') ||
    query.includes('naukari') ||
    query.includes('नौकरी') ||
    query.includes('नौकरियां') ||
    query.includes('job') ||
    query.includes('jobs') ||
    query.includes('जॉब') ||
    query.includes('रोजगार') ||
    query.includes('रोज़गार') ||
    query.includes('vacancy') ||
    query.includes('वेतन') ||
    query.includes('अवसर');

  if (isJobQuery && !isConversationalFollowUp) {
    let specificJob: Opportunity | undefined;
    if (query.includes('first') || query.includes('pehla') || query.includes('pehli') || query.includes('पहला') || query.includes('पहली')) {
      specificJob = liveJobs[0];
    } else if (query.includes('second') || query.includes('dusra') || query.includes('dusri') || query.includes('दूसरा') || query.includes('दूसरी')) {
      specificJob = liveJobs[1];
    } else if (query.includes('third') || query.includes('teesra') || query.includes('तीसरा') || query.includes('तीसरी')) {
      specificJob = liveJobs[2];
    } else if (query.includes('solar') || query.includes('सोलर')) {
      specificJob = liveJobs.find((j) => j.path === 'solar' || j.title.toLowerCase().includes('solar'));
    } else if (query.includes('retail') || query.includes('रिटेल') || query.includes('दुकान')) {
      specificJob = liveJobs.find((j) => j.path === 'retail' || j.title.toLowerCase().includes('retail'));
    } else if (query.includes('tailor') || query.includes('सिलाई')) {
      specificJob = liveJobs.find((j) => j.path === 'tailoring' || j.title.toLowerCase().includes('tailor'));
    } else if (query.includes('digital') || query.includes('कंप्यूटर') || query.includes('डिजिटल') || query.includes('csc')) {
      specificJob = liveJobs.find((j) => j.path === 'digital' || j.title.toLowerCase().includes('digital') || j.title.toLowerCase().includes('csc'));
    }

    if (specificJob) {
      const reply =
        `💼 **नौकरी कार्ड विवरण: ${specificJob.title}**\n\n` +
        `• **संस्था:** ${specificJob.org}\n` +
        `• **वेतन / आय:** ${specificJob.pay}\n` +
        `• **स्थान व दूरी:** ${specificJob.loc} (आपके स्थान से ${specificJob.km || 4} km दूर)\n` +
        `• **योग्यता:** ${specificJob.eligibility}\n` +
        `• **आवश्यक दस्तावेज़:** ${(specificJob.documentsRequired || ['आधार कार्ड']).join(', ')}\n` +
        `• **संपर्क:** ${specificJob.contactInfo || specificJob.loc}`;

      const spokenReply =
        `नौकरी कार्ड विवरण: पद है ${specificJob.title}, संस्था ${specificJob.org}। इसमें वेतन ${specificJob.pay} है। यह आपके स्थान से लगभग ${specificJob.km || 4} किलोमीटर दूर ${specificJob.loc} में स्थित है। योग्यता: ${specificJob.eligibility}। आवश्यक दस्तावेज़: ${(specificJob.documentsRequired || ['आधार कार्ड']).join(', ')}।`;

      return {
        reply,
        spokenReply,
        targetView: 'opportunities',
        actionHighlight: 'opportunities-section',
        isCardReadout: true,
        matchedIntent: true,
        cardType: 'job',
      };
    }

    const topJobs = liveJobs.slice(0, 4);
    const jobLines = topJobs.map(
      (j, idx) =>
        `${idx + 1}. **${j.title}** (${j.org})\n   • वेतन: ${j.pay} · 📍 ${j.loc} (${j.km || 4} km दूर)\n   • योग्यता: ${j.eligibility}`
    );
    const spokenJobLines = topJobs.map(
      (j, idx) =>
        `अवसर ${idx + 1}: ${j.title}, संस्था ${j.org}, वेतन ${j.pay}, स्थान ${j.loc} जो आपसे ${j.km || 4} किलोमीटर दूर है।`
    );

    const reply = `💼 **${userLoc} में उपलब्ध प्रमुख रोजगार अवसर (${topJobs.length} कार्ड):**\n\n` + jobLines.join('\n\n');
    const spokenReply =
      `${userLoc} में आपके लिए उपलब्ध प्रमुख रोजगार अवसर: ` +
      spokenJobLines.join(' ') +
      ` आप किसी भी कार्ड पर टैप करके इन-बिल्ट मैप और रास्ता देख सकते हैं।`;

    return {
      reply,
      spokenReply,
      targetView: 'opportunities',
      actionHighlight: 'opportunities-section',
      isCardReadout: true,
      matchedIntent: true,
      cardType: 'job',
    };
  }

  // -------------------------------------------------------------------------
  // 5. SKILLS & SKILL-GAP READER ("कौशल पढ़ो", "हुनर बताओ", "स्किल गैप")
  // -------------------------------------------------------------------------
  const isSkillQuery =
    query.includes('skill') ||
    query.includes('skills') ||
    query.includes('स्किल') ||
    query.includes('कौशल') ||
    query.includes('हुनर') ||
    query.includes('hunar') ||
    query.includes('gap') ||
    query.includes('अंतर') ||
    query.includes('antar');

  if (isSkillQuery && !isConversationalFollowUp) {
    const userSkills = splitList(profile.skills).map((s) => s.toLowerCase());
    const matchedSkills: string[] = [];
    const gapSkills: string[] = [];

    topPathway.skillTags.forEach((tag) => {
      if (/^[a-zA-Z\s]+$/.test(tag)) {
        if (userSkills.some((us) => us.includes(tag.toLowerCase()) || tag.toLowerCase().includes(us))) {
          if (!matchedSkills.includes(tag)) matchedSkills.push(tag);
        } else {
          if (!gapSkills.includes(tag)) gapSkills.push(tag);
        }
      }
    });

    const displayMatched = profile.skills || (matchedSkills.length > 0 ? matchedSkills.join(', ') : 'बुनियादी बातचीत, फोन का उपयोग');
    const displayGap = gapSkills.length > 0 ? gapSkills.slice(0, 3).join(', ') : 'व्यावसायिक उपकरण संचालन, डिजिटल फॉर्म';

    const reply =
      `⚡ **कौशल अंतर (Skill-Gap) विश्लेषण: ${topPathway.hi || topPathway.name}**\n\n` +
      `• **आपके मौजूदा हुनर:** ${displayMatched}\n` +
      `• **जो कौशल आगे सीखने हैं:** ${displayGap}\n` +
      `• **सुझाव:** ${userLoc} के नजदीकी PMKVY या RSETI केंद्र से निःशुल्क प्रशिक्षण प्राप्त करें।`;

    const spokenReply = `आपके पास अभी ${displayMatched} का हुनर है। ${topPathway.hi || topPathway.name} में आगे बढ़ने के लिए आपको ${displayGap} सीखना चाहिए। कौशल विश्लेषण पेज खोला जा रहा है।`;

    return {
      reply,
      spokenReply,
      targetView: 'skill-gap',
      isCardReadout: true,
      matchedIntent: true,
      cardType: 'skill',
    };
  }

  // -------------------------------------------------------------------------
  // 6. TRAINING CENTERS READER & NAVIGATION (Reads actual live training centers from locationData)
  // -------------------------------------------------------------------------
  const isTrainingQuery =
    query.includes('training') ||
    query.includes('train') ||
    query.includes('ट्रेनिंग') ||
    query.includes('प्रशिक्षण') ||
    query.includes('prashikshan') ||
    query.includes('परिचरण') ||
    query.includes('kendra') ||
    query.includes('केंद्र') ||
    query.includes('center') ||
    query.includes('centre') ||
    query.includes('pmkvy') ||
    query.includes('rseti') ||
    query.includes('iti') ||
    query.includes('course') ||
    query.includes('कोर्स');

  if (isTrainingQuery && !isConversationalFollowUp) {
    const centers = liveTrainingCenters.slice(0, 4);
    const centerLines = centers.map(
      (t, idx) =>
        `${idx + 1}. **${t.title}** (${t.org})\n   • सुविधा: ${t.pay}\n   • स्थान: 📍 ${t.loc} (आपके स्थान से ${t.km || 6} km दूर)\n   • पात्रता: ${t.eligibility}`
    );
    const spokenCenterLines = centers.map(
      (t, idx) =>
        `केंद्र ${idx + 1}: ${t.title}, संस्था ${t.org}। सुविधा: ${t.pay}। यह आपके स्थान से ${t.km || 6} किलोमीटर दूर ${t.loc} में स्थित है।`
    );

    const reply = `🎓 **${userLoc} के प्रमाणित सरकारी प्रशिक्षण केंद्र (${centers.length} केंद्र):**\n\n` + centerLines.join('\n\n');
    const spokenReply =
      `${userLoc} में आपके नजदीकी सरकारी प्रशिक्षण केंद्र: ` +
      spokenCenterLines.join(' ') +
      ` प्रशिक्षण केंद्र पेज खोला जा रहा है।`;

    return {
      reply,
      spokenReply,
      targetView: 'training',
      isCardReadout: true,
      matchedIntent: true,
      cardType: 'training',
    };
  }

  // -------------------------------------------------------------------------
  // 7. CONTEXTUAL "YEH CARD PADHO" / "FIRST CARD PADHO"
  // -------------------------------------------------------------------------
  if (
    query.includes('iss card') ||
    query.includes('is card') ||
    query.includes('yeh card') ||
    query.includes('ye card') ||
    query.includes('read this') ||
    query.includes('card padho') ||
    query.includes('कार्ड पढ़ो') ||
    query.includes('यह पढ़ो') ||
    query.includes('इसे पढ़ो') ||
    query.includes('पहला कार्ड') ||
    query.includes('दूसरा कार्ड')
  ) {
    if (currentView === 'opportunities') {
      return processLocalAssistantQuery(`नौकरी ${rawQuery}`, currentView, currentLang, userProfile, locationData);
    } else if (currentView === 'training') {
      return processLocalAssistantQuery(`प्रशिक्षण केंद्र ${rawQuery}`, currentView, currentLang, userProfile, locationData);
    } else if (currentView === 'skill-gap') {
      return processLocalAssistantQuery('कौशल कार्ड पढ़ो', currentView, currentLang, userProfile, locationData);
    }
    return processLocalAssistantQuery('रोडमैप पढ़ो', currentView, currentLang, userProfile, locationData);
  }

  // -------------------------------------------------------------------------
  // 8. DIRECT PAGE NAVIGATION INTENTS
  // -------------------------------------------------------------------------
  if (query.includes('dashboard') || query.includes('डैशबोर्ड')) {
    const text = isEnglish
      ? 'Opening your livelihood dashboard now.'
      : 'जी, आपका आजीविका डैशबोर्ड खोला जा रहा है।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'dashboard',
      isCardReadout: false,
      matchedIntent: true,
    };
  }

  if (
    query.includes('setting') ||
    query.includes('seting') ||
    query.includes('सेटिंग') ||
    query.includes('notification') ||
    query.includes('अलर्ट') ||
    query.includes('सूचना')
  ) {
    const text = isEnglish
      ? 'Opening settings and notification preferences.'
      : 'जी, सेटिंग्स और सूचना प्राथमिकताएं खोली जा रही हैं।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'notifications',
      isCardReadout: false,
      matchedIntent: true,
    };
  }

  if (
    query.includes('profile') ||
    query.includes('प्रोफाइल') ||
    query.includes('प्रोफ़ाइल') ||
    query.includes('मेरी जानकारी') ||
    query.includes('मेरा ब्यौरा')
  ) {
    const text =
      `👤 **आपकी प्रोफ़ाइल का विवरण:**\n` +
      `• नाम: ${profile.name || 'लाभार्थी'}\n` +
      `• शिक्षा: ${profile.education || '10वीं पास'}\n` +
      `• कौशल (Skills): ${profile.skills || 'सिलाई, डिजिटल'}\n` +
      `• रुचि: ${profile.interests || 'स्वरोजगार'}\n` +
      `• वर्तमान स्थान: ${userLoc}`;
    const spoken = `आपकी प्रोफ़ाइल का विवरण: आपका नाम ${profile.name || 'लाभार्थी'} है, शिक्षा ${profile.education || '10वीं पास'}, हुनर ${profile.skills || 'सिलाई व डिजिटल'}, और वर्तमान स्थान ${userLoc} है।`;
    return {
      reply: text,
      spokenReply: spoken,
      targetView: 'profile',
      isCardReadout: isReadOrExplain,
      matchedIntent: true,
    };
  }

  if (query.includes('home') || query.includes('होम') || query.includes('मुख्य पृष्ठ')) {
    const text = isEnglish ? 'Opening the home page.' : 'जी, मुख्य पृष्ठ खोला जा रहा है।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'home',
      isCardReadout: false,
      matchedIntent: true,
    };
  }

  if (
    query.includes('assessment') ||
    query.includes('मूल्यांकन') ||
    query.includes('नया टेस्ट') ||
    query.includes('फिर से जानकारी')
  ) {
    const text = isEnglish
      ? 'Starting your voice livelihood assessment now.'
      : 'जी, आवाज़ से आजीविका प्रोफ़ाइल मूल्यांकन शुरू किया जा रहा है।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'assessment',
      isCardReadout: false,
      matchedIntent: true,
    };
  }

  if (query.includes('saved') || query.includes('shortlist') || query.includes('सहेजे') || query.includes('सेव')) {
    const text = isEnglish
      ? 'Opening your saved opportunities.'
      : 'जी, आपके सहेजे गए अवसर खोले जा रहे हैं।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'saved',
      isCardReadout: false,
      matchedIntent: true,
    };
  }

  if (query.includes('help') || query.includes('faq') || query.includes('मदद') || query.includes('सहायता')) {
    const text = isEnglish
      ? 'Opening the Help and FAQ section.'
      : 'जी, सहायता और प्रश्नोत्तर अनुभाग खोला जा रहा है।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'faq',
      isCardReadout: false,
      matchedIntent: true,
    };
  }

  // -------------------------------------------------------------------------
  // 9. VOICE PROFILE UPDATES ("मेरा नाम ... है")
  // -------------------------------------------------------------------------
  const updates: Partial<BeneficiaryProfile> = {};
  if (query.includes('mera naam ') || query.includes('hamaar naam ') || query.includes('my name is ') || query.includes('मेरा नाम ')) {
    const match = rawQuery.match(/(?:mera naam|hamaar naam|my name is|मेरा नाम)\s+([a-zA-Z\u0900-\u097F\s]+)/i);
    if (match && match[1]) {
      updates.name = match[1].replace(/\s+(?:है|बा|hai|ba).*$/i, '').trim();
    }
  }

  if (Object.keys(updates).length > 0) {
    const text = isEnglish
      ? `Updated your profile name to ${updates.name}.`
      : `आपकी प्रोफ़ाइल में नाम "${updates.name}" अपडेट कर दिया गया है।`;
    return {
      reply: text,
      spokenReply: text,
      targetView: 'profile',
      profileUpdates: updates,
      isCardReadout: false,
      matchedIntent: true,
    };
  }

  // -------------------------------------------------------------------------
  // 10. OPEN-ENDED / CONVERSATIONAL FOLLOW-UP (Routed to Live Gemini API with chat history & screen data)
  // -------------------------------------------------------------------------
  const pName = topPathway.hi || topPathway.name;
  const fallbackReply = isEnglish
    ? `Based on your profile in ${userLoc}, your top recommended pathway is ${topPathway.name} (${topPathway.role}). You also have ${liveJobs.length} job opportunities and ${liveTrainingCenters.length} training centers available nearby.`
    : `${userLoc} में आपकी प्रोफ़ाइल के अनुसार ${pName} (${topPathway.role}) एक बेहतरीन विकल्प है। आपके पास ${liveJobs.length} स्थानीय रोजगार अवसर और ${liveTrainingCenters.length} सरकारी प्रशिक्षण केंद्र उपलब्ध हैं।`;

  return {
    reply: fallbackReply,
    spokenReply: fallbackReply,
    targetView: null,
    isCardReadout: false,
    matchedIntent: false,
  };
}
