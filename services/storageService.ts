
import { InjectionMold, SparePart, AuthorizedUser } from '../types';
import { INITIAL_MOLDS, INITIAL_PARTS } from '../constants';

const KEYS = {
  MOLDS: 'moldmaster_molds',
  PARTS: 'moldmaster_parts',
  USERS: 'moldmaster_users'
};

/**
 * В реална продукционна среда, тези функции ще използват fetch() или axios() 
 * за комуникация с реален бекенд (Node.js, Python, Firebase и др.)
 */
export const dbService = {
  // Зареждане на всички данни
  async loadAllData() {
    // Симулираме мрежово забавяне
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const molds = localStorage.getItem(KEYS.MOLDS);
    const parts = localStorage.getItem(KEYS.PARTS);
    const users = localStorage.getItem(KEYS.USERS);

    return {
      molds: molds ? JSON.parse(molds) : INITIAL_MOLDS,
      parts: parts ? JSON.parse(parts) : INITIAL_PARTS,
      users: users ? JSON.parse(users) : null // Ако няма потребители, ползваме тези от кода
    };
  },

  // Запис на матрици
  async saveMolds(molds: InjectionMold[]) {
    localStorage.setItem(KEYS.MOLDS, JSON.stringify(molds));
    console.log('📦 База Данни: Матриците са синхронизирани.');
  },

  // Запис на части
  async saveParts(parts: SparePart[]) {
    localStorage.setItem(KEYS.PARTS, JSON.stringify(parts));
    console.log('📦 База Данни: Резервните части са синхронизирани.');
  },

  // Запис на потребители
  async saveUsers(users: AuthorizedUser[]) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
};
