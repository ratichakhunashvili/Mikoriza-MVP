import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Point } from '../../types';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { fmtDate, fmtDateTime, fmtTime } from '../../lib/format';

interface Props {
  title: string;
  subtitle: string;
  unit: string;
  data: Point[];
  current: number;
  target: { min: number; max: number };
  decimals?: number;
  /** 'time' — 24 საათი; 'day' — 7 დღე */
  axis: 'time' | 'day';
  statusText: string;
  description: string;
}

export function SensorChart({ title, subtitle, unit, data, current, target, decimals = 1, axis, statusText, description }: Props) {
  const gradId = `fill-${useId().replace(/:/g, '')}`;
  const now = data.length ? data[data.length - 1].t : Date.now();
  const series = [...data, { t: now + 5000, v: current }].map((p) => ({ ...p, v: +p.v.toFixed(2) }));
  const values = series.map((p) => p.v);
  const lo = Math.min(target.min, ...values);
  const hi = Math.max(target.max, ...values);
  const pad = (hi - lo) * 0.18 || 1;
  const domain: [number, number] = [+(lo - pad).toFixed(1), +(hi + pad).toFixed(1)];

  return (
    <figure className="panel flex flex-col" aria-label={`${title}: ${description}`}>
      <figcaption className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="text-sm text-espresso/80">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="num text-2xl font-semibold leading-none">
            {current.toFixed(decimals)}
            <span className="ml-0.5 text-base font-medium">{unit}</span>
          </p>
          <p className="mt-1 text-xs font-semibold">{statusText}</p>
        </div>
      </figcaption>
      <div className="h-48 w-full sm:h-56" data-testid="chart">
        <ErrorBoundary fallback={<p className="flex h-full items-center justify-center text-sm text-espresso/80">გრაფიკი დროებით მიუწვდომელია.</p>}>
        <ResponsiveContainer width="100%" height="100%" minWidth={120} minHeight={120}>
          <AreaChart data={series} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6D5E51" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#6D5E51" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#6D5E51" strokeOpacity={0.18} vertical={false} />
            <ReferenceArea y1={target.min} y2={target.max} fill="#868375" fillOpacity={0.28} stroke="#6D5E51" strokeOpacity={0.4} strokeDasharray="4 3" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickCount={axis === 'time' ? 5 : 4}
              tickFormatter={(t: number) => (axis === 'time' ? fmtTime(t) : fmtDate(t))}
              tick={{ fill: '#2E211E', fontSize: 11 }}
              stroke="#6D5E51"
              minTickGap={24}
            />
            <YAxis
              domain={domain}
              tick={{ fill: '#2E211E', fontSize: 11 }}
              stroke="#6D5E51"
              tickFormatter={(v: number) => v.toFixed(axis === 'day' ? 1 : 0)}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: '#2E211E', strokeOpacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Point;
                return (
                  <div className="rounded-lg bg-espresso px-3 py-2 text-xs text-cream shadow-lift">
                    <p className="font-semibold">{fmtDateTime(p.t)}</p>
                    <p className="num mt-0.5 text-sm">
                      {title}: {p.v.toFixed(decimals)} {unit}
                    </p>
                    <p className="text-sand">სამიზნე: {target.min}–{target.max} {unit}</p>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="v" stroke="#2E211E" strokeWidth={2} fill={`url(#${gradId})`} isAnimationActive={false} />
            <ReferenceDot x={now + 5000} y={current} r={5} fill="#2E211E" stroke="#E2D9CC" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        </ErrorBoundary>
      </div>
      <p className="mt-2 text-xs text-espresso/80">
        დაჩრდილული ზოლი სამიზნე დიაპაზონია ({target.min}–{target.max} {unit}). მონაცემები სატესტოა.
      </p>
    </figure>
  );
}
