import api from '@/lib/api';
import type { PrintJob, PrintJobCreate } from '@/types';

export const jobsApi = {
  list: (status?: string) =>
    api.get<PrintJob[]>('/api/printjobs', { params: { status } }).then(res => res.data),
  create: (data: PrintJobCreate) => api.post<PrintJob>('/api/printjobs', data).then(res => res.data),
  update: async (id: number, job: Partial<PrintJobCreate>): Promise<PrintJob> => {
    const response = await api.put(`/api/printjobs/${id}`, job);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/printjobs/${id}`);
  },
  deleteAll: async (): Promise<void> => {
    await api.delete('/api/printjobs/all');
  },
};
