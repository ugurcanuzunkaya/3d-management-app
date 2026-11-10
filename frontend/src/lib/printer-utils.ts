import type { Printer, PrinterStatus } from '@/types';

export interface PrinterVisualState {
  label: string;
  color: string;
  text: string;
  border: string;
  glow: string;
  badge: string;
  bg: string;
  borderColorHex: string;
  hoverBorderColorHex: string;
}

const OFFLINE_VISUAL_STATE: PrinterVisualState = {
  label: 'Offline',
  color: 'bg-zinc-500',
  text: 'text-zinc-400',
  border: 'border-zinc-800',
  glow: 'shadow-[0_0_15px_rgba(113,113,122,0.15)]',
  badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  bg: 'linear-gradient(135deg, #18181b 0%, #09090b 80%, #000000 100%)',
  borderColorHex: 'rgba(113, 113, 122, 0.2)',
  hoverBorderColorHex: 'rgba(113, 113, 122, 0.5)',
};

const STATE_BY_GCODE: Record<string, PrinterVisualState> = {
  WORKING: {
    label: 'Working',
    color: 'bg-blue-500 animate-pulse',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    bg: 'linear-gradient(135deg, #0f172a 0%, #09090b 80%, #000000 100%)',
    borderColorHex: 'rgba(59, 130, 246, 0.3)',
    hoverBorderColorHex: 'rgba(59, 130, 246, 0.8)',
  },
  STOPPED: {
    label: 'Stopped',
    color: 'bg-red-500 animate-pulse',
    text: 'text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    bg: 'linear-gradient(135deg, #450a0a 0%, #09090b 80%, #000000 100%)',
    borderColorHex: 'rgba(239, 68, 68, 0.3)',
    hoverBorderColorHex: 'rgba(239, 68, 68, 0.8)',
  },
  IDLE: {
    label: 'Idle',
    color: 'bg-yellow-500',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    glow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]',
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    bg: 'linear-gradient(135deg, #422006 0%, #09090b 80%, #000000 100%)',
    borderColorHex: 'rgba(234, 179, 8, 0.3)',
    hoverBorderColorHex: 'rgba(234, 179, 8, 0.8)',
  },
  ONLINE: {
    label: 'Online',
    color: 'bg-emerald-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    bg: 'linear-gradient(135deg, #064e3b 0%, #09090b 80%, #000000 100%)',
    borderColorHex: 'rgba(16, 185, 129, 0.3)',
    hoverBorderColorHex: 'rgba(16, 185, 129, 0.8)',
  },
};

const isExplicitlyOffline = (statusData: PrinterStatus): boolean => {
  if (statusData.gcode_state === 'OFFLINE' || statusData.online === false) return true;
  return typeof statusData.online === 'object' && statusData.online !== null && statusData.online.ahb === false;
};

export const isPrinterOffline = (
  statusData: PrinterStatus | null | undefined,
  timeNow: number
): boolean => {
  if (!statusData || Object.keys(statusData).length === 0) return false;
  if (isExplicitlyOffline(statusData)) return true;
  return Boolean(statusData.last_updated && timeNow - statusData.last_updated * 1000 > 300000);
};

export const getSpeedLabel = (lvl?: number): string => {
  if (lvl === 1) return 'Silent';
  if (lvl === 3) return 'Sport';
  if (lvl === 4) return 'Ludicrous';
  return 'Standard';
};

export const getPrinterStatusInfo = (
  p: Printer,
  statusData: PrinterStatus | null | undefined,
  timeNow: number
): PrinterVisualState => {
  if (!p.is_active || !statusData || Object.keys(statusData).length === 0 || isPrinterOffline(statusData, timeNow)) {
    return OFFLINE_VISUAL_STATE;
  }
  const gcodeState = statusData.gcode_state || 'IDLE';
  if (gcodeState === 'RUNNING' || gcodeState === 'PREPARE' || gcodeState === 'FINISHING') {
    return STATE_BY_GCODE.WORKING;
  }
  if (gcodeState === 'PAUSE' || gcodeState === 'FAILED') {
    return STATE_BY_GCODE.STOPPED;
  }
  if (gcodeState === 'IDLE' || gcodeState === 'FINISH') {
    return STATE_BY_GCODE.IDLE;
  }
  return STATE_BY_GCODE.ONLINE;
};

export const getWidgetCardStyle = (
  state: string,
  isOfflineState: boolean,
  isWarningState: boolean,
  hovered: boolean
) => {
  if (isOfflineState || state === 'FAILED') {
    return {
      background: 'linear-gradient(135deg, #450a0a 0%, #09090b 80%, #000000 100%)',
      borderColor: hovered ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
      boxShadow: hovered ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
    };
  }
  if (isWarningState || state === 'PAUSE') {
    return {
      background: 'linear-gradient(135deg, #451a03 0%, #09090b 80%, #000000 100%)',
      borderColor: hovered ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)',
      boxShadow: hovered ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none',
    };
  }
  if (state === 'RUNNING') {
    return {
      background: 'linear-gradient(135deg, #022c22 0%, #09090b 80%, #000000 100%)',
      borderColor: hovered ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
      boxShadow: hovered ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none',
    };
  }
  return {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #09090b 85%, #000000 100%)',
    borderColor: hovered ? '#3b82f6' : 'rgba(59, 130, 246, 0.15)',
    boxShadow: hovered ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
  };
};

export const extractWidgetTelemetry = (status: PrinterStatus) => ({
  progress: status.percent ?? 0,
  nozzleTemp: Math.round(status.nozzle_temper ?? 0),
  bedTemp: Math.round(status.bed_temper ?? 0),
  chamberTemp: status.device?.ctc?.info?.temp ?? status.info?.temp ?? status.chamber_temper ?? 0,
  remainTime: status.remain_time ?? 0,
  layerNum: status.layer_num ?? 0,
  totalLayerNum: status.total_layer_num ?? 0,
  subtaskName: status.subtask_name ?? 'Printer Standby',
});

export const computeIdleDuration = (
  status: PrinterStatus | undefined,
  hasValidData: boolean,
  dataUpdatedAt: number,
  mountTime: number,
  now: number
): number => {
  if (status?.last_updated) return Math.max(0, now - status.last_updated * 1000);
  if (hasValidData && dataUpdatedAt) return Math.max(0, now - dataUpdatedAt);
  return Math.max(0, now - mountTime);
};

export const getWidgetDotColor = (isOffline: boolean, isWarning: boolean, gcodeState: string): string => {
  if (isOffline) return 'bg-red-400';
  if (isWarning) return 'bg-amber-400';
  return gcodeState === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400';
};

export const getWidgetStateLabel = (isOffline: boolean, isWarning: boolean, gcodeState: string): string => {
  if (isOffline) return 'OFFLINE';
  if (isWarning) return 'UNCERTAIN';
  return gcodeState;
};
