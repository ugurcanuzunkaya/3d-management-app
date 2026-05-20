import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PrinterStatusWidget from '../components/dashboard/PrinterStatusWidget';
import api from '../lib/api';

import { MemoryRouter } from 'react-router-dom';
import { PrivacyProvider } from '../context/PrivacyContext';

describe('PrinterStatusWidget - Telemetry and Offline Detection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders online/active state when telemetry is recent', async () => {
    const mockNow = 1716120000000; // Fixed timestamp in ms
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);

    // Telemetry updated 10 seconds ago (1716119990 seconds)
    const telemetryTime = (mockNow - 10000) / 1000;

    const mockStatus = {
      gcode_state: 'RUNNING',
      percent: 45,
      nozzle_temper: 220,
      bed_temper: 60,
      chamber_temper: 35,
      remain_time: 120,
      layer_num: 45,
      total_layer_num: 100,
      spd_lvl: 2,
      last_updated: telemetryTime,
    };

    const spyGet = vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/api/printer') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Bambu Lab P1S', ip_address: '192.168.1.1', serial_number: '12345', access_code: 'abc', is_active: true }]
        });
      }
      if (url === '/api/printer/1/status') {
        return Promise.resolve({ data: mockStatus });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PrivacyProvider>
            <PrinterStatusWidget />
          </PrivacyProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(spyGet).toHaveBeenCalled();
    });

    // Wait for state updates to propagate
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText(/RUNNING/i)).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText(/60.*35.*220/)).toBeInTheDocument();
  });

  it('renders offline/warning state when telemetry is stale', async () => {
    const mockNow = 1716120000000; // Fixed timestamp in ms
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);

    // Telemetry updated 6 minutes ago (360000 ms ago -> 1716119640 seconds)
    const telemetryTime = (mockNow - 360000) / 1000;

    const mockStatus = {
      gcode_state: 'RUNNING',
      percent: 45,
      nozzle_temper: 220,
      bed_temper: 60,
      chamber_temper: 35,
      remain_time: 120,
      layer_num: 45,
      total_layer_num: 100,
      spd_lvl: 2,
      last_updated: telemetryTime,
    };

    const spyGet = vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/api/printer') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Bambu Lab P1S', ip_address: '192.168.1.1', serial_number: '12345', access_code: 'abc', is_active: true }]
        });
      }
      if (url === '/api/printer/1/status') {
        return Promise.resolve({ data: mockStatus });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PrivacyProvider>
            <PrinterStatusWidget />
          </PrivacyProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(spyGet).toHaveBeenCalled();
    });

    // Wait for state updates to propagate
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText(/Printer Offline/i)).toBeInTheDocument();
  });
});
