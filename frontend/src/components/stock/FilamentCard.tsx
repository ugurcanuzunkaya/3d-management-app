import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { Filament } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

interface FilamentCardProps {
  filament: Filament;
  onEdit: (f: Filament) => void;
  onDelete: (f: Filament) => void;
  onQuickAdjust?: (f: Filament, deltaGrams: number) => void;
  mountedSlotLabel?: string | null;
}

const isDarkOrGreyHex = (colorHex: string): boolean => {
  try {
    const hex = colorHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
    return Math.max(r, g, b) < 90 || maxDiff < 30;
  } catch {
    return false;
  }
};

const FilamentCardHeader = ({
  filament,
  colorHex,
  isHovered,
  mountedSlotLabel,
  onEdit,
  onDelete,
}: {
  filament: Filament;
  colorHex: string;
  isHovered: boolean;
  mountedSlotLabel?: string | null;
  onEdit: (f: Filament) => void;
  onDelete: (f: Filament) => void;
}) => {
  const isDarkOrGrey = isDarkOrGreyHex(colorHex);
  const badgeStyle = filament.is_opened
    ? 'bg-zinc-800/40 text-zinc-300 border-zinc-700/50'
    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';

  return (
    <CardHeader className="p-4 pb-2 space-y-0">
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1.5 flex-grow">
          <CardTitle
            className="text-base font-semibold leading-tight line-clamp-1 transition-colors duration-300"
            style={{ color: isHovered && !isDarkOrGrey ? colorHex : '#ffffff' }}
          >
            <PrivacyWrapper keyName="maskStockSpoolName" placeholder="•••••" inline>
              {filament.name}
            </PrivacyWrapper>
          </CardTitle>
          <div className="flex flex-wrap gap-1">
            {filament.brand && (
              <Badge
                variant="outline"
                className="text-[9px] font-bold uppercase tracking-wider h-4 px-1.5 bg-blue-950/50 text-blue-300 border-blue-800/50"
              >
                <PrivacyWrapper keyName="maskStockSpoolName" placeholder="•••" inline>
                  {filament.brand}
                </PrivacyWrapper>
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-[9px] font-bold uppercase tracking-wider h-4 px-1.5 transition-colors border ${badgeStyle}`}
            >
              {filament.is_opened ? 'Opened' : 'Sealed'}
            </Badge>
            {filament.filament_type && (
              <Badge
                variant="ghost"
                className="text-[9px] font-bold uppercase tracking-wider h-4 px-1.5 bg-zinc-800/60 text-zinc-200 border border-zinc-700/40"
              >
                <PrivacyWrapper keyName="maskStockSpoolName" placeholder="•••••" inline>
                  {filament.filament_type.name}
                </PrivacyWrapper>
              </Badge>
            )}
            {mountedSlotLabel && (
              <Badge
                variant="outline"
                className="text-[9px] font-bold uppercase tracking-wider h-4 px-1.5 bg-amber-950/60 text-amber-300 border-amber-700/50"
              >
                {mountedSlotLabel}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-75 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Edit Filament"
            className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            onClick={() => onEdit(filament)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Delete Filament"
            className="h-6 w-6 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60"
            onClick={() => onDelete(filament)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

const QuickAdjustRow = ({
  filament,
  onQuickAdjust,
}: {
  filament: Filament;
  onQuickAdjust?: (f: Filament, deltaGrams: number) => void;
}) => {
  if (!onQuickAdjust) return null;
  return (
    <div className="flex items-center justify-end gap-1 pt-0.5">
      {([-50, -10, 50] as const).map(delta => (
        <button
          key={delta}
          type="button"
          onClick={() => onQuickAdjust(filament, delta)}
          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800/70 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-colors"
        >
          {delta > 0 ? `+${delta}g` : `${delta}g`}
        </button>
      ))}
    </div>
  );
};

const FilamentCard = ({
  filament,
  onEdit,
  onDelete,
  onQuickAdjust,
  mountedSlotLabel,
}: FilamentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isMasked } = usePrivacy();

  const isLowStock = filament.remaining_weight_g < 200;
  const colorHex = filament.filament_color?.hex_code || '#808080';
  const masked = isMasked('maskStockSpoolName');
  const fullWeight = filament.initial_weight_g && filament.initial_weight_g > 0 ? filament.initial_weight_g : 1000;
  const pctWidth = masked ? '0%' : `${Math.min(100, (filament.remaining_weight_g / fullWeight) * 100)}%`;

  const cardStyle = {
    background: `linear-gradient(135deg, #000000 0%, #09090b 50%, color-mix(in srgb, ${colorHex} 50%, #09090b) 100%)`,
    borderColor: isHovered ? colorHex : `color-mix(in srgb, ${colorHex} 20%, #1c1c1f)`,
    boxShadow: isHovered ? `0 0 15px color-mix(in srgb, ${colorHex} 15%, transparent)` : 'none',
  };

  return (
    <Card
      className="overflow-hidden group relative transition-all duration-300 border text-white flex flex-col justify-between min-h-[225px]"
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="h-1.5 w-full transition-all duration-300"
        style={{ backgroundColor: colorHex, boxShadow: isHovered ? `0 1px 6px ${colorHex}` : 'none' }}
      />
      <FilamentCardHeader
        filament={filament}
        colorHex={colorHex}
        isHovered={isHovered}
        mountedSlotLabel={mountedSlotLabel}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <CardContent className="p-4 pt-1 pb-4 flex-grow flex flex-col justify-end">
        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Remaining Weight:</span>
              <span className={`font-bold transition-colors ${isLowStock ? 'text-rose-400' : 'text-zinc-200'}`}>
                <PrivacyWrapper keyName="maskStockSpoolName" placeholder="•••" inline>
                  {filament.remaining_weight_g}g
                </PrivacyWrapper>
              </span>
            </div>
            <div className="w-full bg-zinc-800/60 h-1.5 rounded-full overflow-hidden border border-zinc-850/40">
              <div
                className="h-full transition-all duration-300"
                style={{ width: pctWidth, backgroundColor: isLowStock ? '#ef4444' : colorHex }}
              />
            </div>
            <QuickAdjustRow filament={filament} onQuickAdjust={onQuickAdjust} />
            {isLowStock && !masked && (
              <div className="flex items-center gap-1 text-[9px] text-rose-400 font-bold uppercase tracking-wider mt-1 animate-pulse">
                <AlertTriangle className="h-3 w-3" /> Low Stock Warning
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-zinc-300 border-t border-zinc-800/60 pt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: colorHex }} />
              <span className="text-zinc-400 font-medium">
                <PrivacyWrapper keyName="maskStockSpoolName" placeholder="•••••" inline>
                  {filament.filament_color?.name || 'Unknown'}
                </PrivacyWrapper>
              </span>
            </div>
            <span className="font-bold text-zinc-100">
              <PrivacyWrapper keyName="maskFilamentPrice" placeholder="••• TL/kg" inline>
                {filament.price_per_kg} TL/kg
              </PrivacyWrapper>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilamentCard;
