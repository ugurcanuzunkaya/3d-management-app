import api from '@/lib/api';
import type { Settings, StockSettings } from '@/types';

export const settingsApi = {
  get: () => api.get<Settings>('/api/settings').then(res => res.data),
  update: (data: Settings) => api.post<Settings>('/api/settings', data).then(res => res.data),
  
  getStock: () => api.get<StockSettings>('/api/settings/stock').then(res => res.data),
  updateStock: (data: Partial<StockSettings>) => api.put<StockSettings>('/api/settings/stock', data).then(res => res.data),
};
