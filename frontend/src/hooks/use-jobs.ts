import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/api/jobs';
import { queryKeys } from '@/lib/query-keys';
import type { PrintJobCreate } from '@/types';

export const useJobs = (status?: string) => {
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs(status),
    queryFn: () => jobsApi.list(status),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.filaments });
  };

  const createJobMutation = useMutation({
    mutationFn: jobsApi.create,
    onSuccess: invalidateAll,
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PrintJobCreate> }) =>
      jobsApi.update(id, data),
    onSuccess: invalidateAll,
  });

  const approveJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data?: Partial<PrintJobCreate> }) =>
      jobsApi.approve(id, data),
    onSuccess: invalidateAll,
  });

  const deleteJobMutation = useMutation({
    mutationFn: jobsApi.delete,
    onSuccess: invalidateAll,
  });

  const deleteAllJobsMutation = useMutation({
    mutationFn: jobsApi.deleteAll,
    onSuccess: invalidateAll,
  });

  return {
    jobs: jobsQuery.data || [],
    isLoading: jobsQuery.isLoading,
    createJob: createJobMutation.mutateAsync,
    isCreatingJob: createJobMutation.isPending,
    updateJob: updateJobMutation.mutateAsync,
    isUpdatingJob: updateJobMutation.isPending,
    approveJob: approveJobMutation.mutateAsync,
    isApprovingJob: approveJobMutation.isPending,
    deleteJob: deleteJobMutation.mutateAsync,
    isDeletingJob: deleteJobMutation.isPending,
    deleteAllJobs: deleteAllJobsMutation.mutateAsync,
    isDeletingAllJobs: deleteAllJobsMutation.isPending,
  };
};
