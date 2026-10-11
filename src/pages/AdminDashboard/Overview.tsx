import { Link } from 'react-router-dom';
import { CheckCircle, CaretRight, WarningOctagon, Warning, Flask } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { SensorChart } from '../../components/charts/SensorChart';
import { TARGETS } from '../../data/content/labels';
import { HEALTH_LABEL, overallHealth } from '../../lib/mockAutomation/helpers';
import { useAdmin, type ScenarioName } from '../../lib/adminStore';
import { cycleDayLabel, f1, fmtDate, fmtTime, timeAgo } from '../../lib/format';
import type { SectionId } from '../../types';
import { DeviceCard } from './Devices';
import { ProcessTimeline, useSectionInfo } from './Sections';
import { AlertCard, SectionChip, rate, trendOf } from './parts';

const SCENARIOS: { name: ScenarioName; label: string }[] = [
  { name: 'humidity-drop-b', label: 'ტენიანობის დაცემა სექცია B-ში' },
  { name: 'temp-high-a', label: 'ტემპერატურის მომატება სექცია A-ში' },
  { name: 'ph-low-a', label: 'pH-ის გადახრა სექცია A-ში' },
  { name: 'sensor-offline-b', label: 'ტენიანობის სენსორის გათიშვა (B)' },
  { name: 'sensor-fault-a', label: 'ტემპერატურის სენსორის დაზიანება (A)' },
  { name: 'mixer-error', label: 'შემრევის შეცდომა' },
  { name: 'restore', label: 'საწყისი მონაცემების აღდგენა' },
];

const hhmmss = (t: number) => new Date(t).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

