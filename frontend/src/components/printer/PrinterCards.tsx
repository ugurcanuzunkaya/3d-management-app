import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Thermometer, Clock, Gauge, Box, Edit2, Trash2 } from 'lucide-react';
import type { Printer, PrinterStatus } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';
import { getSpeedLabel, type PrinterVisualState } from '@/lib/printer-utils';

export const FleetPrinterCard = ({
  printer,
  status,
  state,
  isSelected,
  onSelect,
}: {
  printer: Printer;
  status: PrinterStatus | null | undefined;
  state: PrinterVisualState;
  isSelected: boolean;
  onSelect: (id: number) => void;
}) => (
  <Card
    className={`cursor-pointer transition-all duration-300 border text-white hover:-translate-y-0.5 hover:shadow-md ${
      isSelected ? 'shadow-sm ring-1 ring-white/10' : ''
    } ${state.glow}`}
    style={{
      background: state.bg,
      borderColor: isSelected ? state.hoverBorderColorHex : state.borderColorHex,
    }}
    onClick={() => onSelect(printer.id)}
  >
    <CardContent className="p-4 flex items-center justify-between">
      <div className="space-y-1">
        <div className="font-semibold text-white flex items-center gap-2">
          <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>{printer.name}</PrivacyWrapper>
          {!printer.is_active && (
            <span className="text-[10px] bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">Disabled</span>
          )}
        </div>
        <div className="text-xs text-zinc-400 font-mono">
          <PrivacyWrapper keyName="maskPrinterIp" placeholder="•••.•••.•••.•••" inline>{printer.ip_address}</PrivacyWrapper>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={`text-xs font-bold ${state.text}`}>{state.label}</div>
          {status?.gcode_state === 'RUNNING' && (
            <div className="text-[10px] text-zinc-400">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••%" inline>{status.percent || 0}% Complete</PrivacyWrapper>
            </div>
          )}
        </div>
        <div className={`h-2.5 w-2.5 rounded-full ${state.color}`} />
      </div>
    </CardContent>
  </Card>
);

