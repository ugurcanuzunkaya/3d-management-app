import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Box, ArrowRight, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import PrinterStatusWidget from '@/components/dashboard/PrinterStatusWidget';
import { DashboardKpiCards } from '@/components/dashboard/DashboardKpiCards';
import { DashboardAlertsCard } from '@/components/dashboard/DashboardAlertsCard';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';
import { useFilaments } from '@/hooks/use-filaments';
import { useJobs } from '@/hooks/use-jobs';
import { useStockSettings } from '@/hooks/use-settings';
import type { PrintJob } from '@/types';

const RecentJobsCard = ({ recentJobs }: { recentJobs: PrintJob[] }) => (
  <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
      <CardTitle className="text-base font-bold flex items-center gap-2">
        <History className="w-4 h-4 text-blue-500" />
        Recent Completed Prints
      </CardTitle>
      <Link to="/jobs">
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          View All Jobs <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </CardHeader>
    <CardContent className="pt-4">
      {recentJobs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No completed print jobs recorded yet.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {recentJobs.map(job => (
            <div key={job.id} className="py-2.5 flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold">
                  <PrivacyWrapper keyName="maskJobName" placeholder="••••••••" inline>
                    {job.name}
                  </PrivacyWrapper>
                </p>
                <p className="text-xs text-muted-foreground">
                  {job.job_type} • {job.duration_minutes}m
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  <PrivacyWrapper keyName="maskJobSalesPrice" placeholder="•••.••" inline>
                    ₺{job.total_cost.toFixed(2)}
                  </PrivacyWrapper>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Cost: ₺{(job.production_cost || 0).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { filaments, isLoading } = useFilaments();
  const { jobs } = useJobs();
  const { stockSettings } = useStockSettings();
  const { isMasked } = usePrivacy();

  if (isLoading) return <DashboardSkeleton />;

  const totalWeightKg = filaments.reduce((acc, f) => acc + f.remaining_weight_g, 0) / 1000;
  const weightProgressPercent = Math.min((totalWeightKg / 100) * 100, 100);
  const lowStockThreshold = stockSettings?.low_stock_threshold ?? 200;
  const recentJobs = jobs.filter(j => j.status !== 'pending').slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">
          <PrivacyWrapper keyName="maskDashboardTitle" placeholder="•••••" inline>
            Dashboard
          </PrivacyWrapper>
        </h1>
        <p className="text-muted-foreground">
          Welcome to your 3D printing control center ({jobs.length} recorded jobs).
        </p>
      </div>

      <DashboardKpiCards jobs={jobs} filaments={filaments} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PrinterStatusWidget />
        </div>

        <div className="lg:col-span-1">
          <DashboardAlertsCard
            jobs={jobs}
            filaments={filaments}
            lowStockThreshold={lowStockThreshold}
          />
        </div>

        <div className="lg:col-span-1">
          <Card className="group relative overflow-hidden transition-all duration-300 border-l-4 border-l-indigo-500 shadow-md h-full bg-white dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-bold text-indigo-950 dark:text-indigo-50">
                Inventory Warehouse
              </CardTitle>
              <Box className="w-5 h-5 text-indigo-500" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tighter text-indigo-600 dark:text-indigo-400">
                  <PrivacyWrapper keyName="maskDashboardStats" placeholder="•••••" inline>
                    {filaments.length}
                  </PrivacyWrapper>
                </span>
                <span className="text-xs font-semibold text-indigo-950/60 dark:text-indigo-200/60 uppercase tracking-widest">
                  Active Filament Spools
                </span>
              </div>

              <div className="pt-4 border-t border-indigo-100/50 dark:border-indigo-950/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Total Warehouse Weight
                  </span>
                  <span className="text-xl font-bold text-indigo-950 dark:text-indigo-50">
                    <PrivacyWrapper keyName="maskDashboardStats" placeholder="•••••" inline>
                      {totalWeightKg.toFixed(2)} kg
                    </PrivacyWrapper>
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-indigo-100/50 dark:bg-indigo-950/50 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-1000 ease-in-out"
                    style={{
                      width: isMasked('maskDashboardStats') ? '0%' : `${weightProgressPercent}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RecentJobsCard recentJobs={recentJobs} />
    </div>
  );
};

export default Dashboard;
