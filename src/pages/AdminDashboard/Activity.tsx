import { useMemo, useState } from 'react';
import type { ActivitySource } from '../../types';
import { SOURCE_LABEL } from '../../data/content/labels';
import { Chip } from '../../components/ui/Chip';
import { useAdmin } from '../../lib/adminStore';
import { fmtDateTime } from '../../lib/format';
import { PageHeader } from './parts';

const FILTERS: { id: 'all' | ActivitySource; label: string }[] = [
  { id: 'all', label: 'ყველა' },
  ...(['sensor', 'device', 'automation', 'operator', 'alert', 'maintenance', 'safety'] as ActivitySource[]).map((s) => ({ id: s, label: SOURCE_LABEL[s] })),
];

export default function Activity() {
  const { state } = useAdmin();
  const [filter, setFilter] = useState<'all' | ActivitySource>('all');
  const rows = useMemo(() => (filter === 'all' ? state.activity : state.activity.filter((a) => a.source === filter)), [state.activity, filter]);

  return (
    <div>
      <PageHeader title="აქტივობის ჟურნალი" text="სენსორების ცვლილებები, მოწყობილობების მოქმედებები, ავტომატიზაციის მოვლენები და ოპერატორის ხელით მოქმედებები." />
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="ჟურნალის გაფილტვრა">
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

      <div className="panel !p-0 overflow-hidden">
        <div className="hidden grid-cols-[150px_1fr_140px_190px_170px] gap-4 border-b border-umber/30 bg-sand/50 px-5 py-3 text-sm font-semibold md:grid" aria-hidden>
          <span>თარიღი და დრო</span>
          <span>მოქმედება</span>
          <span>წყარო</span>
          <span>მომხმარებელი ან სისტემა</span>
          <span>შედეგი</span>
        </div>
        <ul data-testid="activity-list">
          {rows.length === 0 && <li className="p-5">ამ ფილტრით ჩანაწერი არ არის.</li>}
          {rows.map((a) => (
            <li key={a.id} className="grid grid-cols-1 gap-1 border-b border-umber/20 px-5 py-3.5 text-[15px] last:border-b-0 md:grid-cols-[150px_1fr_140px_190px_170px] md:gap-4">
              <span className="num text-sm text-espresso/80">{fmtDateTime(a.at)}</span>
              <span className="font-medium">{a.action}</span>
              <span>
                <Chip tone="neutral">{SOURCE_LABEL[a.source]}</Chip>
              </span>
              <span className="text-sm">
                <span className="md:hidden text-espresso/75">მომხმარებელი: </span>
                {a.actor}
              </span>
              <span className="text-sm font-semibold">
                <span className="md:hidden font-normal text-espresso/75">შედეგი: </span>
                {a.result}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
