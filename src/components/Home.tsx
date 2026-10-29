import React, { useState } from 'react';
import { Icon } from './Icons';
import { DEMO, PATHWAYS } from '../data/mockData';
import { evaluatePathway, rankJobs } from '../services/recommendationEngine';
import { AppView, SupportedLanguage } from '../types';
import { PWAInstallStatusButton } from './PWAInstallStatusButton';
import { HeroCarousel } from './HeroCarousel';
import { SkillTrainingGallery } from './SkillTrainingGallery';
import { LocalBusinessShowcase } from './LocalBusinessShowcase';

interface HomeProps {
  go: (view: AppView | string, sectionId?: string) => void;
  onLoadDemo: () => void;
  onStartVoiceAssessment?: (lang: SupportedLanguage) => void;
  onOpenAccount?: (mode: 'create' | 'login') => void;
  currentLang?: SupportedLanguage;
  hasProfile?: boolean;
  onNotify?: (msg: string) => void;
  userName?: string;
  userPhone?: string;
  userLocation?: string;
}

export const Home: React.FC<HomeProps> = ({
  go,
  onLoadDemo,
  onStartVoiceAssessment,
  onOpenAccount,
  currentLang = 'hi',
  hasProfile = false,
  onNotify = () => {},
  userName,
  userPhone,
  userLocation,
}) => {
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  const previewPaths = PATHWAYS.map((p) => evaluatePathway(p, DEMO)).sort((a, b) => b.score - a.score);
  const previewJobs = rankJobs(DEMO, previewPaths).slice(0, 3);

  const handleStartVoice = () => {
    if (onStartVoiceAssessment) {
      onStartVoiceAssessment(currentLang);
    } else {
      go('assessment');
    }
  };

  const pillars = [
    {
      icon: 'mic',
      color: 'bg-[#17365D]/10 text-[#17365D]',
      title: 'ऑटोमैटिक बोलकर संवाद (Automatic Spoken Dialogue)',
      desc: 'फॉर्म भरने का कोई झंझट नहीं। JeevikaAI वॉयस असिस्टेंट हिंदी, भोजपुरी और अंग्रेजी में प्रश्न पूछकर स्वचालित रूप से अगला कदम दिखाता है।',
      tags: ['Voice-First', 'हिंदी + भोजपुरी', 'कीबोर्ड विकल्प उपलब्ध']
    },
    {
      icon: 'layers',
      color: 'bg-[#287D73]/15 text-[#287D73]',
      title: 'NSQF संरेखित कौशल रोडमैप (NSQF-Aligned Roadmaps)',
      desc: 'पारदर्शी स्कोरिंग एल्गोरिदम आपके मौजूदा हुनर का मूल्यांकन करके राष्ट्रीय कौशल योग्यता ढाँचे (NSQF लेवल 3-4) से जोड़ता है।',
      tags: ['पारदर्शी स्कोर', 'NSQF लेवल 3-4', 'चरणबद्ध लक्ष्य']
    },
    {
      icon: 'pin',
      color: 'bg-[#D9822B]/15 text-[#D9822B]',
      title: 'प्रमाणित स्थानीय अवसर (Verified Local Opportunities)',
      desc: 'आपको सरकारी पीएमकेवीवाई (PMKVY) केंद्रों, आरसेटी (RSETI) और आसपास के ग्रामीण उद्यमियों से जोड़ता है।',
      tags: ['आसपास (≤10 किमी)', 'जिला केंद्र (≤40 किमी)', 'पारदर्शी वेतन']
    }
  ];

  const faqs = [
    {
      q: 'क्या JeevikaAI का उपयोग करने के लिए पढ़े-लिखे होना या फॉर्म भरना जरूरी है?',
      a: 'बिल्कुल नहीं! JeevikaAI को विशेष रूप से प्रथम-बार डिजिटल उपयोगकर्ताओं के लिए बनाया गया है। आप हिंदी या भोजपुरी में केवल बोलकर अपना हुनर बता सकते हैं। हर जानकारी बोलकर भी सुनाई जाती है।'
    },
    {
      q: 'मेरी आवाज़ की गोपनीयता कैसे सुरक्षित रहती है?',
      a: 'आपकी आवाज़ का उपयोग केवल तत्काल हुनर मूल्यांकन और प्रोफ़ाइल बनाने के लिए किया जाता है। कोई भी व्यक्तिगत डेटा आपकी सहमति के बिना किसी तीसरे पक्ष को साझा नहीं किया जाता।'
    },
    {
      q: 'क्या यहाँ मिलने वाले ट्रेनिंग और जॉब्स प्रमाणित हैं?',
      a: 'हाँ, JeevikaAI पर सूचीबद्ध प्रशिक्षण केंद्र राष्ट्रीय कौशल विकास निगम (NSDP / PMKVY) और आरसेटी (RSETI) मानकों से संरेखित हैं। वेतन और दूरी पारदर्शी रूप से प्रदर्शित की जाती हैं।'
    },
    {
      q: 'क्या मैं बिना आवाज़ के केवल लिखकर भी इसका उपयोग कर सकता हूँ?',
      a: 'हाँ! यदि आप शोरगुल वाले स्थान पर हैं या लिखकर उपयोग करना चाहते हैं, तो कीबोर्ड से उत्तर देने का विकल्प सदैव उपलब्ध रहता है।'
    }
  ];

  return (
    <main className="bg-white min-h-screen">
      {/* 1. Top Featured Skill & Livelihood Banner Carousel (Directly under Header) */}
      <section className="bg-gradient-to-b from-[#17365D] to-[#245A91] border-b border-[#DCE3EA] py-3 sm:py-5">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <HeroCarousel go={go} />
        </div>
      </section>

      {/* 2. Main Hero Section (Prominent Voice Entry in Hindi/Bhojpuri & Usable Text Alternative) */}
      <section className="bg-white border-b border-[#DCE3EA] py-10 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Main Hero Copy & Action Gateway */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#F5F7FA] text-[#17365D] border border-[#DCE3EA] shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#287D73] animate-pulse" />
                <span>ग्रामीण हुनर व आजीविका सहायक · Voice-First Platform</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-[#17365D] tracking-tight leading-[1.18] font-['Bricolage_Grotesque']">
                <span>Your Skills.</span>{' '}
                <span className="text-[#245A91] block sm:inline">Your Language.</span>{' '}
                <span className="block text-[#17365D]">Your Livelihood.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#5F6B76] max-w-xl leading-relaxed">
                {currentLang === 'bho'
                  ? 'बिना कवनो फॉर्म भरले, हिंदी अउर भोजपुरी में आवाज से आपन हुनर बताईं। पावीं प्रमाणित ट्रेनिंग रोडमैप अउर पास के रोजगार अवसर।'
                  : 'बिना कोई फॉर्म भरे, अपनी भाषा (हिंदी या भोजपुरी) में बोलकर अपना हुनर बताएं। पाएं प्रमाणित कौशल ट्रेनिंग और आसपास के रोजगार अवसर।'}
              </p>

              {/* Action Buttons Gateway */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Primary CTA */}
                  <button
                    onClick={handleStartVoice}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#287D73] hover:bg-[#1E6058] text-white font-extrabold text-sm sm:text-base shadow-lg transition-all active:scale-95"
                  >
                    <Icon name="mic" size={20} />
                    <span>बोलकर शुरू करें (Start Voice)</span>
                  </button>

                  {/* Secondary CTA */}
                  <button
                    onClick={() => go('opportunities')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-[#17365D] hover:bg-[#17365D] hover:text-white bg-white text-[#17365D] font-extrabold text-xs sm:text-sm transition-all shadow-xs"
                  >
                    <span>नौकरी और ट्रेनिंग देखें</span>
                    <Icon name="arrowR" size={16} />
                  </button>

                  {hasProfile && (
                    <button
                      onClick={() => go('dashboard')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#17365D] hover:bg-[#245A91] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all"
                    >
                      <Icon name="route" size={16} />
                      <span>मेरा रोडमैप देखें</span>
                    </button>
                  )}
                </div>

                {/* Registered Login Link */}
                {onOpenAccount && (
                  <div className="text-xs pt-1">
                    <button
                      onClick={() => onOpenAccount('login')}
                      className="text-[#245A91] hover:underline font-bold"
                    >
                      पंजीकृत हैं? लॉगिन करें (Already registered? Log in)
                    </button>
                  </div>
                )}
              </div>

              {/* Install App Button */}
              <div className="pt-2">
                <PWAInstallStatusButton />
              </div>

              {/* Assurance Points */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-semibold text-[#5F6B76]">
                <div className="flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-[#287D73]" />
                  <span>निःशुल्क सेवा · रजिस्ट्रेशन की बाध्यता नहीं</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-[#287D73]" />
                  <span>कम पढ़े-लिखे नागरिकों हेतु ऑडियो सपोर्ट</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-[#287D73]" />
                  <span>ऑफ़लाइन क्षमता के साथ PWA ऐप</span>
                </div>
              </div>
            </div>

            {/* Right Sample / Personalized Skill-Roadmap Preview */}
            <div className="lg:col-span-5 relative">
              <div className="bg-[#F5F7FA] border border-[#DCE3EA] rounded-3xl p-6 shadow-md space-y-5">
                {/* Beneficiary Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#17365D] text-white flex items-center justify-center font-extrabold text-base font-['Bricolage_Grotesque'] shadow-xs">
                      S
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-[#17365D]">सुनीता देवी (Sunita Devi)</div>
                      <div className="text-xs text-[#5F6B76] flex items-center gap-1 font-medium">
                        <Icon name="pin" size={12} className="text-[#287D73]" /> महाराजगंज, उत्तर प्रदेश
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-[#FFF4DB] text-[#D9822B] border border-[#EBCB7A]">
                    Sample / Demo Roadmap
                  </span>
                </div>

                {/* Spoken Quote Bubble */}
                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE3EA] text-xs space-y-1 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-[#245A91] flex items-center gap-1">
                    <Icon name="mic" size={12} /> Recognized Spoken Input
                  </div>
                  <div className="font-bold text-[#202B36] italic">
                    “हम 10वीं पास बानी अउर गाँव के लगे कंप्यूटर काम सीखल चाहिला”
                  </div>
                </div>

                {/* Recommended Skill Pathways */}
                <div className="space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6B76]">
                    Top Matched Pathway
                  </div>
                  <div className="p-3.5 bg-white rounded-2xl border border-[#DCE3EA] flex items-center justify-between shadow-2xs">
                    {previewPaths && previewPaths.length > 0 && previewPaths[0] ? (
                      <>
                        <div>
                          <div className="font-extrabold text-sm text-[#17365D]">
                            {previewPaths[0].name}
                          </div>
                          <div className="text-xs text-[#5F6B76]">
                            {(previewPaths[0].duration || '').split(' (')[0]} · NSQF Level {previewPaths[0].nsqf}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-[#5F6B76]">Match: </span>
                          <span className="text-sm font-black text-[#287D73]">{previewPaths[0].score}%</span>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="font-extrabold text-sm text-[#17365D]">
                          डिजिटल सेवाएँ एवं सीएससी (Digital Services)
                        </div>
                        <div className="text-xs text-[#5F6B76]">
                          3 माह · NSQF Level 3
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nearby Livelihood Listings */}
                <div className="space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6B76]">
                    Local Openings Near You
                  </div>
                  <div className="space-y-1.5">
                    {previewJobs.map((j) => (
                      <div
                        key={j.id}
                        className="p-2.5 bg-white rounded-xl border border-[#DCE3EA] flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div>
                          <div className="font-bold text-[#17365D]">{j.title}</div>
                          <div className="text-[11px] text-[#5F6B76]">{j.loc} · {j.km} km</div>
                        </div>
                        <div className="font-extrabold text-[#287D73] text-[11px]">
                          {(j.pay || '').split(' per')[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Demo Launcher */}
                <button
                  onClick={onLoadDemo}
                  className="w-full py-2.5 rounded-xl border border-[#DCE3EA] bg-white hover:bg-slate-100 text-xs font-extrabold text-[#17365D] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Icon name="user" size={14} className="text-[#287D73]" />
                  <span>डेमो प्रोफ़ाइल देखें (Load Demo Roadmap)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How JeevikaAI Works & Methodology */}
      <section className="py-14 bg-[#F5F7FA] border-b border-[#DCE3EA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#245A91]/10 text-[#245A91] uppercase tracking-wider">
              Structured Methodology · कार्यप्रणाली
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#17365D] tracking-tight font-['Bricolage_Grotesque']">
              बोलकर सवाल से लेकर प्रमाणित रोज़गार तक
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6B76]">
              बिना किसी जटिल फॉर्म के सरल 4-चरणों में हुनर मार्गदर्शन प्राप्त करें।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              { n: '01', title: 'मौखिक हुनर संवाद', desc: 'हिंदी या भोजपुरी में 8 सरल प्रश्नों का उत्तर आवाज़ से दें।' },
              { n: '02', title: 'स्वचालित प्रोफ़ाइल निष्कर्षण', desc: 'बिना फॉर्म भरे शिक्षा, हुनर और यात्रा सीमा दर्ज हो जाती है।' },
              { n: '03', title: 'पारदर्शी NSQF स्कोरिंग', desc: 'राष्ट्रीय मानकों के अनुसार आपके हुनर का सटीक मिलान।' },
              { n: '04', title: 'स्थानीय अवसर जुड़ाव', desc: 'आसपास के पीएमकेवीवाई केंद्रों और रोजगार से जुड़ें।' },
            ].map((step) => (
              <div
                key={step.n}
                className="p-5 rounded-2xl bg-white border border-[#DCE3EA] space-y-2 shadow-sm"
              >
                <span className="font-['Bricolage_Grotesque'] text-2xl font-black text-[#287D73]">
                  {step.n}
                </span>
                <h4 className="font-extrabold text-sm text-[#17365D]">
                  {step.title}
                </h4>
                <p className="text-xs text-[#5F6B76] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Feature Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-sm space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.color}`}>
                  <Icon name={p.icon} size={20} />
                </div>
                <h3 className="text-base font-bold text-[#17365D]">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6B76] leading-relaxed">
                  {p.desc}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5F7FA] text-[#5F6B76] border border-[#DCE3EA]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Skill Training Categories Gallery */}
      <SkillTrainingGallery go={go} />

      {/* 5. Local Livelihood and Artisan Marketplace */}
      <LocalBusinessShowcase
        go={go}
        onNotify={onNotify || (() => {})}
        userName={userName}
        userPhone={userPhone}
        userLocation={userLocation}
      />

      {/* 6. Accessibility, Trust, Privacy & FAQ Section */}
      <section className="pt-12 pb-4 bg-[#F5F7FA] border-t border-[#DCE3EA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          {/* Trust, Privacy & Consent Transparency Box */}
          <div className="bg-white border border-[#DCE3EA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#287D73]/15 text-[#287D73] flex items-center justify-center font-bold flex-shrink-0">
                <Icon name="shieldCheck" size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#17365D]">
                  गोपनीयता, सहमति व पारदर्शिता प्रतिबद्धता (Trust &amp; Privacy)
                </h3>
                <p className="text-xs text-[#5F6B76]">
                  Transparent AI &amp; Privacy Principles for Rural Citizens
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs text-[#5F6B76] leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-[#DCE3EA] space-y-1">
                <div className="font-extrabold text-[#17365D] flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-[#287D73]" />
                  <span>आवाज़ डेटा सुरक्षा (Voice Privacy)</span>
                </div>
                <p>आपकी आवाज़ का उपयोग केवल हुनर मूल्यांकन के लिए होता है। कोई डेटा बेचा या अनधिकृत शेयर नहीं किया जाता।</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-[#DCE3EA] space-y-1">
                <div className="font-extrabold text-[#17365D] flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-[#287D73]" />
                  <span>स्वतंत्र प्लेटफॉर्म निष्पक्षता</span>
                </div>
                <p>JeevikaAI राष्ट्रीय मानकों (NSQF/PMKVY) से संरेखित एक स्वतंत्र आजीविका प्लेटफॉर्म है।</p>
              </div>
            </div>
          </div>

          {/* Interactive FAQ Accordion */}
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#17365D] font-['Bricolage_Grotesque']">
                अक्सर पूछे जाने वाले प्रश्न (Frequently Asked Questions)
              </h3>
              <p className="text-xs text-[#5F6B76]">
                नागरिकों द्वारा पूछे गए मुख्य सवाल और उनके उत्तर
              </p>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-[#DCE3EA] rounded-2xl overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left font-extrabold text-xs sm:text-sm text-[#17365D] flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <Icon
                        name="chev"
                        size={16}
                        className={`text-[#287D73] transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-[#5F6B76] leading-relaxed border-t border-[#DCE3EA]/60 bg-[#F5F7FA]/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
