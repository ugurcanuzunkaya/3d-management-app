import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelsApi } from '@/api/models';

export const useModels = () => {
  const queryClient = useQueryClient();

  const modelsQuery = useQuery({
    queryKey: ['models'],
    queryFn: modelsApi.list,
  });

  const extractMutation = useMutation({
    mutationFn: modelsApi.extract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: modelsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });

  return {
    models: modelsQuery.data || [],
    isLoading: modelsQuery.isLoading,
    extractModel: extractMutation.mutate,
    isExtracting: extractMutation.isPending,
    deleteModel: deleteMutation.mutate,
  };
};
