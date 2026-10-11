import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ClockCounterClockwise,
  DotsThree,
  Faders,
  House,
  Power,
  SignOut,
  SlidersHorizontal,
  SquaresFour,
  WifiSlash,
  Wrench,
  WarningOctagon,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import type { IconProps } from '@phosphor-icons/react';
import { Logo } from '../../components/brand/Logo';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Modal } from '../../components/ui/Modal';
import { useAdmin, useTicker } from '../../lib/adminStore';
import { ROLES, ROLE_LABEL } from '../../lib/permissions';
import { DEMO_NOTIFICATIONS } from '../../data/mockData/notifications';
import { ALERT_KIND_LABEL } from '../../data/content/labels';
import { timeAgo } from '../../lib/format';
import type { Role } from '../../types';
import { ALERT_TONE, useGate } from './parts';

interface Item {
  to: string;
  label: string;
  icon: ComponentType<IconProps>;
  end?: boolean;
  short?: string;
}
const ITEMS: Item[] = [
  { to: '/admin', label: 'მიმოხილვა', icon: House, end: true },
  { to: '/admin/sections', label: 'სექციები', icon: SquaresFour },
  { to: '/admin/devices', label: 'მოწყობილობები', short: 'მართვა', icon: Faders },
  { to: '/admin/alerts', label: 'გაფრთხილებები', short: 'გაფრთხილება', icon: Bell },
  { to: '/admin/automation', label: 'ავტომატიზაცია', icon: SlidersHorizontal },
  { to: '/admin/activity', label: 'ჟურნალი', icon: ClockCounterClockwise },
  { to: '/admin/maintenance', label: 'მომსახურება', icon: Wrench },
  { to: '/admin/guide', label: 'ცნობარი', icon: BookOpen },
];
const MOBILE_MAIN = ['/admin', '/admin/alerts', '/admin/devices', '/admin/sections'];

