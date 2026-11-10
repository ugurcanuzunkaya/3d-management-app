import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Wallet, Layers } from 'lucide-react';
import type { Filament, PrintJob } from '@/types';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

interface DashboardKpiCardsProps {
  jobs: PrintJob[];
  filaments: Filament[];
}

const computeKpiMetrics = (jobs: PrintJob[], filaments: Filament[]) => {
  const completedJobs = jobs.filter(j => j.status !== 'pending');
  const totalRevenue = completedJobs.reduce((acc, j) => acc + (j.total_cost || 0), 0);
  const totalProductionCost = completedJobs.reduce((acc, j) => acc + (j.production_cost || 0), 0);
  const netProfit = totalRevenue - totalProductionCost;
  const marginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const totalMinutes = completedJobs.reduce((acc, j) => acc + (j.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalGramsPrinted = completedJobs.reduce(
    (acc, j) => acc + (j.job_filaments?.reduce((s, jf) => s + jf.grams_used, 0) || 0),
    0
  );
  const inventoryAssetValue = filaments.reduce(
    (acc, f) => acc + (f.price_per_kg / 1000) * f.remaining_weight_g,
    0
  );
  return {
    completedCount: completedJobs.length,
    totalRevenue,
    totalProductionCost,
    netProfit,
    marginPct,
    totalHours,
    totalGramsPrinted,
    inventoryAssetValue,
  };
};

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({ jobs, filaments }) => {
  const m = computeKpiMetrics(jobs, filaments);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white dark:bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Total Revenue
          </CardTitle>
          <DollarSign className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
            <PrivacyWrapper keyName="maskDashboardStats" placeholder="•••••" inline>
              ₺{m.totalRevenue.toFixed(2)}
            </PrivacyWrapper>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {m.completedCount} completed print jobs
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500 shadow-sm bg-white dark:bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Production Cost
          </CardTitle>
          <Wallet className="w-4 h-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-black text-orange-600 dark:text-orange-400">
            <PrivacyWrapper keyName="maskDashboardStats" placeholder="•••••" inline>
              ₺{m.totalProductionCost.toFixed(2)}
            </PrivacyWrapper>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Stock Asset Value:{' '}
            <PrivacyWrapper keyName="maskDashboardStats" placeholder="••••" inline>
              ₺{m.inventoryAssetValue.toFixed(0)}
            </PrivacyWrapper>
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-white dark:bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Net Profit & Margin
          </CardTitle>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              <PrivacyWrapper keyName="maskDashboardStats" placeholder="•••••" inline>
                ₺{m.netProfit.toFixed(2)}
              </PrivacyWrapper>
            </p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {m.marginPct}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Realized net workshop profit</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500 shadow-sm bg-white dark:bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Workshop Output
          </CardTitle>
          <Layers className="w-4 h-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
            <PrivacyWrapper keyName="maskDashboardStats" placeholder="•••••" inline>
              {m.totalHours}h
            </PrivacyWrapper>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <PrivacyWrapper keyName="maskDashboardStats" placeholder="••••" inline>
              {Math.round(m.totalGramsPrinted)}g
            </PrivacyWrapper>{' '}
            printed • {filaments.length} spools in stock
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
