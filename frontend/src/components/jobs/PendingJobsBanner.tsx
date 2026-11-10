import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import type { Filament, PrintJob, PrintJobCreate } from '@/types';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

interface PendingJobRowProps {
  job: PrintJob;
  filaments: Filament[];
  onApprove: (id: number, data?: Partial<PrintJobCreate>) => Promise<unknown>;
  onReviewEdit: (job: PrintJob) => void;
  onDismiss: (id: number) => void;
}

const PendingJobInfo = ({
  jobName,
  spoolName,
  needsGramEntry,
}: {
  jobName: string;
  spoolName: string;
  needsGramEntry: boolean;
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <span className="font-semibold text-base">
        <PrivacyWrapper keyName="maskJobName" placeholder="Pending Print">
          {jobName}
        </PrivacyWrapper>
      </span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
        Pending Review
      </span>
    </div>
    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
      <span>
        Spool: <strong>{spoolName}</strong>
      </span>
      {needsGramEntry && (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
          <AlertTriangle className="w-3.5 h-3.5" /> Enter final weight (g) before approving
        </span>
      )}
    </div>
  </div>
);

const PendingJobRow = ({
  job,
  filaments,
  onApprove,
  onReviewEdit,
  onDismiss,
}: PendingJobRowProps) => {
  const firstLink = job.job_filaments?.[0];
  const initialGrams = firstLink?.grams_used ?? 0;
  const [grams, setGrams] = useState<string>(String(initialGrams));
  const [price, setPrice] = useState<string>(String(job.total_cost || 0));

  const matchedFilament = filaments.find(f => f.id === firstLink?.filament_id);
  const parsedGrams = parseFloat(grams) || 0;
  const needsGramEntry = parsedGrams <= 0;

  const handleQuickApprove = async () => {
    const updatedFilaments = firstLink
      ? [{ filament_id: firstLink.filament_id, grams_used: parsedGrams }]
      : [];
    await onApprove(job.id, {
      total_cost: parseFloat(price) || 0,
      filaments: updatedFilaments,
    });
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/30 bg-background/80">
      <PendingJobInfo
        jobName={job.name}
        spoolName={matchedFilament ? matchedFilament.name : 'Unassigned Spool'}
        needsGramEntry={needsGramEntry}
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground">Grams:</label>
          <Input
            type="number"
            min="0"
            step="0.1"
            aria-label={`Grams for ${job.name}`}
            value={grams}
            onChange={e => setGrams(e.target.value)}
            className={`w-24 h-8 text-xs ${needsGramEntry ? 'border-amber-500' : ''}`}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground">Price (₺):</label>
          <PrivacyWrapper keyName="maskFinancials" placeholder="•••">
            <Input
              type="number"
              min="0"
              step="1"
              aria-label={`Price for ${job.name}`}
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-24 h-8 text-xs"
            />
          </PrivacyWrapper>
        </div>
        <Button size="sm" variant="outline" onClick={() => onReviewEdit(job)} className="h-8 gap-1 text-xs">
          <Edit2 className="w-3.5 h-3.5" /> Full Edit
        </Button>
        <Button size="sm" onClick={handleQuickApprove} className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Deduct
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDismiss(job.id)} className="h-8 text-destructive hover:text-destructive" title="Dismiss pending print">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface PendingJobsBannerProps {
  pendingJobs: PrintJob[];
  filaments: Filament[];
  onApprove: (id: number, data?: Partial<PrintJobCreate>) => Promise<unknown>;
  onReviewEdit: (job: PrintJob) => void;
  onDismiss: (id: number) => void;
}

export const PendingJobsBanner = ({
  pendingJobs,
  filaments,
  onApprove,
  onReviewEdit,
  onDismiss,
}: PendingJobsBannerProps) => {
  if (pendingJobs.length === 0) return null;

  return (
    <Card className="border-amber-500/40 bg-amber-500/5 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Clock className="w-5 h-5" />
          Pending Completed Prints ({pendingJobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingJobs.map(job => (
          <PendingJobRow
            key={job.id}
            job={job}
            filaments={filaments}
            onApprove={onApprove}
            onReviewEdit={onReviewEdit}
            onDismiss={onDismiss}
          />
        ))}
      </CardContent>
    </Card>
  );
};
