/**
 * დროებითი ბრენდული ნიშანი: სოკოს სიმბოლო და MIKORIZA-ს წარწერა.
 * ოფიციალური ლოგოს ფაილის მიღების შემდეგ ჩაანაცვლეთ მხოლოდ ამ კომპონენტის შიგთავსი,
 * დანარჩენ პროექტში ცვლილება საჭირო არ იქნება.
 */
export function MushroomMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {/* ქუდი */}
      <path d="M5 24C5 13.5 13.5 6 24 6s19 7.5 19 18c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2Z" fill="currentColor" />
      {/* ლაქები */}
      <circle cx="16" cy="17" r="2.4" fill="var(--mark-spot, #E2D9CC)" />
      <circle cx="25" cy="13" r="1.9" fill="var(--mark-spot, #E2D9CC)" />
      <circle cx="33" cy="19" r="2.1" fill="var(--mark-spot, #E2D9CC)" />
      {/* ღერო */}
      <path d="M19 26h10v8c0 2.2-1.8 4-4 4h-2c-2.2 0-4-1.8-4-4v-8Z" fill="currentColor" />
      {/* მიცელიუმი */}
      <path d="M24 38c-1 3-4 4.5-9 5M24 38c1 3 4 4.5 9 5M24 38v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ tone = 'dark', compact = false }: { tone?: 'dark' | 'light'; compact?: boolean }) {
  const light = tone === 'light';
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${light ? 'text-cream' : 'text-espresso'}`}
      style={{ ['--mark-spot' as string]: light ? '#2E211E' : '#E2D9CC' }}
    >
      <MushroomMark size={compact ? 30 : 38} />
      <span className="font-display text-[1.35rem] font-semibold tracking-[0.18em]" aria-label="MIKORIZA">
        MIKORIZA
      </span>
    </span>
  );
}
