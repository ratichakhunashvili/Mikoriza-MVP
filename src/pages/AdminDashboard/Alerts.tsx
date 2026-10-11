import { useMemo, useState } from 'react';
import type { AlertKind } from '../../types';
import { ALERT_KIND_LABEL } from '../../data/content/labels';
import { useAdmin } from '../../lib/adminStore';
import { AlertCard, PageHeader } from './parts';

type Filter = 'all' | AlertKind;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'ყველა' },
  { id: 'critical', label: ALERT_KIND_LABEL.critical },
  { id: 'warning', label: ALERT_KIND_LABEL.warning },
  { id: 'sensor_offline', label: ALERT_KIND_LABEL.sensor_offline },
  { id: 'device_error', label: ALERT_KIND_LABEL.device_error },
  { id: 'info', label: ALERT_KIND_LABEL.info },
  { id: 'maintenance', label: 'მომსახურების შეხსენება' },
];
const WEIGHT: Record<AlertKind, number> = { critical: 0, device_error: 0, warning: 1, sensor_offline: 1, info: 2, maintenance: 3 };

export default function Alerts() {
  const { state } = useAdmin();
  const [tab, setTab] = useState<'open' | 'history'>('open');
  const [filter, setFilter] = useState<Filter>('all');

  const list = useMemo(() => {
    const base = state.alerts.filter((a) => (tab === 'open' ? a.status !== 'resolved' : a.status === 'resolved'));
    const f = filter === 'all' ? base : base.filter((a) => a.kind === filter);
    return [...f].sort((a, b) =>
      tab === 'open' ? WEIGHT[a.kind] - WEIGHT[b.kind] || b.createdAt - a.createdAt : (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0),
    );
  }, [state.alerts, tab, filter]);

  const openCount = state.alerts.filter((a) => a.status !== 'resolved').length;
  const histCount = state.alerts.length - openCount;

  return (
    <div>
      <PageHeader title="გაფრთხილებები" text="ყოველ გაფრთხილებას თან ახლავს ქმედება, რომელიც ოპერატორმა უნდა შეასრულოს." />

      <div role="tablist" aria-label="გაფრთხილებების სია" className="mb-4 inline-flex overflow-hidden rounded-lg border border-umber/60">
        {(
          [
            ['open', `ღია (${openCount})`],
            ['history', `ისტორია (${histCount})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-11 px-5 text-sm font-semibold ${tab === id ? 'bg-espresso text-cream' : 'hover:bg-espresso/10'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="გაფილტვრა სიმძიმის მიხედვით">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-9 rounded-lg px-3 text-sm font-semibold ${filter === f.id ? 'bg-umber text-cream' : 'border border-umber/50 hover:bg-umber/15'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {list.length ? (
          list.map((a) => <AlertCard key={a.id} alert={a} />)
        ) : (
          <p className="panel lg:col-span-2">{tab === 'open' ? 'ამ ფილტრით ღია გაფრთხილება არ არის.' : 'ისტორიაში ამ ფილტრით ჩანაწერი არ არის.'}</p>
        )}
      </div>
    </div>
  );
}
