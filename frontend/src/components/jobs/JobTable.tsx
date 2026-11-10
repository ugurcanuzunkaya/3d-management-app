import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Package, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import type { PrintJob, Filament } from '@/types';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

interface JobTableProps {
  jobs: PrintJob[];
  filaments: Filament[];
  onEdit: (job: PrintJob) => void;
  onDelete: (id: number, name: string) => void;
}

const JobCostCell = ({ job }: { job: PrintJob }) => {
  const profit = job.total_cost - job.production_cost;
  const marginPct = job.total_cost > 0 ? Math.round((profit / job.total_cost) * 100) : 0;

  return (
    <TableCell className="font-mono">
      <div className="flex flex-col">
        <span className="font-bold text-green-600 font-mono">
          <PrivacyWrapper keyName="maskJobTotalCost" placeholder="₺•••.••" inline>
            ₺{job.total_cost.toFixed(2)}
          </PrivacyWrapper>
        </span>
        <div className="flex gap-2 items-center text-[10px] font-mono">
          <span className="text-muted-foreground opacity-70">
            Cost:{' '}
            <PrivacyWrapper keyName="maskJobProductionCost" placeholder="₺•••.••" inline>
              ₺{job.production_cost.toFixed(2)}
            </PrivacyWrapper>
          </span>
          <span className="text-blue-600 font-bold">
            P:{' '}
            <PrivacyWrapper keyName="maskJobProfit" placeholder="₺•••.••" inline>
              ₺{profit.toFixed(2)} ({marginPct}%)
            </PrivacyWrapper>
          </span>
        </div>
      </div>
    </TableCell>
  );
};

const JobRowItem = ({
  job,
  filaments,
  onEdit,
  onDelete,
}: {
  job: PrintJob;
  filaments: Filament[];
  onEdit: (job: PrintJob) => void;
  onDelete: (id: number, name: string) => void;
}) => {
  const jobFilamentList =
    job.job_filaments && job.job_filaments.length > 0
      ? job.job_filaments.map(jf => ({
          name: filaments.find(f => f.id === jf.filament_id)?.name || 'Unknown',
          grams: jf.grams_used,
        }))
      : (job.filaments || []).map(f => ({ name: f.name, grams: null }));

  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
      <TableCell className="font-medium font-mono text-xs">
        <PrivacyWrapper keyName="maskJobDate" placeholder="••••••••••••" inline>{formatDate(job.created_at)}</PrivacyWrapper>
      </TableCell>
      <TableCell className="font-bold">
        <PrivacyWrapper keyName="maskJobName" placeholder="••••••••••••" inline>{job.name}</PrivacyWrapper>
      </TableCell>
      <TableCell>
        <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase font-mono">
          <PrivacyWrapper keyName="maskJobType" placeholder="•••••" inline>{job.job_type || 'N/A'}</PrivacyWrapper>
        </span>
      </TableCell>
      <TableCell>
        <PrivacyWrapper keyName="maskJobFilaments" placeholder="••••••••" inline>
          <div className="flex flex-wrap gap-1">
            {jobFilamentList.map((item, i) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px]">
                <Package className="w-3 h-3" />
                {item.name}
                {item.grams !== null ? ` (${item.grams}g)` : ''}
              </span>
            ))}
            {jobFilamentList.length === 0 && '-'}
          </div>
        </PrivacyWrapper>
      </TableCell>
      <TableCell className="font-mono text-xs">
        <PrivacyWrapper keyName="maskJobDuration" placeholder="•••" inline>{job.duration_minutes}m</PrivacyWrapper>
      </TableCell>
      <JobCostCell job={job} />
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(job)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(job.id, job.name)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const JobTable = ({ jobs, filaments, onEdit, onDelete }: JobTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead><PrivacyWrapper keyName="maskJobDate" inline>Date</PrivacyWrapper></TableHead>
        <TableHead><PrivacyWrapper keyName="maskJobName" inline>Job Name</PrivacyWrapper></TableHead>
        <TableHead><PrivacyWrapper keyName="maskJobType" inline>Type</PrivacyWrapper></TableHead>
        <TableHead><PrivacyWrapper keyName="maskJobFilaments" inline>Filaments</PrivacyWrapper></TableHead>
        <TableHead><PrivacyWrapper keyName="maskJobDuration" inline>Duration</PrivacyWrapper></TableHead>
        <TableHead>
          <PrivacyWrapper keyName="maskJobTotalCost" inline>Price</PrivacyWrapper> /{' '}
          <PrivacyWrapper keyName="maskJobProductionCost" inline>Prod.</PrivacyWrapper> /{' '}
          <PrivacyWrapper keyName="maskJobProfit" inline>Profit</PrivacyWrapper>
        </TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {jobs.length === 0 ? (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <ClipboardList className="w-12 h-12 opacity-20" />
              <p>No jobs found. Start by adding your first print job!</p>
            </div>
          </TableCell>
        </TableRow>
      ) : (
        jobs.map(job => <JobRowItem key={job.id} job={job} filaments={filaments} onEdit={onEdit} onDelete={onDelete} />)
      )}
    </TableBody>
  </Table>
);
