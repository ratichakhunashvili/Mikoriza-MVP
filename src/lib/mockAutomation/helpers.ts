import type {
  ActivityEntry,
  ActivitySource,
  Alert,
  AlertKind,
  AppState,
  SectionId,
  ToastKind,
  ToastMsg,
} from '../../types';
import { MIN } from '../format';
import { ROLE_LABEL } from '../permissions';

/** ცვლადი კონტექსტი, რომლის საშუალებითაც წესები ქმნიან ჩანაწერებს, გაფრთხილებებს და შეტყობინებებს */
export interface Ctx {
  now: number;
  nextId: number;
  alerts: Alert[];
  activity: ActivityEntry[];
  toasts: ToastMsg[];
}

export function makeCtx(s: AppState, now: number): Ctx {
  return { now, nextId: s.nextId, alerts: s.alerts, activity: s.activity, toasts: s.toastQueue };
}

export function uid(ctx: Ctx, prefix: string): string {
  return `${prefix}-${ctx.nextId++}`;
}

export function log(ctx: Ctx, source: ActivitySource, action: string, actor: string, result: string) {
  const entry: ActivityEntry = { id: uid(ctx, 'ac'), at: ctx.now, source, action, actor, result };
  ctx.activity = [entry, ...ctx.activity].slice(0, 250);
}

export function toast(ctx: Ctx, kind: ToastKind, text: string) {
  ctx.toasts = [...ctx.toasts, { id: uid(ctx, 'ts'), kind, text }];
}

export interface AlertSpec {
  key: string;
  kind: AlertKind;
  title: string;
  action: string;
  sectionId?: SectionId;
  guideId?: string;
}

const RESOLVED_COOLDOWN = 2 * MIN;

/** ქმნის გაფრთხილებას, თუ იგივე გასაღების მქონე ღია გაფრთხილება არ არსებობს. აბრუნებს true-ს ახლის შექმნისას. */
export function raiseAlert(ctx: Ctx, spec: AlertSpec, silent = false): boolean {
  const dup = ctx.alerts.find(
    (a) =>
      a.key === spec.key &&
      (a.status !== 'resolved' || (a.resolvedAt !== undefined && ctx.now - a.resolvedAt < RESOLVED_COOLDOWN)),
  );
  if (dup) return false;
  const alert: Alert = { id: uid(ctx, 'al'), createdAt: ctx.now, status: 'active', ...spec };
  ctx.alerts = [alert, ...ctx.alerts];
  log(ctx, 'alert', `შეიქმნა გაფრთხილება: ${spec.title}`, 'სისტემა', 'ღიაა');
  if (!silent) {
    const kind: ToastKind = spec.kind === 'critical' || spec.kind === 'device_error' ? 'error' : 'warning';
    toast(ctx, kind, `ახალი გაფრთხილება: ${spec.title}`);
  }
  return true;
}

export const actorOf = (s: AppState) => ROLE_LABEL[s.auth.role];

export function applyCtx(s: AppState, ctx: Ctx): AppState {
  return { ...s, now: ctx.now, nextId: ctx.nextId, alerts: ctx.alerts, activity: ctx.activity, toastQueue: ctx.toasts };
}

export type Health = 'ok' | 'warning' | 'critical';
export function overallHealth(alerts: Alert[]): Health {
  const open = alerts.filter((a) => a.status !== 'resolved');
  if (open.some((a) => a.kind === 'critical' || a.kind === 'device_error')) return 'critical';
  if (open.some((a) => a.kind === 'warning' || a.kind === 'sensor_offline')) return 'warning';
  return 'ok';
}
export const HEALTH_LABEL: Record<Health, string> = {
  ok: 'ყველაფერი ნორმაშია',
  warning: 'საჭიროა ყურადღება',
  critical: 'საჭიროა სასწრაფო ჩარევა',
};
