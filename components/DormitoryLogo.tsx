export const DormitoryLogo = ({ className = "w-28 h-28" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dormitory-logo-gradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#D6A542" />
        <stop offset="1" stopColor="#8F2019" />
      </linearGradient>
    </defs>
    <path d="M100 20 L25 75 V170 H175 V75 Z" stroke="url(#dormitory-logo-gradient)" strokeWidth="12" strokeLinejoin="round" fill="none" />
    <path d="M15 80 L100 15 L185 80" stroke="url(#dormitory-logo-gradient)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="52" y="80" width="96" height="75" stroke="url(#dormitory-logo-gradient)" strokeWidth="8" rx="4" />
    <circle cx="72" cy="100" r="7" fill="#C93A2E" />
    <rect x="85" y="94" width="50" height="14" rx="3" fill="#C93A2E" />
    <line x1="60" y1="112" x2="140" y2="112" stroke="#C93A2E" strokeWidth="6" strokeLinecap="round" />
    <circle cx="72" cy="132" r="7" fill="#C93A2E" />
    <rect x="85" y="126" width="50" height="14" rx="3" fill="#C93A2E" />
    <line x1="60" y1="144" x2="140" y2="144" stroke="#C93A2E" strokeWidth="6" strokeLinecap="round" />
  </svg>
);
