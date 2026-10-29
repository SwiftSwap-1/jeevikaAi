import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Icon } from './Icons';

interface PWAInstallStatusButtonProps {
  className?: string;
}

export const PWAInstallStatusButton: React.FC<PWAInstallStatusButtonProps> = ({ className = '' }) => {
  const { isInstalled, isIOS, promptInstall, hasNativePrompt } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [installSuccessMessage, setInstallSuccessMessage] = useState(false);

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstallSuccessMessage(true);
      setTimeout(() => setInstallSuccessMessage(false), 4000);
    } else if (outcome === 'ios') {
      setShowIOSModal(true);
    } else if (outcome === 'unsupported' && !hasNativePrompt) {
      setShowManualModal(true);
    }
  };

  return (
    <div className={`w-full max-w-xl ${className}`}>
      {/* Device Check Result: If Already Installed */}
      {isInstalled ? (
        <div className="flex items-center gap-3 p-3 sm:p-3.5 bg-[#287D73]/10 border border-[#287D73]/30 rounded-xl text-left transition-all">
          <div className="w-9 h-9 rounded-lg bg-[#287D73] text-white flex items-center justify-center flex-none shadow-xs">
            <Icon name="check" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-bold text-[#17365D] flex items-center gap-2">
              <span>ऐप आपके डिवाइस पर इंस्टॉल है</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#287D73] text-white font-bold tracking-wide">
                INSTALLED
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-[#5F6B76] mt-0.5">
              JeevikaAI is installed on your device · ऑफलाइन व सीधे होम स्क्रीन से उपलब्ध
            </div>
          </div>
        </div>
      ) : (
        /* If Not Installed: Dedicated Install CTA */
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 bg-[#F5F7FA] border border-[#DCE3EA] hover:border-[#245A91]/50 rounded-xl transition-all">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#17365D] text-white flex items-center justify-center flex-none shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold text-[#17365D]">
                Install App on Your Phone
              </div>
              <div className="text-[11px] text-[#5F6B76]">
                फोन में ऐप इंस्टॉल करें · 1-क्लिक एक्सेस व कमजोर नेटवर्क में भी तेज
              </div>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#287D73] hover:bg-[#20635B] active:scale-95 text-white font-bold text-xs shadow-xs transition-all whitespace-nowrap"
            title="Download and install JeevikaAI on your device"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>ऐप इंस्टॉल करें (Install App)</span>
          </button>
        </div>
      )}

      {/* Success notification banner */}
      {installSuccessMessage && (
        <div className="mt-2 text-xs font-semibold text-[#287D73] flex items-center gap-1.5 p-2 bg-[#287D73]/10 rounded-lg">
          <Icon name="check" size={14} />
          <span>ऐप सफलतापूर्वक इंस्टॉल हो गया है! अब आप सीधे होमस्क्रीन से खोल सकते हैं।</span>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#DCE3EA] space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE3EA]">
              <h3 className="text-base font-bold text-[#17365D] flex items-center gap-2">
                <Icon name="device" size={18} className="text-[#245A91]" />
                <span>iPhone / iPad में इंस्टॉल करें</span>
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-7 h-7 rounded-full bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5F6B76] leading-relaxed">
              Safari ब्राउज़र में नीचे दिए गए 2 आसान चरणों में JeevikaAI को होम स्क्रीन पर जोड़ें:
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
                <div className="w-6 h-6 rounded-full bg-[#245A91] text-white flex items-center justify-center font-bold text-xs flex-none">
                  1
                </div>
                <div>
                  <div className="font-bold text-[#17365D]">Share (शेयर) बटन दबाएं</div>
                  <div className="text-[#5F6B76] mt-0.5">
                    Safari के नीचे मौजूद Share आइकन (चौकोर बॉक्स में ऊपर का तीर ⎋) पर टैप करें।
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
                <div className="w-6 h-6 rounded-full bg-[#245A91] text-white flex items-center justify-center font-bold text-xs flex-none">
                  2
                </div>
                <div>
                  <div className="font-bold text-[#17365D]">"Add to Home Screen" चुनें</div>
                  <div className="text-[#5F6B76] mt-0.5">
                    मेन्यू में नीचे स्क्रॉल करें और <strong>"Add to Home Screen (होम स्क्रीन में जोड़ें)"</strong> पर टैप करें।
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#245A91] text-white font-bold text-xs hover:bg-[#17365D] transition-colors"
            >
              समझ गए (Got it)
            </button>
          </div>
        </div>
      )}

      {/* Manual / Desktop Browser Guide Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#DCE3EA] space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE3EA]">
              <h3 className="text-base font-bold text-[#17365D]">
                ऐप इंस्टॉल करने का तरीका
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="w-7 h-7 rounded-full bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5F6B76] leading-relaxed">
              ब्राउज़र के एड्रेस बार (Address bar) के दाईं ओर मौजूद <strong>Install / ⊕</strong> आइकन पर क्लिक करें, या ब्राउज़र मेन्यू (⋮) खोलकर <strong>"Install JeevikaAI"</strong> या <strong>"Add to Home screen"</strong> चुनें।
            </p>

            <button
              onClick={() => setShowManualModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#245A91] text-white font-bold text-xs hover:bg-[#17365D] transition-colors"
            >
              ठीक है (OK)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
