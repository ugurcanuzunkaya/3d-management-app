import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, Plus } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

const PendingApprovals = () => {
  const queryClient = useQueryClient();
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['pending-jobs'],
    queryFn: () => api.get('/api/printjobs', { params: { status: 'pending' } }).then(res => res.data)
  });

  const approveMutation = useMutation({
    mutationFn: (jobId: number) => api.post(`/api/printjobs/${jobId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Approvals</h1>
          <p className="text-muted-foreground">Review and confirm print jobs from your P2S printer.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Filament</TableHead>
                <TableHead>Used (g)</TableHead>
                <TableHead>Duration (min)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No pending jobs to approve.
                  </TableCell>
                </TableRow>
              )}
              {jobs?.map((job: any) => (
                <TableRow key={job.id}>
                  <TableCell>{format(new Date(job.created_at), 'MMM dd, HH:mm')}</TableCell>
                  <TableCell>{job.model?.name || 'Unknown'}</TableCell>
                  <TableCell>{job.filament?.name || 'Unknown'}</TableCell>
                  <TableCell>{job.used_filament_g}g</TableCell>
                  <TableCell>{job.duration_minutes}m</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" /> Add Cost
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => approveMutation.mutate(job.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovals;
