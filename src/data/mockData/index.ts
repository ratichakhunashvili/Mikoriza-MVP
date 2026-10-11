import type {
  ActivityEntry,
  Alert,
  AppState,
  CalibrationRecord,
  Device,
  MaintenanceTask,
  Rule,
  Section,
  SectionId,
  Sensor,
  SensorKind,
} from '../../types';
import { DAY, HOUR, MIN } from '../../lib/format';
import { buildHistory } from './history';

export const DEMO_EMAIL = 'operator@mikoriza.demo';
export const DEMO_PASSWORD = 'demo123';

const SECTION_IDS: SectionId[] = ['A', 'B', 'C'];
const SENSOR_KINDS: SensorKind[] = ['ph', 'temperature', 'humidity'];

function makeSections(now: number): Record<SectionId, Section> {
  return {
    A: {
      id: 'A',
      status: 'active',
      wasteType: 'ბოსტნეულისა და ხილის ნარჩენი',
      startedAt: now - 11 * DAY,
      cycleLengthDays: 18,
      lastCheckAt: now - 26 * HOUR,
      reading: { ph: 6.8, temperature: 24.6, humidity: 68 },
    },
    B: {
      id: 'B',
      status: 'filling',
      wasteType: 'ყავისა და ჩაის ნარჩენი',
      startedAt: now - 2 * DAY,
      cycleLengthDays: 18,
      lastCheckAt: now - 5 * HOUR,
      reading: { ph: 6.9, temperature: 23.8, humidity: 66 },
    },
    C: {
      id: 'C',
      status: 'ready',
      wasteType: 'ბაღის რბილი ნარჩენი და ქაღალდი',
      startedAt: now - 19 * DAY,
      cycleLengthDays: 18,
      lastCheckAt: now - 2 * DAY,
      reading: { ph: 7.1, temperature: 22.9, humidity: 64 },
    },
  };
}

function makeSensors(now: number): Sensor[] {
  return SECTION_IDS.flatMap((sectionId) =>
    SENSOR_KINDS.map<Sensor>((kind) => ({
      id: `${sectionId}-${kind}`,
      sectionId,
      kind,
      status: 'online',
      lastSeen: now,
      silenced: false,
    })),
  );
}

function makeDevices(now: number): Device[] {
  return [
    {
      id: 'humidifier',
      name: 'დამატენიანებელი',
      description: 'ზრდის სუბსტრატის ტენიანობას, როცა ის სამიზნე დიაპაზონს ქვემოთ ეცემა.',
      on: false,
      mode: 'auto',
      autoCapable: true,
      lastOnAt: now - 3 * HOUR,
      onSince: null,
      maxRuntimeMin: 20,
      faulty: false,
      safety: 'ერთი ჩართვა ავტომატურად წყდება 20 წუთის შემდეგ. ინტერნეტის გათიშვისას გამოირთვება.',
    },
    {
      id: 'mixer',
      name: 'სუბსტრატის შემრევი',
      description: 'ათანაბრებს მასალას და აუმჯობესებს ჰაერცვლას.',
      on: false,
      mode: 'manual',
      autoCapable: false,
      lastOnAt: now - 22 * HOUR,
      onSince: null,
      maxRuntimeMin: 10,
      faulty: false,
      safety: 'ჩართვას დადასტურება სჭირდება. ერთი ჩართვა ავტომატურად წყდება 10 წუთის შემდეგ.',
    },
  ];
}

function makeRules(now: number): Rule[] {
  return [
    {
      id: 'hum-low',
      title: 'დაბალი ტენიანობა',
      condition: 'თუ ტენიანობა 60%-ზე დაბალია',
      action: 'ჩაირთოს დამატენიანებელი',
      type: 'control',
      enabled: true,
      lastTriggeredAt: now - 3 * HOUR,
    },
    {
      id: 'hum-high',
      title: 'მაღალი ტენიანობა',
      condition: 'თუ ტენიანობა 75%-ზე მაღალია',
      action: 'გამოირთოს დამატენიანებელი',
      type: 'control',
      enabled: true,
      lastTriggeredAt: now - 3 * HOUR + 11 * MIN,
    },
    {
      id: 'temp-high',
      title: 'მაღალი ტემპერატურა',
      condition: 'თუ ტემპერატურა 30°C-ს აჭარბებს',
      action: 'შეიქმნას კრიტიკული გაფრთხილება',
      type: 'alert',
      enabled: true,
      lastTriggeredAt: null,
    },
    {
      id: 'ph-range',
      title: 'pH-ის გადახრა',
      condition: 'თუ pH 6.2-ზე დაბალია ან 7.5-ზე მაღალია',
      action: 'შეიქმნას გაფრთხილება',
      type: 'alert',
      enabled: true,
      lastTriggeredAt: now - 6 * DAY,
    },
    {
      id: 'sensor-offline',
      title: 'სენსორთან კავშირის დაკარგვა',
      condition: 'თუ სენსორი 5 წუთზე მეტხანს არ აგზავნის მონაცემს',
      action: 'სენსორი აღინიშნოს როგორც offline',
      type: 'alert',
      enabled: true,
      lastTriggeredAt: now - 3 * DAY,
    },
    {
      id: 'sensor-fault',
      title: 'კრიტიკული სენსორის დაზიანება',
      condition: 'თუ კრიტიკული სენსორი დაზიანებულია',
      action: 'ავტომატური მართვა გაითიშოს',
      type: 'protect',
      enabled: true,
      lastTriggeredAt: null,
    },
  ];
}

