import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '../pages/Settings';
import api from '../lib/api';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyProvider } from '../context/PrivacyContext';

describe('SettingsPage', () => {
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

  it('renders SettingsPage with initial database settings', async () => {
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
      <MemoryRouter initialEntries={['/settings']}>
        <QueryClientProvider client={queryClient}>
          <PrivacyProvider>
            <SettingsPage />
          </PrivacyProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Verify it fetches settings
    await waitFor(() => {
      expect(spyGet).toHaveBeenCalledWith('/api/settings');
    });

    // Check financial input values are populated
    expect(await screen.findByLabelText(/Electric Price/i)).toHaveValue('1.5');
    expect(await screen.findByLabelText(/Fallback Printer Wattage/i)).toHaveValue('350');

    // Confirm that the obsolete configuration menu is NOT rendered
    expect(screen.queryByText('Privacy Toggle Configuration Menu')).not.toBeInTheDocument();
  });
});
