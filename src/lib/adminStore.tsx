import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type {
  AppState,
  DeviceId,
  DeviceMode,
  MaintenanceTask,
  Permission,
  Role,
  RuleId,
  SectionId,
  SectionStatus,
  TaskStatus,
  ToastKind,
} from '../types';
import { createInitialState, DEMO_EMAIL } from '../data/mockData';
import { DEMO_NOTIFICATIONS } from '../data/mockData/notifications';
import { SECTION_STATUS_LABEL, sensorName } from '../data/content/labels';
import { DAY, MIN } from './format';
import { can as roleCan, DENIED_HINT, ROLE_LABEL } from './permissions';
import { applyTick, turnDevice } from './mockAutomation/engine';
import { actorOf, applyCtx, log, makeCtx, raiseAlert, toast as queueToast } from './mockAutomation/helpers';
import { useToast } from '../components/ui/Toast';

export type ScenarioName =
  | 'humidity-drop-b'
  | 'temp-high-a'
  | 'ph-low-a'
  | 'sensor-offline-b'
  | 'sensor-fault-a'
  | 'mixer-error'
  | 'restore';

export type Action =
  | { type: 'login'; email: string; role?: Role }
  | { type: 'logout' }
  | { type: 'setRole'; role: Role }
  | { type: 'tick'; now: number; noise: number[] }
  | { type: 'toggleDevice'; id: DeviceId }
  | { type: 'setDeviceMode'; id: DeviceId; mode: DeviceMode }
  | { type: 'setAutomation'; enabled: boolean }
  | { type: 'toggleRule'; id: RuleId }
  | { type: 'ackAlert'; id: string }
  | { type: 'resolveAlert'; id: string }
  | { type: 'sectionCheck'; id: SectionId }
  | { type: 'sectionStart'; id: SectionId; wasteType: string }
  | { type: 'sectionStatus'; id: SectionId; status: SectionStatus }
  | { type: 'emergencyStop' }
  | { type: 'releaseEmergency' }
  | { type: 'setSafeMode'; on: boolean }
  | { type: 'calibrate'; sensorId: string }
  | { type: 'addTask'; task: Omit<MaintenanceTask, 'id'> }
  | { type: 'setTaskStatus'; id: string; status: TaskStatus }
  | { type: 'scenario'; name: ScenarioName }
  | { type: 'demoNotify'; index: number }
  | { type: 'selectSection'; id: SectionId }
  | { type: 'clearToasts'; ids: string[] };

function say(s: AppState, kind: ToastKind, text: string): AppState {
  const ctx = makeCtx(s, s.now);
  queueToast(ctx, kind, text);
  return applyCtx(s, ctx);
}

function guard(s: AppState, perm: Permission): AppState | null {
  return roleCan(s.auth.role, perm) ? null : say(s, 'error', DENIED_HINT);
}

function locked(s: AppState): string | null {
  if (s.emergencyStop) return 'საგანგებო გამორთვა აქტიურია. ჯერ გაათავისუფლეთ ის.';
  if (s.safeMode) return 'სისტემა უსაფრთხო რეჟიმშია. დისტანციური მართვა დაბლოკილია.';
  return null;
}

function resolveByPrefix(s: AppState, prefix: string, who: string, now: number): AppState {
  return {
    ...s,
    alerts: s.alerts.map((a) =>
      a.key.startsWith(prefix) && a.status !== 'resolved'
        ? { ...a, status: 'resolved', resolvedAt: now, handledBy: who }
        : a,
    ),
  };
}

