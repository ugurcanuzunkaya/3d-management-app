import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PrinterStatusWidget from '../components/dashboard/PrinterStatusWidget';
import { computeIdleDuration } from '../lib/printer-utils';
import api from '../lib/api';

import { MemoryRouter } from 'react-router-dom';
import { PrivacyProvider } from '../context/PrivacyProvider';

const buildMockStatus = (lastUpdated: number) => ({
  gcode_state: 'RUNNING',
  percent: 45,
  nozzle_temper: 220,
  bed_temper: 60,
  chamber_temper: 35,
  remain_time: 120,
  layer_num: 45,
  total_layer_num: 100,
  spd_lvl: 2,
  last_updated: lastUpdated,
});

const mockPrinterStatusApi = (mockStatus: ReturnType<typeof buildMockStatus>) =>
  vi.spyOn(api, 'get').mockImplementation((url) => {
    if (url === '/api/printer') {
      return Promise.resolve({
        data: [{ id: 1, name: 'Bambu Lab P1S', ip_address: '192.168.1.1', serial_number: '12345', access_code: 'abc', is_active: true }],
      });
    }
    if (url === '/api/printer/1/status' || url === '/api/printer/status/all') {
      return Promise.resolve({ data: url.endsWith('/all') ? { 1: mockStatus } : mockStatus });
    }
    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });

describe('PrinterStatusWidget - Telemetry and Offline Detection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders online/active state when telemetry is recent', async () => {
    const mockNow = 1716120000000;
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);
    const spyGet = mockPrinterStatusApi(buildMockStatus((mockNow - 10000) / 1000));

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PrivacyProvider>
            <PrinterStatusWidget />
          </PrivacyProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/RUNNING/i)).toBeInTheDocument();
    expect(spyGet).toHaveBeenCalled();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText(/60.*35.*220/)).toBeInTheDocument();
  });

  it('renders offline/warning state when telemetry is stale', async () => {
    const mockNow = 1716120000000;
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);
    const spyGet = mockPrinterStatusApi(buildMockStatus((mockNow - 360000) / 1000));

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PrivacyProvider>
            <PrinterStatusWidget />
          </PrivacyProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Printer Offline/i)).toBeInTheDocument();
    expect(spyGet).toHaveBeenCalled();
  });

  it('clamps computeIdleDuration to >= 0 when dataUpdatedAt is newer than now', () => {
    const now = 100000;
    const duration = computeIdleDuration(
      { gcode_state: 'OFFLINE', last_updated: undefined },
      true,
      102500,
      now,
      now
    );
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});