function makeAlerts(now: number): Alert[] {
  return [
    {
      id: 'al-1',
      key: 'check:C',
      kind: 'info',
      title: 'სექცია C მზად არის შესამოწმებლად.',
      action: 'შეამოწმეთ მასალის მზადყოფნა და, საჭიროების შემთხვევაში, ამოიღეთ ბიოჰუმუსი.',
      sectionId: 'C',
      createdAt: now - 2 * HOUR,
      status: 'active',
      guideId: 'visual-check',
    },
    {
      id: 'al-2',
      key: 'check:A',
      kind: 'info',
      title: 'საჭიროა სექცია A-ს ვიზუალური შემოწმება.',
      action: 'ბოლო შემოწმებიდან 26 საათია გასული. შეამოწმეთ სუნი, ჭიების აქტიურობა და ზედაპირი.',
      sectionId: 'A',
      createdAt: now - 70 * MIN,
      status: 'active',
      guideId: 'visual-check',
    },
    {
      id: 'al-3',
      key: 'calib:B-ph',
      kind: 'maintenance',
      title: 'სექცია B-ის pH-სენსორის კალიბრაცია მალე იწურება.',
      action: 'დაგეგმეთ კალიბრაცია ტექნიკური მომსახურების გვერდზე.',
      sectionId: 'B',
      createdAt: now - 20 * HOUR,
      status: 'active',
      guideId: 'calibration',
    },
    {
      id: 'al-4',
      key: 'hum-low:A:old',
      kind: 'warning',
      title: 'ტენიანობა დაბალია სექცია A-ში.',
      action: 'შეამოწმეთ წყლის მიწოდება ან ჩართეთ დამატენიანებელი.',
      sectionId: 'A',
      createdAt: now - 3 * HOUR - 4 * MIN,
      status: 'resolved',
      resolvedAt: now - 2.8 * HOUR,
      handledBy: 'ავტომატიზაცია',
      guideId: 'humidity-low',
    },
    {
      id: 'al-5',
      key: 'offline:B-humidity:old',
      kind: 'sensor_offline',
      title: 'ტენიანობის სენსორი აღარ აგზავნის მონაცემებს (სექცია B).',
      action: 'შეამოწმეთ სენსორის კაბელი და კვება.',
      sectionId: 'B',
      createdAt: now - 3 * DAY,
      status: 'resolved',
      resolvedAt: now - 3 * DAY + 50 * MIN,
      handledBy: 'ტექნიკური სპეციალისტი',
      guideId: 'sensor-offline',
    },
    {
      id: 'al-6',
      key: 'ph-range:C:old',
      kind: 'warning',
      title: 'pH-ის მნიშვნელობა საჭიროებს შემოწმებას სექცია C-ში.',
      action: 'ხელით გაზომეთ pH და შეადარეთ სენსორის მაჩვენებელს.',
      sectionId: 'C',
      createdAt: now - 6 * DAY,
      status: 'resolved',
      resolvedAt: now - 6 * DAY + 3 * HOUR,
      handledBy: 'ოპერატორი',
      guideId: 'ph-range',
    },
  ];
}