export function reducer(s: AppState, a: Action): AppState {
  const now = a.type === 'tick' ? a.now : Date.now();
  const actor = actorOf(s);

  switch (a.type) {
    case 'login': {
      const role = a.role ?? 'operator';
      const ctx = makeCtx(s, now);
      log(ctx, 'operator', `შესვლა პანელში (${a.email})`, ROLE_LABEL[role], 'წარმატებით');
      return { ...applyCtx(s, ctx), auth: { loggedIn: true, email: a.email, role } };
    }
    case 'logout':
      return { ...s, auth: { ...s.auth, loggedIn: false } };
    case 'setRole': {
      const ctx = makeCtx(s, now);
      log(ctx, 'operator', `დემო როლი შეიცვალა: ${ROLE_LABEL[a.role]}`, ROLE_LABEL[s.auth.role], 'წარმატებით');
      return { ...applyCtx(s, ctx), auth: { ...s.auth, role: a.role } };
    }
    case 'tick':
      return applyTick(s, a.now, a.noise);

    case 'toggleDevice': {
      const denied = guard(s, 'control_devices');
      if (denied) return denied;
      const lock = locked(s);
      if (lock) return say(s, 'error', lock);
      const d = s.devices[a.id];
      const ctx = makeCtx(s, now);
      if (d.faulty && !d.on) {
        log(ctx, 'device', `${d.name}: ჩართვა ვერ შესრულდა`, actor, 'შეცდომა');
        queueToast(ctx, 'error', `${d.name} ვერ ჩაირთო. საჭიროა ტექნიკური შემოწმება.`);
        return applyCtx(s, ctx);
      }
      const on = !d.on;
      let next = turnDevice(d, on, now);
      const wasAuto = d.mode === 'auto' && d.autoCapable;
      if (wasAuto) next = { ...next, mode: 'manual' };
      log(ctx, 'device', `${d.name} ${on ? 'ჩაირთო' : 'გამოირთო'} (დემო რეჟიმი)`, actor, 'წარმატებით');
      queueToast(ctx, 'success', `${d.name} ${on ? 'ჩართულია' : 'გამორთულია'} დემო რეჟიმში.`);
      if (wasAuto) queueToast(ctx, 'info', `${d.name} გადავიდა ხელით რეჟიმზე. ავტომატურ რეჟიმზე დასაბრუნებლად აირჩიეთ „ავტომატური“.`);
      return applyCtx({ ...s, devices: { ...s.devices, [a.id]: next } }, ctx);
    }
    case 'setDeviceMode': {
      const denied = guard(s, 'control_devices');
      if (denied) return denied;
      const lock = locked(s);
      if (lock) return say(s, 'error', lock);
      const d = s.devices[a.id];
      if (!d.autoCapable) return say(s, 'info', `${d.name} ამ ეტაპზე მხოლოდ ხელით იმართება.`);
      if (a.mode === 'auto') {
        if (!s.automationEnabled) return say(s, 'info', 'ჯერ ჩართეთ საერთო ავტომატური რეჟიმი.');
        if (d.faulty) return say(s, 'error', `${d.name} გაუმართავია და ავტომატურ რეჟიმზე ვერ გადავა.`);
      }
      const ctx = makeCtx(s, now);
      log(ctx, 'device', `${d.name}: რეჟიმი შეიცვალა — ${a.mode === 'auto' ? 'ავტომატური' : 'ხელით'}`, actor, 'წარმატებით');
      queueToast(ctx, 'success', `${d.name}: ${a.mode === 'auto' ? 'ავტომატური' : 'ხელით'} რეჟიმი.`);
      return applyCtx({ ...s, devices: { ...s.devices, [a.id]: { ...d, mode: a.mode } } }, ctx);
    }
    case 'setAutomation': {
      const denied = guard(s, 'control_devices');
      if (denied) return denied;
      const ctx = makeCtx(s, now);
      if (a.enabled) {
        const lock = locked(s);
        if (lock) return say(s, 'error', lock);
        if (s.sensors.some((x) => x.status === 'faulty'))
          return say(s, 'error', 'ავტომატური რეჟიმი ვერ ჩაირთვება: კრიტიკული სენსორი დაზიანებულია.');
        log(ctx, 'operator', 'ავტომატური რეჟიმი ჩაირთო', actor, 'წარმატებით');
        queueToast(ctx, 'success', 'ავტომატური რეჟიმი ჩართულია. წესები მხოლოდ დემო სიმულაციაში მუშაობს.');
        return applyCtx(
          { ...s, automationEnabled: true, devices: { ...s.devices, humidifier: { ...s.devices.humidifier, mode: 'auto' } } },
          ctx,
        );
      }
      log(ctx, 'operator', 'ავტომატური რეჟიმი გამოირთო, მოწყობილობები ხელით რეჟიმზეა', actor, 'წარმატებით');
      queueToast(ctx, 'info', 'ავტომატური რეჟიმი გამორთულია. მოწყობილობებს ახლა ხელით მართავთ.');
      return applyCtx(
        { ...s, automationEnabled: false, devices: { ...s.devices, humidifier: { ...s.devices.humidifier, mode: 'manual' } } },
        ctx,
      );
    }
    case 'toggleRule': {
      const denied = guard(s, 'edit_rules');
      if (denied) return denied;
      const rule = s.rules.find((r) => r.id === a.id);
      if (!rule) return s;
      const ctx = makeCtx(s, now);
      log(ctx, 'operator', `წესი „${rule.title}“ ${rule.enabled ? 'გამოირთო' : 'ჩაირთო'}`, actor, 'წარმატებით');
      queueToast(ctx, 'success', `წესი „${rule.title}“ ${rule.enabled ? 'გამორთულია' : 'ჩართულია'}.`);
      return applyCtx({ ...s, rules: s.rules.map((r) => (r.id === a.id ? { ...r, enabled: !r.enabled } : r)) }, ctx);
    }

    case 'ackAlert': {
      const denied = guard(s, 'ack_alerts');
      if (denied) return denied;
      const al = s.alerts.find((x) => x.id === a.id);
      if (!al || al.status !== 'active') return s;
      // ჯერ ვცვლით გაფრთხილებას, შემდეგ ვქმნით კონტექსტს, რომ ცვლილება არ გადაიწეროს
      const base: AppState = {
        ...s,
        alerts: s.alerts.map((x) => (x.id === a.id ? { ...x, status: 'acknowledged', acknowledgedAt: now, handledBy: actor } : x)),
      };
      const ctx = makeCtx(base, now);
      log(ctx, 'alert', `გაფრთხილება დადასტურდა: ${al.title}`, actor, 'დადასტურებულია');
      queueToast(ctx, 'success', 'გაფრთხილება დადასტურებულია.');
      return applyCtx(base, ctx);
    }
    case 'resolveAlert': {
      const denied = guard(s, 'ack_alerts');
      if (denied) return denied;
      const al = s.alerts.find((x) => x.id === a.id);
      if (!al || al.status === 'resolved') return s;
      const base: AppState = {
        ...s,
        alerts: s.alerts.map((x) => (x.id === a.id ? { ...x, status: 'resolved', resolvedAt: now, handledBy: actor } : x)),
      };
      const ctx = makeCtx(base, now);
      log(ctx, 'alert', `გაფრთხილება მონიშნულია შესრულებულად: ${al.title}`, actor, 'შესრულებულია');
      queueToast(ctx, 'success', 'გაფრთხილება მონიშნულია შესრულებულად.');
      return applyCtx(base, ctx);
    }

    case 'sectionCheck': {
      const denied = guard(s, 'section_actions');
      if (denied) return denied;
      const ctx = makeCtx(s, now);
      log(ctx, 'operator', `სექცია ${a.id}: შემოწმება დასრულებულად მოინიშნა`, actor, 'წარმატებით');
      queueToast(ctx, 'success', `სექცია ${a.id}: შემოწმება დასრულებულია.`);
      let next = applyCtx({ ...s, sections: { ...s.sections, [a.id]: { ...s.sections[a.id], lastCheckAt: now } } }, ctx);
      next = resolveByPrefix(next, `check:${a.id}`, actor, now);
      return next;
    }
    case 'sectionStart': {
      const denied = guard(s, 'section_actions');
      if (denied) return denied;
      const sec = s.sections[a.id];
      const ctx = makeCtx(s, now);
      log(ctx, 'operator', `სექცია ${a.id}: დაიწყო ახალი ციკლი (${a.wasteType})`, actor, 'წარმატებით');
      queueToast(ctx, 'success', `სექცია ${a.id}: ახალი ციკლი დაიწყო.`);
      let next = applyCtx(
        { ...s, sections: { ...s.sections, [a.id]: { ...sec, status: 'filling', wasteType: a.wasteType, startedAt: now, cycleLengthDays: 18, lastCheckAt: now } } },
        ctx,
      );
      next = resolveByPrefix(next, `check:${a.id}`, actor, now);
      return next;
    }
    case 'sectionStatus': {
      const denied = guard(s, 'section_actions');
      if (denied) return denied;
      const sec = s.sections[a.id];
      if (sec.status === a.status) return s;
      const ctx = makeCtx(s, now);
      let updated = { ...sec, status: a.status };
      if (a.status === 'empty') updated = { ...updated, wasteType: null, startedAt: null };
      else if (!sec.startedAt) updated = { ...updated, startedAt: now, wasteType: sec.wasteType ?? 'შერეული ორგანული ნარჩენი' };
      log(ctx, 'operator', `სექცია ${a.id}: სტატუსი შეიცვალა — ${SECTION_STATUS_LABEL[sec.status]} → ${SECTION_STATUS_LABEL[a.status]}`, actor, 'წარმატებით');
      queueToast(ctx, 'success', `სექცია ${a.id}: ${SECTION_STATUS_LABEL[a.status]}.`);
      return applyCtx({ ...s, sections: { ...s.sections, [a.id]: updated } }, ctx);
    }

    case 'emergencyStop': {
      const denied = guard(s, 'emergency_stop');
      if (denied) return denied;
      if (s.emergencyStop) return s;
      const ctx = makeCtx(s, now);
      raiseAlert(
        ctx,
        {
          key: `emergency:${now}`,
          kind: 'critical',
          title: 'საგანგებო გამორთვა ჩართულია.',
          action: 'შეამოწმეთ სისტემა ფიზიკურად და მხოლოდ ამის შემდეგ გაათავისუფლეთ გამორთვა.',
          guideId: 'emergency',
        },
        true,
      );
      log(ctx, 'safety', 'საგანგებო გამორთვა: ყველა მოწყობილობა გამორთულია, ავტომატური რეჟიმი გაითიშა', actor, 'გამორთულია');
      queueToast(ctx, 'warning', 'საგანგებო გამორთვა (დემო): ყველა მოწყობილობა გამორთულია, ავტომატური რეჟიმი გათიშულია.');
      return applyCtx(
        {
          ...s,
          emergencyStop: true,
          automationEnabled: false,
          devices: {
            humidifier: { ...turnDevice(s.devices.humidifier, false, now), mode: 'manual' },
            mixer: turnDevice(s.devices.mixer, false, now),
          },
        },
        ctx,
      );
    }
    case 'releaseEmergency': {
      const denied = guard(s, 'emergency_stop');
      if (denied) return denied;
      const ctx = makeCtx(s, now);
      log(ctx, 'safety', 'საგანგებო გამორთვა გათავისუფლდა', actor, 'წარმატებით');
      queueToast(ctx, 'success', 'საგანგებო გამორთვა გათავისუფლებულია. ავტომატური რეჟიმი ჯერ გამორთულია.');
      return resolveByPrefix(applyCtx({ ...s, emergencyStop: false }, ctx), 'emergency:', actor, now);
    }
    case 'setSafeMode': {
      if (a.on === s.safeMode) return s;
      const ctx = makeCtx(s, now);
      if (a.on) {
        raiseAlert(
          ctx,
          {
            key: `safe-mode:${now}`,
            kind: 'critical',
            title: 'კავშირი გაწყდა. სისტემა უსაფრთხო რეჟიმშია.',
            action: 'დისტანციური მართვა დაბლოკილია და მოწყობილობები გამორთულია. შეამოწმეთ ინტერნეტი ან გამოიყენეთ ადგილობრივი მართვა.',
          },
          true,
        );
        log(ctx, 'safety', 'ინტერნეტის გათიშვის სიმულაცია: სისტემა გადავიდა უსაფრთხო რეჟიმზე', 'სისტემა', 'მოწყობილობები გამორთულია');
        queueToast(ctx, 'warning', 'უსაფრთხო რეჟიმი: დისტანციური მართვა დაბლოკილია, მოწყობილობები გამორთულია.');
        return applyCtx(
          {
            ...s,
            safeMode: true,
            devices: { humidifier: turnDevice(s.devices.humidifier, false, now), mixer: turnDevice(s.devices.mixer, false, now) },
          },
          ctx,
        );
      }
      log(ctx, 'safety', 'კავშირი აღდგა, უსაფრთხო რეჟიმი გამოირთო', 'სისტემა', 'წარმატებით');
      queueToast(ctx, 'success', 'კავშირი აღდგა. დისტანციური მართვა ხელახლა ხელმისაწვდომია.');
      return resolveByPrefix(applyCtx({ ...s, safeMode: false }, ctx), 'safe-mode:', 'სისტემა', now);
    }

    case 'calibrate': {
      const denied = guard(s, 'edit_maintenance');
      if (denied) return denied;
      const sensor = s.sensors.find((x) => x.id === a.sensorId);
      if (!sensor) return s;
      const ctx = makeCtx(s, now);
      log(ctx, 'maintenance', `${sensorName(sensor)}: კალიბრაცია დასრულდა`, actor, 'წარმატებით');
      queueToast(ctx, 'success', `${sensorName(sensor)}: კალიბრაცია დაფიქსირდა.`);
      let next = applyCtx(
        {
          ...s,
          sensors: s.sensors.map((x) => (x.id === a.sensorId ? { ...x, status: 'online', silenced: false, lastSeen: now } : x)),
          calibrations: s.calibrations.map((c) => (c.sensorId === a.sensorId ? { ...c, lastAt: now, nextAt: now + 90 * DAY } : c)),
        },
        ctx,
      );
      next = resolveByPrefix(next, `calib:${a.sensorId}`, actor, now);
      return next;
    }
    case 'addTask': {
      const denied = guard(s, 'edit_maintenance');
      if (denied) return denied;
      const ctx = makeCtx(s, now);
      const id = `tk-${ctx.nextId++}`;
      log(ctx, 'maintenance', `დაემატა ტექნიკური დავალება: ${a.task.title}`, actor, 'წარმატებით');
      queueToast(ctx, 'success', 'ტექნიკური დავალება დაემატა.');
      return applyCtx({ ...s, tasks: [{ id, ...a.task }, ...s.tasks] }, ctx);
    }
    case 'setTaskStatus': {
      const denied = guard(s, 'edit_maintenance');
      if (denied) return denied;
      const task = s.tasks.find((t) => t.id === a.id);
      if (!task || task.status === a.status) return s;
      const ctx = makeCtx(s, now);
      log(ctx, 'maintenance', `დავალების სტატუსი შეიცვალა: ${task.title}`, actor, 'წარმატებით');
      queueToast(ctx, 'success', 'დავალების სტატუსი განახლდა.');
      return applyCtx({ ...s, tasks: s.tasks.map((t) => (t.id === a.id ? { ...t, status: a.status } : t)) }, ctx);
    }

    case 'scenario': {
      if (a.name === 'restore') {
        const fresh = createInitialState(now);
        const ctx = makeCtx(fresh, now);
        log(ctx, 'operator', 'სატესტო მონაცემები აღდგა საწყის მდგომარეობაში', ROLE_LABEL[s.auth.role], 'წარმატებით');
        queueToast(ctx, 'info', 'სატესტო მონაცემები აღდგა საწყის მდგომარეობაში.');
        return applyCtx({ ...fresh, auth: s.auth, selectedSection: s.selectedSection }, ctx);
      }
      const ctx = makeCtx(s, now);
      let next: AppState = s;
      let note = '';
      if (a.name === 'humidity-drop-b') {
        next = { ...s, sections: { ...s.sections, B: { ...s.sections.B, reading: { ...s.sections.B.reading, humidity: 52 } } } };
        note = 'სექცია B-ში ტენიანობა 52%-მდე დაეცა';
      } else if (a.name === 'temp-high-a') {
        next = { ...s, sections: { ...s.sections, A: { ...s.sections.A, reading: { ...s.sections.A.reading, temperature: 31.5 } } } };
        note = 'სექცია A-ში ტემპერატურა 31.5°C-მდე გაიზარდა';
      } else if (a.name === 'ph-low-a') {
        next = { ...s, sections: { ...s.sections, A: { ...s.sections.A, reading: { ...s.sections.A.reading, ph: 5.9 } } } };
        note = 'სექცია A-ში pH 5.9-მდე დაეცა';
      } else if (a.name === 'sensor-offline-b') {
        next = { ...s, sensors: s.sensors.map((x) => (x.id === 'B-humidity' ? { ...x, silenced: true, lastSeen: now - 6 * MIN } : x)) };
        note = 'სექცია B-ის ტენიანობის სენსორმა მონაცემის გაგზავნა შეწყვიტა';
      } else if (a.name === 'sensor-fault-a') {
        next = { ...s, sensors: s.sensors.map((x) => (x.id === 'A-temperature' ? { ...x, status: 'faulty' } : x)) };
        note = 'სექცია A-ის ტემპერატურის სენსორი დაზიანდა';
      } else if (a.name === 'mixer-error') {
        next = { ...s, devices: { ...s.devices, mixer: { ...turnDevice(s.devices.mixer, false, now), faulty: true } } };
        raiseAlert(ctx, {
          key: 'device-error:mixer',
          kind: 'device_error',
          title: 'შემრევი ვერ ჩაირთო. საჭიროა ტექნიკური შემოწმება.',
          action: 'არ სცადოთ განმეორებით ჩართვა. შეამოწმეთ მოწყობილობა ვიზუალურად და შექმენით ტექნიკური დავალება.',
          guideId: 'device-error',
        });
        note = 'სუბსტრატის შემრევი გაუმართავია';
      }
      log(ctx, 'sensor', `სატესტო სცენარი: ${note}`, 'სიმულაცია', 'გააქტიურდა');
      queueToast(ctx, 'info', `სატესტო სცენარი: ${note}.`);
      // მაშინვე ვამოწმებთ წესებს, რომ შედეგი დაუყოვნებლივ ჩანდეს
      return applyTick(applyCtx(next, ctx), now, [0]);
    }

    case 'demoNotify': {
      const tpl = DEMO_NOTIFICATIONS[a.index % DEMO_NOTIFICATIONS.length];
      const ctx = makeCtx(s, now);
      raiseAlert(ctx, { ...tpl, key: `demo:${ctx.nextId}` });
      return applyCtx(s, ctx);
    }
    case 'selectSection':
      return { ...s, selectedSection: a.id };
    case 'clearToasts':
      return { ...s, toastQueue: s.toastQueue.filter((t) => !a.ids.includes(t.id)) };
    default:
      return s;
  }
}

