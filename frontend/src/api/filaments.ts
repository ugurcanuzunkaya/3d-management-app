import api from '@/lib/api';
import type { Filament, FilamentType, FilamentColor } from '@/types';

export const filamentsApi = {
  list: () => api.get<Filament[]>('/api/filaments').then(res => res.data),
  get: (id: number) => api.get<Filament>(`/api/filaments/${id}`).then(res => res.data),
  create: (data: Partial<Filament>) => api.post<Filament>('/api/filaments', data).then(res => res.data),
  update: (id: number, data: Partial<Filament>) =>
    api.patch<Filament>(`/api/filaments/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/api/filaments/${id}`).then(res => res.data),

  // Types
  listTypes: () => api.get<FilamentType[]>('/api/filaments/types').then(res => res.data),
  createType: (data: { name: string; is_custom?: boolean }) =>
    api.post<FilamentType>('/api/filaments/types', { is_custom: true, ...data }).then(res => res.data),
  deleteType: (id: number) => api.delete(`/api/filaments/types/${id}`).then(res => res.data),

  // Colors
  listColors: () => api.get<FilamentColor[]>('/api/filaments/colors').then(res => res.data),
  createColor: (data: { name: string; hex_code: string }) =>
    api.post<FilamentColor>('/api/filaments/colors', data).then(res => res.data),
  deleteColor: (id: number) => api.delete(`/api/filaments/colors/${id}`).then(res => res.data),
};
