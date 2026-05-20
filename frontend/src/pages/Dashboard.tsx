import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import api from '@/lib/api';
import PrinterStatusWidget from '@/components/dashboard/PrinterStatusWidget';
import type { Filament } from '@/types';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

const Dashboard = () => {
  const { data: filaments, isLoading } = useQuery<Filament[]>({
    queryKey: ['filaments'],
    queryFn: () => api.get('/api/filaments').then(res => res.data)
  });

  const { isMasked } = usePrivacy();

  if (isLoading) return <DashboardSkeleton />;

  // Calculate total inventory weight
  const totalWeightKg = (filaments?.reduce((acc, f) => acc + f.remaining_weight_g, 0) || 0) / 1000;
  
  // Dynamic weight progress compared to a reference 100kg warehouse target capacity
  const weightProgressPercent = Math.min((totalWeightKg / 100) * 100, 100);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">
          <PrivacyWrapper keyName="maskDashboardTitle" placeholder="•••••" inline>
            Dashboard
          </PrivacyWrapper>
        </h1>
        <p className="text-muted-foreground">Welcome to your 3D printing control center.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Printer Status Widget */}
        <div className="lg:col-span-1">
          <PrinterStatusWidget />
        </div>

        {/* Inventory Overview Card (Now matching our premium left border style) */}
        <div className="lg:col-span-2">
          <Card className="group relative overflow-hidden transition-all duration-300 border-l-4 border-l-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 shadow-md h-full bg-white dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold text-indigo-950 dark:text-indigo-50">Inventory Overview</CardTitle>
              <Box className="w-6 h-6 text-indigo-500 transition-transform duration-300 group-hover:scale-110" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tighter text-indigo-600 dark:text-indigo-400">
                  <PrivacyWrapper keyName="maskDashboardStats" placeholder="•••••" inline>
                    {filaments?.length || 0}
                  </PrivacyWrapper>
                </span>
                <span className="text-sm font-semibold text-indigo-950/60 dark:text-indigo-200/60 uppercase tracking-widest">
                  Active Filament Spools
                </span>
              </div>

              <div className="pt-6 border-t border-indigo-100/50 dark:border-indigo-950/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Total Warehouse Weight
                  </span>
                  <span className="text-2xl font-bold text-indigo-950 dark:text-indigo-50">
                    <PrivacyWrapper keyName="maskDashboardStats" placeholder="•••••" inline>
                      {totalWeightKg.toFixed(2)} kg
                    </PrivacyWrapper>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-indigo-100/50 dark:bg-indigo-950/50 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                    style={{ width: isMasked('maskDashboardStats') ? '0%' : `${weightProgressPercent}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-medium">
                  <span>0 kg</span>
                  <span>Capacity Target: 100 kg</span>
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
