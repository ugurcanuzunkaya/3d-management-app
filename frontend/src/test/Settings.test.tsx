import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '@/pages/Settings';
import { ModelFormModal } from '@/components/models/ModelFormModal';
import modelFormModalSrc from '@/components/models/ModelFormModal.tsx?raw';
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

describe('Task 13: Unified Tabbed Settings & Local Backup Export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/settings') {
        return Promise.resolve({
          data: {
            electric_price: 3.5,
            fallback_wattage: 200,
            markup_multiplier: 3.0,
            machine_hourly_rate: 5.0,
            failure_rate_pct: 5.0,
            currency: 'TRY',
          },
        });
      }
      if (url === '/api/settings/stock') {
        return Promise.resolve({
          data: {
            default_price_per_kg: 650,
            default_weight_g: 1000,
          },
        });
      }
      if (url === '/api/filament-types') {
        return Promise.resolve({ data: [{ id: 1, name: 'PLA', is_custom: false }] });
      }
      if (url === '/api/colors') {
        return Promise.resolve({ data: [{ id: 1, name: 'Black', hex_code: '#000000' }] });
      }
      if (url === '/api/settings/export') {
        return Promise.resolve({
          data: { settings: {}, filaments: [], jobs: [], models: [], printers: [] },
        });
      }
      if (url === '/api/models/ollama-models') {
        return Promise.resolve({
          data: ['deepseek-r1:8b', 'llava:13b'],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders Financial & Pricing fields, switches to Inventory & Backup tabs', async () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <PrivacyProvider>
            <SettingsPage />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Markup Multiplier/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Machine Hourly Rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Failure Rate Buffer/i)).toBeInTheDocument();

    // Switch to Inventory & Catalog tab
    fireEvent.click(screen.getByRole('button', { name: /Inventory & Catalog/i }));
    await waitFor(() => {
      expect(screen.getByText(/Inventory Defaults/i)).toBeInTheDocument();
    });

    // Switch to Local Backup & Export tab
    fireEvent.click(screen.getByRole('button', { name: /Backup & Data/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download JSON Backup/i })).toBeInTheDocument();
    });
  });

  it('dynamically lists local Ollama models in ModelFormModal without hardcoded model names', async () => {
    expect(modelFormModalSrc).not.toContain('ollama_qwen3.5');
    expect(modelFormModalSrc).not.toContain('ollama_gemma4');

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <PrivacyProvider>
            <ModelFormModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} model={null} />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Ollama (deepseek-r1:8b)' })).toBeInTheDocument();
    });
    expect(screen.getByRole('option', { name: 'Ollama (llava:13b)' })).toBeInTheDocument();
  });
});
