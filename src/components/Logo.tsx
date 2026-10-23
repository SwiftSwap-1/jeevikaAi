import React from 'react';

interface LogoProps {
  size?: number;
  inverse?: boolean;
  onClick?: () => void;
  userName?: string;
}

export const LogoMark: React.FC<{ size?: number }> = ({ size = 36 }) => {
  return (
    <svg width={size} height={Math.round((size * 44) / 48)} viewBox="0 0 48 44" fill="none" aria-hidden="true">
      <path d="M19 41C19 41 6 28 6 18a13 13 0 0 1 26 0C32 28 19 41 19 41Z" fill="#245A91" />
      <circle cx="19" cy="18" r="8.5" fill="#fff" />
      <rect x="17.1" y="12.2" width="3.8" height="7.2" rx="1.9" fill="#17365D" />
      <path d="M14.9 17.6a4.1 4.1 0 0 0 8.2 0" stroke="#17365D" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M19 21.7v2" stroke="#17365D" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M30.5 12 40 8.5 43 21.5 36 32.5M43 21.5 31.5 24" stroke="#287D73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="8.5" r="3" fill="#D9822B" />
      <circle cx="43" cy="21.5" r="2.6" fill="#287D73" />
      <circle cx="36" cy="32.5" r="2.4" fill="#287D73" />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({ size = 36, inverse = false, onClick, userName }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 bg-transparent border-0 p-0 text-left cursor-pointer transition-opacity hover:opacity-90 ${
        inverse ? 'text-white' : 'text-[#17365D]'
      }`}
      aria-label={userName ? `Profile: ${userName}` : "JeevikaAI home"}
    >
      <LogoMark size={size} />
      {userName && userName.trim() ? (
        <span className="font-['Bricolage_Grotesque'] text-lg sm:text-2xl font-extrabold tracking-tight text-[#17365D] truncate max-w-[160px] xs:max-w-[220px] sm:max-w-[320px]">
          {userName}
        </span>
      ) : (
        <span className="font-['Bricolage_Grotesque'] text-2xl font-extrabold tracking-tight">
          Jeevika<b className="text-[#245A91] font-extrabold">AI</b>
        </span>
      )}
    </button>
  );
};
