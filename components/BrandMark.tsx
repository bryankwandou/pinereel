export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="8"
        fill="var(--pr-raised)"
        stroke="var(--pr-rule-2)"
        strokeWidth="1.5"
      />
      <path d="M20 7.5L31.5 28.5H8.5L20 7.5Z" fill="var(--pr-signal)" />
      <path d="M17 17.2L25.2 22L17 26.8V17.2Z" fill="var(--pr-signal-ink)" />
      <path
        d="M12 31.5H28"
        stroke="var(--pr-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

