import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Box, Disc, Flame } from 'lucide-react';
import type { Filament, PrinterSlot, PrinterStatus } from '@/types';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

const DEFAULT_SLOTS: PrinterSlot[] = [0, 1, 2, 3, 254].map(idx => ({
  slot_index: idx,
  slot_type: idx < 4 ? 'ams' : 'external',
  slot_label: idx < 4 ? `AMS Slot ${idx + 1}` : 'External Spool',
  filament_id: null,
  filament: null,
  ams_telemetry: {
    tray_type: '',
    tray_color: '',
    nozzle_temp_min: 0,
    nozzle_temp_max: 0,
    is_active_tray: false,
    dry_time: 0,
  },
}));

const normalizeTrayHex = (rawColor?: string): string => {
  if (!rawColor) return '#52525b';
  const clean = rawColor.replace('#', '').slice(0, 6);
  if (clean.length !== 6 || clean === '000000') return '#52525b';
  return `#${clean}`;
};

const sortFilamentsForSlot = (filaments: Filament[], trayType: string): Filament[] => {
  const targetType = trayType.trim().toUpperCase();
  return [...filaments].sort((a, b) => {
    const aMatch = a.filament_type?.name.toUpperCase() === targetType ? 0 : 1;
    const bMatch = b.filament_type?.name.toUpperCase() === targetType ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.name.localeCompare(b.name);
  });
};

const AmsSlotCard = ({
  slot,
  filaments,
  onAssignSlot,
}: {
  slot: PrinterSlot;
  filaments: Filament[];
  onAssignSlot: (slotIndex: number, filamentId: number | null) => void;
}) => {
  const { filament, ams_telemetry: telemetry } = slot;
  const swatchHex = filament?.color_hex || normalizeTrayHex(telemetry.tray_color);
  const sortedOptions = sortFilamentsForSlot(filaments, telemetry.tray_type);

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
        telemetry.is_active_tray
          ? 'border-indigo-500 bg-indigo-950/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
          : 'border-zinc-800 bg-zinc-900/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: swatchHex }}
          />
          <span className="text-xs font-bold text-zinc-100">{slot.slot_label}</span>
        </div>
        <div className="flex items-center gap-1">
          {telemetry.is_active_tray && (
            <Badge className="text-[9px] h-4 px-1.5 bg-indigo-600 text-white border-none">
              Active
            </Badge>
          )}
          {telemetry.tray_type && (
            <Badge
              variant="outline"
              className="text-[9px] h-4 px-1.5 border-zinc-700 text-zinc-300"
            >
              {telemetry.tray_type}
            </Badge>
          )}
        </div>
      </div>

      {filament ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-200 truncate">
              <PrivacyWrapper keyName="maskStockSpoolName" placeholder="•••••" inline>
                {filament.name}
              </PrivacyWrapper>
            </span>
            <span
              className={`font-bold ${
                filament.is_low_stock ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              <PrivacyWrapper keyName="maskStockSpoolName" placeholder="•••" inline>
                {filament.remaining_weight_g}g
              </PrivacyWrapper>
            </span>
          </div>
          {filament.is_low_stock && (
            <div className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
              <AlertTriangle className="w-3 h-3" /> Low Stock
            </div>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-zinc-500 flex items-center gap-1">
          <Disc className="w-3 h-3" /> No local spool linked
        </div>
      )}

      <select
        aria-label={`Assign spool for ${slot.slot_label}`}
        value={slot.filament_id ? String(slot.filament_id) : ''}
        onChange={e => {
          const val = e.target.value;
          onAssignSlot(slot.slot_index, val ? parseInt(val, 10) : null);
        }}
        className="w-full h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-200 outline-none focus:border-indigo-500"
      >
        <option value="">-- Unassigned --</option>
        {sortedOptions.map(f => (
          <option key={f.id} value={String(f.id)}>
            {f.brand ? `[${f.brand}] ` : ''}
            {f.name} ({f.remaining_weight_g}g)
          </option>
        ))}
      </select>
    </div>
  );
};

export const AmsSlotGrid = ({
  status,
  filaments,
  onAssignSlot,
}: {
  status: PrinterStatus;
  filaments: Filament[];
  onAssignSlot: (slotIndex: number, filamentId: number | null) => void;
}) => {
  const amsUnit = status.ams?.ams?.[0];
  const slots = status.slots && status.slots.length > 0 ? status.slots : DEFAULT_SLOTS;
  const humidityRaw = amsUnit?.humidity_raw ?? '0';
  const amsTemp = amsUnit?.temp ?? '0';
  const dryTime = amsUnit?.dry_time ?? 0;

  return (
    <Card className="md:col-span-2 border border-zinc-800 bg-zinc-950/80 text-white">
      <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
          <Box className="w-4 h-4 text-indigo-400" /> AMS 2 Pro & External Spool Slots
        </CardTitle>
        {amsUnit && (
          <div className="flex items-center gap-4 text-xs">
            <span className="text-zinc-400">
              Humidity: <strong className="text-indigo-400">{humidityRaw}%</strong>
            </span>
            <span className="text-zinc-400">
              Temp: <strong className="text-indigo-400">{amsTemp}°C</strong>
            </span>
            {dryTime > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                <Flame className="w-3.5 h-3.5" /> Drying ({dryTime}m)
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {slots.map(slot => (
            <AmsSlotCard
              key={slot.slot_index}
              slot={slot}
              filaments={filaments}
              onAssignSlot={onAssignSlot}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
