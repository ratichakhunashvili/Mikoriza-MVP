import type { AppState, Device, Section, SectionId, SectionStatus, Sensor } from '../../types';
import { TARGETS, sensorName } from '../../data/content/labels';
import { MIN } from '../format';
import { applyCtx, log, makeCtx, raiseAlert, toast, type Ctx } from './helpers';

/** ავტომატიზაცია მხოლოდ დემო სიმულაციაა. რეალური მოწყობილობა აქ არ იმართება. */
export const SENSOR_TIMEOUT = 5 * MIN;
const REGULATED: SectionStatus[] = ['filling', 'active', 'stabilizing'];
const SECTION_IDS: SectionId[] = ['A', 'B', 'C'];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function ruleOn(s: AppState, id: string) {
  return s.rules.find((r) => r.id === id)?.enabled ?? false;
}

export function markRule(s: AppState, id: string, now: number): AppState {
  return { ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, lastTriggeredAt: now } : r)) };
}

export function turnDevice(d: Device, on: boolean, now: number): Device {
  if (d.on === on) return d;
  return on ? { ...d, on: true, onSince: now, lastOnAt: now } : { ...d, on: false, onSince: null };
}

/**
 * ერთი სიმულაციური ციკლი: ახლებს სენსორებს და მაჩვენებლებს, ამოწმებს უსაფრთხოებას და წესებს.
 * `noise` — [-1; 1] დიაპაზონის შემთხვევითი რიცხვები (რედიუსერის სიწმინდის შესანარჩუნებლად გარედან იგზავნება).
 */
