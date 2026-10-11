export type Role = 'operator' | 'admin' | 'technician' | 'viewer';
export type Permission =
  | 'control_devices'
  | 'ack_alerts'
  | 'section_actions'
  | 'edit_rules'
  | 'edit_maintenance'
  | 'emergency_stop';

export type SectionId = 'A' | 'B' | 'C';
export type SectionStatus = 'empty' | 'filling' | 'active' | 'stabilizing' | 'ready' | 'completed';
export type SensorKind = 'ph' | 'temperature' | 'humidity';
export type SensorStatus = 'online' | 'offline' | 'faulty';

export interface SectionReading {
  ph: number;
  temperature: number;
  humidity: number;
}

export interface Section {
  id: SectionId;
  status: SectionStatus;
  wasteType: string | null;
  startedAt: number | null;
  cycleLengthDays: number;
  lastCheckAt: number | null;
  reading: SectionReading;
}

export interface Sensor {
  id: string;
  sectionId: SectionId;
  kind: SensorKind;
  status: SensorStatus;
  lastSeen: number;
  /** დემო სცენარისთვის: სენსორი მონაცემს აღარ აგზავნის */
  silenced: boolean;
}

export type DeviceId = 'humidifier' | 'mixer';
export type DeviceMode = 'auto' | 'manual';

export interface Device {
  id: DeviceId;
  name: string;
  description: string;
  on: boolean;
  mode: DeviceMode;
  autoCapable: boolean;
  lastOnAt: number | null;
  onSince: number | null;
  maxRuntimeMin: number;
  faulty: boolean;
  safety: string;
}

export type AlertKind =
  | 'info'
  | 'warning'
  | 'critical'
  | 'sensor_offline'
  | 'device_error'
  | 'maintenance';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  key: string;
  kind: AlertKind;
  title: string;
  /** რა მოხდა და რა უნდა გაკეთდეს */
  action: string;
  sectionId?: SectionId;
  createdAt: number;
  status: AlertStatus;
  guideId?: string;
  acknowledgedAt?: number;
  resolvedAt?: number;
  handledBy?: string;
}

export type RuleId =
  | 'hum-low'
  | 'hum-high'
  | 'temp-high'
  | 'ph-range'
  | 'sensor-offline'
  | 'sensor-fault';

export interface Rule {
  id: RuleId;
  title: string;
  condition: string;
  action: string;
  /** control — მოწყობილობას მართავს; alert — გაფრთხილებას ქმნის; protect — უსაფრთხოების დაცვა */
  type: 'control' | 'alert' | 'protect';
  enabled: boolean;
  lastTriggeredAt: number | null;
}

export type ActivitySource = 'sensor' | 'device' | 'automation' | 'operator' | 'alert' | 'maintenance' | 'safety';
export interface ActivityEntry {
  id: string;
  at: number;
  action: string;
  source: ActivitySource;
  actor: string;
  result: string;
}

export interface CalibrationRecord {
  sensorId: string;
  lastAt: number;
  nextAt: number;
}

export type TaskStatus = 'open' | 'in_progress' | 'done';
export interface MaintenanceTask {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  dueAt: number;
  notes: string;
}

export interface Point {
  t: number;
  v: number;
}
export interface SectionHistory {
  humidity: Point[];
  temperature: Point[];
  ph: Point[];
}

export interface GuideEntry {
  id: string;
  title: string;
  summary: string;
  steps: string[];
}

export type ToastKind = 'success' | 'info' | 'warning' | 'error';
export interface ToastMsg {
  id: string;
  kind: ToastKind;
  text: string;
}

export interface AppState {
  now: number;
  auth: { loggedIn: boolean; email: string | null; role: Role };
  sections: Record<SectionId, Section>;
  sensors: Sensor[];
  devices: Record<DeviceId, Device>;
  automationEnabled: boolean;
  emergencyStop: boolean;
  safeMode: boolean;
  rules: Rule[];
  alerts: Alert[];
  activity: ActivityEntry[];
  calibrations: CalibrationRecord[];
  tasks: MaintenanceTask[];
  history: Record<SectionId, SectionHistory>;
  toastQueue: ToastMsg[];
  selectedSection: SectionId;
  nextId: number;
}
