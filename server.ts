import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Helper for timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('AI extraction timeout')), timeoutMs)
    ),
  ]);
}

// Resilient Model Priority List: Prioritize standard Google AI Studio models (gemini-3.8-flash, gemini-3.1-flash-lite, gemini-flash-latest)
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

async function generateContentResilient(
  ai: GoogleGenAI,
  contents: string,
  options?: { responseMimeType?: string; timeoutMs?: number }
): Promise<string> {
  const timeoutMs = options?.timeoutMs || 8500;
  const config = options?.responseMimeType ? { responseMimeType: options.responseMimeType } : undefined;

  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents,
        config,
      });
      const response = await withTimeout(generatePromise, timeoutMs);
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const isQuotaOrRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota') ||
        err?.message?.includes('Quota exceeded');
      if (isQuotaOrRateLimit) {
        continue;
      }
      continue;
    }
  }
  throw lastError || new Error('All models exhausted');
}

// API Route: AI Conversational Profile Extraction & Guidance
app.post('/api/extract-profile', async (req: Request, res: Response) => {
  try {
    const { message, language = 'hi', currentStep = 'general', existingProfile = {}, stepQuestion = '' } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        fallback: true,
        message: 'GEMINI_API_KEY not configured, utilizing Indic client rule-engine.'
      });
    }

    const ai = new GoogleGenAI();

    const systemPrompt = `You are JeevikaAI (जीविका एआई), an empathetic and natural livelihood & skill guide for rural and semi-urban Indian youth and workers.
The user speaks in Hindi, Bhojpuri, Hinglish, or English.
Current Context:
- Step Key: "${currentStep}"
- Current Question Asked: "${stepQuestion}"
- Preferred Language: "${language}" (hi = Hindi, bho = Bhojpuri, hin = Hinglish, en = English)
- Current Profile Data So Far: ${JSON.stringify(existingProfile)}
- User Just Said: "${message}"

Your Task:
1. Interpret intent and extract the clean, relevant value for this field.
2. Standardize choice options:
   - For 'education': Map to one of ["Below 8th class", "8th class pass", "10th pass (Secondary)", "12th pass (Higher Secondary)", "Graduate", "ITI / Diploma"].
   - For 'workType': Map to ["Job", "Self-employment", "Either"].
   - For 'mobility': Map to ["Nearby only (within ~10 km)", "Within my district", "Anywhere in the state"].
3. Determine confidence (0.0 to 1.0). If the answer is completely off-topic or ambiguous, confidence should be below 0.6 and needsClarification should be true.
4. For intro step ("intro"): If user said "haan", "ji", "yes", "shuru karein", "theek ba", recognize intent as "start_affirmative".
5. Produce a warm, encouraging, short 1-sentence acknowledgment in the user's spoken dialect (e.g. Hindi, Bhojpuri, or English).
6. Return ONLY a valid JSON object matching this schema without any markdown formatting around it:
{
  "recognizedIntent": "start_affirmative" | "start_negative" | "education" | "skills" | "interests" | "occupation" | "location" | "workType" | "mobility" | "unclear",
  "cleanValue": "Normalized string for this field",
  "confidence": 0.95,
  "needsClarification": false,
  "clarificationQuestion": "Friendly clarification if confidence is low, else empty string",
  "acknowledgment": "Short 1-sentence natural warm acknowledgment in the user's dialect (e.g. 'Achha, baarahvi pass. Bahut badhiya!')",
  "suggestedNextTopic": "Next field"
}`;

    const rawResult = await generateContentResilient(ai, systemPrompt, { responseMimeType: 'application/json', timeoutMs: 8500 });

    let rawText = rawResult || '{}';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    return res.json({
      fallback: false,
      result: parsed
    });
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.message?.includes('Quota exceeded') || error?.message?.includes('RESOURCE_EXHAUSTED');
    if (!isRateLimit) {
      console.warn('Gemini extraction fallback triggered:', error?.message || 'internal');
    }
    return res.json({
      fallback: true,
      error: 'Using resilient Indic rule engine'
    });
  }
});

