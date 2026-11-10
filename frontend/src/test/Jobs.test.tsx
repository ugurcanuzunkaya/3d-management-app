import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { JobForm } from '@/components/jobs/JobForm';
import { JobTable } from '@/components/jobs/JobTable';
import Jobs from '@/pages/Jobs';
import { PrivacyProvider } from '@/context/PrivacyProvider';
import api from '@/lib/api';
import type { Filament } from '@/types';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const MOCK_FILAMENTS: Filament[] = [
  {
    id: 1,
    name: 'eSUN PLA+ Grey',
    brand: 'eSUN',
    type_id: 1,
    color_id: 1,
    price_per_kg: 500,
    remaining_weight_g: 800,
    is_opened: true,
    notes: null,
    filament_type: { id: 1, name: 'PLA', is_custom: false },
    filament_color: { id: 1, name: 'Grey', hex_code: '#DCDCDC' },
  },
];

const MOCK_SETTINGS = {
  electric_price: 2.0,
  fallback_wattage: 200,
  markup_multiplier: 3.0,
  machine_hourly_rate: 5.0,
  failure_rate_pct: 0,
  currency: 'TRY',
};

const setupPreFillMocks = () => {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/api/printjobs') return Promise.resolve({ data: [] });
    if (url === '/api/filaments') return Promise.resolve({ data: MOCK_FILAMENTS });
    if (url === '/api/settings') return Promise.resolve({ data: MOCK_SETTINGS });
    if (url === '/api/models') {
      return Promise.resolve({
        data: [
          {
            id: 1,
            name: 'Gridfinity 2x3 Bin',
            estimated_weight_g: 48.5,
            tech_details: { print_time_minutes: 95, filament_type: 'PLA' },
          },
        ],
      });
    }
    return Promise.resolve({ data: [] });
  });
};

describe('Task 11: Interactive Cost & Quote Calculator UI + Model Pre-Fill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders itemized cost breakdown and custom costs in JobForm', () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <PrivacyProvider>
            <JobForm
              initialData={{
                id: 99,
                name: 'Test Print',
                job_type: 'Client Order',
                duration_minutes: 60,
                total_cost: 0,
                production_cost: 0,
                status: 'completed',
                created_at: new Date().toISOString(),
                job_filaments: [{ filament_id: 1, grams_used: 100 }],
              }}
              filaments={MOCK_FILAMENTS}
              settings={MOCK_SETTINGS}
              onSubmit={vi.fn()}
              onCancel={vi.fn()}
            />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('₺55.40')).toBeInTheDocument();
    expect(screen.getByLabelText(/Linked 3D Model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Assigned Printer/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add Extra Cost/i }));
    fireEvent.change(screen.getByLabelText('Extra cost value 0'), { target: { value: '10' } });
    expect(screen.getByDisplayValue('176.2')).toBeInTheDocument();
  });

  it('pre-populates JobForm when navigating to /jobs?modelId=1', async () => {
    setupPreFillMocks();
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={['/jobs?modelId=1']}>
          <PrivacyProvider>
            <Jobs />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Job Name/i)).toHaveValue('Gridfinity 2x3 Bin');
    });
    expect(screen.getByDisplayValue('95')).toBeInTheDocument();
  });
});

describe('JobTable Margin & Model Prefill Submit Label', () => {
  it('renders margin percentage in JobTable', () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <PrivacyProvider>
            <JobTable
              jobs={[
                {
                  id: 1,
                  name: 'Vase Mode Lamp',
                  job_type: 'Product',
                  duration_minutes: 120,
                  total_cost: 200,
                  production_cost: 50,
                  status: 'completed',
                  created_at: new Date().toISOString(),
                },
              ]}
              filaments={MOCK_FILAMENTS}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
            />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/75%/i)).toBeInTheDocument();
  });

  it('shows Create New Job and Save Job & Update Stock when prefilled from a model (id === 0)', () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <PrivacyProvider>
            <JobForm
              initialData={{
                id: 0,
                name: 'Prefilled Model Part',
                job_type: 'Model Library',
                model_id: 1,
                duration_minutes: 90,
                total_cost: 0,
                production_cost: 0,
                status: 'completed',
                created_at: new Date().toISOString(),
                job_filaments: [{ filament_id: 1, grams_used: 45 }],
              }}
              filaments={MOCK_FILAMENTS}
              settings={MOCK_SETTINGS}
              onSubmit={vi.fn()}
              onCancel={vi.fn()}
            />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Create New Job')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Job & Update Stock' })).toBeInTheDocument();
  });
});
