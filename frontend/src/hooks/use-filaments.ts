import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filamentsApi } from '@/api/filaments';
import type { Filament } from '@/types';

export const useFilaments = () => {
  const queryClient = useQueryClient();

  const filamentsQuery = useQuery({
    queryKey: ['filaments'],
    queryFn: filamentsApi.list,
  });

  const createFilamentMutation = useMutation({
    mutationFn: filamentsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filaments'] }),
  });

  const updateFilamentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Filament> }) => 
      filamentsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filaments'] }),
  });

  const deleteFilamentMutation = useMutation({
    mutationFn: filamentsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filaments'] }),
  });

  return {
    filaments: filamentsQuery.data || [],
    isLoading: filamentsQuery.isLoading,
    createFilament: createFilamentMutation.mutate,
    updateFilament: updateFilamentMutation.mutate,
    deleteFilament: deleteFilamentMutation.mutate,
  };
};

export const useFilamentTypes = () => {
  const queryClient = useQueryClient();

  const typesQuery = useQuery({
    queryKey: ['filament-types'],
    queryFn: filamentsApi.listTypes,
  });

  const createTypeMutation = useMutation({
    mutationFn: filamentsApi.createType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filament-types'] }),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: filamentsApi.deleteType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filament-types'] }),
  });

  return {
    types: typesQuery.data || [],
    isLoading: typesQuery.isLoading,
    createType: createTypeMutation.mutate,
    createTypeAsync: createTypeMutation.mutateAsync,
    deleteType: deleteTypeMutation.mutate,
  };
};

export const useColors = () => {
  const queryClient = useQueryClient();

  const colorsQuery = useQuery({
    queryKey: ['filament-colors'],
    queryFn: filamentsApi.listColors,
  });

  const createColorMutation = useMutation({
    mutationFn: filamentsApi.createColor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filament-colors'] }),
  });

  const deleteColorMutation = useMutation({
    mutationFn: filamentsApi.deleteColor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filament-colors'] }),
  });

  return {
    colors: colorsQuery.data || [],
    isLoading: colorsQuery.isLoading,
    createColor: createColorMutation.mutate,
    createColorAsync: createColorMutation.mutateAsync,
    deleteColor: deleteColorMutation.mutate,
  };
};
