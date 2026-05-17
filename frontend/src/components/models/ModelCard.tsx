import type { Model3D } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ExternalLink, Edit2, Trash2, Scale, Clock, Thermometer, Box } from 'lucide-react';

interface ModelCardProps {
  model: Model3D;
  onEdit: (model: Model3D) => void;
  onDelete: (model: Model3D) => void;
}

const ModelCard = ({ model, onEdit, onDelete }: ModelCardProps) => {
  const { name, estimated_weight_g, source_url, tech_details } = model;
  const filamentType = tech_details?.filament_type;
  const printTime = tech_details?.print_time_minutes;
  const nozzleTemp = tech_details?.nozzle_temp;
  const bedTemp = tech_details?.bed_temp;
  const dimensions = tech_details?.dimensions;

  const getSourceBadge = (url?: string) => {
    if (!url) return null;
    const isPrintables = url.includes('printables.com');
    const isMakerworld = url.includes('makerworld.com');
    const isThingiverse = url.includes('thingiverse.com');

    let label = 'External Link';
    let colorClass = 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800';

    if (isPrintables) {
      label = 'Printables';
      colorClass = 'bg-orange-950/40 text-orange-400 border-orange-800/40 hover:bg-orange-950/60';
    } else if (isMakerworld) {
      label = 'MakerWorld';
      colorClass = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-950/60';
    } else if (isThingiverse) {
      label = 'Thingiverse';
      colorClass = 'bg-blue-950/40 text-blue-400 border-blue-800/40 hover:bg-blue-950/60';
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border transition-all font-medium ${colorClass}`}
      >
        {label}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  };

  const formatPrintTime = (minutes?: number) => {
    if (!minutes) return null;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const isMakerworld = source_url?.includes('makerworld.com');
  const isPrintables = source_url?.includes('printables.com');
  const isDarkCard = isMakerworld || isPrintables;

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 flex flex-col justify-between h-[230px] ${
        isMakerworld 
          ? 'bg-gradient-to-br from-black via-zinc-950 to-emerald-950/90 border-[#143d28] hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] text-white' 
          : isPrintables
          ? 'bg-gradient-to-br from-black via-zinc-950 to-orange-950/80 border-[#441d08] hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] text-white'
          : 'bg-card border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md text-foreground'
      }`}
    >
      <CardHeader className="p-4 pb-2 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className={`text-base font-semibold line-clamp-1 transition-colors ${
            isMakerworld 
              ? 'text-white group-hover:text-emerald-400' 
              : isPrintables
              ? 'text-white group-hover:text-orange-400'
              : 'text-foreground group-hover:text-primary'
          }`}>
            {name}
          </CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 transition-colors ${
                isMakerworld 
                  ? 'text-zinc-400 hover:text-white hover:bg-emerald-900/20' 
                  : isPrintables
                  ? 'text-zinc-400 hover:text-white hover:bg-orange-900/20'
                  : 'text-zinc-500 hover:text-foreground hover:bg-zinc-100'
              }`}
              onClick={() => onEdit(model)}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 transition-colors ${
                isMakerworld 
                  ? 'text-zinc-400 hover:text-rose-400 hover:bg-emerald-900/20' 
                  : isPrintables
                  ? 'text-zinc-400 hover:text-rose-400 hover:bg-orange-900/20'
                  : 'text-zinc-500 hover:text-destructive hover:bg-zinc-100'
              }`}
              onClick={() => onDelete(model)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getSourceBadge(source_url)}
          {filamentType && (
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
              isMakerworld 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' 
                : isPrintables
                ? 'bg-orange-950/60 text-orange-300 border-orange-800/40'
                : 'bg-muted text-muted-foreground border-zinc-200/50'
            }`}>
              {filamentType}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 pb-4 flex-grow flex flex-col justify-end">
        <div className={`grid grid-cols-2 gap-2 text-xs border-t pt-3 ${
          isMakerworld 
            ? 'text-zinc-300 border-emerald-950/50' 
            : isPrintables
            ? 'text-zinc-300 border-orange-950/50'
            : 'text-muted-foreground border-zinc-100'
        }`}>
          <div className="flex items-center gap-2">
            <Scale className={`h-3.5 w-3.5 ${isDarkCard ? 'text-orange-400' : 'text-orange-500'}`} />
            <span>{estimated_weight_g > 0 ? `${estimated_weight_g}g` : '--'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className={`h-3.5 w-3.5 ${isDarkCard ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>{printTime ? formatPrintTime(printTime) : '--'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Thermometer className={`h-3.5 w-3.5 ${isDarkCard ? 'text-rose-400' : 'text-rose-500'}`} />
            <span>
              {nozzleTemp ? `${nozzleTemp}°C` : '--'}
              {bedTemp ? ` / ${bedTemp}°C` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Box className={`h-3.5 w-3.5 ${isDarkCard ? 'text-sky-400' : 'text-blue-500'}`} />
            <span className="truncate">{dimensions || '--'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelCard;
