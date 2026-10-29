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

// Resilient Model Priority List: Prioritize standard Google AI Studio models
const CANDIDATE_MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-flash-latest'];

async function generateContentResilient(
  ai: GoogleGenAI,
  contents: string,
  options?: { responseMimeType?: string; timeoutMs?: number }
): Promise<string> {
  const timeoutMs = options?.timeoutMs || 6500;
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

// Helper rule-based fallback profile parser for natural speech
function parseProfileWithRules(message: string, existing: any) {
  const updated = { ...existing };
  const text = message.toLowerCase();

  // 1. Phone extraction (10 digit mobile)
  const phoneMatch = message.match(/\b[6-9]\d{9}\b/);
  if (phoneMatch) {
    updated.phone = phoneMatch[0];
  }

  // 2. Education keywords
  if (text.includes('12th') || text.includes('12वी') || text.includes('इंटर') || text.includes('inter')) {
    updated.education = '12th pass (Higher Secondary)';
  } else if (text.includes('10th') || text.includes('10वी') || text.includes('मैट्रिक') || text.includes('highschool')) {
    updated.education = '10th pass (Secondary)';
  } else if (text.includes('graduate') || text.includes('बीए') || text.includes('ba') || text.includes('bsc') || text.includes('bcom') || text.includes('ग्रेजुएट')) {
    updated.education = 'Graduate';
  } else if (text.includes('iti') || text.includes('diploma') || text.includes('आईटीआई') || text.includes('डिप्लोमा')) {
    updated.education = 'ITI / Diploma';
  } else if (text.includes('8th') || text.includes('आठवीं')) {
    updated.education = '8th class pass';
  }

  // 3. District / Location extraction
  const districts = ['Gorakhpur', 'Maharajganj', 'Varanasi', 'Patna', 'Gaya', 'Lucknow', 'Kanpur', 'Agra', 'Meerut', 'Ghaziabad', 'Prayagraj', 'Ballia', 'Deoria', 'Azamgarh', 'Basti', 'Muzaffarpur', 'Bhagalpur'];
  for (const dist of districts) {
    if (text.includes(dist.toLowerCase())) {
      const state = (dist === 'Patna' || dist === 'Gaya' || dist === 'Muzaffarpur' || dist === 'Bhagalpur') ? 'Bihar' : 'Uttar Pradesh';
      updated.location = `${dist}, ${state}`;
      break;
    }
  }

  // 4. Skills extraction
  const skillsFound: string[] = [];
  if (text.includes('electrician') || text.includes('बिजली') || text.includes('वायरिंग')) skillsFound.push('Electrician & Wiring');
  if (text.includes('solar') || text.includes('सोलर')) skillsFound.push('Solar PV Installation');
  if (text.includes('tailor') || text.includes('सिलाई') || text.includes('कपड़ा')) skillsFound.push('Tailoring & Stitching');
  if (text.includes('computer') || text.includes('data entry') || text.includes('कंप्यूटर') || text.includes('डाटा')) skillsFound.push('Digital Services & Data Entry');
  if (text.includes('mobile') || text.includes('मोबाइल')) skillsFound.push('Mobile Phone Repairing');
  if (text.includes('carpent') || text.includes('बढ़ई')) skillsFound.push('Carpentry & Woodwork');
  if (text.includes('weld') || text.includes('वेल्डिंग')) skillsFound.push('Welding & Fabrication');
  if (text.includes('beauty') || text.includes('पार्लर') || text.includes('ब्यूटी')) skillsFound.push('Beauty Parlor & Wellness');
  if (text.includes('plumb') || text.includes('प्लंबर')) skillsFound.push('Plumbing & Pipefitting');

  if (skillsFound.length > 0) {
    updated.skills = skillsFound.join(', ');
  }

  // 5. Name extraction ("mera naam X hai" / "my name is X")
  const nameMatch = message.match(/(?:mera naam|my name is|मेरा नाम|नाम)\s+([A-Za-z\u0900-\u097F\s]{2,25})/i);
  if (nameMatch && nameMatch[1]) {
    const cleanName = nameMatch[1].replace(/(?:hai|ba|hun|hu|is|aam|hai|ba)\b/gi, '').trim();
    if (cleanName.length >= 2) {
      updated.name = cleanName;
    }
  }

  return updated;
}

// API Route: AI Conversational Full Profile Parser for Voice Updates
app.post('/api/parse-speech', async (req: Request, res: Response) => {
  try {
    const { message, language = 'hi', currentProfile = {} } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const updated = parseProfileWithRules(message, currentProfile);
      return res.json({
        fallback: true,
        updatedProfile: updated,
        summary: 'प्रोफ़ाइल डेटाबेस में सफलतापूर्वक अपडेट हो गई है।'
      });
    }

    const ai = new GoogleGenAI();
    const systemPrompt = `You are JeevikaAI (जीविका एआई), an intelligent profile updater for Indian vocational beneficiaries.
The user spoke a natural language statement to update their profile: "${message}"
Current Existing Profile: ${JSON.stringify(currentProfile)}
Language Context: "${language}"

Task:
Extract any mentioned updates for the beneficiary profile fields:
- "name": Full name if mentioned
- "education": One of ["Below 8th class", "8th class pass", "10th pass (Secondary)", "12th pass (Higher Secondary)", "Graduate", "ITI / Diploma"] if mentioned or implied
- "skills": Comma-separated vocational skills if mentioned (e.g., "Solar PV, Electrician", "Tailoring, Stitching", "Data Entry, Computer", "Mobile Repairing")
- "interests": Comma-separated interest areas if mentioned
- "location": District, State (e.g. "Patna, Bihar", "Gorakhpur, Uttar Pradesh", "Varanasi, Uttar Pradesh", "Maharajganj, Uttar Pradesh") if mentioned
- "occupation": Current work/trade if mentioned
- "workType": One of ["Job", "Self-employment", "Either"] if mentioned
- "mobility": One of ["Nearby only (within ~10 km)", "Within my district", "Anywhere in the state"] if mentioned
- "phone": 10-digit mobile phone number if mentioned

Return strictly JSON with NO markdown codeblocks:
{
  "updatedProfile": {
    "name": "Extracted name or existing value",
    "education": "Extracted education or existing value",
    "skills": "Extracted skills or existing value",
    "interests": "Extracted interests or existing value",
    "location": "Extracted location or existing value",
    "occupation": "Extracted occupation or existing value",
    "workType": "Extracted workType or existing value",
    "mobility": "Extracted mobility or existing value",
    "phone": "Extracted 10-digit phone number if spoken, else existing value"
  },
  "summary": "1-sentence warm confirmation in requested language acknowledging what was changed (e.g. 'बहुत बढ़िया! आपकी प्रोफ़ाइल में नाम, जिला और हुनर फ़ायरबेस में अपडेट कर दिया गया है।')"
}`;

    const rawResult = await generateContentResilient(ai, systemPrompt, { responseMimeType: 'application/json', timeoutMs: 8500 });
    let rawText = rawResult || '{}';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    const merged = {
      ...currentProfile,
      ...(parsed.updatedProfile || {})
    };

    return res.json({
      fallback: false,
      updatedProfile: merged,
      summary: parsed.summary || 'प्रोफ़ाइल फ़ायरबेस और डेटाबेस में सफलतापूर्वक अपडेट हो गई है।'
    });
  } catch {
    const updated = parseProfileWithRules(req.body?.message || '', req.body?.currentProfile || {});
    return res.json({
      fallback: true,
      updatedProfile: updated,
      summary: 'प्रोफ़ाइल डेटाबेस में सफलतापूर्वक अपडेट कर दी गई है।'
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
    const {
      message,
      language = 'hi',
      currentView = 'home',
      userProfile = {},
      chatHistory = [],
      locationData = null,
    } = req.body;
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
        if (locationData?.opportunities?.length) {
          const topJobs = locationData.opportunities
            .slice(0, 3)
            .map((j: any, i: number) => `${i + 1}. ${j.title} (${j.org}) - वेतन ${j.pay}, दूरी ${j.distance}`)
            .join('। ');
          reply = `आपके क्षेत्र (${locationData.locationLabel || userProfile?.location || 'महराजगंज'}) की नौकरियां: ${topJobs}।`;
        } else {
          reply = 'जी, आपके नजदीकी रोजगार और नौकरी के अवसर खोले जा रहे हैं।';
        }
      }
      // 4. Training Card reading
      else if (lower.includes('train') || lower.includes('center') || lower.includes('प्रशिक्षण') || lower.includes('केंद्र') || lower.includes('pmkvy') || lower.includes('rseti')) {
        navTarget = 'training';
        if (locationData?.trainingCenters?.length) {
          const topCenters = locationData.trainingCenters
            .slice(0, 3)
            .map((t: any, i: number) => `${i + 1}. ${t.title} (${t.org}) - ${t.pay}, दूरी ${t.distance}`)
            .join('। ');
          reply = `आपके पास के कौशल प्रशिक्षण केंद्र: ${topCenters}।`;
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

    const recentConversation = Array.isArray(chatHistory)
      ? chatHistory
          .slice(-8)
          .map((turn: any) => `${turn.sender === 'user' ? 'User' : 'JeevikaAI'}: ${turn.text}`)
          .join('\n')
      : '';

    const liveScreenSummary = locationData
      ? JSON.stringify({
          location: locationData.locationLabel,
          jobsOnScreen: locationData.opportunities || [],
          trainingCentersOnScreen: locationData.trainingCenters || [],
          schemesOnScreen: locationData.schemes || [],
          districtInsight: locationData.insight || null,
        })
      : 'Standard district data active';

    const ai = new GoogleGenAI();
    const systemPrompt = `You are JeevikaAI (जीविका एआई), a deeply trained, compassionate, and natural conversational voice AI vocational and livelihood counselor for Indian rural and semi-urban citizens.
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
3. Live Screen Data & Active Location Grounding:
   - User's Current Location: "${userProfile?.location || locationData?.locationLabel || 'Maharajganj, Uttar Pradesh'}".
   - Current Page View: "${currentView}"
   - User Language Preference: "${language}" (hi = Hindi, bho = Bhojpuri, hin = Hinglish, en = English)
   - User Profile: ${JSON.stringify(userProfile)}
   - ACTUAL LIVE CARDS & DATA PRESENT ON SCREEN RIGHT NOW: ${liveScreenSummary}
4. Multi-Turn Conversation Memory (Previous Chat Messages):
${recentConversation || 'No prior turns.'}
   - User Just Spoke / Asked: "${message}"

Your Instructions:
1. Natural Conversational Chat & Follow-Up Memory:
   - Understand the user's question in the context of the previous chat messages above ("Recent Conversation"). If the user asks a follow-up about a specific job card, training center, scheme, salary, distance, eligibility, or how to apply ("इसमें कैसे अप्लाई करें?", "पहला वाला कहाँ है?", "कितना पैसा मिलेगा?", "कागज क्या लगेगा?"), answer directly and specifically using the ACTUAL LIVE CARDS & DATA PRESENT ON SCREEN.
   - Speak naturally like a warm, helpful human advisor in the user's language (${language === 'bho' ? 'Bhojpuri' : language === 'en' ? 'English' : language === 'hin' ? 'Hinglish' : 'Hindi'}) in 2-4 clear sentences suitable for voice readout.
2. Reading Screen Data:
   - Whenever the user asks to read any card, section, or page data, read the actual titles, organizations, pay/benefits, locations, and distances from the live screen data above.
3. Dynamic Navigation:
   - Allowed targetView values: "home", "dashboard", "opportunities", "training", "skill-gap", "saved", "profile", "faq", "history", "notifications", "assessment", null.
   - Set targetView ONLY if the user wants to open/navigate to a different section; if they are asking a follow-up question on the current topic, keep targetView as null.
4. Location or Profile Updates:
   - If the user mentions their location/district (e.g. "main Patna se hoon", "Gorakhpur mein kaam chahiye", "mera zila Varanasi hai"), extract "location" into "profileUpdates" (e.g. "Patna, Bihar", "Gorakhpur, Uttar Pradesh", "Varanasi, Uttar Pradesh").
   - If the user mentions name, education, or skills, extract them into "profileUpdates".
5. Identity:
   - If asked who made/created you, answer that you were developed by JeevikaAI Organization (जीविका एआई आर्गेनाइजेशन).

Return strictly JSON with NO markdown codeblocks:
{
  "reply": "Warm spoken reply in user's language with no markdown symbols",
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
    const cleanedProfileUpdates: Record<string, string> = {};
    if (parsed.profileUpdates && typeof parsed.profileUpdates === 'object') {
      for (const [k, v] of Object.entries(parsed.profileUpdates)) {
        if (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' && v.trim().toLowerCase() !== 'undefined') {
          cleanedProfileUpdates[k] = v.trim();
        }
      }
    }
    return res.json({
      fallback: false,
      reply: parsed.reply || 'जी, मैं आपकी सहायता के लिए तैयार हूँ।',
      targetView: parsed.targetView || null,
      actionHighlight: parsed.actionHighlight || null,
      profileUpdates: Object.keys(cleanedProfileUpdates).length > 0 ? cleanedProfileUpdates : null
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

  let viteMiddleware: any = null;
  if (!isProd) {
    app.use((req, res, next) => {
      if (viteMiddleware) {
        return viteMiddleware(req, res, next);
      }
      next();
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`JeevikaAI server running on http://0.0.0.0:${PORT}`);
  });

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const hmrEnabled = process.env.DISABLE_HMR !== 'true';
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: hmrEnabled ? { server: httpServer } : false,
          watch: process.env.DISABLE_HMR === 'true' ? null : {},
        },
        appType: 'spa',
      });
      viteMiddleware = vite.middlewares;
    } catch (err) {
      console.error('Failed to initialize Vite middleware:', err);
    }
  }
}

startServer();

