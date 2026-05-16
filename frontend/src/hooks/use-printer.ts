import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { printerApi } from '@/api/printer';

export const usePrinterStatus = () => {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['printer-status'],
    queryFn: printerApi.getStatus,
    refetchInterval: 30000, // Poll every 30s
  });

  const pollMutation = useMutation({
    mutationFn: printerApi.poll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['printer-status'] }),
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    poll: pollMutation.mutate,
  };
};
