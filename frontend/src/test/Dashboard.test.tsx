import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import { PrivacyProvider } from '@/context/PrivacyProvider';
import api from '@/lib/api';

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

const MOCK_FILAMENTS = [
  {
    id: 1,
    name: 'eSUN PLA+ Grey',
    brand: 'eSUN',
    type_id: 1,
    color_id: 1,
    price_per_kg: 500,
    remaining_weight_g: 850,
    is_opened: true,
    notes: null,
    filament_type: { id: 1, name: 'PLA', is_custom: false },
    filament_color: { id: 1, name: 'Grey', hex_code: '#DCDCDC' },
  },
  {
    id: 2,
    name: 'eSUN PETG Black',
    brand: 'eSUN',
    type_id: 2,
    color_id: 2,
    price_per_kg: 600,
    remaining_weight_g: 120,
    is_opened: true,
    notes: null,
    filament_type: { id: 2, name: 'PETG', is_custom: false },
    filament_color: { id: 2, name: 'Black', hex_code: '#111111' },
  },
];

const MOCK_JOBS = [
  {
    id: 10,
    name: 'Voron Stealthburner',
    job_type: 'Client Order',
    duration_minutes: 120,
    total_cost: 200,
    production_cost: 60,
    status: 'completed',
    created_at: new Date().toISOString(),
    job_filaments: [{ filament_id: 1, grams_used: 80 }],
  },
  {
    id: 11,
    name: 'Gridfinity Baseplate',
    job_type: 'Stock',
    duration_minutes: 60,
    total_cost: 150,
    production_cost: 50,
    status: 'completed',
    created_at: new Date().toISOString(),
    job_filaments: [{ filament_id: 1, grams_used: 45 }],
  },
  {
    id: 12,
    name: 'AMS_Riser_Plate_1.3mf',
    job_type: 'Auto-Sync',
    duration_minutes: 90,
    total_cost: 120,
    production_cost: 40,
    status: 'pending',
    created_at: new Date().toISOString(),
    job_filaments: [{ filament_id: 2, grams_used: 50 }],
  },
];

describe('Task 12: Business KPI Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/filaments') return Promise.resolve({ data: MOCK_FILAMENTS });
      if (url === '/api/printjobs') return Promise.resolve({ data: MOCK_JOBS });
      if (url === '/api/printer') return Promise.resolve({ data: [] });
      if (url === '/api/settings/stock') {
        return Promise.resolve({
          data: { default_weight_g: 1000, default_price_per_kg: 500, low_stock_threshold: 200 },
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders Revenue, Production Cost, Net Profit, Margin %, and Action Alerts', async () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <PrivacyProvider>
            <Dashboard />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('₺350.00')).toBeInTheDocument();
    });

    // Production cost: 60 + 50 = 110.00
    expect(screen.getByText('₺110.00')).toBeInTheDocument();
    // Net Profit: 350 - 110 = 240.00 (69% margin)
    expect(screen.getByText('₺240.00')).toBeInTheDocument();
    expect(screen.getByText(/69%/)).toBeInTheDocument();

    // Pending print alert
    expect(screen.getByText(/1 Pending Completed Print/i)).toBeInTheDocument();
    // Low stock spool alert + link to /stock
    expect(screen.getByText('eSUN PETG Black')).toBeInTheDocument();
    expect(screen.getByText(/120g/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage Stock/i })).toHaveAttribute('href', '/stock');
    // Recent completed job in recent jobs list
    expect(screen.getByText('Voron Stealthburner')).toBeInTheDocument();
  });
});
