import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { printerApi } from '@/api/printer';
import { queryKeys } from '@/lib/query-keys';
import type { Printer } from '@/types';

export const usePrinter = (
  selectedId?: number | null,
  options?: { pollStatuses?: boolean }
) => {
  const queryClient = useQueryClient();
  const pollStatuses = options?.pollStatuses ?? true;

  const printersQuery = useQuery({
    queryKey: queryKeys.printers,
    queryFn: printerApi.list,
    refetchInterval: pollStatuses ? 5000 : false,
  });

  const allStatusesQuery = useQuery({
    queryKey: queryKeys.printerStatuses,
    queryFn: printerApi.getAllStatuses,
    enabled: pollStatuses,
    refetchInterval: pollStatuses ? 3000 : false,
  });

  const createMutation = useMutation({
    mutationFn: printerApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.printers }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Printer> }) =>
      printerApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.printers }),
  });

  const deleteMutation = useMutation({
    mutationFn: printerApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.printers }),
  });

  const assignSlotMutation = useMutation({
    mutationFn: ({
      printerId,
      slotIndex,
      filamentId,
    }: {
      printerId: number;
      slotIndex: number;
      filamentId: number | null;
    }) => printerApi.assignSlot(printerId, slotIndex, filamentId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.printerSlots(vars.printerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.printerStatus(vars.printerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.printerStatuses });
    },
  });

  const pollMutation = useMutation({
    mutationFn: (id: number) => printerApi.poll(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.printerStatus(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.printerSlots(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.printerStatuses });
    },
  });

  const allStatuses = allStatusesQuery.data || {};
  const selectedStatus = selectedId ? allStatuses[selectedId] : undefined;

  return {
    printers: printersQuery.data || [],
    isLoadingPrinters: printersQuery.isLoading,
    allStatuses,
    isLoadingStatuses: allStatusesQuery.isLoading,
    status: selectedStatus,
    isLoadingStatus: allStatusesQuery.isLoading,
    slots: selectedStatus?.slots || [],
    isLoadingSlots: allStatusesQuery.isLoading,
    createPrinter: createMutation.mutate,
    createPrinterAsync: createMutation.mutateAsync,
    isCreatingPrinter: createMutation.isPending,
    updatePrinter: updateMutation.mutate,
    updatePrinterAsync: updateMutation.mutateAsync,
    isUpdatingPrinter: updateMutation.isPending,
    deletePrinter: deleteMutation.mutate,
    deletePrinterAsync: deleteMutation.mutateAsync,
    assignSlot: assignSlotMutation.mutate,
    assignSlotAsync: assignSlotMutation.mutateAsync,
    isAssigningSlot: assignSlotMutation.isPending,
    poll: pollMutation.mutate,
    isPolling: pollMutation.isPending,
  };
};