export const PrinterDetailsHeader = ({
  printer,
  activeState,
  onEdit,
  onDelete,
}: {
  printer: Printer;
  activeState: PrinterVisualState;
  onEdit: (p: Printer) => void;
  onDelete: (id: number) => void;
}) => (
  <Card
    className={`border text-white shadow-lg relative overflow-hidden ${activeState.glow}`}
    style={{ background: activeState.bg, borderColor: activeState.borderColorHex }}
  >
    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">
            <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>{printer.name}</PrivacyWrapper>
          </h2>
          <div className={`h-2.5 w-2.5 rounded-full ${activeState.color}`} />
        </div>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Serial: <PrivacyWrapper keyName="maskPrinterSerial" placeholder="••••••••••••" inline>{printer.serial_number}</PrivacyWrapper> | Host:{' '}
          <PrivacyWrapper keyName="maskPrinterIp" placeholder="•••.•••.•••.•••" inline>{printer.ip_address}</PrivacyWrapper>
        </p>
      </div>
      <div className="flex items-center gap-2 self-start md:self-center">
        <Button variant="outline" size="sm" onClick={() => onEdit(printer)} className="gap-1 border-zinc-700 bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:text-white">
          <Edit2 className="w-3.5 h-3.5" /> Edit Connection
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(printer.id)} className="gap-1 bg-red-600 hover:bg-red-500 text-white border-transparent">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const ThermalsPanel = ({ status }: { status: PrinterStatus }) => {
  const chamberTemp = status.device?.ctc?.info?.temp ?? status.info?.temp ?? status.chamber_temper ?? 0;
  return (
    <Card className="border border-zinc-800 bg-zinc-950/80 text-white">
      <CardHeader className="pb-3 border-b border-zinc-800/60">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
          <Thermometer className="w-4 h-4 text-orange-400" /> Temperatures
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-zinc-400">Extruder Nozzle</span>
          <div className="text-right">
            <span className="text-lg font-bold text-white">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••" inline>{Math.round(status.nozzle_temper || 0)}</PrivacyWrapper>°C
            </span>
            <div className="text-[10px] text-zinc-500">
              Target: <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••" inline>{status.nozzle_target_temper || 0}</PrivacyWrapper>°C
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-zinc-400">Heated Bed</span>
          <div className="text-right">
            <span className="text-lg font-bold text-white">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••" inline>{Math.round(status.bed_temper || 0)}</PrivacyWrapper>°C
            </span>
            <div className="text-[10px] text-zinc-500">
              Target: <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••" inline>{status.bed_target_temper || 0}</PrivacyWrapper>°C
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
          <span className="text-sm text-zinc-400">Chamber Ambient</span>
          <span className="text-lg font-bold text-orange-400">
            <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••" inline>{chamberTemp}</PrivacyWrapper>°C
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export const MechanicsPanel = ({ status }: { status: PrinterStatus }) => (
  <Card className="border border-zinc-800 bg-zinc-950/80 text-white">
    <CardHeader className="pb-3 border-b border-zinc-800/60">
      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
        <Gauge className="w-4 h-4 text-emerald-400" /> Mechanics
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-4 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-zinc-400">Speed Profile</span>
        <div className="text-right">
          <span className="text-lg font-bold text-white">
            <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>{getSpeedLabel(status.spd_lvl)}</PrivacyWrapper>
          </span>
          <div className="text-[10px] text-zinc-500">
            <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••" inline>{status.spd_mag || 100}</PrivacyWrapper>% speed scale
          </div>
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
);

export const JobProgressPanel = ({
  status,
  activeState,
}: {
  status: PrinterStatus;
  activeState: PrinterVisualState;
}) => {
  const { isMasked } = usePrivacy();
  return (
    <Card className="md:col-span-2 border border-zinc-800 bg-zinc-950/80 text-white">
      <CardHeader className="pb-3 border-b border-zinc-800/60">
        <CardTitle className="text-sm font-semibold flex items-center justify-between text-white">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> Job Progress</span>
          {status.gcode_state === 'RUNNING' && (
            <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> PRINTING
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-xs text-zinc-500">State</div>
            <div className={`text-md font-bold uppercase ${activeState.text}`}>
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>{status.gcode_state || 'IDLE'}</PrivacyWrapper>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-zinc-500">Completed</div>
            <div className="text-md font-bold text-white">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••" inline>{status.percent || 0}%</PrivacyWrapper>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-zinc-500">Remaining</div>
            <div className="text-md font-bold text-white">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••" inline>{status.remain_time || 0}m</PrivacyWrapper>
            </div>
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-1000 ease-in-out" style={{ width: isMasked('maskPrinterTelemetryName') ? '0%' : `${status.percent || 0}%` }} />
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Layer <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••" inline>{status.layer_num || 0}</PrivacyWrapper></span>
            <span>Total Layers: <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••" inline>{status.total_layer_num || 0}</PrivacyWrapper></span>
          </div>
        </div>
        {status.subtask_name && (
          <div className="pt-3 border-t border-zinc-800 text-xs font-mono text-zinc-500 break-all">
            Task: <PrivacyWrapper keyName="maskPrinterSubtaskName" placeholder="••••••••••••" inline>{status.subtask_name}</PrivacyWrapper>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AmsOverviewPanel = ({ status }: { status: PrinterStatus }) => {
  const amsUnit = status.ams?.ams?.[0];
  if (!amsUnit || Object.keys(amsUnit).length === 0) return null;
  return (
    <Card className="md:col-span-2 border border-zinc-800 bg-zinc-950/80 text-white">
      <CardHeader className="pb-3 border-b border-zinc-800/60">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
          <Box className="w-4 h-4 text-indigo-400" /> Automatic Material System (AMS)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="text-xs text-zinc-500">AMS Humidity</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">{amsUnit.humidity_raw || 0}%</div>
          <span className="text-[10px] text-zinc-500">Sensor Raw: {amsUnit.humidity || 0}</span>
        </div>
        <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="text-xs text-zinc-500">AMS Temperature</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">{amsUnit.temp || 0}°C</div>
        </div>
      </CardContent>
    </Card>
  );
};
