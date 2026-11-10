export const queryKeys = {
  filaments: ['filaments'] as const,
  filamentTypes: ['filament-types'] as const,
  colors: ['filament-colors'] as const,
  jobs: (status?: string) => (status ? (['jobs', status] as const) : (['jobs'] as const)),
  models: ['models'] as const,
  ollamaModels: ['ollama-models'] as const,
  printers: ['printers'] as const,
  printerStatuses: ['printer-statuses'] as const,
  printerStatus: (id?: number) => (id !== undefined ? (['printer-status', id] as const) : (['printer-status'] as const)),
  printerSlots: (id?: number) => (id !== undefined ? (['printer-slots', id] as const) : (['printer-slots'] as const)),
  settings: ['settings'] as const,
  stockSettings: ['stock-settings'] as const,
};
