import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PrinterPage from '@/pages/Printer';
import { AmsSlotGrid } from '@/components/printer/AmsSlotGrid';
import { PrivacyProvider } from '@/context/PrivacyProvider';
import api from '@/lib/api';
import type { Filament, PrinterStatus } from '@/types';
import jobsSrc from '@/pages/Jobs.tsx?raw';
import stockSettingsSrc from '@/pages/StockSettings.tsx?raw';
import filamentModalSrc from '@/components/stock/FilamentFormModal.tsx?raw';

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

const MOCK_AMS_STATUS: PrinterStatus = {
  ams: {
    tray_now: '0',
    ams: [{ id: '0', humidity_raw: '35', temp: '26.9', dry_time: 0 }],
  },
  slots: [
    {
      slot_index: 0,
      slot_type: 'ams',
      slot_label: 'AMS Slot 1',
      filament_id: 1,
      filament: {
        id: 1,
        name: 'eSUN PLA+ Grey',
        brand: 'eSUN',
        remaining_weight_g: 80,
        price_per_kg: 600,
        color_name: 'Grey',
        color_hex: '#DCDCDC',
        type_name: 'PLA',
        is_low_stock: true,
      },
      ams_telemetry: {
        tray_type: 'PLA',
        tray_color: 'DCDCDCFF',
        nozzle_temp_min: 190,
        nozzle_temp_max: 240,
        is_active_tray: true,
        humidity_raw: '35',
        ams_temp: '26.9',
        dry_time: 0,
      },
    },
    {
      slot_index: 1,
      slot_type: 'ams',
      slot_label: 'AMS Slot 2',
      filament_id: null,
      filament: null,
      ams_telemetry: {
        tray_type: 'PETG',
        tray_color: '1A1A1AFF',
        nozzle_temp_min: 230,
        nozzle_temp_max: 260,
        is_active_tray: false,
        humidity_raw: '35',
        ams_temp: '26.9',
        dry_time: 0,
      },
    },
    {
      slot_index: 2,
      slot_type: 'ams',
      slot_label: 'AMS Slot 3',
      filament_id: null,
      filament: null,
      ams_telemetry: {
        tray_type: '',
        tray_color: '',
        nozzle_temp_min: 0,
        nozzle_temp_max: 0,
        is_active_tray: false,
        dry_time: 0,
      },
    },
    {
      slot_index: 3,
      slot_type: 'ams',
      slot_label: 'AMS Slot 4',
      filament_id: null,
      filament: null,
      ams_telemetry: {
        tray_type: '',
        tray_color: '',
        nozzle_temp_min: 0,
        nozzle_temp_max: 0,
        is_active_tray: false,
        dry_time: 0,
      },
    },
    {
      slot_index: 254,
      slot_type: 'external',
      slot_label: 'External Spool',
      filament_id: null,
      filament: null,
      ams_telemetry: {
        tray_type: '',
        tray_color: '',
        nozzle_temp_min: 0,
        nozzle_temp_max: 0,
        is_active_tray: false,
        dry_time: 0,
      },
    },
  ],
};

const MOCK_FILAMENTS: Filament[] = [
  {
    id: 1,
    name: 'eSUN PLA+ Grey',
    brand: 'eSUN',
    type_id: 1,
    color_id: 1,
    price_per_kg: 600,
    remaining_weight_g: 80,
    is_opened: true,
    notes: null,
    filament_type: { id: 1, name: 'PLA', is_custom: false },
    filament_color: { id: 1, name: 'Grey', hex_code: '#DCDCDC' },
  },
  {
    id: 2,
    name: 'Polymaker PETG Black',
    brand: 'Polymaker',
    type_id: 2,
    color_id: 2,
    price_per_kg: 750,
    remaining_weight_g: 850,
    is_opened: true,
    notes: null,
    filament_type: { id: 2, name: 'PETG', is_custom: false },
    filament_color: { id: 2, name: 'Black', hex_code: '#1A1A1A' },
  },
];

describe('Task 04 & Task 09: Printer Offline Fix, Decomposition & AMS 2 Pro Slot Grid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Printer Offline banner when gcode_state is OFFLINE and last_updated is null', async () => {
    const mockedGet = vi.mocked(api.get);
    mockedGet.mockImplementation((url: string) => {
      if (url === '/api/printer') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Bambu Lab P2S',
              ip_address: '192.168.1.50',
              serial_number: '22E8BA572201450',
              access_code: '********',
              is_active: true,
            },
          ],
        });
      }
      if (url === '/api/printer/status' || url === '/api/printer/status/all') {
        return Promise.resolve({
          data: { 1: { gcode_state: 'OFFLINE', last_updated: null } },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PrivacyProvider>
            <PrinterPage />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Printer Offline')).toBeInTheDocument();
    });
    expect(screen.queryByText('Extruder Nozzle')).not.toBeInTheDocument();
    expect(screen.getByText('AMS 2 Pro & External Spool Slots')).toBeInTheDocument();
    expect(screen.getByText('AMS Slot 1')).toBeInTheDocument();
  });

  it('wires extracted sub-components into Jobs, StockSettings, and FilamentFormModal', () => {
    expect(jobsSrc).toContain('JobForm');
    expect(jobsSrc).toContain('JobTable');
    expect(stockSettingsSrc).toContain('TypeSettings');
    expect(stockSettingsSrc).toContain('ColorSettings');
    expect(filamentModalSrc).toContain('FilamentFormBody');
  });

  it('Task 09: renders AmsSlotGrid with 4 AMS 2 Pro slots + External Spool, low-stock alert, and slot assignment', () => {
    const onAssignSlot = vi.fn();
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PrivacyProvider>
            <AmsSlotGrid
              status={MOCK_AMS_STATUS}
              filaments={MOCK_FILAMENTS}
              onAssignSlot={onAssignSlot}
            />
          </PrivacyProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('26.9°C')).toBeInTheDocument();
    expect(screen.getByText('AMS Slot 1')).toBeInTheDocument();
    expect(screen.getByText('External Spool')).toBeInTheDocument();
    expect(screen.getByText('eSUN PLA+ Grey')).toBeInTheDocument();
    expect(screen.getByText('80g')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    const slot2Select = screen.getByLabelText('Assign spool for AMS Slot 2');
    fireEvent.change(slot2Select, { target: { value: '2' } });
    expect(onAssignSlot).toHaveBeenCalledWith(1, 2);
  });
});