function makeActivity(now: number): ActivityEntry[] {
  const e = (
    n: number,
    ago: number,
    source: ActivityEntry['source'],
    action: string,
    actor: string,
    result: string,
  ): ActivityEntry => ({ id: `ac-${n}`, at: now - ago, source, action, actor, result });
  return [
    e(1, 12 * MIN, 'sensor', 'სექცია A: მონაცემები განახლდა (pH 6.8, 24.6°C, 68%)', 'სისტემა', 'წარმატებით'),
    e(2, 70 * MIN, 'alert', 'შეიქმნა შეხსენება: სექცია A-ს ვიზუალური შემოწმება', 'სისტემა', 'ღიაა'),
    e(3, 2 * HOUR, 'alert', 'შეიქმნა შეტყობინება: სექცია C მზად არის შესამოწმებლად', 'სისტემა', 'ღიაა'),
    e(4, 2.8 * HOUR, 'device', 'დამატენიანებელი გამოირთო: ტენიანობამ 75%-ს მიაღწია', 'ავტომატიზაცია', 'წარმატებით'),
    e(5, 3 * HOUR, 'automation', 'წესი „დაბალი ტენიანობა“ ამოქმედდა: ტენიანობა სექცია A-ში 59.6%', 'ავტომატიზაცია', 'დამატენიანებელი ჩაირთო'),
    e(6, 5 * HOUR, 'operator', 'სექცია B: შემოწმება დასრულებულად მოინიშნა', 'ოპერატორი', 'წარმატებით'),
    e(7, 20 * HOUR, 'alert', 'შეიქმნა შეხსენება: სექცია B-ის pH-სენსორის კალიბრაცია', 'სისტემა', 'ღიაა'),
    e(8, 22 * HOUR, 'device', 'სუბსტრატის შემრევი ჩაირთო (დემო რეჟიმი)', 'ოპერატორი', 'წარმატებით'),
    e(9, 22 * HOUR - 8 * MIN, 'device', 'სუბსტრატის შემრევი გამოირთო', 'ოპერატორი', 'წარმატებით'),
    e(10, 26 * HOUR, 'operator', 'სექცია A: შემოწმება დასრულებულად მოინიშნა', 'ოპერატორი', 'წარმატებით'),
    e(11, 2 * DAY, 'maintenance', 'ტენიანობის სენსორების გასუფთავება დასრულდა', 'ტექნიკური სპეციალისტი', 'დასრულებულია'),
  ];
}

const calibrationOffsets: Record<string, number> = {
  'A-ph': 50,
  'A-temperature': 30,
  'A-humidity': 62,
  'B-ph': 87,
  'B-temperature': 41,
  'B-humidity': 55,
  'C-ph': 20,
  'C-temperature': 70,
  'C-humidity': 94,
};

function makeCalibrations(now: number): CalibrationRecord[] {
  return Object.entries(calibrationOffsets).map(([sensorId, daysAgo]) => ({
    sensorId,
    lastAt: now - daysAgo * DAY,
    nextAt: now - daysAgo * DAY + 90 * DAY,
  }));
}

function makeTasks(now: number): MaintenanceTask[] {
  return [
    {
      id: 'tk-1',
      title: 'სექცია B-ის pH-სენსორის კალიბრაცია',
      status: 'open',
      assignee: 'ნინო ბერიძე',
      dueAt: now + 3 * DAY,
      notes: 'საჭიროა კალიბრაციის ხსნარები. სექცია B ამჟამად შევსების პროცესშია.',
    },
    {
      id: 'tk-2',
      title: 'დამატენიანებლის საქშენის გასუფთავება',
      status: 'in_progress',
      assignee: 'გიორგი მელაძე',
      dueAt: now + 1 * DAY,
      notes: 'წყლის ნაკადი შესამოწმებელია გასუფთავების შემდეგ.',
    },
    {
      id: 'tk-3',
      title: 'სენსორების კაბელების შემოწმება',
      status: 'open',
      assignee: 'ნინო ბერიძე',
      dueAt: now + 9 * DAY,
      notes: 'ყურადღება მიაქციეთ სექცია C-ის კაბელებს.',
    },
    {
      id: 'tk-4',
      title: 'ტენიანობის სენსორების გასუფთავება',
      status: 'done',
      assignee: 'ნინო ბერიძე',
      dueAt: now - 2 * DAY,
      notes: 'შესრულდა. შენიშვნები არ არის.',
    },
  ];
}

export function createInitialState(now: number = Date.now()): AppState {
  const sections = makeSections(now);
  const devices = makeDevices(now);
  return {
    now,
    auth: { loggedIn: false, email: null, role: 'operator' },
    sections,
    sensors: makeSensors(now),
    devices: { humidifier: devices[0], mixer: devices[1] },
    automationEnabled: true,
    emergencyStop: false,
    safeMode: false,
    rules: makeRules(now),
    alerts: makeAlerts(now),
    activity: makeActivity(now),
    calibrations: makeCalibrations(now),
    tasks: makeTasks(now),
    history: {
      A: buildHistory('A', now, sections.A.reading),
      B: buildHistory('B', now, sections.B.reading),
      C: buildHistory('C', now, sections.C.reading),
    },
    toastQueue: [],
    selectedSection: 'A',
    nextId: 100,
  };
}
