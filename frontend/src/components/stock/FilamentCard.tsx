import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { Filament } from '@/types';

interface FilamentCardProps {
  filament: Filament;
  onEdit: (f: Filament) => void;
  onDelete: (f: Filament) => void;
}

const FilamentCard = ({ filament, onEdit, onDelete }: FilamentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isLowStock = filament.remaining_weight_g < 200;
  const colorHex = filament.filament_color?.hex_code || '#808080';

  const cardStyle = {
    background: `linear-gradient(135deg, #030303 0%, #0e0e11 65%, ${colorHex}22 100%)`,
    borderColor: isHovered ? `${colorHex}66` : `${colorHex}22`,
    boxShadow: isHovered ? `0 0 15px ${colorHex}18` : 'none',
  };

  return (
    <Card 
      className="overflow-hidden group transition-all duration-300 border text-white flex flex-col justify-between h-[210px]"
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="h-1.5 w-full transition-all duration-300"
        style={{ 
          backgroundColor: colorHex,
          boxShadow: isHovered ? `0 1px 6px ${colorHex}` : 'none'
        }}
      ></div>
      <CardHeader className="p-4 pb-2 space-y-0">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1.5 flex-grow">
            <CardTitle 
              className="text-base font-semibold leading-tight line-clamp-1 transition-colors duration-300"
              style={{ color: isHovered ? colorHex : '#ffffff' }}
            >
              {filament.name}
            </CardTitle>
            <div className="flex flex-wrap gap-1">
              <Badge 
                variant="outline" 
                className={`text-[9px] font-bold uppercase tracking-wider h-4 px-1.5 transition-colors border ${
                  filament.is_opened 
                    ? 'bg-zinc-800/40 text-zinc-300 border-zinc-700/50' 
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                }`}
              >
                {filament.is_opened ? "Opened" : "Sealed"}
              </Badge>
              {filament.filament_type && (
                <Badge 
                  variant="ghost" 
                  className="text-[9px] font-bold uppercase tracking-wider h-4 px-1.5 bg-zinc-800/60 text-zinc-200 border border-zinc-700/40"
                >
                  {filament.filament_type.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
            <Button 
              variant="ghost" 
              size="icon-xs" 
              className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              onClick={() => onEdit(filament)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-xs" 
              className="h-6 w-6 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60" 
              onClick={() => onDelete(filament)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1 pb-4 flex-grow flex flex-col justify-end">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Remaining Weight:</span>
              <span 
                className={`font-bold transition-colors ${
                  isLowStock ? 'text-rose-400' : 'text-zinc-200'
                }`}
              >
                {filament.remaining_weight_g}g
              </span>
            </div>
            <div className="w-full bg-zinc-800/60 h-1.5 rounded-full overflow-hidden border border-zinc-850/40">
              <div
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (filament.remaining_weight_g / 1000) * 100)}%`,
                  backgroundColor: isLowStock ? '#ef4444' : colorHex
                }}
              ></div>
            </div>
            {isLowStock && (
              <div className="flex items-center gap-1 text-[9px] text-rose-400 font-bold uppercase tracking-wider mt-1 animate-pulse">
                <AlertTriangle className="h-3 w-3" /> Low Stock Warning
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-zinc-300 border-t border-zinc-800/60 pt-2.5">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full border border-white/10"
                style={{ backgroundColor: colorHex }}
              ></div>
              <span className="text-zinc-400 font-medium">{filament.filament_color?.name || 'Unknown'}</span>
            </div>
            <span className="font-bold text-zinc-100">{filament.price_per_kg} TL/kg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilamentCard;
