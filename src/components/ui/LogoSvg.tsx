export default function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 222 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PadelOn"
    >
      {/* ── RACKET ── */}
      {/* Head outline — stroke only, adapts to dark/light via currentColor */}
      <ellipse cx="21" cy="21" rx="16" ry="19" stroke="currentColor" strokeWidth="2.8" fill="none"/>
      {/* Green ball inside racket head */}
      <circle cx="21" cy="19" r="11" fill="#16a34a"/>
      {/* Ball holes */}
      <circle cx="16" cy="15" r="2.2" fill="rgba(0,0,0,0.35)"/>
      <circle cx="25" cy="16" r="1.9" fill="rgba(0,0,0,0.3)"/>
      <circle cx="16" cy="22" r="1.8" fill="rgba(0,0,0,0.28)"/>
      <circle cx="25" cy="23" r="1.5" fill="rgba(0,0,0,0.22)"/>
      {/* Handle */}
      <line x1="17" y1="39" x2="7" y2="54" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>

      {/* ── PADEL (currentColor → black light / white dark) ── */}
      <text
        x="44" y="43"
        fontFamily="'Arial Black','Helvetica Neue',Arial,sans-serif"
        fontWeight="900"
        fontSize="36"
        fill="currentColor"
        letterSpacing="0.5"
      >PADEL</text>

      {/* ── POWER-BUTTON "O" ── */}
      {/* Sits after PADEL (~157px wide from x=44). Center x=175, y=29, r=13 */}
      {/* Arc: full circle minus ~65° gap at top */}
      <path
        d="M 182.5,18.4 A 13,13 0 1 1 167.5,18.4"
        stroke="#16a34a"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Vertical power line through the gap */}
      <line x1="175" y1="11" x2="175" y2="27" stroke="#16a34a" strokeWidth="5.5" strokeLinecap="round"/>

      {/* ── N (green) ── */}
      <text
        x="191" y="43"
        fontFamily="'Arial Black','Helvetica Neue',Arial,sans-serif"
        fontWeight="900"
        fontSize="36"
        fill="#16a34a"
        letterSpacing="0.5"
      >N</text>
    </svg>
  );
}
