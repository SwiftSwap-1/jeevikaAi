import { AppView, BeneficiaryProfile, SupportedLanguage, Pathway, Opportunity } from '../types';
import { PATHWAYS, JOBS, DEMO } from '../data/mockData';
import { rankPaths, rankJobs, splitList } from './recommendationEngine';

export interface AssistantEngineResult {
  reply: string;
  spokenReply: string;
  targetView: AppView | null;
  actionHighlight?: string;
  profileUpdates?: Partial<BeneficiaryProfile> | null;
  isCardReadout: boolean;
  cardType?: 'roadmap' | 'job' | 'training' | 'skill' | 'scheme' | null;
}

/**
 * Normalizes text for fast Indic and English matching
 */
function cleanQuery(text: string): string {
  return text.toLowerCase().replace(/[?,.!/\\;:()""'']/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Intelligent Multilingual NLP & Card Reader Engine for JeevikaAI
 * Fully functional offline, in preview, and as fallback when API does not respond.
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

  // Calculate current ranked pathways and jobs based on profile
  const rankedPathways = rankPaths(profile);
  const topPathway = rankedPathways[0] || PATHWAYS[0];
  const rankedOpportunities = rankJobs(profile, rankedPathways);

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
      ? 'हमरा के JeevikaAI Organization (जीविका एआई आर्गेनाइजेशन) द्वारा बनावल गइल बा, ताकि रउआ आपन भाषा में रोजगार और हुनर के सही राह पा सकीं।'
      : isEnglish
      ? 'I was developed by JeevikaAI Organization to empower rural and semi-urban jobseekers with voice-first livelihood and NSQF skill discovery.'
      : 'मुझे JeevikaAI Organization (जीविका एआई आर्गेनाइजेशन) द्वारा बनाया गया है, ताकि हर नागरिक अपनी मातृभाषा में आजीविका और रोजगार की सही राह चुन सके।';

    return {
      reply: text,
      spokenReply: text,
      targetView: null,
      isCardReadout: false,
    };
  }

  // -------------------------------------------------------------------------
  // 2. CARD READING INTENT: ROADMAP CARD (रोडमैप कार्ड पढ़ के बताओ)
  // -------------------------------------------------------------------------
  const isReadVerb =
    query.includes('padh') ||
    query.includes('padho') ||
    query.includes('padhiye') ||
    query.includes('read') ||
    query.includes('batao') ||
    query.includes('tell') ||
    query.includes('explain') ||
    query.includes('sunao') ||
    query.includes('kya hai') ||
    query.includes('what is') ||
    query.includes('details') ||
    query.includes('कार्ड') ||
    query.includes('card');

  const isRoadmapQuery =
    query.includes('roadmap') ||
    query.includes('road map') ||
    query.includes('रोडमैप') ||
    query.includes('कैरियर') ||
    query.includes('करियर') ||
    query.includes('pathway') ||
    query.includes('मार्ग') ||
    query.includes('चरण') ||
    query.includes('stage') ||
    query.includes('stages') ||
    query.includes('kadam') ||
    query.includes('milestone');

  if (isRoadmapQuery && (isReadVerb || query.includes('mera') || query.includes('my') || query.includes('dikhao') || query.includes('show'))) {
    const pName = topPathway.hi || topPathway.name;
    const stage1 = topPathway.stages[0];
    const stage2 = topPathway.stages[1];
    const stage3 = topPathway.stages[2];

    const reply = isEnglish
      ? `🗺️ **Livelihood Roadmap Card: ${topPathway.name}**\n\n` +
        `• **Target Role:** ${topPathway.role}\n` +
        `• **Course Duration:** ${topPathway.duration} (NSQF Level ${topPathway.nsqf})\n` +
        `• **Estimated Earnings:** ₹8,000 to ₹15,000 per month\n\n` +
        `**3 Milestone Stages:**\n` +
        `1️⃣ **${stage1[0]}** (${stage1[2]}): ${stage1[1]}\n` +
        `2️⃣ **${stage2[0]}** (${stage2[2]}): ${stage2[1]}\n` +
        `3️⃣ **${stage3[0]}** (${stage3[2]}): ${stage3[1]}\n\n` +
        `*(Opening your roadmap section on the dashboard now)*`
      : isBhojpuri
      ? `🗺️ **आजीविका रोडमैप कार्ड: ${pName}**\n\n` +
        `• **लक्ष्य रोल:** ${topPathway.role}\n` +
        `• **अवधि:** ${topPathway.duration} (NSQF लेवल ${topPathway.nsqf})\n` +
        `• **अनुमानित कमाई:** ₹8,000 से ₹15,000 हर महीना\n\n` +
        `**3 गो मुख्य चरण:**\n` +
        `1️⃣ **${stage1[0]}** (${stage1[2]}): ${stage1[1]}\n` +
        `2️⃣ **${stage2[0]}** (${stage2[2]}): ${stage2[1]}\n` +
        `3️⃣ **${stage3[0]}** (${stage3[2]}): ${stage3[1]}\n\n` +
        `*(रउआ खातिर डैशबोर्ड पर रोडमैप खोल दिहल गइल बा)*`
      : `🗺️ **आजीविका रोडमैप कार्ड: ${pName}**\n\n` +
        `• **लक्ष्य रोल:** ${topPathway.role}\n` +
        `• **अवधि:** ${topPathway.duration} (NSQF लेवल ${topPathway.nsqf})\n` +
        `• **संभावित आय:** ₹8,000 से ₹15,000 प्रति माह\n\n` +
        `**3 मुख्य सीखने के चरण:**\n` +
        `1️⃣ **${stage1[0]}** (${stage1[2]}): ${stage1[1]}\n` +
        `2️⃣ **${stage2[0]}** (${stage2[2]}): ${stage2[1]}\n` +
        `3️⃣ **${stage3[0]}** (${stage3[2]}): ${stage3[1]}\n\n` +
        `*(डैशबोर्ड पर आपका व्यक्तिगत रोडमैप खोला जा रहा है)*`;

    const spokenReply = isEnglish
      ? `Here is your Roadmap Card for ${topPathway.name}. Your target role is ${topPathway.role}. The course duration is ${topPathway.duration} at NSQF Level ${topPathway.nsqf}. The three steps are: First, ${stage1[0]}. Second, ${stage2[0]}. Third, ${stage3[0]}. You can earn ₹8,000 to ₹15,000 monthly. I am opening your roadmap now.`
      : isBhojpuri
      ? `रउआ रोडमैप कार्ड: रउआ खातिर मुख्य मार्ग ${pName} बा। रउआ ${topPathway.role} बन सकेनी। एकर अवधि ${topPathway.duration} बा। एकर तीन गो चरण बा: पहिला, ${stage1[0]}। दूसरा, ${stage2[0]}। अउर तीसरा, ${stage3[0]}। रउआ ₹8,000 से ₹15,000 हर महीना कमा सकेनी।`
      : `आपके लिए रोडमैप कार्ड: आपकी योग्यता के अनुसार आपका शीर्ष करियर मार्ग ${pName} है। इसमें आप ${topPathway.role} बन सकते हैं। अवधि ${topPathway.duration} और एनएसक्यूएफ स्तर ${topPathway.nsqf} है। इसके तीन चरण हैं: पहला, ${stage1[0]}। दूसरा, ${stage2[0]}। और तीसरा, ${stage3[0]}। इससे आप ₹8,000 से ₹15,000 प्रति माह कमा सकते हैं।`;

    return {
      reply,
      spokenReply,
      targetView: 'dashboard',
      actionHighlight: 'roadmap-section',
      isCardReadout: true,
      cardType: 'roadmap',
    };
  }

  // -------------------------------------------------------------------------
  // 3. CARD READING INTENT: JOBS / NAUKARI CARD (नौकरी कार्ड पढ़ के बताओ)
  // -------------------------------------------------------------------------
  const isJobQuery =
    query.includes('naukri') ||
    query.includes('naukari') ||
    query.includes('नौकरी') ||
    query.includes('job') ||
    query.includes('jobs') ||
    query.includes('रोजगार') ||
    query.includes('kam') ||
    query.includes('kaam') ||
    query.includes('काम') ||
    query.includes('vacancy') ||
    query.includes('salary') ||
    query.includes('vetan') ||
    query.includes('अवसर');

  if (isJobQuery) {
    // Check if user is asking to read a specific job card or general jobs
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
      const reply = `💼 **नौकरी कार्ड: ${specificJob.title}**\n\n` +
        `• **संस्था/कंपनी:** ${specificJob.org}\n` +
        `• **मासिक वेतन:** ${specificJob.pay}\n` +
        `• **स्थान:** ${specificJob.loc} (${specificJob.km === 0 ? 'स्थानीय' : specificJob.km + ' किमी दूर'})\n` +
        `• **योग्यता:** ${specificJob.eligibility}\n` +
        `• **ज़रूरी दस्तावेज़:** ${(specificJob.documentsRequired || ['आधार कार्ड']).join(', ')}\n` +
        `• **संपर्क विवरण:** ${specificJob.contactInfo || 'ब्लॉक/जिला कौशल सहायता केंद्र'}\n\n` +
        `*(रोजगार सूची खोली जा रही है)*`;

      const spokenReply = isEnglish
        ? `Here is the Job Card for ${specificJob.title} at ${specificJob.org}. Salary is ${specificJob.pay}. Location: ${specificJob.loc}. Eligibility: ${specificJob.eligibility}. Documents required: ${(specificJob.documentsRequired || ['Aadhaar Card']).join(', ')}. Contact: ${specificJob.contactInfo}. Opening jobs page.`
        : `नौकरी कार्ड विवरण: पद है ${specificJob.title}, संस्था है ${specificJob.org}। वेतन ${specificJob.pay} है। स्थान ${specificJob.loc} है। योग्यता: ${specificJob.eligibility}। ज़रूरी दस्तावेज़: ${(specificJob.documentsRequired || ['आधार कार्ड']).join(', ')}। आप इसपर आवेदन कर सकते हैं।`;

      return {
        reply,
        spokenReply,
        targetView: 'opportunities',
        actionHighlight: 'opportunities-section',
        isCardReadout: true,
        cardType: 'job',
      };
    }

    // General jobs readout
    const topJobs = rankedOpportunities.filter((j) => j.type === 'Job').slice(0, 3);
    const j1 = topJobs[0] || JOBS[0];
    const j2 = topJobs[1] || JOBS[1];
    const j3 = topJobs[2] || JOBS[3];

    const reply = isEnglish
      ? `💼 **Nearby Matched Job Cards for Your Profile:**\n\n` +
        `1️⃣ **${j1.title}** (${j1.org})\n` +
        `   • Pay: ${j1.pay} | Location: ${j1.loc} (${j1.km} km)\n` +
        `   • Requirements: ${j1.eligibility}\n\n` +
        `2️⃣ **${j2.title}** (${j2.org})\n` +
        `   • Pay: ${j2.pay} | Location: ${j2.loc} (${j2.km} km)\n\n` +
        `3️⃣ **${j3.title}** (${j3.org})\n` +
        `   • Pay: ${j3.pay} | Location: ${j3.loc}\n\n` +
        `*(Navigating to full Opportunities page)*`
      : isBhojpuri
      ? `💼 **रउआ खातिर मुख्य नौकरी कार्ड:**\n\n` +
        `1️⃣ **${j1.title}** (${j1.org})\n` +
        `   • वेतन: ${j1.pay} | स्थान: ${j1.loc} (${j1.km} किमी)\n` +
        `   • योग्यता: ${j1.eligibility}\n\n` +
        `2️⃣ **${j2.title}** (${j2.org})\n` +
        `   • वेतन: ${j2.pay} | स्थान: ${j2.loc}\n\n` +
        `3️⃣ **${j3.title}** (${j3.org})\n` +
        `   • वेतन: ${j3.pay}\n\n` +
        `*(नौकरी पेज खोलल जा रहल बा)*`
      : `💼 **आपके प्रोफाइल के अनुसार शीर्ष नौकरी कार्ड:**\n\n` +
        `1️⃣ **${j1.title}** (${j1.org})\n` +
        `   • वेतन: ${j1.pay} | स्थान: ${j1.loc} (${j1.km} किमी)\n` +
        `   • पात्रता: ${j1.eligibility}\n\n` +
        `2️⃣ **${j2.title}** (${j2.org})\n` +
        `   • वेतन: ${j2.pay} | स्थान: ${j2.loc}\n\n` +
        `3️⃣ **${j3.title}** (${j3.org})\n` +
        `   • वेतन: ${j3.pay} | स्थान: ${j3.loc}\n\n` +
        `*(रोजगार अवसर पेज खोला जा रहा है)*`;

    const spokenReply = isEnglish
      ? `Here are top jobs near you: First, ${j1.title} at ${j1.org}, salary ${j1.pay}, location ${j1.loc}. Second, ${j2.title}, salary ${j2.pay}. Third, ${j3.title}. Opening your jobs page now.`
      : isBhojpuri
      ? `रउआ खातिर नौकरी कार्ड: पहिला बा ${j1.title}, वेतन ${j1.pay}, जगह ${j1.loc} बा। दूसरा बा ${j2.title}, वेतन ${j2.pay}। अउर तीसरा बा ${j3.title}। हम रोजगार पेज खोलत बानी।`
      : `आपके नजदीकी नौकरी कार्ड: पहली है ${j1.title}, वेतन ${j1.pay}, स्थान ${j1.loc}। दूसरी है ${j2.title}, वेतन ${j2.pay}। और तीसरी है ${j3.title}। मैं रोजगार पेज खोल रहा हूँ।`;

    return {
      reply,
      spokenReply,
      targetView: 'opportunities',
      actionHighlight: 'opportunities-section',
      isCardReadout: true,
      cardType: 'job',
    };
  }

  // -------------------------------------------------------------------------
  // 4. CARD READING INTENT: SKILLS & SKILL-GAP CARD (कौशल कार्ड पढ़ के बताओ)
  // -------------------------------------------------------------------------
  const isSkillQuery =
    query.includes('skill') ||
    query.includes('skills') ||
    query.includes('कौशल') ||
    query.includes('हुनर') ||
    query.includes('hunar') ||
    query.includes('gap') ||
    query.includes('अंतर') ||
    query.includes('antar') ||
    query.includes('seekhna') ||
    query.includes('sikhna') ||
    query.includes('सीखना') ||
    query.includes('योग्यता');

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

    const displayMatched = matchedSkills.length > 0 ? matchedSkills.join(', ') : 'बुनियादी बातचीत, फोन का उपयोग';
    const displayGap = gapSkills.length > 0 ? gapSkills.slice(0, 3).join(', ') : 'व्यावसायिक उपकरण संचालन, डिजिटल फॉर्म';

    const reply = isEnglish
      ? `⚡ **Skill-Gap Analysis Card: ${topPathway.name}**\n\n` +
        `• **Skills You Already Have:** ${displayMatched}\n` +
        `• **Skills You Need to Learn (Gap):** ${displayGap}\n` +
        `• **Readiness Score:** 85% Fit\n` +
        `• **Bridge Solution:** 2 to 3 months NSQF Level ${topPathway.nsqf} course under PMKVY or RSETI with free certification.\n\n` +
        `*(Navigating to Skill-Gap view)*`
      : `⚡ **कौशल अंतर (Skill-Gap) कार्ड: ${topPathway.hi || topPathway.name}**\n\n` +
        `• **आपके पास पहले से मौजूद कौशल:** ${displayMatched}\n` +
        `• **जो कौशल आपको सीखने हैं (गैप):** ${displayGap}\n` +
        `• **तैयारी स्कोर:** 85% मैच\n` +
        `• **समाधान:** PMKVY या RSETI से 2 से 3 महीने का निःशुल्क कोर्स करके सरकारी सर्टिफिकेट प्राप्त करें।\n\n` +
        `*(कौशल अंतर विश्लेषण पेज खोला जा रहा है)*`;

    const spokenReply = isEnglish
      ? `Here is your Skill-Gap Card: You currently have skills in ${displayMatched}. To succeed in ${topPathway.name}, you need to learn ${displayGap}. Your readiness fit score is 85%. You can learn this free through PMKVY or RSETI training.`
      : `कौशल कार्ड विश्लेषण: आपके पास वर्तमान में ${displayMatched} कौशल हैं। ${topPathway.hi || topPathway.name} के लिए आपको ${displayGap} सीखने की आवश्यकता है। आपकी तैयारी 85% है। आप PMKVY या RSETI प्रशिक्षण से यह आसानी से सीख सकते हैं।`;

    return {
      reply,
      spokenReply,
      targetView: 'skill-gap',
      isCardReadout: true,
      cardType: 'skill',
    };
  }

  // -------------------------------------------------------------------------
  // 5. CARD READING INTENT: TRAINING / PRASHIKSHAN CARD (ट्रेनिंग कार्ड बताओ)
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
    query.includes('coaching') ||
    query.includes('course') ||
    query.includes('कोर्स');

  if (isTrainingQuery) {
    const trainingJobs = JOBS.filter((j) => j.type === 'Training');
    const t1 = trainingJobs[0] || JOBS[7];
    const t2 = trainingJobs[1] || JOBS[8];

    const reply = isEnglish
      ? `🎓 **Government Skill Training Centers Card:**\n\n` +
        `1️⃣ **${t1.title}**\n` +
        `   • Center: ${t1.org}\n` +
        `   • Location: ${t1.loc} (${t1.km} km)\n` +
        `   • Benefit: ${t1.pay}\n` +
        `   • Eligibility: ${t1.eligibility}\n\n` +
        `2️⃣ **${t2.title}**\n` +
        `   • Center: ${t2.org}\n` +
        `   • Location: ${t2.loc} (${t2.km} km)\n` +
        `   • Benefit: ${t2.pay}\n` +
        `   • Eligibility: ${t2.eligibility}\n\n` +
        `*(Navigating to Training page)*`
      : `🎓 **निःशुल्क सरकारी कौशल प्रशिक्षण केंद्र कार्ड:**\n\n` +
        `1️⃣ **${t1.title}**\n` +
        `   • केंद्र: ${t1.org}\n` +
        `   • स्थान: ${t1.loc} (${t1.km} किमी)\n` +
        `   • लाभ: ${t1.pay}\n` +
        `   • पात्रता: ${t1.eligibility}\n\n` +
        `2️⃣ **${t2.title}**\n` +
        `   • केंद्र: ${t2.org}\n` +
        `   • स्थान: ${t2.loc} (${t2.km} किमी)\n` +
        `   • लाभ: ${t2.pay}\n` +
        `   • पात्रता: ${t2.eligibility}\n\n` +
        `*(प्रशिक्षण केंद्र पेज खोला जा रहा है)*`;

    const spokenReply = isEnglish
      ? `Here are top free training centers: First, ${t1.title} at ${t1.loc}, offering government-sponsored training and stipend. Second, ${t2.title} at ${t2.loc}, offering free residential training and toolkit. Opening training page.`
      : `सरकारी प्रशिक्षण केंद्र कार्ड: पहला है ${t1.title}, स्थान ${t1.loc}, यहाँ निःशुल्क प्रशिक्षण और वजीफा मिलता है। दूसरा है ${t2.title}, स्थान ${t2.loc}, यहाँ फ्री हॉस्टल और टूलकिट मिलती है। मैं ट्रेनिंग केंद्र खोल रहा हूँ।`;

    return {
      reply,
      spokenReply,
      targetView: 'training',
      isCardReadout: true,
      cardType: 'training',
    };
  }

  // -------------------------------------------------------------------------
  // 6. CARD READING INTENT: GOVERNMENT SCHEMES / YOJANA CARD (योजना कार्ड बताओ)
  // -------------------------------------------------------------------------
  const isSchemeQuery =
    query.includes('yojana') ||
    query.includes('योजना') ||
    query.includes('scheme') ||
    query.includes('schemes') ||
    query.includes('sarkari') ||
    query.includes('सरकारी') ||
    query.includes('vishwakarma') ||
    query.includes('विश्वकर्मा') ||
    query.includes('mudra') ||
    query.includes('मुद्रा') ||
    query.includes('subsidy') ||
    query.includes('loan') ||
    query.includes('ऋण');

  if (isSchemeQuery) {
    const reply = isEnglish
      ? `🏛️ **Government Welfare & Livelihood Schemes Card:**\n\n` +
        `1️⃣ **PM Vishwakarma Yojana**\n` +
        `   • For artisans, tailors, electricians, carpenters\n` +
        `   • Benefits: ₹15,000 free modern toolkit + collateral-free loans up to ₹3 Lakh at 5% interest.\n\n` +
        `2️⃣ **Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)**\n` +
        `   • 100% Free NSQF accredited vocational skilling with government stipend & placement assistance.\n\n` +
        `3️⃣ **PM Mudra Yojana & PMEGP**\n` +
        `   • Business startup loans from ₹50,000 up to ₹10 Lakh with 15-35% capital subsidy for rural citizens.\n\n` +
        `*(You can find more scheme details in the Help & FAQ section)*`
      : `🏛️ **प्रमुख सरकारी आजीविका एवं स्वरोजगार योजनाएँ कार्ड:**\n\n` +
        `1️⃣ **पीएम विश्वकर्मा योजना (PM Vishwakarma):**\n` +
        `   • दर्जी, बढ़ई, इलेक्ट्रीशियन व 18 पारंपरिक कारीगरों के लिए।\n` +
        `   • लाभ: ₹15,000 की निःशुल्क टूलकिट ग्रांट + 5% ब्याज पर ₹3 लाख तक का आसान लोन।\n\n` +
        `2️⃣ **प्रधानमंत्री कौशल विकास योजना (PMKVY 4.0):**\n` +
        `   • 300+ आधुनिक ट्रेडों में 100% मुफ्त ट्रेनिंग, सरकार द्वारा मान्यता प्राप्त NSQF सर्टिफिकेट और वजीफा।\n\n` +
        `3️⃣ **पीएम मुद्रा योजना (PM Mudra Loan) व PMEGP:**\n` +
        `   • अपनी दुकान, डिजिटल सेवा केंद्र या सिलाई इकाई शुरू करने के लिए ₹50,000 से ₹10 लाख तक लोन और 15-35% सरकारी सब्सिडी।\n\n` +
        `*(अधिक जानकारी सहायता व FAQ अनुभाग में उपलब्ध है)*`;

    const spokenReply = isEnglish
      ? `Here are top government schemes: First, PM Vishwakarma Yojana offers ₹15,000 free toolkit grant and low-interest loans. Second, PMKVY provides free vocational training and certified NSQF certificates. Third, PM Mudra Yojana offers business loans from ₹50,000 to ₹10 Lakh.`
      : `सरकारी योजना कार्ड: पहली है पीएम विश्वकर्मा योजना, जिसमें ₹15,000 की मुफ्त टूलकिट और ₹3 लाख तक आसान ऋण मिलता है। दूसरी है पीएमकेवीवाई, जिसमें 100% मुफ्त ट्रेनिंग और सर्टिफिकेट मिलता है। तीसरी है मुद्रा योजना, जिससे अपनी दुकान या काम शुरू करने के लिए लोन मिलता है।`;

    return {
      reply,
      spokenReply,
      targetView: 'faq',
      isCardReadout: true,
      cardType: 'scheme',
    };
  }

  // -------------------------------------------------------------------------
  // 7. CURRENT SCREEN CONTEXT: "YEH CARD PADHO" / "READ THIS CARD"
  // -------------------------------------------------------------------------
  if (query.includes('iss card') || query.includes('is card') || query.includes('yeh card') || query.includes('ye card') || query.includes('read this card') || query.includes('card padho')) {
    if (currentView === 'dashboard') {
      return processLocalAssistantQuery('roadmap card padho', currentView, currentLang, userProfile);
    } else if (currentView === 'opportunities') {
      return processLocalAssistantQuery('job card padho', currentView, currentLang, userProfile);
    } else if (currentView === 'training') {
      return processLocalAssistantQuery('training card padho', currentView, currentLang, userProfile);
    } else if (currentView === 'skill-gap') {
      return processLocalAssistantQuery('skill card padho', currentView, currentLang, userProfile);
    }
  }

  // -------------------------------------------------------------------------
  // 8. PAGE NAVIGATION INTENTS (हिंदी और अंग्रेजी में नेविगेशन)
  // -------------------------------------------------------------------------
  if (
    query.includes('open roadmap') ||
    query.includes('go to roadmap') ||
    query.includes('show roadmap') ||
    query.includes('open dashboard') ||
    query.includes('go to dashboard') ||
    query.includes('रोडमैप दिखाओ') ||
    query.includes('रोडमैप खोलो') ||
    query.includes('डैशबोर्ड खोलो') ||
    query.includes('डैशबोर्ड पर जाओ') ||
    query.includes('roadmap par jao') ||
    query.includes('roadmap kholo') ||
    query.includes('roadmap dikhao')
  ) {
    const text = isEnglish
      ? 'Opening your personalized livelihood roadmap on the dashboard now.'
      : isBhojpuri
      ? 'रउआ खातिर डैशबोर्ड पर व्यक्तिगत रोडमैप खोलल जा रहल बा।'
      : 'जी, आपका व्यक्तिगत आजीविका रोडमैप खोला जा रहा है।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'dashboard',
      actionHighlight: 'roadmap-section',
      isCardReadout: false,
    };
  }

  if (
    query.includes('open jobs') ||
    query.includes('show jobs') ||
    query.includes('find jobs') ||
    query.includes('open opportunities') ||
    query.includes('नौकरी दिखाओ') ||
    query.includes('नौकरी खोलो') ||
    query.includes('रोजगार दिखाओ') ||
    query.includes('काम दिखाओ') ||
    query.includes('naukri dikhao') ||
    query.includes('jobs kholo') ||
    query.includes('kaam dikhao')
  ) {
    const text = isEnglish
      ? 'Navigating to matched livelihood and employment opportunities.'
      : isBhojpuri
      ? 'रउआ लगे के सभ नौकरी अउर रोजगार अवसर खोलल जा रहल बा।'
      : 'जी, आपके नजदीकी रोजगार और नौकरी के अवसर खोले जा रहे हैं।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'opportunities',
      actionHighlight: 'opportunities-section',
      isCardReadout: false,
    };
  }

  if (
    query.includes('open training') ||
    query.includes('show training') ||
    query.includes('training centers') ||
    query.includes('प्रशिक्षण केंद्र दिखाओ') ||
    query.includes('ट्रेनिंग खोलो') ||
    query.includes('कौशल केंद्र दिखाओ') ||
    query.includes('training kholo') ||
    query.includes('prashikshan dikhao')
  ) {
    const text = isEnglish
      ? 'Showing government PMKVY and RSETI vocational training centers near you.'
      : isBhojpuri
      ? 'रउआ लगे के PMKVY अउर RSETI कौशल प्रशिक्षण केंद्र देखावल जा रहल बा।'
      : 'जी, आपके नजदीकी PMKVY और RSETI कौशल प्रशिक्षण केंद्र खोले जा रहे हैं।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'training',
      isCardReadout: false,
    };
  }

  if (
    query.includes('open profile') ||
    query.includes('show profile') ||
    query.includes('edit profile') ||
    query.includes('my profile') ||
    query.includes('प्रोफ़ाइल खोलो') ||
    query.includes('प्रोफाइल दिखाओ') ||
    query.includes('मेरी जानकारी') ||
    query.includes('profile kholo') ||
    query.includes('profile dikhao')
  ) {
    const text = isEnglish
      ? 'Opening your beneficiary profile for review or editing.'
      : isBhojpuri
      ? 'रउआ प्रोफ़ाइल खोल दिहल गइल बा।'
      : 'जी, आपकी लाभार्थी प्रोफ़ाइल खोली जा रही है।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'profile',
      isCardReadout: false,
    };
  }

  if (
    query.includes('go home') ||
    query.includes('home page') ||
    query.includes('start assessment') ||
    query.includes('retake assessment') ||
    query.includes('start over') ||
    query.includes('होम पेज पर जाओ') ||
    query.includes('मुख्य पृष्ठ') ||
    query.includes('शुरू से शुरू करो') ||
    query.includes('मूल्यांकन शुरू करो') ||
    query.includes('home par jao') ||
    query.includes('shuru se shuru')
  ) {
    const text = isEnglish
      ? 'Navigating to the home page where you can start a new voice assessment.'
      : isBhojpuri
      ? 'मुख्य पृष्ठ पर ले जाइल जा रहल बा जहाँ से रउआ नया आवाज़ मूल्यांकन शुरू कर सकेनी।'
      : 'जी, मुख्य पृष्ठ खोला जा रहा है जहाँ से आप नया आवाज़ मूल्यांकन शुरू कर सकते हैं।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'home',
      isCardReadout: false,
    };
  }

  if (
    query.includes('saved') ||
    query.includes('shortlist') ||
    query.includes('bookmarks') ||
    query.includes('सहेजे गए') ||
    query.includes('सेव की हुई नौकरी') ||
    query.includes('saved jobs')
  ) {
    const text = isEnglish
      ? 'Opening your saved and shortlisted livelihood opportunities.'
      : 'जी, आपके द्वारा सहेजे गए (शॉर्टलिस्ट किए गए) अवसर खोले जा रहे हैं।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'saved',
      isCardReadout: false,
    };
  }

  if (
    query.includes('help') ||
    query.includes('faq') ||
    query.includes('support') ||
    query.includes('मदद') ||
    query.includes('सहायता') ||
    query.includes('सवाल') ||
    query.includes('help kholo')
  ) {
    const text = isEnglish
      ? 'Opening the Help, FAQ and Platform Guidelines section.'
      : 'जी, सहायता और अक्सर पूछे जाने वाले प्रश्न (FAQ) खोले जा रहे हैं।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'faq',
      isCardReadout: false,
    };
  }

  if (
    query.includes('history') ||
    query.includes('इतिहास') ||
    query.includes('purana record') ||
    query.includes('पुराना रिकॉर्ड')
  ) {
    const text = isEnglish
      ? 'Opening your past assessment history.'
      : 'जी, आपके पिछले मूल्यांकनों का इतिहास खोला जा रहा है।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'history',
      isCardReadout: false,
    };
  }

  if (
    query.includes('notification') ||
    query.includes('notifications') ||
    query.includes('अलर्ट') ||
    query.includes('सूचना') ||
    query.includes('alert settings')
  ) {
    const text = isEnglish
      ? 'Opening notification and alert preferences.'
      : 'जी, सूचना और अलर्ट सेटिंग्स खोली जा रही हैं।';
    return {
      reply: text,
      spokenReply: text,
      targetView: 'notifications',
      isCardReadout: false,
    };
  }

  // -------------------------------------------------------------------------
  // 9. PROFILE UPDATES EXTRACTION BY VOICE
  // -------------------------------------------------------------------------
  const updates: Partial<BeneficiaryProfile> = {};
  if (query.includes('mera naam ') || query.includes('hamaar naam ') || query.includes('my name is ')) {
    const match = rawQuery.match(/(?:mera naam|hamaar naam|my name is)\s+([a-zA-Z\u0900-\u097F\s]+)/i);
    if (match && match[1]) {
      updates.name = match[1].trim();
    }
  }
  if (query.includes('10th') || query.includes('दसवीं') || query.includes('10वीं') || query.includes('matric')) {
    updates.education = '10th pass (Secondary)';
  } else if (query.includes('12th') || query.includes('बारहवीं') || query.includes('12वीं') || query.includes('inter')) {
    updates.education = '12th pass (Higher Secondary)';
  } else if (query.includes('graduate') || query.includes('स्नातक') || query.includes('ba') || query.includes('b.a') || query.includes('degree')) {
    updates.education = 'Graduate';
  } else if (query.includes('iti') || query.includes('diploma') || query.includes('आईटीआई')) {
    updates.education = 'ITI / Diploma';
  }

  if (Object.keys(updates).length > 0) {
    const text = isEnglish
      ? `Profile updated successfully with: ${JSON.stringify(updates).replace(/["{}]/g, '')}`
      : `आपकी प्रोफ़ाइल में जानकारी अपडेट कर दी गई है: ${updates.name ? 'नाम: ' + updates.name : ''} ${updates.education ? 'शिक्षा: ' + updates.education : ''}`;
    return {
      reply: text,
      spokenReply: text,
      targetView: 'profile',
      profileUpdates: updates,
      isCardReadout: false,
    };
  }

  // -------------------------------------------------------------------------
  // 10. DEFAULT FRIENDLY FALLBACK WITH SMART SUGGESTIONS
  // -------------------------------------------------------------------------
  const fallbackReply = isEnglish
    ? `I heard: "${rawQuery}". You can ask me to read your Roadmap Card, Job Cards, or Training Cards aloud, or say "Open Jobs", "Open Roadmap", or "Edit Profile" to navigate instantly!`
    : isBhojpuri
    ? `हम रउआ बात सुन लीहले बानी: "${rawQuery}"। रउआ हमरा से कह सकेनी "रोडमैप कार्ड पढ़ के बताओ", "नौकरी कार्ड बताओ", या "प्रशिक्षण केंद्र खोलो", हम रउआ के सब पढ़ के सुनाइब अउर पेज पर ले जाइब!`
    : `मैंने सुना: "${rawQuery}"। आप मुझसे "रोडमैप कार्ड पढ़ के बताओ", "नौकरी कार्ड बताओ", या "कौशल (Skills) कार्ड पढ़ो" कह सकते हैं, मैं आपको पूरा कार्ड बोलकर समझाऊंगा और पेज भी खोल दूंगा!`;

  return {
    reply: fallbackReply,
    spokenReply: fallbackReply,
    targetView: null,
    isCardReadout: false,
  };
}
