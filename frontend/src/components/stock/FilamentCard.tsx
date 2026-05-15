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
  const isLowStock = filament.remaining_weight_g < 200;

  return (
    <Card className="overflow-hidden group">
      <div
        className="h-2 w-full"
        style={{ backgroundColor: filament.filament_color?.hex_code || '#808080' }}
      ></div>
      <CardHeader className="pb-2 space-y-0">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight">{filament.name}</CardTitle>
            <div className="flex flex-wrap gap-1">
              <Badge variant={filament.is_opened ? "secondary" : "outline"} className="text-[10px] h-4 px-1">
                {filament.is_opened ? "Opened" : "Sealed"}
              </Badge>
              {filament.filament_type && (
                <Badge variant="ghost" className="text-[10px] h-4 px-1 bg-muted/50">
                  {filament.filament_type.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon-xs" onClick={() => onEdit(filament)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => onDelete(filament)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining:</span>
              <span className={`font-bold ${isLowStock ? 'text-destructive' : ''}`}>
                {filament.remaining_weight_g}g
              </span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isLowStock ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, (filament.remaining_weight_g / 1000) * 100)}%` }}
              ></div>
            </div>
            {isLowStock && (
              <div className="flex items-center gap-1 text-[10px] text-destructive font-medium mt-1">
                <AlertTriangle className="h-3 w-3" /> Low Stock
              </div>
            )}
          </div>

          <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: filament.filament_color?.hex_code }}
              ></div>
              <span>{filament.filament_color?.name || 'Unknown'}</span>
            </div>
            <span className="font-medium text-foreground">{filament.price_per_kg} TL/kg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilamentCard;
