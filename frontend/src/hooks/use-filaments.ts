import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filamentsApi } from '@/api/filaments';
import { queryKeys } from '@/lib/query-keys';
import type { Filament } from '@/types';

export const useFilaments = () => {
  const queryClient = useQueryClient();

  const filamentsQuery = useQuery({
    queryKey: queryKeys.filaments,
    queryFn: filamentsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: filamentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filaments });
      queryClient.invalidateQueries({ queryKey: queryKeys.filamentTypes });
      queryClient.invalidateQueries({ queryKey: queryKeys.colors });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Filament> }) =>
      filamentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filaments });
      queryClient.invalidateQueries({ queryKey: queryKeys.filamentTypes });
      queryClient.invalidateQueries({ queryKey: queryKeys.colors });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: filamentsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.filaments }),
  });

  return {
    filaments: filamentsQuery.data || [],
    isLoading: filamentsQuery.isLoading,
    createFilament: createMutation.mutate,
    createFilamentAsync: createMutation.mutateAsync,
    updateFilament: updateMutation.mutate,
    updateFilamentAsync: updateMutation.mutateAsync,
    deleteFilament: deleteMutation.mutate,
    deleteFilamentAsync: deleteMutation.mutateAsync,
    isUpserting: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useFilamentTypes = () => {
  const queryClient = useQueryClient();
  const typesQuery = useQuery({
    queryKey: queryKeys.filamentTypes,
    queryFn: filamentsApi.listTypes,
  });

  const createTypeMutation = useMutation({
    mutationFn: (name: string) => filamentsApi.createType({ name, is_custom: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.filamentTypes }),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: filamentsApi.deleteType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.filamentTypes }),
  });

  return {
    types: typesQuery.data || [],
    isLoading: typesQuery.isLoading,
    createType: createTypeMutation.mutate,
    createTypeAsync: createTypeMutation.mutateAsync,
    isCreatingType: createTypeMutation.isPending,
    deleteType: deleteTypeMutation.mutate,
    isDeletingType: deleteTypeMutation.isPending,
  };
};

export const useColors = () => {
  const queryClient = useQueryClient();
  const colorsQuery = useQuery({
    queryKey: queryKeys.colors,
    queryFn: filamentsApi.listColors,
  });

  const createColorMutation = useMutation({
    mutationFn: filamentsApi.createColor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.colors }),
  });

  const deleteColorMutation = useMutation({
    mutationFn: filamentsApi.deleteColor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.colors }),
  });

  return {
    colors: colorsQuery.data || [],
    isLoading: colorsQuery.isLoading,
    createColor: createColorMutation.mutate,
    createColorAsync: createColorMutation.mutateAsync,
    isCreatingColor: createColorMutation.isPending,
    deleteColor: deleteColorMutation.mutate,
    isDeletingColor: deleteColorMutation.isPending,
  };
};
