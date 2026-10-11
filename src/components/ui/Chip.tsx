import type { ReactNode } from 'react';

export type Tone = 'ok' | 'neutral' | 'warn' | 'crit' | 'info' | 'dark';

const TONE: Record<Tone, string> = {
  ok: 'bg-olive/30 text-espresso',
  neutral: 'bg-sand/50 text-espresso',
  info: 'bg-umber/15 text-espresso',
  warn: 'bg-ochre/20 text-espresso ring-1 ring-inset ring-ochre/50',
  crit: 'bg-brick text-cream',
  dark: 'bg-espresso text-cream',
};

export function Chip({ tone = 'neutral', icon, children, className = '' }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold leading-none ${TONE[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}
