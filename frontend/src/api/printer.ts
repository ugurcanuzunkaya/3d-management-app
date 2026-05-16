import api from '@/lib/api';

export const printerApi = {
  getStatus: () => api.get('/api/printer/status').then(res => res.data),
  poll: () => api.post('/api/printer/poll').then(res => res.data),
};
