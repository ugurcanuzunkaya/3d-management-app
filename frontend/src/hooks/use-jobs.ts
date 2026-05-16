import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/api/jobs';
import type { PrintJobCreate } from '@/types';

export const useJobs = (status?: string) => {
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ['jobs', status],
    queryFn: () => jobsApi.list(status),
  });

  const createJobMutation = useMutation({
    mutationFn: jobsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PrintJobCreate> }) => 
      jobsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: jobsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
    },
  });

  return {
    jobs: jobsQuery.data || [],
    isLoading: jobsQuery.isLoading,
    createJob: createJobMutation.mutateAsync,
    updateJob: updateJobMutation.mutateAsync,
    deleteJob: deleteJobMutation.mutateAsync,
  };
};
