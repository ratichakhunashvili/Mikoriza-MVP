import { Chip } from '../../components/ui/Chip';
import { Switch } from '../../components/ui/Switch';
import { useAdmin } from '../../lib/adminStore';
import { fmtDateTime, timeAgo } from '../../lib/format';
import { PageHeader, useGate } from './parts';

const TYPE_LABEL = { control: 'მართავს მოწყობილობას', alert: 'ქმნის გაფრთხილებას', protect: 'უსაფრთხოების დაცვა' } as const;

export default function Automation() {
  const { state, dispatch } = useAdmin();
  const gate = useGate('edit_rules');
  return (
    <div>
      <PageHeader title="ავტომატიზაცია" text="წესები, რომლებიც სატესტო სიმულაციაში ამოწმებს მაჩვენებლებს და ახდენს რეაგირებას. რეალური მოწყობილობა არ იმართება." />

      <p className="panel mb-5 flex flex-wrap items-center justify-between gap-3">
        <span>
          <span className="font-semibold">მოწყობილობის მართვის წესები </span>
          მუშაობს მხოლოდ მაშინ, როცა ავტომატური რეჟიმი ჩართულია:
        </span>
        <Chip tone={state.automationEnabled ? 'dark' : 'neutral'}>{state.automationEnabled ? 'ავტომატური რეჟიმი ჩართულია' : 'ავტომატური რეჟიმი გამორთულია'}</Chip>
      </p>

      {gate.disabled && <p className="mb-4 rounded-lg border border-umber/40 p-3 text-sm">წესების ჩართვა და გამორთვა მხოლოდ ადმინისტრატორს შეუძლია. თქვენ ხედავთ წესებს მხოლოდ წასაკითხად.</p>}

      <ul className="space-y-3">
        {state.rules.map((r) => (
          <li key={r.id} className="panel" data-testid={`rule-${r.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{r.title}</h2>
                  <Chip tone="neutral">{TYPE_LABEL[r.type]}</Chip>
                  <Chip tone={r.enabled ? 'ok' : 'neutral'}>{r.enabled ? 'ჩართულია' : 'გამორთულია'}</Chip>
                </div>
                <dl className="mt-3 grid gap-3 text-[15px] sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-espresso/75">პირობა</dt>
                    <dd className="font-semibold">{r.condition}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-espresso/75">მოქმედება</dt>
                    <dd className="font-semibold">{r.action}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-espresso/75">ბოლოს ამოქმედდა</dt>
                    <dd className="font-semibold">{r.lastTriggeredAt ? timeAgo(r.lastTriggeredAt, state.now) : 'ჯერ არ ამოქმედებულა'}</dd>
                    {r.lastTriggeredAt && <dd className="text-xs text-espresso/75">{fmtDateTime(r.lastTriggeredAt)}</dd>}
                  </div>
                </dl>
              </div>
              <Switch checked={r.enabled} label={`წესი: ${r.title}`} disabled={gate.disabled} title={gate.title} onChange={() => dispatch({ type: 'toggleRule', id: r.id })} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
