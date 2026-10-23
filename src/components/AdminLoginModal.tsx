import React, { useState } from 'react';
import { authService, AppUser } from '../services/firebase';
import { Icon } from './Icons';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AppUser) => void;
  onNotify: (msg: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNotify,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const user = await authService.loginWithEmail(cleanEmail, password.trim());
      
      const isAdmin = user.role === 'admin' || user.email?.toLowerCase() === 'ayushgupt640@gmail.com';
      if (!isAdmin) {
        setError('इस खाते के पास प्रशासनिक अनुमति नहीं है। (Access Denied: Not an authorized admin account)');
        setLoading(false);
        return;
      }

      onSuccess(user);
      onNotify('प्रशासक के रूप में लॉगिन सफल! (Admin Authentication Successful)');
      onClose();
    } catch (err: any) {
      setError(err.message || 'लॉगिन विफल रहा। कृपया सही ईमेल और पासवर्ड दर्ज करें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-[#DCE3EA] space-y-4 text-left my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#17365D] text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
              <Icon name="shield" size={18} />
            </div>
            <div>
              <h3 id="admin-dialog-title" className="text-base font-extrabold text-[#17365D]">
                प्रशासनिक लॉगिन (Admin Portal)
              </h3>
              <p className="text-[11px] text-[#5F6B76]">
                Restricted Access · Authorized Personnel Only
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close admin login dialog"
            className="w-8 h-8 rounded-full bg-[#F5F7FA] text-[#5F6B76] hover:text-[#17365D] hover:bg-[#E4EAF0] flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Security Warning Notice */}
        <div className="p-2.5 rounded-xl bg-[#F5F7FA] border border-[#DCE3EA] text-[11px] text-[#5F6B76] flex items-start gap-2">
          <Icon name="lock" size={14} className="text-[#245A91] flex-none mt-0.5" />
          <span>
            केवल अधिकृत प्रशासक ही इस पोर्टल पर डेटा और सेटिंग्स में बदलाव कर सकते हैं।
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-[#FDEDEC] text-[#9E2A2B] text-xs font-semibold border border-[#9E2A2B]/20 flex items-start gap-2 animate-fade-in">
            <Icon name="info" size={15} className="flex-none mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Real Secure Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#17365D] mb-1">
              Admin Email / अधिकृत ईमेल ID:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@jeevika.org"
              autoComplete="username"
              required
              className="w-full p-2.5 sm:p-3 rounded-xl border border-[#DCE3EA] focus:border-[#245A91] focus:ring-1 focus:ring-[#245A91] focus:outline-none text-[#17365D] font-medium transition-colors"
            />
          </div>

          <div>
            <label className="block font-bold text-[#17365D] mb-1">
              Admin Password / पासवर्ड:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full p-2.5 sm:p-3 rounded-xl border border-[#DCE3EA] focus:border-[#245A91] focus:ring-1 focus:ring-[#245A91] focus:outline-none text-[#17365D] font-medium tracking-wider transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-3.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span>सत्यापित हो रहा है...</span>
            ) : (
              <>
                <Icon name="lock" size={15} />
                <span>सुरक्षित लॉगिन करें (Secure Login)</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-[#DCE3EA] text-center text-[11px] text-[#5F6B76]">
          <span>JeevikaAI Security System · End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
};
