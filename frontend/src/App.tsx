import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import FilamentStock from './pages/FilamentStock';
import StockSettingsPage from './pages/StockSettings';
import ModelLibrary from './pages/ModelLibrary';
import SettingsPage from './pages/Settings';
import PrinterPage from './pages/Printer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5,    // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <Router>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <Navbar />
          <main className="container mx-auto py-8 px-4 relative z-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/stock" element={<FilamentStock />} />
              <Route path="/stock/settings" element={<StockSettingsPage />} />
              <Route path="/models" element={<ModelLibrary />} />
              <Route path="/printer" element={<PrinterPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </PersistQueryClientProvider>
  );
}

export default App;
