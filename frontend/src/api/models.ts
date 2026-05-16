import api from '@/lib/api';
import type { Model3D } from '@/types';

export const modelsApi = {
  list: () => api.get<Model3D[]>('/api/models').then(res => res.data),
  extract: (url: string) => api.post<Model3D>('/api/models/extract', null, { params: { url } }).then(res => res.data),
  delete: (id: number) => api.delete(`/api/models/${id}`).then(res => res.data),
};