// API Route: Generate Readback Summary Aloud
app.post('/api/generate-readback', async (req: Request, res: Response) => {
  try {
    const { profile, language = 'hi' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({ fallback: true });
    }

    const ai = new GoogleGenAI();
    const prompt = `Generate a concise, natural, warm 2-sentence verbal summary read-back for this beneficiary in ${language === 'bho' ? 'Bhojpuri' : language === 'en' ? 'English' : 'simple conversational Hindi'}:
Profile:
- Name: ${profile?.name || 'Not specified'}
- Education: ${profile?.education || 'Not specified'}
- Skills: ${profile?.skills || 'Not specified'}
- Interests: ${profile?.interests || 'Not specified'}
- Location: ${profile?.location || 'Not specified'}
- Work Preference: ${profile?.workType || 'Not specified'}

Format requirements:
- Natural spoken cadence suitable for Text-to-Speech (TTS).
- End with asking if this information is correct so we can generate their livelihood roadmap.
- Return ONLY plain text with no quotes, markdown, or JSON.`;

    const readbackResult = await generateContentResilient(ai, prompt, { timeoutMs: 8500 });

    return res.json({
      fallback: false,
      readbackText: readbackResult.trim()
    });
  } catch {
    return res.json({ fallback: true });
  }
});

// API Route: AI Profile Analysis & Career Roadmap Synthesis
app.post('/api/analyze-profile', async (req: Request, res: Response) => {
  try {
    const { profile, language = 'hi' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        fallback: true,
        analysis: {
          summary: 'प्रोफ़ाइल का विश्लेषण सफलतापूर्वक पूरा हुआ। आपकी योग्यता और प्राथमिकताओं के अनुसार रोडमैप तैयार है।',
          topCareerPathway: profile?.interests?.toLowerCase().includes('digital') ? 'Digital Services' : 'Local Livelihood Services',
          readinessScore: 88,
          keyStrengths: [profile?.skills || 'बुनियादी कौशल', 'स्थानीय उपलब्धता']
        }
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `Analyze this Indian rural/semi-urban citizen profile for NSQF livelihood alignment:
Profile:
- Name: ${profile?.name || 'Beneficiary'}
- Education: ${profile?.education || 'Not specified'}
- Existing Skills: ${profile?.skills || 'Not specified'}
- Interests: ${profile?.interests || 'Not specified'}
- Occupation: ${profile?.occupation || 'None'}
- Location: ${profile?.location || 'Rural/Semi-urban area'}
- Work Preference: ${profile?.workType || 'Job'}
- Mobility: ${profile?.mobility || 'Nearby'}

Language: ${language === 'bho' ? 'Bhojpuri' : language === 'en' ? 'English' : 'Hindi'}

Return strictly JSON with no markdown formatting:
{
  "summary": "1-2 sentence warm encouraging summary in the requested language",
  "topCareerPathway": "Best matching pathway e.g. Digital Services, Retail Operations, Tailoring & Crafts, Solar Installation",
  "readinessScore": 85,
  "keyStrengths": ["Strength 1", "Strength 2"]
}`;

    const rawResult = await generateContentResilient(ai, prompt, { responseMimeType: 'application/json', timeoutMs: 8500 });
    let rawText = rawResult || '{}';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(rawText);

    return res.json({
      fallback: false,
      analysis: parsed
    });
  } catch {
    return res.json({
      fallback: true,
      analysis: {
        summary: 'प्रोफ़ाइल का विश्लेषण सफलतापूर्वक पूरा हुआ। आपका व्यक्तिगत रोडमैप तैयार है।',
        topCareerPathway: 'Digital & Local Livelihood Services',
        readinessScore: 85,
        keyStrengths: ['कौशल रुचि', 'स्थानीय रोजगार तत्परता']
      }
    });
  }
});

// API Route: Floating Voice AI Assistant & Site Navigation Proxy
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, language = 'hi', currentView = 'home', userProfile = {} } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const lower = message.toLowerCase();
      let navTarget: string | null = null;
      let highlight: string | null = null;
      let reply = 'नमस्ते! मैं जीविका एआई वॉइस असिस्टेंट हूँ। आप मुझसे नौकरी, रोडमैप, या कौशल कार्ड पढ़ने के लिए कह सकते हैं।';

      // 1. Creator query
      if (lower.includes('banaya') || lower.includes('created') || lower.includes('maker') || lower.includes('developer') || lower.includes('किसने बनाया') || lower.includes('कोन बनइले')) {
        reply = 'मुझे JeevikaAI Organization (जीविका एआई आर्गेनाइजेशन) द्वारा बनाया गया है ताकि हर नागरिक अपनी भाषा में आजीविका और कौशल की सही दिशा पा सके।';
      }
      // 2. Roadmap Card reading
      else if (lower.includes('roadmap') || lower.includes('रोडमैप') || lower.includes('डैशबोर्ड')) {
        navTarget = 'dashboard';
        highlight = 'roadmap-section';
        if (lower.includes('padh') || lower.includes('card') || lower.includes('कार्ड') || lower.includes('batao') || lower.includes('read') || lower.includes('step')) {
          reply = 'आजीविका रोडमैप कार्ड: आपके लिए डिजिटल सेवाएँ और स्थानीय रोजगार सबसे उपयुक्त मार्ग है। इसमें 3 चरण हैं: 1. कंप्यूटर व फोन की बुनियादी समझ, 2. ऑनलाइन सेवाएँ व बिलिंग का अभ्यास, 3. नजदीकी सेवा काउंटर या जॉब के लिए आवेदन। आप ₹8,000 से ₹15,000 प्रति माह कमा सकते हैं।';
        } else {
          reply = 'जी, आपका व्यक्तिगत आजीविका रोडमैप डैशबोर्ड खोला जा रहा है।';
        }
      }
      // 3. Job / Naukari Card reading
      else if (lower.includes('job') || lower.includes('kaam') || lower.includes('नौकरी') || lower.includes('रोजगार') || lower.includes('naukri')) {
        navTarget = 'opportunities';
        highlight = 'opportunities-section';
        if (lower.includes('padh') || lower.includes('card') || lower.includes('कार्ड') || lower.includes('batao') || lower.includes('read') || lower.includes('first') || lower.includes('salary') || lower.includes('solar')) {
          reply = 'नौकरी कार्ड विवरण: 1. डिजिटल सर्विस असिस्टेंट (CSC केंद्र) - वेतन ₹8,000 से ₹12,000, 10वीं पास आवश्यक। 2. सोलर इंस्टॉलेशन हेल्पर - वेतन ₹9,000 से ₹14,000। 3. रिटेल सेल्स एसोसिएट - वेतन ₹7,000 से ₹10,000। रोजगार सूची खोली जा रही है।';
        } else {
          reply = 'जी, आपके नजदीकी रोजगार और नौकरी के अवसर खोले जा रहे हैं।';
        }
      }
      // 4. Training Card reading
      else if (lower.includes('train') || lower.includes('center') || lower.includes('प्रशिक्षण') || lower.includes('केंद्र') || lower.includes('pmkvy') || lower.includes('rseti')) {
        navTarget = 'training';
        if (lower.includes('padh') || lower.includes('card') || lower.includes('कार्ड') || lower.includes('batao') || lower.includes('read')) {
          reply = 'कौशल प्रशिक्षण केंद्र कार्ड: 1. PMKVY डिजिटल साक्षरता व डाटा एंट्री केंद्र, महराजगंज - निःशुल्क ट्रेनिंग व सरकारी वजीफा। 2. RSETI सिलाई मशीन व स्वरोजगार केंद्र, गोरखपुर - फ्री आवासीय कोर्स व टूलकिट। प्रशिक्षण केंद्र खोले जा रहे हैं।';
        } else {
          reply = 'आपके पास के PMKVY और RSETI कौशल प्रशिक्षण केंद्र दिखाए जा रहे हैं।';
        }
      }
      // 5. Skills & Skill-gap card reading
      else if (lower.includes('gap') || lower.includes('skill') || lower.includes('कौशल') || lower.includes('हुनर')) {
        navTarget = 'skill-gap';
        reply = 'कौशल कार्ड विश्लेषण: आपके वर्तमान कौशलों के आधार पर आपकी तैयारी 85% है। उन्नत कार्य के लिए आपको डिजिटल बिलिंग और उपकरण संचालन का अभ्यास करना होगा। कौशल अंतर पेज खोला जा रहा है।';
      }
      // 6. Government Schemes
      else if (lower.includes('yojana') || lower.includes('योजना') || lower.includes('scheme') || lower.includes('vishwakarma') || lower.includes('mudra')) {
        navTarget = 'faq';
        reply = 'सरकारी योजना कार्ड: 1. PM विश्वकर्मा योजना - ₹15,000 टूलकिट ग्रांट व ₹3 लाख तक रियायती लोन। 2. PMKVY 4.0 - फ्री वोकेशनल ट्रेनिंग व सर्टिफिकेट। 3. PM मुद्रा योजना - ₹50,000 से ₹10 लाख तक व्यवसाय लोन।';
      }
      // 7. Profile navigation
      else if (lower.includes('profile') || lower.includes('नाम') || lower.includes('प्रोफाइल')) {
        navTarget = 'profile';
        reply = 'आपकी प्रोफाइल खोली जा रही है।';
      }
      // 8. Help / FAQ navigation
      else if (lower.includes('help') || lower.includes('faq') || lower.includes('मदद') || lower.includes('सवाल')) {
        navTarget = 'faq';
        reply = 'सहायता और प्रश्नोत्तर अनुभाग खोला जा रहा है।';
      }
      // 9. Saved / Shortlist navigation
      else if (lower.includes('saved') || lower.includes('सहेजे') || lower.includes('shortlist')) {
        navTarget = 'saved';
        reply = 'आपके सहेजे गए अवसर दिखाए जा रहे हैं।';
      }
      // 10. Home navigation
      else if (lower.includes('home') || lower.includes('होम') || lower.includes('start') || lower.includes('शुरू')) {
        navTarget = 'home';
        reply = 'मुख्य पृष्ठ खोला जा रहा है जहाँ से आप नया मूल्यांकन शुरू कर सकते हैं।';
      }
      // 11. Settings navigation
      else if (lower.includes('setting') || lower.includes('seting') || lower.includes('सेटिंग') || lower.includes('alert') || lower.includes('notification')) {
        navTarget = 'notifications';
        reply = 'ऐप सेटिंग्स और सूचना प्राथमिकताएं खोली जा रही हैं। (Opening Settings)';
      }
      // 12. Assessment navigation
      else if (lower.includes('assessment') || lower.includes('मूल्यांकन') || lower.includes('test')) {
        navTarget = 'assessment';
        reply = 'आवाज़ द्वारा आजीविका मूल्यांकन शुरू किया जा रहा है। (Starting Assessment)';
      }

      return res.json({
        fallback: true,
        reply,
        targetView: navTarget,
        actionHighlight: highlight
      });
    }

    const ai = new GoogleGenAI();
    const systemPrompt = `You are JeevikaAI (जीविका एआई), a deeply trained, compassionate, and highly knowledgeable voice AI vocational and livelihood counselor for Indian rural and semi-urban citizens.
You have comprehensive mastery of:
1. Indian Vocational Ecosystem & NSQF (National Skills Qualification Framework):
   - NSQF Levels 1-5 (Helper to Skilled Technician to Supervisor).
   - Practical sectors: Solar PV & Green Energy, Digital Seva & Data Entry, Retail & Mandi Operations, Tailoring & Boutique Garment Craft, Electrician & Home Appliances, Mobile Phone Repair, Food Processing & Dairy SHGs.
2. Indian Government Livelihood & Credit Schemes:
   - PM Vishwakarma: 18 traditional artisan trades (carpenters, blacksmiths, tailors, cobblers, potters, etc.). 5-7 days basic training + ₹500/day stipend, ₹15,000 e-voucher toolkit grant, up to ₹3 lakh subsidized credit (₹1L first tranche, ₹2L second tranche at 5% interest with 8% subvention).
   - PMKVY 4.0 (Skill India Digital Hub): Free government certification, on-the-job training (OJT) stipends, zero fee.
   - PM Mudra Yojana: Shishu (up to ₹50k), Kishore (₹50k to ₹5L), Tarun (₹5L to ₹10L) collateral-free loans.
   - PMEGP: 15-35% capital subsidy for manufacturing/services micro-units.
   - RSETI (Rural Self Employment Training Institute): Run by lead banks (SBI, PNB, Canara, Union Bank) in every district; 100% FREE residential courses with food, lodging, practical skills and bank credit linkage.
   - State Schemes: UP ODOP & Mukhyamantri Yuva Swarojgar; Bihar Mukhyamantri Udyami Yojana (₹10L project: ₹5L 100% grant + ₹5L 1% loan); MP Udyam Kranti; Rajasthan Yuva Sambal.
3. Realistic District-Level Wages & Economic Realities:
   - Entry digital assistant / data entry: ₹8,000 - ₹13,500/month.
   - Solar rooftop helper / installer: ₹9,500 - ₹16,000/month.
   - Retail sales & counter billing: ₹7,500 - ₹12,000/month.
   - Boutique tailor & self-help group stitching: ₹6,000 - ₹15,000/month.
4. Active Location Grounding:
   - User's Current Location: "${userProfile?.location || 'Maharajganj, Uttar Pradesh'}".
   - Current Page View: "${currentView}"
   - User Language Preference: "${language}" (hi = Hindi, bho = Bhojpuri, hin = Hinglish, en = English)
   - User Profile: ${JSON.stringify(userProfile)}
   - User Spoke: "${message}"

Your Instructions:
1. Conversational Reply:
   - Provide a natural, encouraging 2-3 sentence spoken reply in the user's language (${language === 'bho' ? 'Bhojpuri' : language === 'en' ? 'English' : language === 'hin' ? 'Hinglish' : 'Hindi'}).
   - Ground your answer in the user's location and profile. If they ask about jobs, training, or schemes in their area, provide actual details relevant to their district/state.
2. Card Reading / Explanation:
   - "Roadmap Card" / "रोडमैप": Explain career stages, NSQF level, duration, and monthly earning range. Target: "dashboard".
   - "Job / Naukari Card" / "नौकरी": Read specific job role, employer type, salary, and requirements. Target: "opportunities".
   - "Training / Kendra Card" / "ट्रेनिंग": Read PMKVY, RSETI, or ITI centers with free benefits. Target: "training".
   - "Yojana Card" / "योजना": Read PM Vishwakarma, Mudra, or State Udyami scheme grants and loan limits. Target: "faq".
3. Dynamic Navigation:
   - Allowed targetView values: "home", "dashboard", "opportunities", "training", "skill-gap", "saved", "profile", "faq", "history", "notifications", "assessment", null.
   - If user asks to go to dashboard or roadmap ("go to dashboard", "open dashboard", "dashboard") -> "dashboard".
   - If user asks for settings ("open settings", "go to settings", "settings") -> "notifications".
4. Location or Profile Updates:
   - If the user mentions their location/district (e.g. "main Patna se hoon", "Gorakhpur mein kaam chahiye", "mera zila Varanasi hai"), extract "location" into "profileUpdates" (e.g. "Patna, Bihar", "Gorakhpur, Uttar Pradesh", "Varanasi, Uttar Pradesh").
   - If the user mentions name, education, or skills, extract them into "profileUpdates".
5. Identity:
   - If asked who made/created you, answer that you were developed by JeevikaAI Organization (जीविका एआई आर्गेनाइजेशन).

Return strictly JSON with NO markdown codeblocks:
{
  "reply": "Warm spoken reply in user's language",
  "targetView": "opportunities" | "training" | "dashboard" | "skill-gap" | "saved" | "profile" | "faq" | "home" | "notifications" | "assessment" | null,
  "actionHighlight": "opportunities-section" | "roadmap-section" | "training-section" | null,
  "profileUpdates": {
    "location": "District, State if mentioned",
    "name": "Name if mentioned",
    "education": "Education level if mentioned",
    "skills": "Skills if mentioned"
  }
}`;

    const rawResult = await generateContentResilient(ai, systemPrompt, { responseMimeType: 'application/json', timeoutMs: 8500 });
    let rawText = rawResult || '{}';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    return res.json({
      fallback: false,
      reply: parsed.reply || 'जी, मैं आपकी सहायता के लिए तैयार हूँ।',
      targetView: parsed.targetView || null,
      actionHighlight: parsed.actionHighlight || null,
      profileUpdates: parsed.profileUpdates && Object.keys(parsed.profileUpdates).length ? parsed.profileUpdates : null
    });
  } catch (error: any) {
    return res.json({
      fallback: true,
      reply: 'जी, मैं आपकी सहायता के लिए तैयार हूँ। आप नौकरी, प्रशिक्षण केंद्र या अपने रोडमैप के बारे में पूछ सकते हैं।',
      targetView: null
    });
  }
});

