import { useState } from 'react';
import { CheckCircle, Drop, Lightning, ArrowsClockwise, ShieldCheck, WifiSlash } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Modal } from '../../components/ui/Modal';
import { Switch } from '../../components/ui/Switch';
import type { Device } from '../../types';
import { useAdmin } from '../../lib/adminStore';
import { PERMISSIONS, PERMISSION_LABEL, ROLES, ROLE_LABEL, can as roleCan } from '../../lib/permissions';
import { fmtDateTime, timeAgo } from '../../lib/format';
import { PageHeader, useGate } from './parts';

export function DeviceCard({ device, compact = false }: { device: Device; compact?: boolean }) {
  const { state, dispatch, lockReason } = useAdmin();
  const gate = useGate('control_devices');
  const [confirm, setConfirm] = useState(false);
  const Icon = device.id === 'humidifier' ? Drop : ArrowsClockwise;
  const blocked = gate.disabled || !!lockReason;
  const hint = gate.title ?? lockReason ?? undefined;

  const press = () => {
    // მექანიკური მოწყობილობის ჩართვას დადასტურება სჭირდება
    if (device.id === 'mixer' && !device.on) setConfirm(true);
    else dispatch({ type: 'toggleDevice', id: device.id });
  };

  return (
    <article className="panel flex flex-col gap-4" data-testid={`device-${device.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-espresso text-cream">
            <Icon size={24} aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-semibold leading-tight">{device.name}</h3>
            <p className="text-sm text-espresso/80">
              {device.faulty ? 'გაუმართავია' : device.on ? 'ჩართულია (დემო)' : 'გამორთულია'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Chip tone={device.faulty ? 'crit' : device.on ? 'dark' : 'neutral'}>{device.faulty ? 'შეცდომა' : device.on ? 'ჩართულია' : 'გამორთულია'}</Chip>
          <Chip tone="info">{device.mode === 'auto' ? 'ავტომატური რეჟიმი' : 'ხელით რეჟიმი'}</Chip>
        </div>
      </div>

      {!compact && <p className="text-[15px] text-espresso/90">{device.description}</p>}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-espresso/75">ბოლო ჩართვა</dt>
          <dd className="font-semibold">{device.lastOnAt ? `${timeAgo(device.lastOnAt, state.now)}` : 'ჯერ არ ჩართულა'}</dd>
          {!compact && device.lastOnAt && <dd className="text-xs text-espresso/75">{fmtDateTime(device.lastOnAt)}</dd>}
        </div>
        <div>
          <dt className="text-espresso/75">მაქს. ხანგრძლივობა</dt>
          <dd className="font-semibold">{device.maxRuntimeMin} წუთი</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={device.on ? 'primary' : 'secondary'}
          disabled={blocked}
          title={hint}
          aria-pressed={device.on}
          onClick={press}
        >
          {device.on ? 'გამორთვა' : 'ჩართვა'}
        </Button>
        {device.autoCapable ? (
          <div role="group" aria-label={`${device.name}: რეჟიმი`} className="flex overflow-hidden rounded-lg border border-umber/60">
            {(['auto', 'manual'] as const).map((m) => (
              <button
                key={m}
                type="button"
                disabled={blocked}
                title={hint}
                aria-pressed={device.mode === m}
                onClick={() => dispatch({ type: 'setDeviceMode', id: device.id, mode: m })}
                className={`min-h-11 px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${device.mode === m ? 'bg-espresso text-cream' : 'hover:bg-espresso/10'}`}
              >
                {m === 'auto' ? 'ავტომატური' : 'ხელით'}
              </button>
            ))}
          </div>
        ) : (
          !compact && <span className="text-sm text-espresso/75">ამ ეტაპზე მხოლოდ ხელით იმართება</span>
        )}
      </div>

      {!compact && (
        <p className="flex items-start gap-2 rounded-lg bg-cream/70 p-3 text-sm">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">უსაფრთხოება: </span>
            {device.safety}
          </span>
        </p>
      )}

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="ჩავრთოთ შემრევი?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              გაუქმება
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: 'toggleDevice', id: 'mixer' });
                setConfirm(false);
              }}
            >
              დიახ, ჩართვა
            </Button>
          </>
        }
      >
        <p>შემრევის ჩართვამდე დარწმუნდით, რომ სექციაში ხელს ან უცხო ნივთს არაფერი უშლის. დემო რეჟიმში რეალური მოწყობილობა არ ირთვება.</p>
      </Modal>
    </article>
  );
}

export default function Devices() {
  const { state, dispatch, lockReason } = useAdmin();
  const gate = useGate('control_devices');
  const [offConfirm, setOffConfirm] = useState(false);
  const faultySensor = state.sensors.find((s) => s.status === 'faulty');

  return (
    <div>
      <PageHeader title="მოწყობილობები" text="დამატენიანებლისა და შემრევის მართვა. ყველა მოქმედება დემო რეჟიმშია და ჟურნალში ფიქსირდება." />

      <section aria-labelledby="auto-h" className="on-dark mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-espresso p-5 text-cream sm:p-6">
        <div className="max-w-xl">
          <h2 id="auto-h" className="text-xl font-semibold">
            ავტომატური რეჟიმი
          </h2>
          <p className="mt-1 text-cream/85">
            ჩართულ რეჟიმში დამატენიანებელი მუშაობს ავტომატიზაციის წესებით. ხელით ჩართვისას მოწყობილობა ავტომატურიდან ხელით რეჟიმზე გადადის.
          </p>
          {faultySensor && <p className="mt-2 text-sm font-semibold text-sand">კრიტიკული სენსორი დაზიანებულია, ამიტომ ავტომატური რეჟიმი დაბლოკილია.</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{state.automationEnabled ? 'ჩართულია' : 'გამორთულია'}</span>
          <Switch
            checked={state.automationEnabled}
            label="ავტომატური რეჟიმი"
            disabled={gate.disabled || (!state.automationEnabled && !!lockReason)}
            title={gate.title ?? lockReason ?? undefined}
            onChange={(next) => (next ? dispatch({ type: 'setAutomation', enabled: true }) : setOffConfirm(true))}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DeviceCard device={state.devices.humidifier} />
        <DeviceCard device={state.devices.mixer} />
        <article className="panel lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-espresso text-cream">
                <Lightning size={24} aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-semibold leading-tight">ელექტრო კონტროლის სისტემა</h3>
                <p className="text-sm text-espresso/80">მხოლოდ მდგომარეობის ჩვენება. დისტანციურად არ იმართება.</p>
              </div>
            </div>
            <Chip tone="ok" icon={<CheckCircle size={14} weight="fill" aria-hidden />}>
              კვება ნორმალურია (დემო)
            </Chip>
          </div>
        </article>
      </div>

      <SafetyCenter />

      <Modal
        open={offConfirm}
        onClose={() => setOffConfirm(false)}
        title="გამოვრთოთ ავტომატური რეჟიმი?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOffConfirm(false)}>
              გაუქმება
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: 'setAutomation', enabled: false });
                setOffConfirm(false);
              }}
            >
              გამორთვა
            </Button>
          </>
        }
      >
        <p>ტენიანობის ავტომატური რეგულირება შეჩერდება. ოპერატორმა თავად უნდა აკონტროლოს მაჩვენებლები და მოწყობილობა ხელით ჩართოს.</p>
      </Modal>
    </div>
  );
}

function SafetyCenter() {
  const { state, dispatch } = useAdmin();
  const role = state.auth.role;
  const items = [
    { t: 'საგანგებო გამორთვა', d: 'ხელმისაწვდომია ზედა პანელიდან. ყველა მოწყობილობას გამორთავს და ავტომატურ რეჟიმს გათიშავს.', s: 'სატესტო რეჟიმში მუშაობს' },
    { t: 'ადგილობრივი ხელით მართვა', d: 'რეალურ სისტემაში ფიზიკური ამომრთველი უნდა აჭარბებდეს დისტანციურ ბრძანებას.', s: 'კონცეფცია, მიერთებული არ არის' },
    { t: 'უსაფრთხო რეჟიმი ინტერნეტის გათიშვისას', d: 'კავშირის დაკარგვისას მოწყობილობები გამოირთვება და დისტანციური მართვა დაიბლოკება.', s: 'შეგიძლიათ სიმულაცია გამოსცადოთ' },
    { t: 'მუშაობის მაქსიმალური ხანგრძლივობა', d: `დამატენიანებელი: ${state.devices.humidifier.maxRuntimeMin} წთ, შემრევი: ${state.devices.mixer.maxRuntimeMin} წთ. შემდეგ მოწყობილობა თავისით გამოირთვება.`, s: 'სატესტო რეჟიმში მუშაობს' },
    { t: 'დაცვა სენსორის დაზიანებისას', d: 'კრიტიკული სენსორის დაზიანებისას ავტომატური მართვა გამოირთვება.', s: 'სატესტო რეჟიმში მუშაობს' },
    { t: 'კრიტიკული მოქმედებების დადასტურება', d: 'შემრევის ჩართვას, ავტომატური რეჟიმის გამორთვას და საგანგებო გამორთვას დადასტურება სჭირდება.', s: 'სატესტო რეჟიმში მუშაობს' },
    { t: 'ხელით მოქმედებების audit log', d: 'ყველა მოქმედება ჩაიწერება ჟურნალში მომხმარებლისა და დროის მითითებით.', s: 'სატესტო რეჟიმში მუშაობს' },
  ];
  return (
    <section aria-labelledby="safety-h" className="mt-10">
      <h2 id="safety-h" className="text-2xl font-semibold">
        უსაფრთხოება
      </h2>
      <p className="mt-1 max-w-2xl text-espresso/80">დისტანციური მართვა შეზღუდულია უსაფრთხოების წესებით. ეს ფუნქციები დემოში სიმულაციით არის წარმოდგენილი.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-12">
        <ul className="lg:col-span-7">
          {items.map((i, idx) => (
            <li key={i.t} className={`border-b border-umber/30 py-4 ${idx === 0 ? 'border-t' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-semibold">{i.t}</h3>
                <Chip tone="neutral">{i.s}</Chip>
              </div>
              <p className="mt-1 text-[15px] text-espresso/85">{i.d}</p>
            </li>
          ))}
        </ul>

        <div className="space-y-4 lg:col-span-5">
          <div className="panel">
            <h3 className="text-lg font-semibold">ინტერნეტის გათიშვის სიმულაცია</h3>
            <p className="mt-1 text-sm text-espresso/85">გამოსცადეთ, როგორ იქცევა სისტემა კავშირის დაკარგვისას.</p>
            <Button
              className="mt-3"
              variant={state.safeMode ? 'primary' : 'secondary'}
              icon={<WifiSlash size={18} aria-hidden />}
              onClick={() => dispatch({ type: 'setSafeMode', on: !state.safeMode })}
            >
              {state.safeMode ? 'კავშირის აღდგენა' : 'კავშირის გათიშვა'}
            </Button>
          </div>

          <div className="panel overflow-x-auto">
            <h3 className="text-lg font-semibold">როლები და უფლებები</h3>
            <table className="mt-3 w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-umber/40">
                  <th scope="col" className="py-2 pr-2 font-semibold">
                    მოქმედება
                  </th>
                  {ROLES.map((r) => (
                    <th key={r} scope="col" className={`px-1 py-2 text-center text-xs font-semibold ${r === role ? 'bg-espresso text-cream' : ''}`}>
                      {ROLE_LABEL[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p) => (
                  <tr key={p} className="border-b border-umber/20">
                    <th scope="row" className="py-2 pr-2 font-medium">
                      {PERMISSION_LABEL[p]}
                    </th>
                    {ROLES.map((r) => (
                      <td key={r} className="px-1 py-2 text-center">
                        {roleCan(r, p) ? (
                          <span aria-label="ნებადართულია">
                            <CheckCircle size={20} weight="fill" className="inline" aria-hidden />
                          </span>
                        ) : (
                          <span aria-label="აკრძალულია" className="text-espresso/70">
                            არა
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-espresso/75">ამჟამინდელი დემო როლი: {ROLE_LABEL[role]}. როლი ზედა პანელიდან იცვლება.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
