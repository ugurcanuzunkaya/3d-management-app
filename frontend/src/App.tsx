import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import { PrivacyProvider } from './context/PrivacyProvider';
import { PrivacyEditPanel } from './components/shared/PrivacyEditPanel';
import { DashboardSkeleton } from './components/ui/Skeleton';

const Jobs = lazy(() => import('./pages/Jobs'));
const FilamentStock = lazy(() => import('./pages/FilamentStock'));
const StockSettingsPage = lazy(() => import('./pages/StockSettings'));
const ModelLibrary = lazy(() => import('./pages/ModelLibrary'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const PrinterPage = lazy(() => import('./pages/Printer'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      retryDelay: 500,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <PrivacyProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <main className="container mx-auto py-8 px-4 relative z-0">
              <Suspense fallback={<DashboardSkeleton />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/stock" element={<FilamentStock />} />
                  <Route path="/stock/settings" element={<StockSettingsPage />} />
                  <Route path="/models" element={<ModelLibrary />} />
                  <Route path="/printer" element={<PrinterPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Suspense>
            </main>
            <PrivacyEditPanel />
          </div>
        </PrivacyProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
