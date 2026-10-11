import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle,
  Info,
  Minus,
  Warning,
  WarningOctagon,
  WifiSlash,
  Wrench,
} from '@phosphor-icons/react';
import type { Alert, AlertKind, Point, SectionStatus, SensorKind } from '../../types';
import { Chip, type Tone } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { ALERT_KIND_LABEL, ALERT_STATUS_LABEL, SECTION_STATUS_LABEL, TARGETS } from '../../data/content/labels';
import { timeAgo } from '../../lib/format';
import { DENIED_HINT } from '../../lib/permissions';
import { useAdmin } from '../../lib/adminStore';

export function PageHeader({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-tight">{title}</h1>
        {text && <p className="mt-1.5 max-w-2xl text-espresso/80">{text}</p>}
      </div>
      {children}
    </div>
  );
}

export const SECTION_TONE: Record<SectionStatus, Tone> = {
  empty: 'neutral',
  filling: 'info',
  active: 'ok',
  stabilizing: 'info',
  ready: 'dark',
  completed: 'neutral',
};
export const SectionChip = ({ status }: { status: SectionStatus }) => <Chip tone={SECTION_TONE[status]}>{SECTION_STATUS_LABEL[status]}</Chip>;

export const ALERT_TONE: Record<AlertKind, Tone> = {
  critical: 'crit',
  device_error: 'crit',
  warning: 'warn',
  sensor_offline: 'warn',
  info: 'info',
  maintenance: 'neutral',
};
const ALERT_ICON = {
  critical: WarningOctagon,
  device_error: WarningOctagon,
  warning: Warning,
  sensor_offline: WifiSlash,
  info: Info,
  maintenance: Wrench,
} as const;

export interface Rating {
  label: string;
  tone: Tone;
  explain: string;
}

/** სტატუსი ყოველთვის ტექსტითაც გამოიხატება, არა მხოლოდ ფერით */
export function rate(kind: SensorKind, value: number, online = true): Rating {
  if (!online) return { label: 'სენსორი offline', tone: 'warn', explain: 'ბოლო ცნობილი მნიშვნელობა. მონაცემი სანდო არ არის.' };
  if (kind === 'humidity') {
    const { min, max } = TARGETS.humidity;
    if (value < min) return { label: 'დაბალია', tone: 'warn', explain: `ტენიანობა სამიზნე ${min}–${max}%-ზე დაბალია.` };
    if (value > max) return { label: 'მაღალია', tone: 'warn', explain: `ტენიანობა სამიზნე ${min}–${max}%-ზე მაღალია.` };
    return { label: 'ოპტიმალური', tone: 'ok', explain: `ტენიანობა სამიზნე ${min}–${max}% დიაპაზონშია.` };
  }
  if (kind === 'temperature') {
    if (value > TARGETS.temperature.max) return { label: 'საშიშად მაღალია', tone: 'crit', explain: `ტემპერატურა ${TARGETS.temperature.max}°C-ს აჭარბებს.` };
    if (value > 28 || value < 20) return { label: 'საჭიროებს ყურადღებას', tone: 'warn', explain: 'ტემპერატურა ოპტიმალური 20–28°C დიაპაზონის გარეთაა.' };
    return { label: 'ოპტიმალური', tone: 'ok', explain: 'ტემპერატურა ოპტიმალურ 20–28°C დიაპაზონშია.' };
  }
  const { min, max } = TARGETS.ph;
  if (value < min || value > max) return { label: 'დიაპაზონს გარეთაა', tone: 'warn', explain: `pH სამიზნე ${min}–${max} დიაპაზონს სცდება.` };
  return { label: 'სამიზნე დიაპაზონში', tone: 'ok', explain: `pH სამიზნე ${min}–${max} დიაპაზონშია.` };
}

export function trendOf(series: Point[], current: number, stepsBack: number, threshold: number) {
  const ref = series[Math.max(0, series.length - stepsBack)]?.v ?? current;
  const d = current - ref;
  if (Math.abs(d) < threshold) return { icon: Minus, text: 'სტაბილურია', d };
  return d > 0 ? { icon: ArrowUp, text: 'იზრდება', d } : { icon: ArrowDown, text: 'მცირდება', d };
}

export function useGate(perm: Parameters<ReturnType<typeof useAdmin>['can']>[0]) {
  const { can } = useAdmin();
  const ok = can(perm);
  return { disabled: !ok, title: ok ? undefined : DENIED_HINT };
}

export function AlertCard({ alert, compact = false }: { alert: Alert; compact?: boolean }) {
  const { state, dispatch } = useAdmin();
  const ack = useGate('ack_alerts');
  const Icon = ALERT_ICON[alert.kind];
  const resolved = alert.status === 'resolved';
  const border =
    resolved || alert.kind === 'info' || alert.kind === 'maintenance'
      ? 'border-umber/25 bg-sand/30'
      : alert.kind === 'critical' || alert.kind === 'device_error'
        ? 'border-brick bg-brick/10'
        : 'border-ochre/60 bg-ochre/10';

  return (
    <article className={`rounded-xl border p-4 ${border} ${resolved ? 'opacity-75' : ''}`} data-testid="alert-card" data-kind={alert.kind} data-status={alert.status}>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={ALERT_TONE[alert.kind]} icon={<Icon size={14} weight="fill" aria-hidden />}>
          {ALERT_KIND_LABEL[alert.kind]}
        </Chip>
        <Chip tone={alert.status === 'active' ? 'dark' : alert.status === 'acknowledged' ? 'info' : 'ok'}>{ALERT_STATUS_LABEL[alert.status]}</Chip>
        <span className="ml-auto text-xs text-espresso/75">
          {alert.sectionId ? `სექცია ${alert.sectionId}, ` : ''}
          {timeAgo(alert.createdAt, state.now)}
        </span>
      </div>
      <h3 className="mt-2.5 text-lg font-semibold leading-snug">{alert.title}</h3>
      <p className="mt-1 text-[15px] text-espresso/90">
        <span className="font-semibold">რა გავაკეთოთ: </span>
        {alert.action}
      </p>
      {resolved && alert.handledBy && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-espresso/80">
          <CheckCircle size={16} weight="fill" aria-hidden /> დახურა: {alert.handledBy}
        </p>
      )}
      {!resolved && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {alert.status === 'active' && (
            <Button size="sm" variant="secondary" {...ack} onClick={() => dispatch({ type: 'ackAlert', id: alert.id })}>
              დადასტურება
            </Button>
          )}
          <Button size="sm" {...ack} onClick={() => dispatch({ type: 'resolveAlert', id: alert.id })}>
            შესრულებულია
          </Button>
          {alert.guideId && !compact && (
            <Link
              to={`/admin/guide?topic=${alert.guideId}`}
              className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold underline underline-offset-4 hover:text-umber"
            >
              <BookOpen size={16} aria-hidden /> იხილეთ ინსტრუქცია
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
