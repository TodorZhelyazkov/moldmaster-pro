
import { ToolStatus, InjectionMold, SparePart } from './types';

export const INITIAL_MOLDS: InjectionMold[] = [
  {
    id: '1',
    name: 'Корпус Телефон A1',
    serialNumber: 'MOLD-2023-001',
    manufacturer: 'Hasco Solutions',
    totalShots: 154200,
    cavities: 4,
    status: ToolStatus.ACTIVE,
    repairHistory: [
      {
        id: 'r1',
        moldId: '1',
        moldName: 'Корпус Телефон A1',
        date: '2023-11-15',
        technician: 'Иван Иванов',
        description: 'Смяна на изхвъргачи и почистване на въздушници',
        partsReplaced: ['Изхвъргач 12мм - 4бр'],
        durationHours: 6
      }
    ]
  },
  {
    id: '2',
    name: 'Капачка Бутилка V2',
    serialNumber: 'MOLD-2022-452',
    manufacturer: 'DME Europe',
    totalShots: 890000,
    cavities: 16,
    status: ToolStatus.ACTIVE,
    repairHistory: []
  },
  {
    id: '3',
    name: 'Основа Стол Б-12',
    serialNumber: 'MOLD-2021-112',
    manufacturer: 'Meusburger',
    totalShots: 45000,
    cavities: 1,
    status: ToolStatus.IN_REPAIR,
    repairHistory: [
      {
        id: 'r2',
        moldId: '3',
        moldName: 'Основа Стол Б-12',
        date: '2024-02-01',
        technician: 'Петър Петров',
        description: 'Ремонт на горещи канали - теч на материал',
        partsReplaced: ['Дюза тип 2', 'Нагревател'],
        durationHours: 12
      }
    ]
  }
];

export const INITIAL_PARTS: SparePart[] = [
  { id: 'p1', name: 'Изхвъргач 12мм', sku: 'EJ-12-HASCO', quantity: 24, minQuantity: 10, location: 'Шкаф A1' },
  { id: 'p2', name: 'Нагревател Дюза', sku: 'HEAT-NZL-40', quantity: 5, minQuantity: 2, location: 'Шкаф B2' },
  { id: 'p3', name: 'О-пръстен Viton 10x2', sku: 'OR-102-V', quantity: 150, minQuantity: 50, location: 'Кутия 12' },
];
