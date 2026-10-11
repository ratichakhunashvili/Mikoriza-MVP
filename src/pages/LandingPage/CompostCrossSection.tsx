import { Logo } from '../../components/brand/Logo';

const BINS = [
  { id: 'A', x: 28 },
  { id: 'B', x: 200 },
  { id: 'C', x: 372 },
];

/** ილუსტრაცია: სამი სექციის ჭრილი, სენსორის ზონდები და მათი დამაკავშირებელი მიცელიუმის ქსელი */
export function CompostCrossSection() {
  return (
    <div className="on-dark relative overflow-hidden rounded-3xl bg-espresso p-5 text-cream shadow-lift sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Logo tone="light" compact />
        <span className="flex items-center gap-2 rounded-md bg-cream/10 px-2.5 py-1.5 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="probe-dot absolute inline-flex h-full w-full rounded-full bg-sand" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cream" />
          </span>
          სისტემა მუშაობს
        </span>
      </div>

      <svg viewBox="0 0 560 420" className="mycelium mt-2 w-full" role="img" aria-label="ვერმიკომპოსტირების სამი სექციის ჭრილი, სენსორის ზონდებით და მონიტორინგის პლატფორმასთან დამაკავშირებელი ხაზებით">
        {/* პლატფორმის კვანძი */}
        <circle cx="280" cy="40" r="11" fill="#E2D9CC" />
        <circle cx="280" cy="40" r="19" fill="none" stroke="#B1AA99" strokeOpacity=".5" />
        <text x="280" y="12" textAnchor="middle" fill="#B1AA99" fontSize="12" fontFamily="Noto Sans Georgian, sans-serif">
          მონიტორინგის პლატფორმა
        </text>

        {BINS.map((b, i) => {
          const cx = b.x + 66;
          const dir = i === 0 ? -1 : i === 2 ? 1 : 0;
          return (
            <g key={b.id}>
              {/* სექციის ჭრილი */}
              <clipPath id={`bin-${b.id}`}>
                <path d={`M${b.x} 150h160v200a14 14 0 0 1-14 14H${b.x + 14}a14 14 0 0 1-14-14Z`} />
              </clipPath>
              <g clipPath={`url(#bin-${b.id})`}>
                <rect x={b.x} y="150" width="160" height="214" fill="#2E211E" />
                <rect x={b.x} y="178" width="160" height="62" fill="#868375" />
                <rect x={b.x} y="240" width="160" height="70" fill="#6D5E51" />
                <rect x={b.x} y="310" width="160" height="54" fill="#6D5E51" fillOpacity=".45" />
                {/* ნარჩენის ნატეხები */}
                <g fill="#B1AA99" fillOpacity=".75">
                  <rect x={b.x + 14} y="190" width="16" height="7" rx="3" transform={`rotate(-12 ${b.x + 22} 193)`} />
                  <rect x={b.x + 48} y="204" width="20" height="7" rx="3" transform={`rotate(9 ${b.x + 58} 207)`} />
                  <rect x={b.x + 96} y="192" width="14" height="7" rx="3" />
                  <rect x={b.x + 120} y="214" width="18" height="7" rx="3" transform={`rotate(-8 ${b.x + 129} 217)`} />
                  <rect x={b.x + 30} y="224" width="12" height="6" rx="3" />
                </g>
                {/* ჭიები */}
                <g stroke="#B1AA99" strokeWidth="3" strokeLinecap="round" fill="none">
                  <path d={`M${b.x + 20} 268q8-9 16 0t16 0`} />
                  <path d={`M${b.x + 86} 286q8 9 16 0t16 0`} />
                  <path d={`M${b.x + 40} 336q8-9 16 0t16 0`} strokeOpacity=".7" />
                </g>
                {/* სუბსტრატში ჩაზრდილი ზონდი და ფესვები */}
                <path d={`M${cx} 164V300`} stroke="#E2D9CC" strokeWidth="2.5" />
                <g stroke="#E2D9CC" strokeOpacity=".4" strokeWidth="1" fill="none" strokeLinecap="round">
                  <path d={`M${cx} 270c-14 2-26 10-34 24M${cx} 270c14 2 26 10 34 24M${cx} 232c-10 0-20 4-26 12M${cx} 232c10 0 20 4 26 12`} />
                </g>
              </g>
              <path
                d={`M${b.x} 150h160v200a14 14 0 0 1-14 14H${b.x + 14}a14 14 0 0 1-14-14Z`}
                fill="none"
                stroke="#B1AA99"
                strokeOpacity=".6"
                strokeWidth="2"
              />
              <text x={cx} y="396" textAnchor="middle" fill="#E2D9CC" fontSize="22" fontFamily="Fraunces, Noto Serif Georgian, serif" fontWeight="600">
                {b.id}
              </text>
              {/* ზონდის თავი */}
              <circle cx={cx} cy="156" r="6" fill="#E2D9CC" />
              <circle cx={cx} cy="156" r="6" fill="#E2D9CC" className="probe-dot" />
              {/* მიცელიუმი პლატფორმისკენ */}
              <path
                className="draw"
                d={`M${cx} 156C${cx} ${110 - i * 6} ${cx + dir * -40} 84 280 50`}
                fill="none"
                stroke="#E2D9CC"
                strokeOpacity=".75"
                strokeWidth="1.6"
                strokeLinecap="round"
                style={{ animationDelay: `${i * 0.35}s` }}
              />
              <path
                className="draw"
                d={`M${cx} 128c${12 * (dir || 1)} -14 ${28 * (dir || 1)} -20 ${44 * (dir || 1)} -22`}
                fill="none"
                stroke="#B1AA99"
                strokeOpacity=".6"
                strokeWidth="1"
                strokeLinecap="round"
                style={{ animationDelay: `${0.6 + i * 0.35}s` }}
              />
            </g>
          );
        })}
      </svg>

      <dl className="mt-1 grid grid-cols-3 gap-3 border-t border-cream/15 pt-4 text-center">
        {[
          { k: 'pH', v: '6.8', u: '' },
          { k: 'ტემპერატურა', v: '24.6', u: '°C' },
          { k: 'ტენიანობა', v: '68', u: '%' },
        ].map((m) => (
          <div key={m.k}>
            <dd className="num text-[1.9rem] font-semibold leading-none">
              {m.v}
              <span className="text-lg font-medium">{m.u}</span>
            </dd>
            <dt className="mt-1.5 text-xs text-sand">{m.k}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-sand">ილუსტრაცია სატესტო მნიშვნელობებით. რეალური სენსორები ამ დემოში მიერთებული არ არის.</p>
    </div>
  );
}
