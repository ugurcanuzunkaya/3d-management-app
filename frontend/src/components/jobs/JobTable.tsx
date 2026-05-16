import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Package, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDuration, formatDate } from '@/lib/formatters';
import type { PrintJob, Filament } from '@/types';

interface JobTableProps {
  jobs: PrintJob[];
  filaments: Filament[];
  onEdit: (job: PrintJob) => void;
  onDelete: (id: number, name: string) => void;
}

export const JobTable = ({ jobs, filaments, onEdit, onDelete }: JobTableProps) => {
  if (jobs.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <ClipboardList className="w-12 h-12 opacity-20" />
                <p>No jobs found. Start by adding your first print job!</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Job Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Filaments</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Price / Prod.</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
            <TableCell className="font-medium">{formatDate(job.created_at)}</TableCell>
            <TableCell className="font-bold">{job.name}</TableCell>
            <TableCell>
              <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                {job.job_type}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {job.job_filaments?.map((f, i) => {
                  const filament = filaments.find(filt => filt.id === f.filament_id);
                  return (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px]">
                      <Package className="w-3 h-3" />
                      {filament?.name || 'Unknown'} ({f.grams_used}g)
                    </span>
                  );
                })}
                {(!job.job_filaments || job.job_filaments.length === 0) && '-'}
              </div>
            </TableCell>
            <TableCell>{formatDuration(job.duration_minutes)}</TableCell>
            <TableCell className="font-mono">
              <div className="flex flex-col">
                <span className="font-bold text-green-600">{formatCurrency(job.total_cost)}</span>
                <div className="flex gap-2 items-center text-[10px]">
                  <span className="text-muted-foreground opacity-70">Cost: {formatCurrency(job.production_cost)}</span>
                  <span className="text-blue-600 font-bold">P: {formatCurrency(job.total_cost - job.production_cost)}</span>
                </div>
              </div>
            </TableCell>
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
        ))}
      </TableBody>
    </Table>
  );
};
