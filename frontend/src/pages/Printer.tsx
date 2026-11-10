import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';
import type { Printer, PrinterStatus } from '@/types';
import { PrinterSkeleton } from '@/components/ui/Skeleton';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';
import { usePrinter } from '@/hooks/use-printer';
import { useFilaments } from '@/hooks/use-filaments';
import type { Filament } from '@/types';
import { queryKeys } from '@/lib/query-keys';
import {
  getPrinterStatusInfo,
  isPrinterOffline,
  type PrinterVisualState,
} from '@/lib/printer-utils';
import {
  FleetPrinterCard,
  PrinterDetailsHeader,
  ThermalsPanel,
  MechanicsPanel,
  JobProgressPanel,
} from '@/components/printer/PrinterCards';
import { AmsSlotGrid } from '@/components/printer/AmsSlotGrid';
import {
  EmptyFleetView,
  DisabledPrinterView,
  OfflinePrinterView,
  AwaitingTelemetryView,
  PrinterConnectionModal,
  type PrinterFormValues,
} from '@/components/printer/PrinterStatusViews';

const DEFAULT_PRINTER_FORM: PrinterFormValues = {
  name: '',
  ip_address: '',
  serial_number: '',
  access_code: '',
  is_active: true,
};

const resolveActivePrinterId = (selectedId: number | null, printers: Printer[]): number | null => {
  if (selectedId !== null) return selectedId;
  if (printers.length === 0) return null;
  return printers.find(p => p.is_active)?.id ?? printers[0].id;
};

const SelectedPrinterPanel = ({
  selectedPrinter,
  status,
  activeState,
  filaments,
  now,
  lastManualPoll,
  isPolling,
  onEdit,
  onDelete,
  onRecheck,
  onForcePoll,
  onAssignSlot,
}: {
  selectedPrinter: Printer;
  status: PrinterStatus | null | undefined;
  activeState: PrinterVisualState;
  filaments: Filament[];
  now: number;
  lastManualPoll: Date | null;
  isPolling: boolean;
  onEdit: (p: Printer) => void;
  onDelete: (id: number) => void;
  onRecheck: () => void;
  onForcePoll: () => void;
  onAssignSlot: (slotIndex: number, filamentId: number | null) => void;
}) => {
  const hasValidData = Boolean(status && Object.keys(status).length > 0);
  const offline = isPrinterOffline(status, now);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PrinterDetailsHeader printer={selectedPrinter} activeState={activeState} onEdit={onEdit} onDelete={onDelete} />
      {!selectedPrinter.is_active ? (
        <DisabledPrinterView onEnableClick={() => onEdit(selectedPrinter)} />
      ) : offline ? (
        <div className="space-y-6">
          <OfflinePrinterView printer={selectedPrinter} status={status} now={now} onRecheck={onRecheck} />
          <AmsSlotGrid status={status ?? {}} filaments={filaments} onAssignSlot={onAssignSlot} />
        </div>
      ) : !hasValidData || !status ? (
        <div className="space-y-6">
          <AwaitingTelemetryView />
          <AmsSlotGrid status={status ?? {}} filaments={filaments} onAssignSlot={onAssignSlot} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Telemetry</span>
              {lastManualPoll && <span className="text-[10px] text-muted-foreground">Last force poll: {lastManualPoll.toLocaleTimeString()}</span>}
            </div>
            <Button size="sm" variant="ghost" onClick={onForcePoll} disabled={isPolling} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200">
              <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} /> Force Telemetry Request
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ThermalsPanel status={status} />
            <MechanicsPanel status={status} />
            <JobProgressPanel status={status} activeState={activeState} />
            <AmsSlotGrid status={status} filaments={filaments} onAssignSlot={onAssignSlot} />
          </div>
        </div>
      )}
    </div>
  );
};

