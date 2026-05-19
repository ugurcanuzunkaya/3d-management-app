import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Activity, Thermometer, Clock,
  Gauge, Box, RefreshCw, Plus, Edit2, Trash2, X,
  Eye, EyeOff
} from 'lucide-react';
import api from '@/lib/api';
import type { Printer } from '@/types';

interface TelemetryStatus {
  last_updated?: number;
  gcode_state?: string;
  percent?: number;
  nozzle_temper?: number;
  nozzle_target_temper?: number;
  bed_temper?: number;
  bed_target_temper?: number;
  chamber_temper?: number;
  spd_lvl?: number;
  spd_mag?: number;
  nozzle_type?: string;
  nozzle_diameter?: string;
  remain_time?: number;
  layer_num?: number;
  total_layer_num?: number;
  subtask_name?: string;
  info?: { temp?: number };
  ams?: { ams?: Array<{ humidity_raw?: number; humidity?: number; temp?: number }> };
  online?: { ahb?: boolean; version?: number } | boolean;
}

const PrinterPage = () => {
  const queryClient = useQueryClient();
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lastManualPoll, setLastManualPoll] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    serial_number: '',
    access_code: '',
    is_active: true
  });

  const [editFormData, setEditFormData] = useState({
    id: 0,
    name: '',
    ip_address: '',
    serial_number: '',
    access_code: '',
    is_active: true
  });

  // Query all printers
  const { data: printers, isLoading: isLoadingPrinters } = useQuery<Printer[]>({
    queryKey: ['printers'],
    queryFn: () => api.get('/api/printer').then(res => res.data)
  });

  // Compute active/selected printer ID dynamically to avoid setState in effect
  const activePrinterId = selectedPrinterId ?? (printers && printers.length > 0
    ? (printers.find(p => p.is_active)?.id ?? printers[0].id)
    : null);

  // Update clock for offline timer calculation
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const selectedPrinter = printers?.find(p => p.id === activePrinterId);

  // Query status for all printers to display labels in the list
  const { data: allStatuses, isError } = useQuery<Record<number, TelemetryStatus>>({
    queryKey: ['all-printer-statuses'],
    queryFn: () => api.get('/api/printer/status/all').then(res => res.data),
    refetchInterval: 5000 // Poll every 5s for all printers
  });

  const status = allStatuses && activePrinterId ? allStatuses[activePrinterId] : null;

  // Mutations
  const addPrinterMutation = useMutation({
    mutationFn: (newPrinter: Omit<Printer, 'id'>) => api.post('/api/printer', newPrinter),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      queryClient.invalidateQueries({ queryKey: ['all-printer-statuses'] });
      setIsAddModalOpen(false);
      setFormData({ name: '', ip_address: '', serial_number: '', access_code: '', is_active: true });
      setSelectedPrinterId(res.data.id);
    }
  });

  const updatePrinterMutation = useMutation({
    mutationFn: (updated: Printer) => api.put(`/api/printer/${updated.id}`, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      queryClient.invalidateQueries({ queryKey: ['all-printer-statuses'] });
      setIsEditModalOpen(false);
    }
  });

  const deletePrinterMutation = useMutation({
    mutationFn: (printerId: number) => api.delete(`/api/printer/${printerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      queryClient.invalidateQueries({ queryKey: ['all-printer-statuses'] });
      setSelectedPrinterId(null);
    }
  });

  const pollMutation = useMutation({
    mutationFn: () => {
      if (!activePrinterId) return Promise.resolve(null);
      return api.post(`/api/printer/${activePrinterId}/poll`);
    },
    onSuccess: () => {
      setLastManualPoll(new Date());
      queryClient.invalidateQueries({ queryKey: ['all-printer-statuses'] });
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ip_address || !formData.serial_number || !formData.access_code) {
      alert('Please fill out all fields.');
      return;
    }
    addPrinterMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.ip_address || !editFormData.serial_number || !editFormData.access_code) {
      alert('Please fill out all fields.');
      return;
    }
    updatePrinterMutation.mutate(editFormData);
  };

  const openEditModal = (printer: Printer) => {
    setEditFormData(printer);
    setIsEditModalOpen(true);
  };

  const handleDelete = (printerId: number) => {
    if (confirm('Are you sure you want to delete this printer? All telemetry logs and configuration will be removed.')) {
      deletePrinterMutation.mutate(printerId);
    }
  };

  // Status helper variables
  const amsUnit = status?.ams?.ams?.[0] || {};
  const isOffline = status?.last_updated ? (now - status.last_updated * 1000 > 300000) : false;
  const hasValidData = !isError && status && Object.keys(status).length > 0;

  // Helpers to get state strings and indicators
  const getPrinterStatusInfo = (p: Printer, statusData: TelemetryStatus | null | undefined, timeNow: number) => {
    if (!p.is_active) {
      return {
        label: 'Offline',
        color: 'bg-zinc-500',
        text: 'text-zinc-400',
        border: 'border-zinc-800',
        glow: 'shadow-[0_0_15px_rgba(113,113,122,0.15)]',
        badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        bg: 'linear-gradient(135deg, #18181b 0%, #09090b 80%, #000000 100%)',
        borderColorHex: 'rgba(113, 113, 122, 0.2)',
        hoverBorderColorHex: 'rgba(113, 113, 122, 0.5)'
      };
    }

    // Calculate telemetry age
    const lastUpdated = statusData?.last_updated;
    const lastValidTime = statusData && Object.keys(statusData).length > 0 && lastUpdated ? lastUpdated * 1000 : null;
    const idleDuration = lastValidTime ? (timeNow - lastValidTime) : null;
    const isOfflineState = (idleDuration !== null && idleDuration > 300000) ||
      statusData?.gcode_state === 'OFFLINE' ||
      (statusData?.online === false || (typeof statusData?.online === 'object' && statusData?.online !== null && statusData?.online.ahb === false));

    if (isOfflineState || !statusData || Object.keys(statusData).length === 0) {
      return {
        label: 'Offline',
        color: 'bg-zinc-500',
        text: 'text-zinc-400',
        border: 'border-zinc-800',
        glow: 'shadow-[0_0_15px_rgba(113,113,122,0.15)]',
        badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        bg: 'linear-gradient(135deg, #18181b 0%, #09090b 80%, #000000 100%)',
        borderColorHex: 'rgba(113, 113, 122, 0.2)',
        hoverBorderColorHex: 'rgba(113, 113, 122, 0.5)'
      };
    }

    const gcodeState = statusData?.gcode_state || 'IDLE';

    if (gcodeState === 'RUNNING' || gcodeState === 'PREPARE' || gcodeState === 'FINISHING') {
      return {
        label: 'Working',
        color: 'bg-blue-500 animate-pulse',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        bg: 'linear-gradient(135deg, #0f172a 0%, #09090b 80%, #000000 100%)',
        borderColorHex: 'rgba(59, 130, 246, 0.3)',
        hoverBorderColorHex: 'rgba(59, 130, 246, 0.8)'
      };
    }

    if (gcodeState === 'PAUSE' || gcodeState === 'FAILED') {
      return {
        label: 'Stopped',
        color: 'bg-red-500 animate-pulse',
        text: 'text-red-400',
        border: 'border-red-500/30',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        badge: 'bg-red-500/10 text-red-400 border-red-500/20',
        bg: 'linear-gradient(135deg, #450a0a 0%, #09090b 80%, #000000 100%)',
        borderColorHex: 'rgba(239, 68, 68, 0.3)',
        hoverBorderColorHex: 'rgba(239, 68, 68, 0.8)'
      };
    }

    if (gcodeState === 'IDLE' || gcodeState === 'FINISH') {
      return {
        label: 'Idle',
        color: 'bg-yellow-500',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
        glow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]',
        badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        bg: 'linear-gradient(135deg, #422006 0%, #09090b 80%, #000000 100%)',
        borderColorHex: 'rgba(234, 179, 8, 0.3)',
        hoverBorderColorHex: 'rgba(234, 179, 8, 0.8)'
      };
    }

    // Fallback to Online
    return {
      label: 'Online',
      color: 'bg-emerald-500',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      bg: 'linear-gradient(135deg, #064e3b 0%, #09090b 80%, #000000 100%)',
      borderColorHex: 'rgba(16, 185, 129, 0.3)',
      hoverBorderColorHex: 'rgba(16, 185, 129, 0.8)'
    };
  };

  const getSpeedLabel = (lvl?: number) => {
    switch (lvl) {
      case 1: return "Silent";
      case 2: return "Standard";
      case 3: return "Sport";
      case 4: return "Ludicrous";
      default: return "Standard";
    }
  };

  const activeState = selectedPrinter ? getPrinterStatusInfo(selectedPrinter, status, now) : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            Printers Manager
          </h1>
          <p className="text-muted-foreground">Monitor and manage your Bambu Lab 3D printer fleet.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <Button
            variant="outline"
            onClick={() => setShowPersonalInfo(!showPersonalInfo)}
            className="gap-2 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            {showPersonalInfo ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            {showPersonalInfo ? 'Hide Credentials' : 'Show Credentials'}
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
            <Plus className="w-4 h-4" />
            Add Printer
          </Button>
        </div>
      </div>

      {isLoadingPrinters ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-muted-foreground font-medium">Loading printer registry...</p>
        </div>
      ) : !printers || printers.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/30 dark:bg-zinc-950/10">
          <Activity className="w-16 h-16 text-zinc-300 dark:text-zinc-800 mb-6" />
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">No printer added</h2>
          <p className="text-muted-foreground max-w-sm mb-8">
            You don't have any printers configured yet. Add your Bambu Lab printer to start receiving real-time MQTT telemetry.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-md">
            <Plus className="w-4 h-4" />
            Add Your First Printer
          </Button>
        </div>
      ) : (
        /* Printer Fleet View Split Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Printers List Grid */}
          <div className="space-y-4 lg:col-span-1">
            <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground px-1 mb-2">Active Fleet ({printers.length})</h2>
            <div className="space-y-3">
              {printers.map((printer) => {
                const pStatus = allStatuses?.[printer.id];
                const state = getPrinterStatusInfo(printer, pStatus, now);
                const isSelected = printer.id === activePrinterId;
                return (
                  <Card
                    key={printer.id}
                    className={`cursor-pointer transition-all duration-300 border text-white hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? 'shadow-sm ring-1 ring-white/10'
                        : ''
                    } ${state.glow}`}
                    style={{
                      background: state.bg,
                      borderColor: isSelected ? state.hoverBorderColorHex : state.borderColorHex,
                    }}
                    onClick={() => setSelectedPrinterId(printer.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {printer.name}
                          {!printer.is_active && (
                            <span className="text-[10px] bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">Disabled</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                          {showPersonalInfo ? printer.ip_address : '•••.•••.•••.•••'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-xs font-bold ${state.text}`}>{state.label}</div>
                          {pStatus && pStatus.gcode_state === 'RUNNING' && (
                            <div className="text-[10px] text-zinc-400">{pStatus.percent || 0}% Complete</div>
                          )}
                        </div>
                        <div className={`h-2.5 w-2.5 rounded-full ${state.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Printer Details & Settings */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPrinter && activeState ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Details Header Card */}
                <Card 
                  className={`border text-white shadow-lg relative overflow-hidden ${activeState.glow}`}
                  style={{
                    background: activeState.bg,
                    borderColor: activeState.borderColorHex
                  }}
                >
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">{selectedPrinter.name}</h2>
                        <div className={`h-2.5 w-2.5 rounded-full ${activeState.color}`} />
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Serial: {showPersonalInfo ? selectedPrinter.serial_number : '••••••••••••'} | Host: {showPersonalInfo ? selectedPrinter.ip_address : '•••.•••.•••.•••'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start md:self-center">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(selectedPrinter)} className="gap-1 border-white/20 text-white hover:bg-white/10 hover:text-white">
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Connection
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedPrinter.id)} className="gap-1 bg-red-600 hover:bg-red-500 text-white border-transparent">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Telemetry Details */}
                {!selectedPrinter.is_active ? (
                  <Card className="border border-dashed border-zinc-800 p-8 text-center bg-zinc-950/80 text-white">
                    <Activity className="w-12 h-12 text-zinc-600 opacity-50 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg text-zinc-300">Telemetry Stream Off</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
                      This printer is currently disabled. Toggle connection on in the settings dialog to resume live MQTT telemetry monitoring.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => openEditModal(selectedPrinter)} className="border-zinc-700 hover:bg-zinc-900 text-white">
                      Enable Printer Connection
                    </Button>
                  </Card>
                ) : isOffline ? (
                  <Card className="border border-red-900 p-8 text-center bg-zinc-950/80 text-white shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                    <Activity className="w-12 h-12 text-red-500 opacity-60 mx-auto mb-4 animate-pulse" />
                    <h3 className="font-semibold text-lg text-red-400">Printer Offline</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-6">
                      No telemetry packets have been received from IP {showPersonalInfo ? selectedPrinter.ip_address : '•••.•••.•••.•••'} in the last {status?.last_updated ? Math.floor((now - status.last_updated * 1000) / 60000) : 'several'} minutes. Check if the printer is powered on and connected to the same local network.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['all-printer-statuses'] })} className="border-zinc-700 hover:bg-zinc-900 text-white">
                      Recheck Connection
                    </Button>
                  </Card>
                ) : !hasValidData ? (
                  <Card className="p-8 text-center border border-zinc-800 bg-zinc-950/80 text-white">
                    <Activity className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
                    <h3 className="font-medium text-zinc-300">Awaiting Telemetry...</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
                      Subscribing to MQTT topic and syncing printer logs. This may take up to a minute.
                    </p>
                  </Card>
                ) : (
                  /* Live Telemetry View */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Telemetry</span>
                        {lastManualPoll && (
                          <span className="text-[10px] text-muted-foreground">
                            Last force poll: {lastManualPoll.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => pollMutation.mutate()}
                        disabled={pollMutation.isPending}
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${pollMutation.isPending ? 'animate-spin' : ''}`} />
                        Force Telemetry Request
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Thermals Panel */}
                      <Card className="border border-zinc-800 bg-zinc-950/80 text-white">
                        <CardHeader className="pb-3 border-b border-zinc-800/60">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                            <Thermometer className="w-4 h-4 text-orange-400" />
                            Temperatures
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400">Extruder Nozzle</span>
                            <div className="text-right">
                              <span className="text-lg font-bold text-white">{Math.round(status.nozzle_temper || 0)}°C</span>
                              <div className="text-[10px] text-zinc-500">Target: {status.nozzle_target_temper || 0}°C</div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400">Heated Bed</span>
                            <div className="text-right">
                              <span className="text-lg font-bold text-white">{Math.round(status.bed_temper || 0)}°C</span>
                              <div className="text-[10px] text-zinc-500">Target: {status.bed_target_temper || 0}°C</div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                            <span className="text-sm text-zinc-400">Chamber Ambient</span>
                            <span className="text-lg font-bold text-orange-400">{status.info?.temp || status.chamber_temper || 0}°C</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Performance Panel */}
                      <Card className="border border-zinc-800 bg-zinc-950/80 text-white">
                        <CardHeader className="pb-3 border-b border-zinc-800/60">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                            <Gauge className="w-4 h-4 text-emerald-400" />
                            Mechanics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400">Speed Profile</span>
                            <div className="text-right">
                              <span className="text-lg font-bold text-white">{getSpeedLabel(status.spd_lvl)}</span>
                              <div className="text-[10px] text-zinc-500">{status.spd_mag || 100}% speed scale</div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400">Hardware Nozzle</span>
                            <div className="text-right">
                              <span className="text-md font-bold text-white truncate">{status.nozzle_type || 'Stainless'}</span>
                              <div className="text-[10px] text-zinc-500">{status.nozzle_diameter || '0.4'}mm diameter</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Print Telemetry Panel */}
                      <Card className="md:col-span-2 border border-zinc-800 bg-zinc-950/80 text-white">
                        <CardHeader className="pb-3 border-b border-zinc-800/60">
                          <CardTitle className="text-sm font-semibold flex items-center justify-between text-white">
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-400" />
                              Job Progress
                            </span>
                            {status.gcode_state === 'RUNNING' && (
                              <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                PRINTING
                              </span>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="space-y-1">
                              <div className="text-xs text-zinc-500">State</div>
                              <div className={`text-md font-bold uppercase ${activeState.text}`}>{status.gcode_state || 'IDLE'}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-zinc-500">Completed</div>
                              <div className="text-md font-bold text-white">{status.percent || 0}%</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-zinc-500">Remaining</div>
                              <div className="text-md font-bold text-white">{status.remain_time || 0}m</div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                  className="h-full bg-indigo-500 transition-all duration-1000 ease-in-out"
                                  style={{ width: `${status.percent || 0}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-zinc-500">
                              <span>Layer {status.layer_num || 0}</span>
                              <span>Total Layers: {status.total_layer_num || 0}</span>
                            </div>
                          </div>

                          {status.subtask_name && (
                            <div className="pt-3 border-t border-zinc-800 text-xs font-mono text-zinc-500 break-all">
                              Task: {status.subtask_name}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* AMS Unit Panel */}
                      {amsUnit && Object.keys(amsUnit).length > 0 && (
                        <Card className="md:col-span-2 border border-zinc-800 bg-zinc-950/80 text-white">
                          <CardHeader className="pb-3 border-b border-zinc-800/60">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                              <Box className="w-4 h-4 text-indigo-400" />
                              Automatic Material System (AMS)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 grid grid-cols-2 gap-4">
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                              <div className="text-xs text-zinc-500">AMS Humidity</div>
                              <div className="text-xl font-bold text-indigo-400 mt-1">
                                {amsUnit.humidity_raw || 0}%
                              </div>
                              <span className="text-[10px] text-zinc-500">Sensor Raw: {amsUnit.humidity || 0}</span>
                            </div>
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                              <div className="text-xs text-zinc-500">AMS Temperature</div>
                              <div className="text-xl font-bold text-indigo-400 mt-1">
                                {amsUnit.temp || 0}°C
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select a printer from the left to view active telemetry logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Printer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <CardTitle className="text-xl font-bold">Add 3D Printer</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAddSubmit}>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Friendly Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Lab X1C"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ip_address">Local IP Address</Label>
                  <Input
                    id="ip_address"
                    placeholder="e.g. 192.168.1.150"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="serial_number">Bambu Serial Number</Label>
                  <Input
                    id="serial_number"
                    placeholder="e.g. 01P00A123456789"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="access_code">LAN Access Code</Label>
                  <Input
                    id="access_code"
                    type="password"
                    placeholder="8-character alphanumeric code"
                    value={formData.access_code}
                    onChange={(e) => setFormData({ ...formData, access_code: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">Enable immediately upon adding</Label>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3 border-t border-zinc-100 dark:border-zinc-900 mt-6 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addPrinterMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  {addPrinterMutation.isPending ? 'Registering...' : 'Register Printer'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Printer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <CardTitle className="text-xl font-bold">Edit Printer Connection</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsEditModalOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleEditSubmit}>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Friendly Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g. Lab X1C"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-ip_address">Local IP Address</Label>
                  <Input
                    id="edit-ip_address"
                    placeholder="e.g. 192.168.1.150"
                    value={editFormData.ip_address}
                    onChange={(e) => setEditFormData({ ...editFormData, ip_address: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-serial_number">Bambu Serial Number</Label>
                  <Input
                    id="edit-serial_number"
                    placeholder="e.g. 01P00A123456789"
                    value={editFormData.serial_number}
                    onChange={(e) => setEditFormData({ ...editFormData, serial_number: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-access_code">LAN Access Code</Label>
                  <Input
                    id="edit-access_code"
                    type="password"
                    placeholder="8-character alphanumeric code"
                    value={editFormData.access_code}
                    onChange={(e) => setEditFormData({ ...editFormData, access_code: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="edit-is_active"
                    type="checkbox"
                    checked={editFormData.is_active}
                    onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="edit-is_active" className="cursor-pointer">Active connection stream</Label>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3 border-t border-zinc-100 dark:border-zinc-900 mt-6 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updatePrinterMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  {updatePrinterMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PrinterPage;
