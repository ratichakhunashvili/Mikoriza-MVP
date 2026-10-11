import { useState, type FormEvent } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Chip, type Tone } from '../../components/ui/Chip';
import { Modal } from '../../components/ui/Modal';
import { TASK_STATUS_LABEL, sensorName } from '../../data/content/labels';
import { useAdmin } from '../../lib/adminStore';
import { DAY, dueIn, fmtDate } from '../../lib/format';
import type { TaskStatus } from '../../types';
import { PageHeader, useGate } from './parts';

export const ASSIGNEES = ['ნინო ბერიძე', 'გიორგი მელაძე', 'დავით ქავთარაძე'];

function calStatus(nextAt: number, now: number): { label: string; tone: Tone } {
  if (nextAt < now) return { label: 'ვადა გასულია', tone: 'crit' };
  if (nextAt - now < 14 * DAY) return { label: 'მალე იწურება', tone: 'warn' };
  return { label: 'კალიბრირებულია', tone: 'ok' };
}

export default function Maintenance() {
  const { state, dispatch } = useAdmin();
  const gate = useGate('edit_maintenance');
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get('title') ?? '').trim();
    const due = String(f.get('due') ?? '');
    if (!title) return setErr('მიუთითეთ დავალების სახელი.');
    if (!due) return setErr('აირჩიეთ შესრულების თარიღი.');
    dispatch({
      type: 'addTask',
      task: { title, assignee: String(f.get('assignee')), dueAt: new Date(`${due}T12:00:00`).getTime(), notes: String(f.get('notes') ?? '').trim() || 'შენიშვნა არ არის.', status: 'open' },
    });
    setErr('');
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="ტექნიკური მომსახურება და კალიბრაცია" text="სენსორების კალიბრაციის სტატუსი და ტექნიკური დავალებები." />

      <section aria-labelledby="cal-h">
        <h2 id="cal-h" className="mb-3 text-xl font-semibold">
          სენსორების კალიბრაცია
        </h2>
        <div className="panel !p-0 overflow-hidden">
          <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_auto] gap-4 border-b border-umber/30 bg-sand/50 px-5 py-3 text-sm font-semibold md:grid" aria-hidden>
            <span>სენსორი</span>
            <span>სტატუსი</span>
            <span>ბოლო კალიბრაცია</span>
            <span>შემდეგი კალიბრაცია</span>
            <span className="w-44" />
          </div>
          <ul data-testid="calibration-list">
            {state.calibrations.map((c) => {
              const sensor = state.sensors.find((s) => s.id === c.sensorId)!;
              const st = calStatus(c.nextAt, state.now);
              return (
                <li key={c.sensorId} className="grid grid-cols-1 gap-2 border-b border-umber/20 px-5 py-4 last:border-b-0 md:grid-cols-[1.6fr_1fr_1fr_1fr_auto] md:items-center md:gap-4">
                  <div>
                    <p className="font-semibold">{sensorName(sensor)}</p>
                    {sensor.status !== 'online' && <p className="text-sm font-semibold text-brick">{sensor.status === 'offline' ? 'სენსორი offline-ია' : 'სენსორი დაზიანებულია'}</p>}
                  </div>
                  <div>
                    <Chip tone={st.tone}>{st.label}</Chip>
                  </div>
                  <p className="text-sm">
                    <span className="text-espresso/75 md:hidden">ბოლო: </span>
                    {fmtDate(c.lastAt)}
                  </p>
                  <p className="text-sm">
                    <span className="text-espresso/75 md:hidden">შემდეგი: </span>
                    {fmtDate(c.nextAt)} <span className="text-espresso/75">({dueIn(c.nextAt, state.now)})</span>
                  </p>
                  <Button size="sm" variant="secondary" className="md:w-44" {...gate} onClick={() => dispatch({ type: 'calibrate', sensorId: c.sensorId })}>
                    კალიბრაცია დასრულდა
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-labelledby="task-h" className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="task-h" className="text-xl font-semibold">
            ტექნიკური დავალებები
          </h2>
          <Button size="sm" icon={<Plus size={16} weight="bold" aria-hidden />} {...gate} onClick={() => setOpen(true)}>
            ახალი დავალება
          </Button>
        </div>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2" data-testid="task-list">
          {state.tasks.map((t) => (
            <li key={t.id} className="panel">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold leading-snug">{t.title}</h3>
                <Chip tone={t.status === 'done' ? 'ok' : t.status === 'in_progress' ? 'info' : 'neutral'}>{TASK_STATUS_LABEL[t.status]}</Chip>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-espresso/75">პასუხისმგებელი</dt>
                  <dd className="font-semibold">{t.assignee}</dd>
                </div>
                <div>
                  <dt className="text-espresso/75">ვადა</dt>
                  <dd className="font-semibold">
                    {fmtDate(t.dueAt)} {t.status !== 'done' && <span className="font-normal text-espresso/75">({dueIn(t.dueAt, state.now)})</span>}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[15px] text-espresso/90">
                <span className="font-semibold">შენიშვნა: </span>
                {t.notes}
              </p>
              <div className="mt-4">
                <label htmlFor={`st-${t.id}`} className="text-sm">
                  სტატუსი
                </label>
                <select id={`st-${t.id}`} value={t.status} disabled={gate.disabled} title={gate.title} onChange={(e) => dispatch({ type: 'setTaskStatus', id: t.id, status: e.target.value as TaskStatus })} className="mt-1 !w-auto min-w-44 disabled:opacity-50">
                  {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="ახალი ტექნიკური დავალება">
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="t-title">დავალება</label>
            <input id="t-title" name="title" className="mt-1" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="t-assignee">პასუხისმგებელი</label>
              <select id="t-assignee" name="assignee" className="mt-1">
                {ASSIGNEES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="t-due">ვადა</label>
              <input id="t-due" name="due" type="date" className="mt-1" />
            </div>
          </div>
          <div>
            <label htmlFor="t-notes">შენიშვნა</label>
            <textarea id="t-notes" name="notes" rows={3} className="mt-1" />
          </div>
          {err && (
            <p role="alert" className="rounded-lg bg-brick px-3 py-2 text-sm text-cream">
              {err}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              გაუქმება
            </Button>
            <Button type="submit">დამატება</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
