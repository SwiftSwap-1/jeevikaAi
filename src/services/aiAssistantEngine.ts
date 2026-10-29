import { AppView, BeneficiaryProfile, SupportedLanguage, Opportunity } from '../types';
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
 * Intelligent Multilingual NLP & Card Reader Engine for JeevikaAI
 * Understands Hindi (Devanagari), Hinglish, Bhojpuri, and English voice commands.
 */
export function processLocalAssistantQuery(
  rawQuery: string,
  currentView: AppView,
  currentLang: SupportedLanguage,
  userProfile: BeneficiaryProfile | null
): AssistantEngineResult {
  const query = cleanQuery(rawQuery);
  const profile: BeneficiaryProfile = userProfile || DEMO;
  const isBhojpuri = currentLang === 'bho';
  const isEnglish = currentLang === 'en';
  const userLoc = profile.location || 'Maharajganj, Uttar Pradesh';

  // Calculate current ranked pathways and jobs based on profile
  const rankedPathways = rankPaths(profile);
  const topPathway = rankedPathways[0] || PATHWAYS[0];
  const rankedOpportunities = rankJobs(profile, rankedPathways);

  // Common read / explain / tell verbs in Devanagari, Hinglish, Bhojpuri, and English
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
    query.includes('kya hai') ||
    query.includes('क्या है') ||
    query.includes('details') ||
    query.includes('विवरण') ||
    query.includes('जानकारी') ||
    query.includes('कार्ड') ||
    query.includes('card');

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
    query.includes('रास्ता') ||
    query.includes('चरण') ||
    query.includes('stage') ||
    query.includes('stages') ||
    query.includes('kadam') ||
    query.includes('milestone');

  if (isRoadmapQuery) {
    const pName = topPathway.hi || topPathway.name;
    const stage1 = topPathway.stages[0];
    const stage2 = topPathway.stages[1];
    const stage3 = topPathway.stages[2];

    const reply = isEnglish
      ? `🗺️ **Livelihood Roadmap: ${topPathway.name}**\n\n` +
        `• **Target Role:** ${topPathway.role}\n` +
        `• **Duration:** ${topPathway.duration} (NSQF Level ${topPathway.nsqf})\n` +
        `• **Estimated Earnings:** ₹8,000 to ₹15,000 / month\n\n` +
        `**3 Learning Stages:**\n` +
        `1. **${stage1[0]}** (${stage1[2]}): ${stage1[1]}\n` +
        `2. **${stage2[0]}** (${stage2[2]}): ${stage2[1]}\n` +
        `3. **${stage3[0]}** (${stage3[2]}): ${stage3[1]}`
      : isBhojpuri
      ? `🗺️ **रउआ आजीविका रोडमैप: ${pName}**\n\n` +
        `• **लक्ष्य काम:** ${topPathway.role}\n` +
        `• **अवधि:** ${topPathway.duration} (NSQF लेवल ${topPathway.nsqf})\n` +
        `• **अनुमानित कमाई:** ₹8,000 से ₹15,000 हर महीना\n\n` +
        `**3 गो मुख्य चरण:**\n` +
        `1. **${stage1[0]}** (${stage1[2]}): ${stage1[1]}\n` +
        `2. **${stage2[0]}** (${stage2[2]}): ${stage2[1]}\n` +
        `3. **${stage3[0]}** (${stage3[2]}): ${stage3[1]}`
      : `🗺️ **आपका आजीविका रोडमैप: ${pName}**\n\n` +
        `• **लक्ष्य कार्य:** ${topPathway.role}\n` +
        `• **अवधि:** ${topPathway.duration} (NSQF स्तर ${topPathway.nsqf})\n` +
        `• **संभावित आय:** ₹8,000 से ₹15,000 प्रति माह\n\n` +
        `**3 मुख्य चरण:**\n` +
        `1. **${stage1[0]}** (${stage1[2]}): ${stage1[1]}\n` +
        `2. **${stage2[0]}** (${stage2[2]}): ${stage2[1]}\n` +
        `3. **${stage3[0]}** (${stage3[2]}): ${stage3[1]}`;

    const spokenReply = isEnglish
      ? `Here is your Roadmap for ${topPathway.name}. Your target role is ${topPathway.role}, duration ${topPathway.duration} at NSQF Level ${topPathway.nsqf}. Stage 1: ${stage1[0]}. Stage 2: ${stage2[0]}. Stage 3: ${stage3[0]}. You can earn ₹8,000 to ₹15,000 monthly.`
      : isBhojpuri
      ? `रउआ रोडमैप तैयार बा: रउआ खातिर सबसे बढ़िया रास्ता ${pName} बा। रउआ ${topPathway.role} बन सकेनी। एकर तीन गो चरण बा: पहिला, ${stage1[0]}। दूसरा, ${stage2[0]}। अउर तीसरा, ${stage3[0]}। रउआ ₹8,000 से ₹15,000 महीना कमा सकेनी।`
      : `आपका आजीविका रोडमैप: आपकी प्रोफ़ाइल के अनुसार आपका शीर्ष मार्ग ${pName} है। इसमें आप ${topPathway.role} बन सकते हैं। इसके तीन चरण हैं: पहला चरण, ${stage1[0]}। दूसरा चरण, ${stage2[0]}। और तीसरा चरण, ${stage3[0]}। इससे आप ₹8,000 से ₹15,000 प्रति माह कमा सकते हैं।`;

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
  // 3. GOVERNMENT SCHEMES / YOJANA READER ("योजना पढ़ो", "सरकारी योजना बताओ")
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
    query.includes('अनुदान') ||
    query.includes('loan') ||
    query.includes('लोन') ||
    query.includes('ऋण');

  if (isSchemeQuery) {
    const reply = isEnglish
      ? `🏛️ **Active Government Schemes for ${userLoc}:**\n\n` +
        `1. **PM Vishwakarma Yojana**\n` +
        `   • Benefit: ₹15,000 toolkit grant + ₹500/day training stipend + up to ₹3 Lakh loan at 5% interest.\n` +
        `   • Apply at: Nearest CSC Center or Gram Panchayat.\n\n` +
        `2. **One District One Product (ODOP) Scheme**\n` +
        `   • Benefit: Up to ₹25,000 toolkit + margin money subsidy for local crafts.\n` +
        `   • Apply at: District Industries Centre (DIC).\n\n` +
        `3. **PM Mudra Yojana (Shishu / Kishore)**\n` +
        `   • Benefit: Collateral-free business loan up to ₹50,000 (Shishu) to ₹5 Lakh.\n` +
        `   • Apply at: Any nationalized bank branch (SBI, PNB, Baroda).`
      : `🏛️ **${userLoc} के लिए प्रमुख सरकारी योजनाएं:**\n\n` +
        `1. **प्रधानमंत्री विश्वकर्मा योजना:**\n` +
        `   • लाभ: ₹15,000 टूलकिट अनुदान + ₹500/दिन प्रशिक्षण वजीफा + ₹3 लाख तक 5% ब्याज पर ऋण।\n` +
        `   • आवेदन: नजदीकी CSC केंद्र या ग्राम पंचायत सचिवालय।\n\n` +
        `2. **एक जिला एक उत्पाद (ODOP) योजना:**\n` +
        `   • लाभ: ₹25,000 तक टूलकिट व व्यवसाय हेतु मार्जिन मनी सब्सिडी।\n` +
        `   • आवेदन: जिला उद्योग प्रोत्साहन केंद्र (DIC)।\n\n` +
        `3. **प्रधानमंत्री मुद्रा योजना (शिशु/किशोर):**\n` +
        `   • लाभ: ₹50,000 से ₹5 लाख तक बिना गारंटी स्वरोजगार ऋण।\n` +
        `   • आवेदन: किसी भी राष्ट्रीयकृत बैंक शाखा (SBI, PNB, Baroda) में।`;

    const spokenReply = isEnglish
      ? `Here are the top government schemes for ${userLoc}: First, PM Vishwakarma Yojana gives ₹15,000 toolkit grant and ₹500 daily training stipend; apply at your nearest CSC center. Second, ODOP scheme provides toolkit and margin money subsidy at the District Industries Centre. Third, PM Mudra Yojana offers up to ₹50,000 Shishu business loan at any bank branch.`
      : `${userLoc} के लिए सरकारी योजनाएं: पहली है प्रधानमंत्री विश्वकर्मा योजना, जिसमें ₹15,000 टूलकिट अनुदान और ₹500 प्रतिदिन प्रशिक्षण वजीफा मिलता है, इसके लिए नजदीकी सीएससी केंद्र पर आवेदन करें। दूसरी है एक जिला एक उत्पाद योजना, जिसमें जिला उद्योग केंद्र से ₹25,000 तक टूलकिट और सब्सिडी मिलती है। तीसरी है प्रधानमंत्री मुद्रा योजना, जिसमें बैंक शाखा से ₹50,000 तक शिशु लोन बिना गारंटी मिलता है।`;

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
  // 4. JOBS / NAUKARI CARD READER & NAVIGATION ("नौकरी पढ़ो", "काम बताओ", "रोजगार खोलो")
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
    query.includes('kaam') ||
    query.includes('काम') ||
    query.includes('vacancy') ||
    query.includes('salary') ||
    query.includes('vetan') ||
    query.includes('वेतन') ||
    query.includes('अवसर');

  if (isJobQuery) {
    const isSolar = query.includes('solar') || query.includes('सोलर');
    const isRetail = query.includes('retail') || query.includes('रिटेल') || query.includes('dukaan') || query.includes('दुकान');
    const isTailor = query.includes('tailor') || query.includes('silai') || query.includes('सिलाई');
    const isDigital = query.includes('digital') || query.includes('typing') || query.includes('डाटा एंट्री') || query.includes('डिजिटल');

    let specificJob: Opportunity | undefined;
    if (isSolar) specificJob = JOBS.find((j) => j.path === 'solar');
    else if (isRetail) specificJob = JOBS.find((j) => j.path === 'retail');
    else if (isTailor) specificJob = JOBS.find((j) => j.path === 'tailoring');
    else if (isDigital) specificJob = JOBS.find((j) => j.path === 'digital');
    else if (query.includes('first') || query.includes('pehli') || query.includes('पहली')) specificJob = rankedOpportunities[0];

    if (specificJob) {
      const reply =
        `💼 **नौकरी विवरण: ${specificJob.title}**\n\n` +
        `• **संस्था:** ${specificJob.org}\n` +
        `• **वेतन:** ${specificJob.pay}\n` +
        `• **स्थान:** ${specificJob.loc}\n` +
        `• **योग्यता:** ${specificJob.eligibility}\n` +
        `• **दस्तावेज़:** ${(specificJob.documentsRequired || ['आधार कार्ड']).join(', ')}`;

      const spokenReply = isEnglish
        ? `Job details for ${specificJob.title} at ${specificJob.org}: Pay is ${specificJob.pay}, located at ${specificJob.loc}. Eligibility: ${specificJob.eligibility}.`
        : `नौकरी विवरण: पद है ${specificJob.title}, संस्था ${specificJob.org}। मासिक वेतन ${specificJob.pay} है। स्थान ${specificJob.loc} है। योग्यता: ${specificJob.eligibility}।`;

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

    const topJobs = rankedOpportunities.filter((j) => j.type !== 'Training').slice(0, 3);
    const j1 = topJobs[0] || JOBS[0];
    const j2 = topJobs[1] || JOBS[1];
    const j3 = topJobs[2] || JOBS[3];

    const reply = isEnglish
      ? `💼 **Matched Jobs for Your Profile (${userLoc}):**\n\n` +
        `1. **${j1.title}** (${j1.org}) — ${j1.pay}\n` +
        `2. **${j2.title}** (${j2.org}) — ${j2.pay}\n` +
        `3. **${j3.title}** (${j3.org}) — ${j3.pay}`
      : `💼 **आपके प्रोफाइल के अनुसार प्रमुख रोजगार अवसर (${userLoc}):**\n\n` +
        `1. **${j1.title}** (${j1.org})\n   • वेतन: ${j1.pay} · स्थान: ${j1.loc}\n` +
        `2. **${j2.title}** (${j2.org})\n   • वेतन: ${j2.pay} · स्थान: ${j2.loc}\n` +
        `3. **${j3.title}** (${j3.org})\n   • वेतन: ${j3.pay} · स्थान: ${j3.loc}`;

    const spokenReply = isEnglish
      ? `Here are the top matched jobs near you: First, ${j1.title} at ${j1.org}, paying ${j1.pay}. Second, ${j2.title}, paying ${j2.pay}. Third, ${j3.title}, paying ${j3.pay}. Opening the opportunities page now.`
      : isBhojpuri
      ? `रउआ खातिर मुख्य रोजगार अवसर: पहिला बा ${j1.title}, वेतन ${j1.pay}। दूसरा बा ${j2.title}, वेतन ${j2.pay}। अउर तीसरा बा ${j3.title}। रोजगार पेज खोलल जा रहल बा।`
      : `आपके लिए प्रमुख रोजगार अवसर: पहला है ${j1.title}, वेतन ${j1.pay}। दूसरा है ${j2.title}, वेतन ${j2.pay}। और तीसरा है ${j3.title}, वेतन ${j3.pay}। मैं रोजगार अवसर पेज खोल रहा हूँ।`;

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
    query.includes('antar') ||
    query.includes('seekhna') ||
    query.includes('sikhna') ||
    query.includes('सीखना');

  if (isSkillQuery) {
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

    const reply = isEnglish
      ? `⚡ **Skill-Gap Analysis: ${topPathway.name}**\n\n` +
        `• **Current Skills:** ${displayMatched}\n` +
        `• **Skills to Learn:** ${displayGap}\n` +
        `• **Recommended Step:** 2–3 months free PMKVY / RSETI certification course.`
      : `⚡ **कौशल अंतर (Skill-Gap) विश्लेषण: ${topPathway.hi || topPathway.name}**\n\n` +
        `• **आपके मौजूदा हुनर:** ${displayMatched}\n` +
        `• **जो कौशल आगे सीखने हैं:** ${displayGap}\n` +
        `• **सुझाव:** PMKVY या RSETI केंद्र से निःशुल्क प्रशिक्षण प्राप्त करें।`;

    const spokenReply = isEnglish
      ? `Your current skills are ${displayMatched}. For ${topPathway.name}, learning ${displayGap} will boost your income. Opening your Skill Gap page now.`
      : `आपके पास अभी ${displayMatched} का हुनर है। ${topPathway.hi || topPathway.name} में आगे बढ़ने के लिए आपको ${displayGap} सीखना चाहिए। कौशल विश्लेषण पेज खोला जा रहा है।`;

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
  // 6. TRAINING CENTERS READER & NAVIGATION ("ट्रेनिंग पढ़ो", "प्रशिक्षण केंद्र बताओ")
  // -------------------------------------------------------------------------
  const isTrainingQuery =
    query.includes('training') ||
    query.includes('train') ||
    query.includes('ट्रेनिंग') ||
    query.includes('प्रशिक्षण') ||
    query.includes('prashikshan') ||
    query.includes('kendra') ||
    query.includes('केंद्र') ||
    query.includes('center') ||
    query.includes('centre') ||
    query.includes('pmkvy') ||
    query.includes('rseti') ||
    query.includes('iti') ||
    query.includes('course') ||
    query.includes('कोर्स') ||
    query.includes('सिलाई सीख') ||
    query.includes('कंप्यूटर सीख');

  if (isTrainingQuery) {
    const trainingJobs = JOBS.filter((j) => j.type === 'Training');
    const t1 = trainingJobs[0] || JOBS[7];
    const t2 = trainingJobs[1] || JOBS[8];

    const reply = isEnglish
      ? `🎓 **Free Government Skill Training Centers (${userLoc}):**\n\n` +
        `1. **${t1.title}** (${t1.org})\n   • Benefit: ${t1.pay}\n` +
        `2. **${t2.title}** (${t2.org})\n   • Benefit: ${t2.pay}`
      : `🎓 **निःशुल्क सरकारी कौशल प्रशिक्षण केंद्र (${userLoc}):**\n\n` +
        `1. **${t1.title}** (${t1.org})\n   • लाभ: ${t1.pay}\n` +
        `2. **${t2.title}** (${t2.org})\n   • लाभ: ${t2.pay}`;

    const spokenReply = isEnglish
      ? `Here are the free government training centers near you: First, ${t1.title}, offering free training and certificate. Second, ${t2.title}, offering free residential self-employment training. Opening the training page now.`
      : `आपके नजदीकी सरकारी प्रशिक्षण केंद्र: पहला है ${t1.title}, जहाँ मुफ्त ट्रेनिंग और सर्टिफिकेट मिलता है। दूसरा है ${t2.title}, जहाँ स्वरोजगार के लिए निःशुल्क प्रशिक्षण और टूलकिट सहायता मिलती है। प्रशिक्षण पेज खोला जा रहा है।`;

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
  // 7. CONTEXTUAL "YEH CARD PADHO" / "READ THIS PAGE"
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
    query.includes('इसे पढ़ो')
  ) {
    if (currentView === 'opportunities') {
      return processLocalAssistantQuery('job card padho', currentView, currentLang, userProfile);
    } else if (currentView === 'training') {
      return processLocalAssistantQuery('training card padho', currentView, currentLang, userProfile);
    } else if (currentView === 'skill-gap') {
      return processLocalAssistantQuery('skill card padho', currentView, currentLang, userProfile);
    }
    return processLocalAssistantQuery('roadmap card padho', currentView, currentLang, userProfile);
  }

  // -------------------------------------------------------------------------
  // 8. DIRECT PAGE NAVIGATION INTENTS
  // -------------------------------------------------------------------------
  if (
    query.includes('dashboard') ||
    query.includes('डैशबोर्ड')
  ) {
    const text = isEnglish
      ? 'Opening your livelihood dashboard now.'
      : isBhojpuri
      ? 'रउआ खातिर आजीविका डैशबोर्ड खोलल जा रहल बा।'
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
    const text = isEnglish
      ? `Opening your profile. Name: ${profile.name || 'Beneficiary'}, Education: ${profile.education || '10th pass'}, Location: ${userLoc}.`
      : `आपकी प्रोफ़ाइल खोली जा रही है। नाम: ${profile.name || 'लाभार्थी'}, शिक्षा: ${profile.education || '10वीं पास'}, स्थान: ${userLoc}।`;
    return {
      reply: text,
      spokenReply: text,
      targetView: 'profile',
      isCardReadout: isReadOrExplain,
      matchedIntent: true,
    };
  }

  if (
    query.includes('home') ||
    query.includes('होम') ||
    query.includes('मुख्य पृष्ठ')
  ) {
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
    query.includes('शुरू से') ||
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

  if (
    query.includes('saved') ||
    query.includes('shortlist') ||
    query.includes('सहेजे') ||
    query.includes('सेव')
  ) {
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

  if (
    query.includes('help') ||
    query.includes('faq') ||
    query.includes('मदद') ||
    query.includes('सहायता')
  ) {
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
  // 10. OPEN-ENDED QUESTION FALLBACK (Will be answered by live Gemini API first)
  // -------------------------------------------------------------------------
  const pName = topPathway.hi || topPathway.name;
  const fallbackReply = isEnglish
    ? `Based on your profile in ${userLoc}, your top recommended pathway is ${topPathway.name} (${topPathway.role}). You can also explore free PMKVY/RSETI training and PM Vishwakarma schemes on your dashboard.`
    : isBhojpuri
    ? `${userLoc} में रउआ प्रोफ़ाइल के हिसाब से सबसे बढ़िया मार्ग ${pName} (${topPathway.role}) बा। रउआ डैशबोर्ड पर सरकारी योजना, ट्रेनिंग अउर रोजगार के पूरा जानकारी देख सकेनी।`
    : `${userLoc} में आपकी प्रोफ़ाइल के अनुसार ${pName} (${topPathway.role}) एक बेहतरीन विकल्प है। इसके लिए आप नजदीकी PMKVY या RSETI केंद्र से निःशुल्क प्रशिक्षण और पीएम विश्वकर्मा व मुद्रा योजना का लाभ ले सकते हैं।`;

  return {
    reply: fallbackReply,
    spokenReply: fallbackReply,
    targetView: null,
    isCardReadout: false,
    matchedIntent: false,
  };
}
