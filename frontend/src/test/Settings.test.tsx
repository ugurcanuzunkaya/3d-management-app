import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '../pages/Settings';
import api from '../lib/api';

describe('SettingsPage - Dual-Listbox Privacy Configurator', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders SettingsPage with initial database settings and shows dual-listbox', async () => {
    const mockSettings = {
      electric_price: 1.5,
      fallback_wattage: 350,
    };

    const spyGet = vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/api/settings') {
        return Promise.resolve({ data: mockSettings });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    );

    // Verify it fetches settings
    await waitFor(() => {
      expect(spyGet).toHaveBeenCalledWith('/api/settings');
    });

    // Check financial input values are populated
    expect(await screen.findByLabelText(/Electric Price/i)).toHaveValue('1.5');
    expect(await screen.findByLabelText(/Fallback Printer Wattage/i)).toHaveValue('350');

    // Check privacy config section titles
    expect(screen.getByText('Privacy Toggle Configuration Menu')).toBeInTheDocument();
    expect(screen.getByText('Masked Fields (Selected)')).toBeInTheDocument();
    expect(screen.getByText('Shown Fields (Unselected)')).toBeInTheDocument();
  });

  it('allows selecting fields and moving them between masked and shown lists', async () => {
    // Initial state: default settings has maskPrinterIp = true (masked), maskJobName = true (masked), etc.
    // Let's set custom privacySettings in localStorage where maskPrinterIp is false (Shown)
    localStorage.setItem('privacySettings', JSON.stringify({
      maskPrinterIp: false, // in shown column
      maskPrinterSerial: true, // in masked column
    }));

    const mockSettings = {
      electric_price: 1.5,
      fallback_wattage: 350,
    };

    vi.spyOn(api, 'get').mockResolvedValue({ data: mockSettings });

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    );

    await screen.findByText('Privacy Toggle Configuration Menu');

    // "Printer IP Address" should be in the unselected list initially
    const printerIpOption = screen.getAllByText('Printer IP Address')[0];
    expect(printerIpOption).toBeInTheDocument();

    // Let's click on "Printer IP Address" (which resides in the unselected list)
    fireEvent.click(printerIpOption);

    // Let's find the move left button (mask selected fields)
    const moveLeftBtn = screen.getByTitle('Mask Selected Fields');
    expect(moveLeftBtn).not.toBeDisabled();

    // Click to move to masked list
    fireEvent.click(moveLeftBtn);

    // Verify localStorage has been updated to set maskPrinterIp to true
    const savedSettings = JSON.parse(localStorage.getItem('privacySettings') || '{}');
    expect(savedSettings.maskPrinterIp).toBe(true);
  });
});
