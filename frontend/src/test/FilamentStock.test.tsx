import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import api from '@/lib/api';
import { printerApi } from '@/api/printer';
import { filamentsApi } from '@/api/filaments';
import FilamentCard from '@/components/stock/FilamentCard';
import { PrivacyProvider } from '@/context/PrivacyProvider';
import filamentStockSrc from '@/pages/FilamentStock.tsx?raw';
import dashboardSrc from '@/pages/Dashboard.tsx?raw';
import modelLibrarySrc from '@/pages/ModelLibrary.tsx?raw';
import settingsSrc from '@/pages/Settings.tsx?raw';
import filamentFormBodySrc from '@/components/stock/FilamentFormBody.tsx?raw';

describe('Task 03 & Task 08: Modular API, Tare Weight Calculator & Quick Gram Adjustments', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('filamentsApi.update sends PATCH /api/filaments/:id and FilamentStock uses useFilaments hook instead of api.put', async () => {
    const patchSpy = vi.spyOn(api, 'patch').mockResolvedValueOnce({
      data: { id: 42, type: 'PLA', color: 'Black', remaining_weight_g: 850 },
    });

    await filamentsApi.update(42, { remaining_weight_g: 850 });
    expect(patchSpy).toHaveBeenCalledWith('/api/filaments/42', { remaining_weight_g: 850 });

    expect(filamentStockSrc).not.toContain('api.put(`/api/filaments/');
    expect(filamentStockSrc).toContain('useFilaments');
  });

  it('printerApi.poll(printerId) calls POST /api/printer/:id/poll', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { status: 'Polling initiated' },
    });

    await printerApi.poll(1);
    expect(postSpy).toHaveBeenCalledWith('/api/printer/1/poll');
  });

  it('Dashboard, ModelLibrary, and Settings pages use modular hooks', () => {
    expect(dashboardSrc).toContain('useFilaments');
    expect(dashboardSrc).toContain('useJobs');
    expect(modelLibrarySrc).toContain('useModels');
    expect(settingsSrc).toContain('useSettings');
  });

  it('Task 08: FilamentFormBody includes brand, empty_spool_weight_g, and scale tare calculation', () => {
    expect(filamentFormBodySrc).toContain('empty_spool_weight_g');
    expect(filamentFormBodySrc).toContain('grossScaleWeight');
  });

  it('Task 08: FilamentCard renders brand and triggers quick -50g adjustment', () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
    const onQuickAdjust = vi.fn();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PrivacyProvider>
            <FilamentCard
              filament={{
                id: 10,
                name: 'PLA+ Cold White',
                brand: 'eSUN',
                type_id: 1,
                color_id: 1,
                price_per_kg: 600,
                initial_weight_g: 1000,
                empty_spool_weight_g: 200,
                remaining_weight_g: 500,
                is_opened: true,
                notes: null,
                filament_type: { id: 1, name: 'PLA', is_custom: false },
                filament_color: { id: 1, name: 'White', hex_code: '#FFFFFF' },
              }}
              mountedSlotLabel="In AMS A1"
              onEdit={vi.fn()}
              onDelete={vi.fn()}
              onQuickAdjust={onQuickAdjust}
            />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('eSUN')).toBeInTheDocument();
    expect(screen.getByText('In AMS A1')).toBeInTheDocument();
    const minus50Btn = screen.getByRole('button', { name: '-50g' });
    fireEvent.click(minus50Btn);
    expect(onQuickAdjust).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }), -50);
  });
});