export default function Layout() {
  useTicker();
  const { state, dispatch } = useAdmin();
  const [moreOpen, setMoreOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const stopGate = useGate('emergency_stop');
  const [bellOpen, setBellOpen] = useState(false);
  const [feedOn, setFeedOn] = useState(true);
  const [feedIdx, setFeedIdx] = useState(0);

  // სატესტო ნაკადი: პირველი შეტყობინება ~7 წამში, შემდეგ ყოველ 18 წამში (ერთი სრული წრე)
  useEffect(() => {
    if (!feedOn || feedIdx >= DEMO_NOTIFICATIONS.length) return;
    const id = window.setTimeout(() => {
      dispatch({ type: 'demoNotify', index: feedIdx });
      setFeedIdx((i) => i + 1);
    }, feedIdx === 0 ? 7000 : 18000);
    return () => window.clearTimeout(id);
  }, [feedOn, feedIdx, dispatch]);
  useEffect(() => {
    if (!bellOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBellOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [bellOpen]);

  const recent = state.alerts
    .filter((a) => a.status !== 'resolved')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);
  const openAlerts = state.alerts.filter((a) => a.status === 'active').length;

  const roleSelect = (id: string) => (
    <div>
      <label htmlFor={id} className="sr-only">
        დემო როლი
      </label>
      <select id={id} value={state.auth.role} onChange={(e) => dispatch({ type: 'setRole', role: e.target.value as Role })} className="!w-auto !py-1.5 text-sm" title="დემო როლის შეცვლა">
        {ROLES.map((r) => (
          <option key={r} value={r}>
            როლი: {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
    </div>
  );

  const badge = (to: string) =>
    to === '/admin/alerts' && openAlerts > 0 ? (
      <span className="num ml-auto rounded-md bg-cream px-1.5 py-0.5 text-xs font-bold text-espresso" aria-label={`${openAlerts} ახალი გაფრთხილება`}>
        {openAlerts}
      </span>
    ) : null;

  const moreActive = !MOBILE_MAIN.includes(loc.pathname);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      {/* გვერდითი მენიუ (დესკტოპი) */}
      <aside className="on-dark sticky top-0 hidden h-screen flex-col bg-espresso p-5 text-cream lg:flex">
        <div className="px-1 pb-6 pt-1">
          <Logo tone="light" compact />
        </div>
        <nav aria-label="პანელის მენიუ" className="flex flex-1 flex-col gap-1">
          {ITEMS.map(({ to, label, icon: I, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${isActive ? 'bg-cream text-espresso' : 'text-cream/90 hover:bg-cream/10'}`
              }
            >
              <I size={22} aria-hidden />
              {label}
              {badge(to)}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-cream/15 pt-4 text-sm text-sand">
          <p>დემო ვერსია. რეალური მოწყობილობები მიერთებული არ არის.</p>
          <Link to="/" className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-cream hover:bg-cream/10">
            <SignOut size={20} aria-hidden /> მთავარ გვერდზე
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        {/* ზედა პანელი */}
        <header className="sticky top-0 z-30 flex min-h-[60px] items-center justify-between gap-3 border-b border-umber/25 bg-cream px-4 sm:px-6">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Chip tone="neutral">დემო რეჟიმი</Chip>
            <span className="text-sm text-espresso/80">მონაცემები სატესტოა</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">{roleSelect('role-top')}</div>
            <div className="relative">
              <button
                type="button"
                aria-label={`შეტყობინებები: ${openAlerts} ახალი`}
                aria-expanded={bellOpen}
                aria-haspopup="true"
                onClick={() => setBellOpen((v) => !v)}
                className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-umber/50 hover:bg-espresso/10"
              >
                <Bell size={22} aria-hidden />
                {openAlerts > 0 && (
                  <span data-testid="bell-count" className="num absolute -right-1.5 -top-1.5 min-w-5 rounded-md bg-brick px-1 text-center text-[11px] font-bold leading-5 text-cream">
                    {openAlerts}
                  </span>
                )}
              </button>
              {bellOpen && (
                <>
                  <button type="button" aria-label="დახურვა" className="fixed inset-0 z-40 cursor-default" onClick={() => setBellOpen(false)} />
                  <div role="dialog" aria-label="შეტყობინებები" className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(92vw,390px)] rounded-2xl bg-cream p-4 shadow-lift ring-1 ring-umber/30">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="font-display text-xl font-semibold">შეტყობინებები</h2>
                      <Chip tone={feedOn && feedIdx < DEMO_NOTIFICATIONS.length ? 'dark' : 'neutral'}>
                        {feedOn && feedIdx < DEMO_NOTIFICATIONS.length ? 'სატესტო ნაკადი' : 'ნაკადი შეჩერებულია'}
                      </Chip>
                    </div>
                    <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
                      {recent.length === 0 && <li className="text-sm">ახალი შეტყობინება არ არის.</li>}
                      {recent.map((a) => (
                        <li key={a.id}>
                          <Link to="/admin/alerts" onClick={() => setBellOpen(false)} className="block rounded-xl border border-umber/25 bg-sand/30 p-3 hover:bg-sand/60">
                            <div className="flex items-center justify-between gap-2">
                              <Chip tone={ALERT_TONE[a.kind]}>{ALERT_KIND_LABEL[a.kind]}</Chip>
                              <span className="text-xs text-espresso/75">{timeAgo(a.createdAt, state.now)}</span>
                            </div>
                            <p className="mt-1.5 text-[15px] font-semibold leading-snug">{a.title}</p>
                            <p className="mt-0.5 text-sm text-espresso/85">{a.action}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-umber/25 pt-3">
                      <Button size="sm" variant="secondary" onClick={() => { dispatch({ type: 'demoNotify', index: feedIdx }); setFeedIdx((i) => i + 1); }}>
                        გამოგზავნე ახლა
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setFeedOn((v) => !v); }}>
                        {feedOn ? 'ნაკადის შეჩერება' : 'ნაკადის გაგრძელება'}
                      </Button>
                      <Link to="/admin/alerts" onClick={() => setBellOpen(false)} className="ml-auto text-sm font-semibold underline underline-offset-4">
                        ყველა
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="danger"
              size="sm"
              icon={<Power size={18} weight="bold" aria-hidden />}
              {...stopGate}
              onClick={() => (state.emergencyStop ? dispatch({ type: 'releaseEmergency' }) : setStopOpen(true))}
            >
              {state.emergencyStop ? 'გამორთვის გათავისუფლება' : 'საგანგებო გამორთვა'}
            </Button>
          </div>
        </header>

        {state.emergencyStop && (
          <div role="alert" className="flex flex-wrap items-center gap-3 bg-brick px-4 py-3 text-cream sm:px-6">
            <WarningOctagon size={22} weight="fill" aria-hidden />
            <p className="flex-1 text-[15px] font-semibold">საგანგებო გამორთვა აქტიურია. მოწყობილობები გამორთულია და მართვა დაბლოკილია, სანამ არ გაათავისუფლებთ.</p>
          </div>
        )}
        {state.safeMode && (
          <div role="alert" className="flex flex-wrap items-center gap-3 bg-ochre px-4 py-3 text-cream sm:px-6">
            <WifiSlash size={22} weight="fill" aria-hidden />
            <p className="flex-1 text-[15px] font-semibold">უსაფრთხო რეჟიმი: კავშირი გაწყვეტილია. დისტანციური მართვა დაბლოკილია.</p>
            <Button size="sm" variant="light" onClick={() => dispatch({ type: 'setSafeMode', on: false })}>
              კავშირის აღდგენა (სიმულაცია)
            </Button>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* ქვედა ნავიგაცია (მობილური) */}
      <nav aria-label="მობილური ნავიგაცია" className="on-dark fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 bg-espresso pb-[env(safe-area-inset-bottom,0px)] text-cream lg:hidden">
        {ITEMS.filter((i) => MOBILE_MAIN.includes(i.to)).map(({ to, label, short, icon: I, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[10.5px] font-medium ${isActive ? 'bg-cream/15' : ''}`}
          >
            <I size={24} aria-hidden />
            <span aria-label={label}>{short ?? label}</span>
            {to === '/admin/alerts' && openAlerts > 0 && (
              <span className="num absolute right-3 top-2 rounded-md bg-cream px-1.5 text-[11px] font-bold text-espresso">{openAlerts}</span>
            )}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMoreOpen(true)} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${moreActive ? 'bg-cream/15' : ''}`}>
          <DotsThree size={26} weight="bold" aria-hidden />
          მეტი
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="მენიუ">
        <div className="flex flex-col">
          {ITEMS.filter((i) => !MOBILE_MAIN.includes(i.to)).map(({ to, label, icon: I }) => (
            <NavLink key={to} to={to} onClick={() => setMoreOpen(false)} className="flex min-h-12 items-center gap-3 border-b border-umber/20 text-lg font-medium">
              <I size={22} aria-hidden /> {label}
            </NavLink>
          ))}
        </div>
        <div className="mt-5">{roleSelect('role-mobile')}</div>
        <Button
          variant="secondary"
          className="mt-4 w-full"
          icon={<SignOut size={18} aria-hidden />}
          onClick={() => {
            setMoreOpen(false);
            navigate('/');
          }}
        >
          მთავარ გვერდზე
        </Button>
      </Modal>

      <Modal
        open={stopOpen}
        onClose={() => setStopOpen(false)}
        title="საგანგებო გამორთვა"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStopOpen(false)}>
              გაუქმება
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                dispatch({ type: 'emergencyStop' });
                setStopOpen(false);
              }}
            >
              გამორთვა
            </Button>
          </>
        }
      >
        <p>ყველა მოწყობილობა გამოირთვება და ავტომატური რეჟიმი გაითიშება. მართვა დაბლოკილი იქნება, სანამ გამორთვას არ გაათავისუფლებთ.</p>
        <p className="mt-3 text-sm text-espresso/75">დემო რეჟიმში ეს მხოლოდ ინტერფეისის სიმულაციაა. რეალური მოწყობილობა არ იმართება.</p>
      </Modal>
    </div>
  );
}