// ---------- Context ----------

interface Store {
  state: AppState;
  dispatch: (a: Action) => void;
  can: (p: Permission) => boolean;
  /** დისტანციური მართვა დაბლოკილია უსაფრთხოების მიზეზით */
  lockReason: string | null;
}
const Ctx = createContext<Store | null>(null);

function initState(): AppState {
  // პროტოტიპში ავტორიზაცია არ არის: პანელი პირდაპირ იხსნება ოპერატორის როლით
  const s = createInitialState();
  return { ...s, auth: { loggedIn: true, email: DEMO_EMAIL, role: 'operator' } };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const toast = useToast();

  useEffect(() => {
    if (!state.toastQueue.length) return;
    state.toastQueue.forEach((t) => toast.push(t.kind, t.text));
    dispatch({ type: 'clearToasts', ids: state.toastQueue.map((t) => t.id) });
  }, [state.toastQueue, toast]);

  const can = useCallback((p: Permission) => roleCan(state.auth.role, p), [state.auth.role]);
  const value = useMemo<Store>(
    () => ({ state, dispatch, can, lockReason: locked(state) }),
    [state, can],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdmin უნდა გამოიყენებოდეს AdminProvider-ის შიგნით');
  return v;
}

/** სიმულაციური ციკლი: 5 წამში ერთხელ ახლებს სატესტო მაჩვენებლებს (მხოლოდ პანელის ღია ყოფნისას) */
export function useTicker(intervalMs = 5000) {
  const { dispatch } = useAdmin();
  useEffect(() => {
    const id = window.setInterval(() => {
      dispatch({ type: 'tick', now: Date.now(), noise: Array.from({ length: 9 }, () => Math.random() * 2 - 1) });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [dispatch, intervalMs]);
}
