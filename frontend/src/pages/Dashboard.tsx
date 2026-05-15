import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import api from '@/lib/api';
import PrinterStatusWidget from '@/components/dashboard/PrinterStatusWidget';
import type { Filament } from '@/types';

const Dashboard = () => {
  const { data: filaments } = useQuery<Filament[]>({
    queryKey: ['filaments'],
    queryFn: () => api.get('/api/filaments').then(res => res.data)
  });

  // Calculate total inventory weight
  const totalWeightKg = (filaments?.reduce((acc, f) => acc + f.remaining_weight_g, 0) || 0) / 1000;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your 3D printing control center.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Printer Status Widget */}
        <div className="lg:col-span-1">
          <PrinterStatusWidget />
        </div>

        {/* Inventory Overview */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-md h-full bg-blue-50 dark:bg-blue-900/20">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold">Inventory Overview</CardTitle>
              <Box className="w-6 h-6 text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tighter text-blue-600 dark:text-blue-400">
                  {filaments?.length || 0}
                </span>
                <span className="text-lg font-medium text-muted-foreground uppercase tracking-widest">
                  Active Filaments
                </span>
              </div>

              <div className="pt-4 border-t border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Stock Weight</span>
                  <span className="text-2xl font-bold">{totalWeightKg.toFixed(2)} kg</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
