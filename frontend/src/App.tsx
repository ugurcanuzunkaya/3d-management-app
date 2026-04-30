import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import PendingApprovals from './pages/PendingApprovals';
import FilamentStock from './pages/FilamentStock';
import ModelLibrary from './pages/ModelLibrary';
import SettingsPage from './pages/Settings';

const queryClient = new QueryClient();
const QCP = QueryClientProvider as any;

function App() {
  return (
    <QCP client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto py-8 px-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pending" element={<PendingApprovals />} />
              <Route path="/stock" element={<FilamentStock />} />
              <Route path="/models" element={<ModelLibrary />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QCP>
  );
}

export default App;
