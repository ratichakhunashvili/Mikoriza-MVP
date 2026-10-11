import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Modal } from '../../components/ui/Modal';
import type { Section, SectionStatus } from '../../types';
import { SECTION_STATUS_LABEL, SECTION_STATUS_ORDER, WASTE_TYPES, sensorName } from '../../data/content/labels';
import { useAdmin } from '../../lib/adminStore';
import { DAY, cycleDay, cycleDayLabel, f1, fmtDate, fmtDateTime, timeAgo } from '../../lib/format';
import { PageHeader, SectionChip, rate, useGate } from './parts';

const STAGES: { s: SectionStatus; label: string }[] = [
  { s: 'filling', label: 'შევსება' },
  { s: 'active', label: 'აქტიური' },
  { s: 'stabilizing', label: 'სტაბილიზაცია' },
  { s: 'ready', label: 'მზადაა' },
  { s: 'completed', label: 'დასრულდა' },
];

export function ProcessTimeline({ status }: { status: SectionStatus }) {
  const idx = STAGES.findIndex((x) => x.s === status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="პროცესის ეტაპები">
      {STAGES.map((st, i) => {
        const done = i < idx;
        const cur = i === idx;
        return (
          <li key={st.s} className="min-w-0" aria-current={cur ? 'step' : undefined}>
            <div className={`h-2 rounded-sm ${done ? 'bg-umber' : cur ? 'bg-espresso' : 'bg-sand/70'}`} />
            <p className={`mt-1.5 break-words text-[11px] leading-tight sm:text-xs ${cur ? 'font-bold' : 'text-espresso/75'}`}>
              {st.label}
              {cur && <span className="sr-only"> (მიმდინარე ეტაპი)</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function useSectionInfo(sec: Section) {
  const { state } = useAdmin();
  const day = cycleDay(sec.startedAt, sec.cycleLengthDays, state.now);
  const ok = (k: 'ph' | 'temperature' | 'humidity') => state.sensors.find((x) => x.sectionId === sec.id && x.kind === k)?.status === 'online';
  return {
    day,
    expectedEnd: sec.startedAt ? sec.startedAt + sec.cycleLengthDays * DAY : null,
    ok,
    pct: sec.startedAt ? Math.round((day / sec.cycleLengthDays) * 100) : 0,
  };
}

function Metric({ label, value, unit, rating }: { label: string; value: string; unit: string; rating: ReturnType<typeof rate> }) {
  return (
    <div className="rounded-lg bg-cream/70 p-3">
      <p className="text-xs text-espresso/75">{label}</p>
      <p className="num mt-0.5 text-2xl font-semibold leading-none">
        {value}
        <span className="text-base font-medium">{unit}</span>
      </p>
      <p className="mt-1.5 text-xs font-semibold">{rating.label}</p>
    </div>
  );
}

function SectionCard({ sec }: { sec: Section }) {
  const { state, dispatch } = useAdmin();
  const gate = useGate('section_actions');
  const info = useSectionInfo(sec);
  const [details, setDetails] = useState(false);
  const [start, setStart] = useState(false);
  const [change, setChange] = useState(false);
  const [waste, setWaste] = useState(WASTE_TYPES[0]);
  const [newStatus, setNewStatus] = useState<SectionStatus>(sec.status);
  const [confirmPrev, setConfirmPrev] = useState(false);
  const needsConfirm = sec.status !== 'empty' && sec.status !== 'completed';
  const related = state.alerts.filter((a) => a.sectionId === sec.id && a.status !== 'resolved');
  const empty = sec.status === 'empty';

  return (
    <article className="panel flex flex-col gap-4" data-testid={`section-${sec.id}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold">სექცია {sec.id}</h2>
        <SectionChip status={sec.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="col-span-2">
          <dt className="text-espresso/75">ნარჩენის ტიპი</dt>
          <dd className="font-semibold">{sec.wasteType ?? 'სექცია ცარიელია'}</dd>
        </div>
        <div>
          <dt className="text-espresso/75">დაწყების თარიღი</dt>
          <dd className="font-semibold">{sec.startedAt ? fmtDate(sec.startedAt) : '—'}</dd>
        </div>
        <div>
          <dt className="text-espresso/75">მოსალოდნელი დასრულება</dt>
          <dd className="font-semibold">{info.expectedEnd ? fmtDate(info.expectedEnd) : '—'}</dd>
        </div>
        <div>
          <dt className="text-espresso/75">ციკლის დღე</dt>
          <dd className="font-semibold">{sec.startedAt ? cycleDayLabel(info.day, sec.cycleLengthDays) : '—'}</dd>
        </div>
        <div>
          <dt className="text-espresso/75">ბოლო შემოწმება</dt>
          <dd className="font-semibold">{sec.lastCheckAt ? timeAgo(sec.lastCheckAt, state.now) : 'ჯერ არ შემოწმებულა'}</dd>
        </div>
      </dl>

      {sec.startedAt && (
        <div>
          <div className="h-2.5 overflow-hidden rounded-sm bg-sand/70" role="progressbar" aria-valuenow={info.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`ციკლის პროგრესი: ${info.pct}%`}>
            <div className="h-full bg-espresso" style={{ width: `${info.pct}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Metric label="pH" value={f1(sec.reading.ph)} unit="" rating={rate('ph', sec.reading.ph, info.ok('ph'))} />
        <Metric label="ტემპერატურა" value={f1(sec.reading.temperature)} unit="°C" rating={rate('temperature', sec.reading.temperature, info.ok('temperature'))} />
        <Metric label="ტენიანობა" value={f1(sec.reading.humidity)} unit="%" rating={rate('humidity', sec.reading.humidity, info.ok('humidity'))} />
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setDetails(true)}>
          დეტალები
        </Button>
        <Button size="sm" {...gate} disabled={gate.disabled || empty} onClick={() => dispatch({ type: 'sectionCheck', id: sec.id })} icon={<CheckCircle size={16} aria-hidden />}>
          შემოწმება დასრულებულია
        </Button>
        <Button size="sm" variant="secondary" {...gate} onClick={() => { setConfirmPrev(false); setStart(true); }}>
          ახალი ციკლი
        </Button>
        <Button size="sm" variant="ghost" {...gate} onClick={() => { setNewStatus(sec.status); setChange(true); }}>
          სტატუსის შეცვლა
        </Button>
      </div>

      {/* დეტალები */}
      <Modal open={details} onClose={() => setDetails(false)} title={`სექცია ${sec.id}: დეტალები`} footer={<Button onClick={() => setDetails(false)}>დახურვა</Button>}>
        <div className="space-y-5">
          <ProcessTimeline status={sec.status} />
          <div>
            <h3 className="font-semibold">სენსორები</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {state.sensors
                .filter((x) => x.sectionId === sec.id)
                .map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-3">
                    <span>{sensorName(x)}</span>
                    <Chip tone={x.status === 'online' ? 'ok' : x.status === 'offline' ? 'warn' : 'crit'}>
                      {x.status === 'online' ? 'მუშაობს' : x.status === 'offline' ? 'offline' : 'დაზიანებულია'}
                    </Chip>
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">ღია გაფრთხილებები</h3>
            {related.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {related.map((a) => (
                  <li key={a.id}>{a.title}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm">ამ სექციისთვის ღია გაფრთხილება არ არის.</p>
            )}
          </div>
          <p className="text-sm text-espresso/75">ბოლო შემოწმება: {sec.lastCheckAt ? fmtDateTime(sec.lastCheckAt) : 'არ არის'}</p>
        </div>
      </Modal>

      {/* ახალი ციკლი */}
      <Modal
        open={start}
        onClose={() => setStart(false)}
        title={`სექცია ${sec.id}: ახალი ციკლი`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStart(false)}>
              გაუქმება
            </Button>
            <Button
              disabled={needsConfirm && !confirmPrev}
              onClick={() => {
                dispatch({ type: 'sectionStart', id: sec.id, wasteType: waste });
                setStart(false);
              }}
            >
              დაწყება
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor={`waste-${sec.id}`}>ნარჩენის ტიპი</label>
            <select id={`waste-${sec.id}`} value={waste} onChange={(e) => setWaste(e.target.value)} className="mt-1">
              {WASTE_TYPES.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </div>
          {needsConfirm && (
            <label className="flex items-start gap-3 text-[15px] font-normal">
              <input type="checkbox" checked={confirmPrev} onChange={(e) => setConfirmPrev(e.target.checked)} className="mt-1 !w-5" />
              ვადასტურებ, რომ წინა ციკლის მასალა ამოღებულია ან მისი შეწყვეტა მიზანმიმართულია.
            </label>
          )}
          <p className="text-sm text-espresso/75">ციკლი 18 დღიანი სატესტო პარამეტრით დაიწყება.</p>
        </div>
      </Modal>

      {/* სტატუსის შეცვლა */}
      <Modal
        open={change}
        onClose={() => setChange(false)}
        title={`სექცია ${sec.id}: სტატუსი`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setChange(false)}>
              გაუქმება
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: 'sectionStatus', id: sec.id, status: newStatus });
                setChange(false);
              }}
            >
              შენახვა
            </Button>
          </>
        }
      >
        <label htmlFor={`status-${sec.id}`}>ახალი სტატუსი</label>
        <select id={`status-${sec.id}`} value={newStatus} onChange={(e) => setNewStatus(e.target.value as SectionStatus)} className="mt-1">
          {SECTION_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {SECTION_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Modal>
    </article>
  );
}

export default function Sections() {
  const { state } = useAdmin();
  return (
    <div>
      <PageHeader title="სექციები" text="სამი საკომპოსტე სექციის მდგომარეობა, ციკლები და ბოლო შემოწმებები." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 md:grid-cols-2">
        {(['A', 'B', 'C'] as const).map((id) => (
          <SectionCard key={id} sec={state.sections[id]} />
        ))}
      </div>
    </div>
  );
}