export function applyTick(prev: AppState, now: number, noise: number[]): AppState {
  if (!prev.auth.loggedIn) return { ...prev, now };
  let s: AppState = { ...prev, now };
  const ctx: Ctx = makeCtx(s, now);
  const n = (i: number) => noise[i % noise.length] ?? 0;

  // 1. სენსორების კავშირი (წესი 5)
  const sensors: Sensor[] = s.sensors.map((sn) => {
    if (sn.status !== 'online') return sn;
    if (!sn.silenced) return { ...sn, lastSeen: now };
    if (now - sn.lastSeen > SENSOR_TIMEOUT && ruleOn(s, 'sensor-offline')) {
      raiseAlert(ctx, {
        key: `offline:${sn.id}`,
        kind: 'sensor_offline',
        title: `${sensorName(sn)} აღარ აგზავნის მონაცემებს.`,
        action: 'შეამოწმეთ სენსორის კაბელი და კვება. ამ დროისთვის მაჩვენებელი არ არის სანდო.',
        sectionId: sn.sectionId,
        guideId: 'sensor-offline',
      });
      log(ctx, 'automation', `${sensorName(sn)} აღინიშნა როგორც offline: 5 წუთზე მეტია მონაცემი არ მოსულა`, 'ავტომატიზაცია', 'offline');
      s = markRule(s, 'sensor-offline', now);
      return { ...sn, status: 'offline' };
    }
    return sn;
  });
  s = { ...s, sensors };
  const sensorOk = (sec: SectionId, kind: Sensor['kind']) =>
    s.sensors.find((x) => x.sectionId === sec && x.kind === kind)?.status === 'online';

  // 2. მაჩვენებლების სიმულაცია
  const humidifierOn = s.devices.humidifier.on && !s.safeMode && !s.emergencyStop;
  const mixerOn = s.devices.mixer.on;
  const sections = { ...s.sections };
  SECTION_IDS.forEach((id, idx) => {
    const sec = sections[id];
    const regulated = REGULATED.includes(sec.status);
    let { humidity, temperature, ph } = sec.reading;
    if (sensorOk(id, 'humidity')) {
      humidity = clamp(humidity + (regulated ? (humidifierOn ? 0.9 : -0.08) : 0) + n(idx * 3) * 0.2, 20, 95);
    }
    if (sensorOk(id, 'temperature')) {
      temperature = temperature + (24.6 - temperature) * 0.03 + n(idx * 3 + 1) * 0.05 + (mixerOn && regulated ? 0.02 : 0);
    }
    if (sensorOk(id, 'ph')) {
      ph = clamp(ph + (6.8 - ph) * 0.01 + n(idx * 3 + 2) * 0.01, 3, 10);
    }
    sections[id] = { ...sec, reading: { humidity, temperature, ph } };
  });
  s = { ...s, sections };

  // 3. მოწყობილობის მაქსიმალური მუშაობის დრო
  const devices = { ...s.devices };
  (Object.keys(devices) as (keyof typeof devices)[]).forEach((k) => {
    const d = devices[k];
    if (d.on && d.onSince && now - d.onSince > d.maxRuntimeMin * MIN) {
      devices[k] = { ...turnDevice(d, false, now) };
      log(ctx, 'safety', `${d.name} გამოირთო: მაქსიმალური მუშაობის დრო (${d.maxRuntimeMin} წთ) ამოიწურა`, 'უსაფრთხოება', 'გამორთულია');
      toast(ctx, 'warning', `${d.name} ავტომატურად გამოირთო: მუშაობის მაქსიმალური დრო ამოიწურა.`);
    }
  });
  s = { ...s, devices };

  // 4. სენსორის დაზიანება: ავტომატური მართვა გაითიშება (წესი 6)
  const faulty = s.sensors.find((x) => x.status === 'faulty');
  if (faulty && ruleOn(s, 'sensor-fault') && s.automationEnabled) {
    s = {
      ...s,
      automationEnabled: false,
      devices: { ...s.devices, humidifier: { ...turnDevice(s.devices.humidifier, false, now), mode: 'manual' } },
    };
    s = markRule(s, 'sensor-fault', now);
    raiseAlert(ctx, {
      key: `fault:${faulty.id}`,
      kind: 'critical',
      title: `${sensorName(faulty)} დაზიანებულია. ავტომატური მართვა გამორთულია.`,
      action: 'სისტემა ზომავს მხოლოდ სანდო მონაცემებს. შეამოწმეთ სენსორი ფიზიკურად და მოწყობილობები მართეთ ხელით.',
      sectionId: faulty.sectionId,
      guideId: 'sensor-offline',
    });
    log(ctx, 'automation', 'ავტომატური მართვა გაითიშა: კრიტიკული სენსორი დაზიანებულია', 'ავტომატიზაცია', 'გამორთულია');
  }

  // 5. მართვის წესები 1 და 2 (მხოლოდ ავტომატურ რეჟიმში და უსაფრთხო მდგომარეობაში)
  const controlAllowed = s.automationEnabled && !s.safeMode && !s.emergencyStop;
  const regulatedSecs = SECTION_IDS.map((id) => s.sections[id]).filter(
    (sec) => REGULATED.includes(sec.status) && sensorOk(sec.id, 'humidity'),
  );
  const hum = s.devices.humidifier;
  if (controlAllowed && hum.mode === 'auto' && !hum.faulty && regulatedSecs.length) {
    const lowest = regulatedSecs.reduce((a, b) => (a.reading.humidity <= b.reading.humidity ? a : b));
    const highest = regulatedSecs.reduce((a, b) => (a.reading.humidity >= b.reading.humidity ? a : b));
    if (!hum.on && ruleOn(s, 'hum-low') && lowest.reading.humidity < TARGETS.humidity.min) {
      s = { ...s, devices: { ...s.devices, humidifier: turnDevice(hum, true, now) } };
      s = markRule(s, 'hum-low', now);
      log(ctx, 'automation', `წესი „დაბალი ტენიანობა“ ამოქმედდა: სექცია ${lowest.id}-ში ტენიანობა ${lowest.reading.humidity.toFixed(1)}%-ია`, 'ავტომატიზაცია', 'დამატენიანებელი ჩაირთო');
      toast(ctx, 'info', 'დამატენიანებელი ჩაირთო დემო რეჟიმში: ტენიანობა დაბალია.');
    } else if (hum.on && ruleOn(s, 'hum-high') && highest.reading.humidity > TARGETS.humidity.max) {
      s = { ...s, devices: { ...s.devices, humidifier: turnDevice(hum, false, now) } };
      s = markRule(s, 'hum-high', now);
      log(ctx, 'automation', `წესი „მაღალი ტენიანობა“ ამოქმედდა: სექცია ${highest.id}-ში ტენიანობა ${highest.reading.humidity.toFixed(1)}%-ია`, 'ავტომატიზაცია', 'დამატენიანებელი გამოირთო');
      toast(ctx, 'info', 'დამატენიანებელი გამოირთო დემო რეჟიმში: ტენიანობა სამიზნე დიაპაზონს მიაღწია.');
    }
  }

  // 6. გაფრთხილების წესები 3 და 4, ასევე დაბალი/მაღალი ტენიანობის შეტყობინებები
  SECTION_IDS.forEach((id) => {
    const sec: Section = s.sections[id];
    if (!REGULATED.includes(sec.status)) return;
    const { temperature, ph, humidity } = sec.reading;
    if (sensorOk(id, 'temperature') && temperature > TARGETS.temperature.max && ruleOn(s, 'temp-high')) {
      if (
        raiseAlert(ctx, {
          key: `temp-high:${id}`,
          kind: 'critical',
          title: `ტემპერატურა აჭარბებს უსაფრთხო ზღვარს სექცია ${id}-ში.`,
          action: 'საჭიროა ფიზიკური შემოწმება. შეაჩერეთ შემრევი და გაზარდეთ ჰაერის ცვლა.',
          sectionId: id,
          guideId: 'temperature-high',
        })
      ) {
        s = markRule(s, 'temp-high', now);
      }
    }
    if (sensorOk(id, 'ph') && (ph < TARGETS.ph.min || ph > TARGETS.ph.max) && ruleOn(s, 'ph-range')) {
      if (
        raiseAlert(ctx, {
          key: `ph-range:${id}`,
          kind: 'warning',
          title: `pH-ის მნიშვნელობა საჭიროებს შემოწმებას სექცია ${id}-ში.`,
          action: 'ხელით გაზომეთ pH და შეადარეთ სენსორის მაჩვენებელს. ახალი მასალა ჯერ არ დაამატოთ.',
          sectionId: id,
          guideId: 'ph-range',
        })
      ) {
        s = markRule(s, 'ph-range', now);
      }
    }
    if (sensorOk(id, 'humidity') && humidity < TARGETS.humidity.min) {
      raiseAlert(ctx, {
        key: `hum-low:${id}`,
        kind: 'warning',
        title: `ტენიანობა დაბალია სექცია ${id}-ში.`,
        action: 'შეამოწმეთ წყლის მიწოდება ან ჩართეთ დამატენიანებელი.',
        sectionId: id,
        guideId: 'humidity-low',
      });
    }
    if (sensorOk(id, 'humidity') && humidity > TARGETS.humidity.max + 3) {
      raiseAlert(ctx, {
        key: `hum-high:${id}`,
        kind: 'warning',
        title: `ტენიანობა მაღალია სექცია ${id}-ში.`,
        action: 'გამორთეთ დამატენიანებელი და შეამოწმეთ დრენაჟი. საჭიროების შემთხვევაში დაამატეთ მშრალი მასალა.',
        sectionId: id,
        guideId: 'humidity-high',
      });
    }
  });

  return applyCtx(s, ctx);
}
