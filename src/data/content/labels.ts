import type {
  ActivitySource,
  AlertKind,
  AlertStatus,
  SectionStatus,
  Sensor,
  SensorKind,
  TaskStatus,
} from '../../types';

export const SECTION_STATUS_LABEL: Record<SectionStatus, string> = {
  empty: 'ცარიელი',
  filling: 'შევსების პროცესში',
  active: 'აქტიური',
  stabilizing: 'სტაბილიზაციის ეტაპზე',
  ready: 'მზად არის',
  completed: 'დასრულებული',
};
export const SECTION_STATUS_ORDER: SectionStatus[] = [
  'empty',
  'filling',
  'active',
  'stabilizing',
  'ready',
  'completed',
];

export const SENSOR_KIND_LABEL: Record<SensorKind, string> = {
  ph: 'pH-სენსორი',
  temperature: 'ტემპერატურის სენსორი',
  humidity: 'ტენიანობის სენსორი',
};
export const sensorName = (s: Pick<Sensor, 'kind' | 'sectionId'>) =>
  `${SENSOR_KIND_LABEL[s.kind]}, სექცია ${s.sectionId}`;

export const ALERT_KIND_LABEL: Record<AlertKind, string> = {
  info: 'საინფორმაციო',
  warning: 'გაფრთხილება',
  critical: 'კრიტიკული',
  sensor_offline: 'სენსორი offline',
  device_error: 'მოწყობილობის შეცდომა',
  maintenance: 'ტექნიკური მომსახურების შეხსენება',
};
export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  active: 'ახალი',
  acknowledged: 'დადასტურებულია',
  resolved: 'შესრულებულია',
};

export const SOURCE_LABEL: Record<ActivitySource, string> = {
  sensor: 'სენსორი',
  device: 'მოწყობილობა',
  automation: 'ავტომატიზაცია',
  operator: 'ოპერატორი',
  alert: 'გაფრთხილება',
  maintenance: 'მომსახურება',
  safety: 'უსაფრთხოება',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'ღია',
  in_progress: 'მიმდინარე',
  done: 'დასრულებული',
};

export const WASTE_TYPES = [
  'ბოსტნეულისა და ხილის ნარჩენი',
  'ყავისა და ჩაის ნარჩენი',
  'ბაღის რბილი ნარჩენი და ქაღალდი',
  'შერეული ორგანული ნარჩენი',
];

export const TARGETS = {
  ph: { min: 6.2, max: 7.5 },
  temperature: { min: 18, max: 30 },
  humidity: { min: 60, max: 75 },
} as const;
