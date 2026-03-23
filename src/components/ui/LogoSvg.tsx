export default function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 210 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PadelOn"
    >
      {/* Racket head */}
      <rect x="4" y="2" width="28" height="33" rx="14" fill="#16a34a" />
      {/* Strings */}
      <line x1="4"  y1="12" x2="32" y2="12" stroke="white" strokeWidth="1.3" opacity="0.5" />
      <line x1="4"  y1="18" x2="32" y2="18" stroke="white" strokeWidth="1.3" opacity="0.5" />
      <line x1="4"  y1="24" x2="32" y2="24" stroke="white" strokeWidth="1.3" opacity="0.5" />
      <line x1="12" y1="2"  x2="12" y2="35" stroke="white" strokeWidth="1.3" opacity="0.5" />
      <line x1="18" y1="2"  x2="18" y2="35" stroke="white" strokeWidth="1.3" opacity="0.5" />
      <line x1="24" y1="2"  x2="24" y2="35" stroke="white" strokeWidth="1.3" opacity="0.5" />
      {/* Handle */}
      <rect x="14" y="34" width="8" height="12" rx="4" fill="#15803d" />
      {/* Ball — white with green tint */}
      <circle cx="35" cy="8" r="6" fill="white" opacity="0.9" />
      <circle cx="35" cy="8" r="6" fill="#16a34a" opacity="0.15" />

      {/* "Padel" — currentColor → black in light mode, white in dark mode */}
      <text
        x="48"
        y="35"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="30"
        letterSpacing="-1"
        fill="currentColor"
      >
        Padel
      </text>

      {/* "On" — always green */}
      <text
        x="144"
        y="35"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="30"
        letterSpacing="-1"
        fill="#16a34a"
      >
        On
      </text>
    </svg>
  );
}
