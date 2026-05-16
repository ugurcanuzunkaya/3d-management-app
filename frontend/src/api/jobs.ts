import api from '@/lib/api';
import type { PrintJob, PrintJobCreate } from '@/types';

export const jobsApi = {
  list: (status?: string) => 
    api.get<PrintJob[]>('/api/printjobs', { params: { status } }).then(res => res.data),
  create: (data: PrintJobCreate) => api.post<PrintJob>('/api/printjobs', data).then(res => res.data),
  update: (id: number, data: Partial<PrintJobCreate>) => 
    api.put<PrintJob>(`/api/printjobs/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/api/printjobs/${id}`).then(res => res.data),
};
