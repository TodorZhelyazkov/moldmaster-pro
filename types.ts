
export enum ToolStatus {
  ACTIVE = 'Активна',
  IN_REPAIR = 'В Ремонт',
  RETIRED = 'Бракувана'
}

export enum AppView {
  DASHBOARD = 'Табло',
  INVENTORY = 'Инвентар',
  REPAIRS = 'Ремонт',
  PARTS = 'Резервни части',
  SETTINGS = 'Настройки'
}

export enum SettingsTab {
  GENERAL = 'Общи',
  ACCESS = 'Достъп'
}

export enum UserRole {
  ADMIN = 'Админ',
  USER = 'Потребител'
}

export interface AuthorizedUser {
  id: string;
  email: string;
  role: UserRole;
  addedAt: string;
}

export interface RepairLog {
  id: string;
  moldId: string;
  moldName: string;
  date: string;
  technician: string;
  description: string;
  partsReplaced: string[];
  cost?: number;
  durationHours: number;
}

export interface InjectionMold {
  id: string;
  name: string;
  serialNumber: string;
  manufacturer: string;
  totalShots: number;
  cavities: number;
  status: ToolStatus;
  repairHistory: RepairLog[];
  image?: string;
}

export interface SparePart {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  location: string;
}

export interface DashboardStats {
  totalMolds: number;
  activeMolds: number;
  inRepairMolds: number;
}
