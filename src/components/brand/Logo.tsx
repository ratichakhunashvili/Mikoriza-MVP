/** MIKORIZA-ს ოფიციალური ლოგო (public/logo-light.png და logo-dark.png). tone — ფონის ტონი, რომელზეც ლოგო დევს. */
export function Logo({ tone = 'dark', compact = false }: { tone?: 'dark' | 'light'; compact?: boolean }) {
  return (
    <img
      src={tone === 'light' ? '/logo-light.png' : '/logo-dark.png'}
      alt="MIKORIZA"
      width={1132}
      height={296}
      className={`w-auto ${compact ? 'h-8' : 'h-11'}`}
    />
  );
}
