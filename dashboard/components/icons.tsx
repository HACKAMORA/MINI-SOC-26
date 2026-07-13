// Minimal inline icon set (no external icon package needed).
// Each icon is a plain 20x20 stroke-based SVG, currentColor-driven.

type IconProps = { className?: string };

export function IconGrid({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 8a5 5 0 0 1 10 0c0 3.2 1 4.2 1.5 5H3.5c.5-.8 1.5-1.8 1.5-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8.2 16a1.8 1.8 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconServer({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="3" width="15" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="15" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.5" cy="5.75" r="0.9" fill="currentColor" />
      <circle cx="5.5" cy="14.25" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2.5 16.5 5v4.2c0 4.2-2.7 7.1-6.5 8.3-3.8-1.2-6.5-4.1-6.5-8.3V5L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7.3 10.1l1.9 1.9 3.6-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDatabase({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <ellipse cx="10" cy="4.5" rx="6.5" ry="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 4.5v11c0 1.2 2.9 2.2 6.5 2.2s6.5-1 6.5-2.2v-11" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 10c0 1.2 2.9 2.2 6.5 2.2s6.5-1 6.5-2.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconFolder({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M2.5 5.3c0-.7.6-1.3 1.3-1.3h3.6l1.4 1.7h7.4c.7 0 1.3.6 1.3 1.3v7.7c0 .7-.6 1.3-1.3 1.3H3.8c-.7 0-1.3-.6-1.3-1.3V5.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconRefresh({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M16 10a6 6 0 1 1-1.8-4.3M16 3v4h-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="8.7" cy="8.7" r="5.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.8 12.8 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconShare({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="4.5" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.5" cy="15.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.3 9.1 13.7 5.4M6.3 10.9l7.4 3.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlay({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M6 4.5 15 10l-9 5.5v-11Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDot({ className }: IconProps) {
  return (
    <svg viewBox="0 0 8 8" fill="currentColor" className={className}>
      <circle cx="4" cy="4" r="4" />
    </svg>
  );
}
