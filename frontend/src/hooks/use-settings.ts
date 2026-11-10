import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import { queryKeys } from '@/lib/query-keys';

export const useSettings = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.get,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};

export const useStockSettings = () => {
  const queryClient = useQueryClient();

  const stockSettingsQuery = useQuery({
    queryKey: queryKeys.stockSettings,
    queryFn: settingsApi.getStock,
  });

  const updateStockSettingsMutation = useMutation({
    mutationFn: settingsApi.updateStock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.stockSettings }),
  });

  return {
    stockSettings: stockSettingsQuery.data,
    isLoading: stockSettingsQuery.isLoading,
    updateStockSettings: updateStockSettingsMutation.mutate,
    isUpdatingStock: updateStockSettingsMutation.isPending,
  };
};