// API Route: Live AI Location Intelligence & Livelihood Data Generator
app.post('/api/generate-location-data', async (req: Request, res: Response) => {
  try {
    const { location, district = '', state = '', language = 'hi', existingProfile = {} } = req.body;
    const targetLoc = location || `${district}, ${state}` || 'Maharajganj, Uttar Pradesh';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        fallback: true,
        message: 'GEMINI_API_KEY not configured, utilizing curated district database.'
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are the Live Location Livelihood Data Engine for JeevikaAI in India.
Target Location: "${targetLoc}" (District: "${district}", State: "${state}")
Language for text descriptions: ${language === 'bho' ? 'Bhojpuri & Hindi' : language === 'en' ? 'English' : 'Hindi'}
User Profile Context: ${JSON.stringify(existingProfile)}

Generate accurate, realistic, ground-level livelihood intelligence for this Indian location.
Requirements:
1. "insight": Economic profile for this district/area:
   - district: District name
   - state: State name
   - economicHub: Major local industries/trades (e.g. Handloom, Agro Mandi, Solar, Logistics, Brassware)
   - topSectors: 4 high-demand sectors in this district
   - averageMonthlyWage: Realistic local monthly salary range in INR (e.g. "₹9,500 - ₹16,000")
   - activeSchemesCount: number between 6 and 12
   - openVacanciesCount: realistic number between 30 and 95
   - verifiedCentersCount: number between 3 and 8
   - summary: 1-2 sentence overview of vocational potential in this district in Hindi or English
2. "opportunities": Array of 4 realistic job or self-employment opportunities situated in or near this district:
   - id: Unique string like "loc-j1"
   - title: Job or enterprise title (e.g. "Solar PV Helper", "CSC Digital Seva Assistant", "Retail Counter Executive", "Boutique Tailoring Unit")
   - org: Realistic local employer, cooperative, or agency
   - type: "Job" | "Self-employment"
   - loc: Landmark or town in this district
   - km: Estimated km distance (0 to 30)
   - pay: Monthly pay in INR (e.g. "₹9,000 to ₹14,000 per month")
   - path: matching pathway id ("digital" | "solar" | "tailoring" | "retail")
   - verified: boolean (true)
   - source: e.g. "District Employment Exchange" | "Skill India Mission" | "Local Trade Cluster"
   - lastVerifiedDate: "October 2026"
   - eligibility: Brief education & skill requirements
   - documentsRequired: Array of 2-3 standard documents like ["Aadhaar Card", "10th Marksheet"]
   - contactInfo: Address or desk in that district
3. "trainingCenters": Array of 2-3 verified skill centers in this district:
   - id: Unique string like "loc-t1"
   - title: e.g. "Govt ITI [District]", "RSETI [Lead Bank] [District]", "PMKVY Kaushal Kendra"
   - org: Operating body
   - type: "Training"
   - loc: Actual locality or road in this district
   - km: Estimated km distance (2 to 20)
   - pay: "100% Free Government Course + Certificate + Stipend/Toolkit"
   - path: "digital" | "solar" | "tailoring" | "retail"
   - verified: true
   - source: "NCVT / Skill India Digital" | "MoRD RSETI"
   - lastVerifiedDate: "October 2026"
   - eligibility: Age and education criteria
   - documentsRequired: ["Aadhaar Card", "Bank Passbook", "Education Proof"]
   - contactInfo: Campus desk / director office
4. "schemes": Array of 3 active government schemes applicable in this state and district:
   - id: Unique string
   - name: English scheme name (e.g. "PM Vishwakarma", State Udyami Scheme, "PM Mudra")
   - hiName: Hindi scheme name
   - benefit: Exact grant, loan, and toolkit benefits
   - eligibility: Who can apply
   - applyOffice: CSC center or local DIC office in this district
   - category: "central" | "state" | "toolkit" | "loan"
   - financialSupport: Specific rupee benefit summary

Return ONLY valid JSON matching this structure without markdown formatting:
{
  "district": "${district || 'District'}",
  "state": "${state || 'State'}",
  "insight": { ... },
  "opportunities": [ ... ],
  "trainingCenters": [ ... ],
  "schemes": [ ... ]
}`;

    const rawResult = await generateContentResilient(ai, prompt, { responseMimeType: 'application/json', timeoutMs: 15000 });
    let rawText = rawResult || '{}';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    return res.json({
      fallback: false,
      result: parsed
    });
  } catch (error: any) {
    const isRateLimit =
      error?.message?.includes('429') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('quota') ||
      error?.message?.includes('Quota exceeded');
    if (!isRateLimit) {
      console.warn('Location data generated via curated fallback engine:', error?.message || 'timeout');
    }
    return res.json({
      fallback: true,
      error: 'Using verified curated district dataset'
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JeevikaAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
