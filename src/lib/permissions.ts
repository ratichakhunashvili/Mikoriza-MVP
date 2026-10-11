import type { Permission, Role } from '../types';

export const ROLE_LABEL: Record<Role, string> = {
  operator: 'ოპერატორი',
  admin: 'ადმინისტრატორი',
  technician: 'ტექნიკური სპეციალისტი',
  viewer: 'დამკვირვებელი',
};

export const PERMISSION_LABEL: Record<Permission, string> = {
  control_devices: 'მოწყობილობების ხელით მართვა',
  ack_alerts: 'გაფრთხილებების დადასტურება და დახურვა',
  section_actions: 'სექციების მართვა და ახალი ციკლი',
  edit_rules: 'ავტომატიზაციის წესების შეცვლა',
  edit_maintenance: 'მომსახურებისა და კალიბრაციის ჩანაწერები',
  emergency_stop: 'საგანგებო გამორთვა',
};

const MATRIX: Record<Permission, Role[]> = {
  control_devices: ['operator', 'admin', 'technician'],
  ack_alerts: ['operator', 'admin', 'technician'],
  section_actions: ['operator', 'admin'],
  edit_rules: ['admin'],
  edit_maintenance: ['technician', 'admin'],
  emergency_stop: ['operator', 'admin', 'technician'],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[permission].includes(role);
}

export const PERMISSIONS = Object.keys(MATRIX) as Permission[];
export const ROLES = Object.keys(ROLE_LABEL) as Role[];
export const DENIED_HINT = 'თქვენი როლი ამ მოქმედებას არ იძლევა.';
