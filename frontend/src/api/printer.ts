import api from '@/lib/api';
import type { Printer, PrinterSlot, PrinterStatus } from '@/types';

export const printerApi = {
  list: () => api.get<Printer[]>('/api/printer').then(res => res.data),
  create: (data: Partial<Printer>) => api.post<Printer>('/api/printer', data).then(res => res.data),
  update: (id: number, data: Partial<Printer>) =>
    api.put<Printer>(`/api/printer/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/api/printer/${id}`).then(res => res.data),

  getAllStatuses: () =>
    api.get<Record<string, PrinterStatus>>('/api/printer/status/all').then(res => res.data),
  getStatus: (id: number) =>
    api.get<PrinterStatus>(`/api/printer/${id}/status`).then(res => res.data),
  getSlots: (id: number) =>
    api.get<PrinterSlot[]>(`/api/printer/${id}/slots`).then(res => res.data),
  assignSlot: (printerId: number, slotIndex: number, filamentId: number | null) =>
    api
      .put<PrinterSlot>(`/api/printer/${printerId}/slots/${slotIndex}`, {
        filament_id: filamentId,
      })
      .then(res => res.data),
  poll: (id: number) => api.post(`/api/printer/${id}/poll`).then(res => res.data),
};
