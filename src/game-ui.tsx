export type GameTier = {
  entryAmount: number;
  moleCount: number;
};

export function MoleMark() {
  return (
    <svg
      aria-hidden="true"
      className="mole-mark"
      viewBox="0 0 80 80"
      fill="none"
    >
      <path
        d="M17 36 10 20c-2-5 4-8 8-4l11 11M63 36l7-16c2-5-4-8-8-4L51 27"
        fill="#B86F42"
        stroke="#4A2519"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M16 78V48c0-19 10-31 24-31s24 12 24 31v30H16Z"
        fill="#C77B49"
        stroke="#4A2519"
        strokeWidth="3"
      />
      <path
        d="M20 47c4-15 12-23 20-23s16 8 20 23"
        stroke="#E5A46C"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="52" rx="17" ry="14" fill="#EBC08A" />
      <ellipse cx="28" cy="47" rx="5" ry="6" fill="#1A1A25" />
      <ellipse cx="52" cy="47" rx="5" ry="6" fill="#1A1A25" />
      <circle cx="29.5" cy="45.5" r="1.5" fill="#fff" />
      <circle cx="53.5" cy="45.5" r="1.5" fill="#fff" />
      <path
        d="M32 39c-3-3-6-3-8-1M48 39c3-3 6-3 8-1"
        stroke="#4A2519"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="54" rx="5" ry="3.5" fill="#4A2519" />
      <path
        d="M36 60c2 3 6 3 8 0"
        stroke="#4A2519"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M17 67c4-3 8-3 11 1M63 67c-4-3-8-3-11 1"
        stroke="#EBC08A"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M35 63h3l2 3 2-3h3"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
