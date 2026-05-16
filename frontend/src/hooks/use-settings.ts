import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';

export const useSettings = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    updateSettings: updateSettingsMutation.mutate,
  };
};

export const useStockSettings = () => {
  const queryClient = useQueryClient();

  const stockSettingsQuery = useQuery({
    queryKey: ['stock-settings'],
    queryFn: settingsApi.getStock,
  });

  const updateStockSettingsMutation = useMutation({
    mutationFn: settingsApi.updateStock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-settings'] }),
  });

  return {
    stockSettings: stockSettingsQuery.data,
    isLoading: stockSettingsQuery.isLoading,
    updateStockSettings: updateStockSettingsMutation.mutate,
  };
};
