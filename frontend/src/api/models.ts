import api from '@/lib/api';
import type { Model3D, ModelExtractionResult } from '@/types';

export const modelsApi = {
  list: () => api.get<Model3D[]>('/api/models').then(res => res.data),
  get: (id: number) => api.get<Model3D>(`/api/models/${id}`).then(res => res.data),
  create: (data: Omit<Model3D, 'id' | 'tech_details'> & { tech_details: Record<string, unknown> }) =>
    api.post<Model3D>('/api/models', data).then(res => res.data),
  update: (id: number, data: Partial<Omit<Model3D, 'id'>>) =>
    api.put<Model3D>(`/api/models/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/api/models/${id}`).then(res => res.data),
  extract: (url: string) =>
    api.post<Model3D>('/api/models/extract', null, { params: { url } }).then(res => res.data),
  analyzeLink: (url: string, provider: string) =>
    api.post<ModelExtractionResult>('/api/models/analyze-link', null, { params: { url, provider } }).then(res => res.data),
  analyzeImage: (file: File, provider: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', provider);
    return api.post<ModelExtractionResult>('/api/models/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
};
