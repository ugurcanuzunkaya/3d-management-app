import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Filament, PrintJob } from '@/types';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

interface DashboardAlertsCardProps {
  jobs: PrintJob[];
  filaments: Filament[];
  lowStockThreshold: number;
}

export const DashboardAlertsCard: React.FC<DashboardAlertsCardProps> = ({
  jobs,
  filaments,
  lowStockThreshold,
}) => {
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const lowStockFilaments = filaments.filter(f => f.remaining_weight_g <= lowStockThreshold);
  const hasAlerts = pendingJobs.length > 0 || lowStockFilaments.length > 0;

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-md h-full bg-white dark:bg-zinc-900">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Action Center & Low-Stock Alerts
        </CardTitle>
        <span className="text-xs font-semibold text-muted-foreground">
          {pendingJobs.length + lowStockFilaments.length} active
        </span>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {pendingJobs.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  {pendingJobs.length} Pending Completed Print{pendingJobs.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                  Review grams used and approve to deduct filament stock.
                </p>
              </div>
            </div>
            <Link to="/jobs">
              <Button size="sm" variant="outline" className="gap-1 text-xs shrink-0">
                Review <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {lowStockFilaments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Low-Stock Spools (≤ {lowStockThreshold}g)
              </p>
              <Link to="/stock" className="text-xs text-primary hover:underline font-medium">
                Manage Stock
              </Link>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {lowStockFilaments.map(f => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2 rounded-md bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: f.filament_color?.hex_code || '#ccc' }}
                    />
                    <span className="font-semibold truncate">
                      <PrivacyWrapper keyName="maskFilamentName" placeholder="•••••" inline>
                        {f.name}
                      </PrivacyWrapper>
                    </span>
                    {f.brand && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({f.brand})
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-red-600 dark:text-red-400 shrink-0 ml-2">
                    {Math.round(f.remaining_weight_g)}g left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasAlerts && (
          <div className="py-8 text-center flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-foreground">All Clear!</p>
            <p className="text-xs">No pending prints or low-stock spools require attention.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
