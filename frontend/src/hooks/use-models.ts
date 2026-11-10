import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelsApi } from '@/api/models';
import { queryKeys } from '@/lib/query-keys';
import type { Model3D } from '@/types';

export const useModels = () => {
  const queryClient = useQueryClient();

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: modelsApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Omit<Model3D, 'id'> & { id?: number }) => {
      if (data.id) {
        return modelsApi.update(data.id, data);
      }
      return modelsApi.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.models }),
  });

  const extractMutation = useMutation({
    mutationFn: modelsApi.extract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.models }),
  });

  const deleteMutation = useMutation({
    mutationFn: modelsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.models }),
  });

  return {
    models: modelsQuery.data || [],
    isLoading: modelsQuery.isLoading,
    saveModelAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    extractModel: extractMutation.mutate,
    isExtracting: extractMutation.isPending,
    deleteModel: deleteMutation.mutate,
    deleteModelAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
