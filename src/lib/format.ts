export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

const LOCALE = 'ka-GE';

export function fmtTime(t: number): string {
  return new Date(t).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
}
const MONTHS = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'];
export function fmtDate(t: number): string {
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function fmtDateTime(t: number): string {
  return `${fmtDate(t)}, ${fmtTime(t)}`;
}

export function timeAgo(t: number, now: number = Date.now()): string {
  const d = Math.max(0, now - t);
  if (d < 45_000) return 'ახლახან';
  if (d < HOUR) return `${Math.max(1, Math.round(d / MIN))} წუთის წინ`;
  if (d < DAY) return `${Math.round(d / HOUR)} საათის წინ`;
  return `${Math.round(d / DAY)} დღის წინ`;
}

/** მომავალი თარიღის შეფასება: „3 დღეში“ ან „ვადა გასულია“ */
export function dueIn(t: number, now: number = Date.now()): string {
  const d = t - now;
  if (d < 0) return `ვადა გასულია (${Math.max(1, Math.round(-d / DAY))} დღის წინ)`;
  if (d < DAY) return 'დღეს';
  return `${Math.round(d / DAY)} დღეში`;
}

/** „მე-12 დღე 18-დან“ */
export function cycleDayLabel(day: number, total: number): string {
  const d = day === 1 ? '1-ლი' : `მე-${day}`;
  return `${d} დღე ${total}-დან`;
}

export function cycleDay(startedAt: number | null, total: number, now: number): number {
  if (!startedAt) return 0;
  return Math.min(total, Math.max(1, Math.floor((now - startedAt) / DAY) + 1));
}

export const f1 = (n: number) => n.toFixed(1);