const PrinterFleetGrid = ({
  printers,
  allStatuses,
  activePrinterId,
  selectedPrinter,
  activeState,
  filaments,
  now,
  lastManualPoll,
  isPolling,
  onSelect,
  onEdit,
  onDelete,
  onRecheck,
  onForcePoll,
  onAssignSlot,
}: {
  printers: Printer[];
  allStatuses: Record<string, PrinterStatus>;
  activePrinterId: number | null;
  selectedPrinter: Printer | null;
  activeState: PrinterVisualState | null;
  filaments: Filament[];
  now: number;
  lastManualPoll: Date | null;
  isPolling: boolean;
  onSelect: (id: number) => void;
  onEdit: (p: Printer) => void;
  onDelete: (id: number) => void;
  onRecheck: () => void;
  onForcePoll: () => void;
  onAssignSlot: (slotIndex: number, filamentId: number | null) => void;
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
    <div className="space-y-4 lg:col-span-1">
      <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground px-1 mb-2">Active Fleet ({printers.length})</h2>
      <div className="space-y-3">
        {printers.map(printer => {
          const pStatus = allStatuses[printer.id];
          const state = getPrinterStatusInfo(printer, pStatus, now);
          return <FleetPrinterCard key={printer.id} printer={printer} status={pStatus} state={state} isSelected={printer.id === activePrinterId} onSelect={onSelect} />;
        })}
      </div>
    </div>
    <div className="lg:col-span-2 space-y-6">
      {selectedPrinter && activeState ? (
        <SelectedPrinterPanel
          selectedPrinter={selectedPrinter}
          status={activePrinterId ? allStatuses[activePrinterId] : null}
          activeState={activeState}
          filaments={filaments}
          now={now}
          lastManualPoll={lastManualPoll}
          isPolling={isPolling}
          onEdit={onEdit}
          onDelete={onDelete}
          onRecheck={onRecheck}
          onForcePoll={onForcePoll}
          onAssignSlot={onAssignSlot}
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">Select a printer from the left to view active telemetry logs.</div>
      )}
    </div>
  </div>
);

const PrinterPage = () => {
  const queryClient = useQueryClient();
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [lastManualPoll, setLastManualPoll] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { printers, isLoadingPrinters, allStatuses, createPrinterAsync, isCreatingPrinter, updatePrinterAsync, isUpdatingPrinter, deletePrinterAsync, assignSlot, poll, isPolling } = usePrinter(selectedPrinterId);
  const { filaments } = useFilaments();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const activePrinterId = resolveActivePrinterId(selectedPrinterId, printers);
  const selectedPrinter = printers.find(p => p.id === activePrinterId) ?? null;
  const status = activePrinterId ? allStatuses[activePrinterId] : null;
  const activeState = selectedPrinter ? getPrinterStatusInfo(selectedPrinter, status, now) : null;

  const handleAddSubmit = async (values: PrinterFormValues) => {
    const created = await createPrinterAsync(values);
    setIsAddModalOpen(false);
    setSelectedPrinterId(created.id);
  };

  const handleEditSubmit = async (values: PrinterFormValues) => {
    if (!editingPrinter) return;
    await updatePrinterAsync({ id: editingPrinter.id, data: values });
    setEditingPrinter(null);
  };

  const handleDelete = async (printerId: number) => {
    if (window.confirm('Are you sure you want to delete this printer? All telemetry logs and configuration will be removed.')) {
      await deletePrinterAsync(printerId);
      setSelectedPrinterId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            <PrivacyWrapper keyName="maskPrinterTitle" placeholder="•••••" inline>Printers Manager</PrivacyWrapper>
          </h1>
          <p className="text-muted-foreground">Monitor and manage your Bambu Lab 3D printer fleet.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
          <Plus className="w-4 h-4" /> Add Printer
        </Button>
      </div>
      {isLoadingPrinters ? (
        <PrinterSkeleton />
      ) : printers.length === 0 ? (
        <EmptyFleetView onAddClick={() => setIsAddModalOpen(true)} />
      ) : (
        <PrinterFleetGrid
          printers={printers}
          allStatuses={allStatuses}
          activePrinterId={activePrinterId}
          selectedPrinter={selectedPrinter}
          activeState={activeState}
          filaments={filaments}
          now={now}
          lastManualPoll={lastManualPoll}
          isPolling={isPolling}
          onSelect={setSelectedPrinterId}
          onEdit={setEditingPrinter}
          onDelete={handleDelete}
          onRecheck={() => queryClient.invalidateQueries({ queryKey: queryKeys.printerStatuses })}
          onForcePoll={() => {
            if (!activePrinterId) return;
            poll(activePrinterId, { onSuccess: () => setLastManualPoll(new Date()) });
          }}
          onAssignSlot={(slotIndex, filamentId) => {
            if (!activePrinterId) return;
            assignSlot({ printerId: activePrinterId, slotIndex, filamentId });
          }}
        />
      )}
      <PrinterConnectionModal
        key={isAddModalOpen ? 'add-open' : 'add-closed'}
        isOpen={isAddModalOpen}
        title="Add 3D Printer"
        submitLabel="Register Printer"
        pendingLabel="Registering..."
        initialValues={DEFAULT_PRINTER_FORM}
        isPending={isCreatingPrinter}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
      <PrinterConnectionModal
        key={editingPrinter?.id ?? 'edit-closed'}
        isOpen={Boolean(editingPrinter)}
        title="Edit Printer Connection"
        submitLabel="Save Changes"
        pendingLabel="Saving..."
        initialValues={editingPrinter ?? DEFAULT_PRINTER_FORM}
        isPending={isUpdatingPrinter}
        onClose={() => setEditingPrinter(null)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default PrinterPage;
