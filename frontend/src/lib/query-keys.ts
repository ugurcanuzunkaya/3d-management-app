export const queryKeys = {
  filaments: {
    all: ['filaments'] as const,
    list: () => [...queryKeys.filaments.all, 'list'] as const,
    types: ['filament-types'] as const,
    colors: ['filament-colors'] as const,
  },
  jobs: {
    all: ['jobs'] as const,
    list: (status?: string) => [...queryKeys.jobs.all, 'list', { status }] as const,
  },
  printer: {
    status: ['printer-status'] as const,
  },
  settings: {
    app: ['settings'] as const,
    stock: ['stock-settings'] as const,
  },
  models: {
    all: ['models'] as const,
  },
};