function Kpi({
  label,
  value,
  unit,
  rating,
  trend,
  updated,
  children,
}: {
  label: string;
  value: string;
  unit: string;
  rating: ReturnType<typeof rate>;
  trend: ReturnType<typeof trendOf>;
  updated: number;
  children?: React.ReactNode;
}) {
  const T = trend.icon;
  return (
    <article className="panel flex flex-col gap-2.5" data-testid={`kpi-${label}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <h3 className="text-base font-semibold">{label}</h3>
        <Chip tone={rating.tone}>{rating.label}</Chip>
      </div>
      <p className="num text-[2.6rem] font-semibold leading-none">
        {value}
        <span className="ml-1 text-xl font-medium">{unit}</span>
      </p>
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <T size={16} weight="bold" aria-hidden /> {trend.text}
      </p>
      <p className="text-sm text-espresso/85">{rating.explain}</p>
      {children}
      <p className="mt-auto text-xs text-espresso/75">ბოლო განახლება: {hhmmss(updated)}</p>
    </article>
  );
}

export default function Overview() {
  const { state, dispatch } = useAdmin();
  const selId = state.selectedSection;
  const sec = state.sections[selId];
  const info = useSectionInfo(sec);
  const hist = state.history[selId];
  const health = overallHealth(state.alerts);
  const open = state.alerts.filter((a) => a.status !== 'resolved');
  const severity = (k: string) => (k === 'critical' || k === 'device_error' ? 0 : k === 'warning' || k === 'sensor_offline' ? 1 : 2);
  const sorted = [...open].sort((a, b) => severity(a.kind) - severity(b.kind) || b.createdAt - a.createdAt);
  const urgent = sorted.filter((a) => severity(a.kind) < 2 && a.status === 'active');
  const actions = sorted.slice(0, 4);
  const sensorsOnline = state.sensors.filter((s) => s.status === 'online').length;
  const devicesOk = Object.values(state.devices).filter((d) => !d.faulty).length;
  const HealthIcon = health === 'ok' ? CheckCircle : health === 'warning' ? Warning : WarningOctagon;

  const r = sec.reading;
  const phRate = rate('ph', r.ph, info.ok('ph'));
  const tRate = rate('temperature', r.temperature, info.ok('temperature'));
  const hRate = rate('humidity', r.humidity, info.ok('humidity'));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* 1. სათაური და საერთო მდგომარეობა */}
      <header className="lg:col-span-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-tight">სისტემა კონტროლდება.</h1>
            <p className="mt-1 text-espresso/80">
              ბოლო განახლება: <span className="num font-semibold">{hhmmss(state.now)}</span>. მონაცემები სატესტოა.
            </p>
          </div>
          <div
            data-testid="health"
            data-health={health}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${health === 'ok' ? 'bg-espresso text-cream' : health === 'warning' ? 'bg-ochre/20 ring-1 ring-ochre/60' : 'bg-brick text-cream'}`}
          >
            <HealthIcon size={28} weight="fill" aria-hidden />
            <div>
              <p className="text-lg font-semibold leading-tight">{HEALTH_LABEL[health]}</p>
              <p className="text-xs opacity-90">
                სენსორები {sensorsOnline}/{state.sensors.length}, მოწყობილობები {devicesOk}/2 გამართულია, ღია გაფრთხილება: {open.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. კრიტიკული გაფრთხილებები */}
      {urgent.length > 0 && (
        <section aria-label="გადაუდებელი გაფრთხილებები" className="grid grid-cols-1 gap-3 lg:col-span-12">
          {urgent.slice(0, 2).map((a) => (
            <AlertCard key={a.id} alert={a} compact />
          ))}
          {urgent.length > 2 && (
            <Link to="/admin/alerts" className="text-sm font-semibold underline underline-offset-4">
              კიდევ {urgent.length - 2} გაფრთხილება
            </Link>
          )}
        </section>
      )}

      {/* სექციის არჩევა */}
      <div className="flex flex-wrap items-center gap-2 lg:col-span-12" role="group" aria-label="სექციის არჩევა">
        <span className="mr-1 text-sm font-semibold">მაჩვენებლები:</span>
        {(['A', 'B', 'C'] as SectionId[]).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={selId === id}
            onClick={() => dispatch({ type: 'selectSection', id })}
            className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${selId === id ? 'bg-espresso text-cream' : 'border border-umber/60 hover:bg-umber hover:text-cream'}`}
          >
            სექცია {id}
          </button>
        ))}
      </div>

      {/* 3. მიმდინარე სენსორული მონაცემები */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
        <Kpi label="pH" value={f1(r.ph)} unit="" rating={phRate} trend={trendOf(hist.ph, r.ph, 9, 0.08)} updated={state.now} />
        <Kpi label="ტემპერატურა" value={f1(r.temperature)} unit="°C" rating={tRate} trend={trendOf(hist.temperature, r.temperature, 3, 0.4)} updated={state.now} />
        <Kpi label="ტენიანობა" value={f1(r.humidity)} unit="%" rating={hRate} trend={trendOf(hist.humidity, r.humidity, 3, 1.2)} updated={state.now} />
        <Kpi
          label="ციკლის პროგრესი"
          value={sec.startedAt ? `${info.day}` : '—'}
          unit={sec.startedAt ? ` / ${sec.cycleLengthDays} დღე` : ''}
          rating={{ label: sec.startedAt ? 'მიმდინარეობს' : 'ციკლი არ არის', tone: sec.startedAt ? 'ok' : 'neutral', explain: sec.startedAt ? `${cycleDayLabel(info.day, sec.cycleLengthDays)}. აქტიური სექცია: ${sec.id}.` : 'ამ სექციაში ახალი ციკლი ჯერ არ დაწყებულა.' }}
          trend={{ icon: CaretRight, text: sec.startedAt ? `დასრულება: ${fmtDate(info.expectedEnd!)}` : 'ახალი ციკლი შეგიძლიათ დაიწყოთ სექციების გვერდზე', d: 0 }}
          updated={state.now}
        >
          <div className="h-2.5 overflow-hidden rounded-sm bg-sand/80" role="progressbar" aria-valuenow={info.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`ციკლის პროგრესი ${info.pct}%`}>
            <div className="h-full bg-espresso" style={{ width: `${info.pct}%` }} />
          </div>
        </Kpi>
      </div>

      {/* 4. აქტიური ციკლი */}
      <section className="panel lg:col-span-7" aria-labelledby="cycle-h">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="cycle-h" className="text-xl font-semibold">
              სექცია {sec.id}: ციკლი
            </h2>
            <p className="text-sm text-espresso/80">{sec.wasteType ?? 'სექცია ცარიელია'}</p>
          </div>
          <SectionChip status={sec.status} />
        </div>
        <div className="mt-5">
          <ProcessTimeline status={sec.status} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-espresso/75">დაწყება</dt>
            <dd className="font-semibold">{sec.startedAt ? fmtDate(sec.startedAt) : '—'}</dd>
          </div>
          <div>
            <dt className="text-espresso/75">მოსალოდნელი დასრულება</dt>
            <dd className="font-semibold">{info.expectedEnd ? fmtDate(info.expectedEnd) : '—'}</dd>
          </div>
          <div>
            <dt className="text-espresso/75">ბოლო შემოწმება</dt>
            <dd className="font-semibold">{sec.lastCheckAt ? timeAgo(sec.lastCheckAt, state.now) : '—'}</dd>
          </div>
        </dl>
        <div className="mt-5">
          <Link to="/admin/sections" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
            სექციების მართვა <CaretRight size={14} aria-hidden />
          </Link>
        </div>
      </section>

      {/* 5. მოწყობილობები */}
      <section className="grid grid-cols-1 gap-4 lg:col-span-5" aria-label="მოწყობილობები">
        <DeviceCard device={state.devices.humidifier} compact />
        <DeviceCard device={state.devices.mixer} compact />
      </section>

      {/* 6. ოპერატორისთვის საჭირო მოქმედებები */}
      <section className="lg:col-span-12" aria-labelledby="actions-h">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="actions-h" className="text-xl font-semibold">
            რა უნდა გააკეთოს ოპერატორმა
          </h2>
          <Link to="/admin/alerts" className="text-sm font-semibold underline underline-offset-4">
            ყველა გაფრთხილება
          </Link>
        </div>
        {actions.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {actions.map((a) => (
              <AlertCard key={a.id} alert={a} compact />
            ))}
          </div>
        ) : (
          <p className="panel flex items-center gap-3">
            <CheckCircle size={24} weight="fill" aria-hidden /> ამ ეტაპზე ოპერატორის მოქმედება საჭირო არ არის.
          </p>
        )}
      </section>

      {/* 7. გრაფიკები */}
      <section className="grid grid-cols-1 gap-4 lg:col-span-12 lg:grid-cols-2" aria-label="ისტორიული გრაფიკები">
        <SensorChart
          title="ტენიანობა"
          subtitle={`სექცია ${selId}, ბოლო 24 საათი`}
          unit="%"
          data={hist.humidity}
          current={r.humidity}
          target={TARGETS.humidity}
          axis="time"
          statusText={hRate.label}
          description={hRate.explain}
        />
        <SensorChart
          title="ტემპერატურა"
          subtitle={`სექცია ${selId}, ბოლო 24 საათი`}
          unit="°C"
          data={hist.temperature}
          current={r.temperature}
          target={TARGETS.temperature}
          axis="time"
          statusText={tRate.label}
          description={tRate.explain}
        />
        <div className="lg:col-span-2">
          <SensorChart
            title="pH"
            subtitle={`სექცია ${selId}, ბოლო 7 დღე`}
            unit=""
            data={hist.ph}
            current={r.ph}
            target={TARGETS.ph}
            axis="day"
            statusText={phRate.label}
            description={phRate.explain}
          />
        </div>
      </section>

      {/* 8. სატესტო სცენარები */}
      <section className="panel lg:col-span-12" aria-labelledby="sim-h">
        <h2 id="sim-h" className="flex items-center gap-2 text-xl font-semibold">
          <Flask size={22} aria-hidden /> სატესტო სცენარები
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-espresso/85">
          გამოცადეთ, როგორ რეაგირებს სისტემა გადახრებზე. სცენარები მხოლოდ დემო მონაცემებს ცვლის და რეალურ მოწყობილობაზე გავლენას არ ახდენს.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <Button key={s.name} size="sm" variant={s.name === 'restore' ? 'primary' : 'secondary'} onClick={() => dispatch({ type: 'scenario', name: s.name })}>
              {s.label}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-espresso/75">ბოლო სიმულაციური განახლება: {fmtTime(state.now)}. სენსორის გათიშვის სცენარი ხუთწუთიან დუმილს აიმიტირებს.</p>
      </section>
    </div>
  );
}
