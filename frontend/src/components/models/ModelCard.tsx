import { Link } from 'react-router-dom';
import type { Model3D } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ExternalLink, Edit2, Trash2, Scale, Clock, Thermometer, Box, Calculator } from 'lucide-react';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

interface ModelCardProps {
  model: Model3D;
  onEdit: (model: Model3D) => void;
  onDelete: (model: Model3D) => void;
}

const getSourceBadgeInfo = (url: string) => {
  if (url.includes('printables.com')) {
    return {
      label: 'Printables',
      colorClass: 'bg-orange-950/40 text-orange-400 border-orange-800/40 hover:bg-orange-950/60',
    };
  }
  if (url.includes('makerworld.com')) {
    return {
      label: 'MakerWorld',
      colorClass: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-950/60',
    };
  }
  if (url.includes('thingiverse.com')) {
    return {
      label: 'Thingiverse',
      colorClass: 'bg-blue-950/40 text-blue-400 border-blue-800/40 hover:bg-blue-950/60',
    };
  }
  return {
    label: 'External Link',
    colorClass: 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800',
  };
};

const getCardTheme = (sourceUrl?: string) => {
  if (sourceUrl?.includes('makerworld.com')) {
    return {
      isDark: true,
      card: 'bg-gradient-to-br from-black via-zinc-950 to-emerald-950/90 border-[#143d28] hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] text-white',
      title: 'text-white group-hover:text-emerald-400',
      editBtn: 'text-zinc-400 hover:text-white hover:bg-emerald-900/20',
      delBtn: 'text-zinc-400 hover:text-rose-400 hover:bg-emerald-900/20',
      tag: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
      grid: 'text-zinc-300 border-emerald-950/50',
      icons: { scale: 'text-orange-400', clock: 'text-emerald-400', temp: 'text-rose-400', box: 'text-sky-400' },
    };
  }
  if (sourceUrl?.includes('printables.com')) {
    return {
      isDark: true,
      card: 'bg-gradient-to-br from-black via-zinc-950 to-orange-950/80 border-[#441d08] hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] text-white',
      title: 'text-white group-hover:text-orange-400',
      editBtn: 'text-zinc-400 hover:text-white hover:bg-orange-900/20',
      delBtn: 'text-zinc-400 hover:text-rose-400 hover:bg-orange-900/20',
      tag: 'bg-orange-950/60 text-orange-300 border-orange-800/40',
      grid: 'text-zinc-300 border-orange-950/50',
      icons: { scale: 'text-orange-400', clock: 'text-emerald-400', temp: 'text-rose-400', box: 'text-sky-400' },
    };
  }
  return {
    isDark: false,
    card: 'bg-card border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md text-foreground',
    title: 'text-foreground group-hover:text-primary',
    editBtn: 'text-zinc-500 hover:text-foreground hover:bg-zinc-100',
    delBtn: 'text-zinc-500 hover:text-destructive hover:bg-zinc-100',
    tag: 'bg-muted text-muted-foreground border-zinc-200/50',
    grid: 'text-muted-foreground border-zinc-100',
    icons: { scale: 'text-orange-500', clock: 'text-emerald-600', temp: 'text-rose-500', box: 'text-blue-500' },
  };
};

const formatPrintTime = (minutes?: number) => {
  if (!minutes) return '--';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

const formatTempDisplay = (nozzleTemp?: number, bedTemp?: number) => {
  const nozzle = nozzleTemp ? `${nozzleTemp}°C` : '--';
  const bed = bedTemp ? ` / ${bedTemp}°C` : '';
  return `${nozzle}${bed}`;
};

export const ModelCard = ({ model, onEdit, onDelete }: ModelCardProps) => {
  const { name, estimated_weight_g, source_url, tech_details } = model;
  const theme = getCardTheme(source_url);
  const badge = source_url ? getSourceBadgeInfo(source_url) : null;
  const weightDisplay = estimated_weight_g > 0 ? `${estimated_weight_g}g` : '--';
  const dimDisplay = tech_details?.dimensions || '--';

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 flex flex-col justify-between h-[230px] ${theme.card}`}>
      <CardHeader className="p-4 pb-2 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className={`text-base font-semibold line-clamp-1 transition-colors ${theme.title}`}>
            <PrivacyWrapper keyName="maskLibraryModelName" placeholder="•••••" inline>{name}</PrivacyWrapper>
          </CardTitle>
          <div className="flex gap-1 opacity-75 group-hover:opacity-100 transition-opacity duration-200">
            <Link to={`/jobs?modelId=${model.id}`} title="Quote / Log Print" aria-label="Quote / Log Print">
              <Button variant="ghost" size="icon" className={`h-7 w-7 transition-colors ${theme.editBtn}`}>
                <Calculator className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" aria-label="Edit Model" className={`h-7 w-7 transition-colors ${theme.editBtn}`} onClick={() => onEdit(model)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete Model" className={`h-7 w-7 transition-colors ${theme.delBtn}`} onClick={() => onDelete(model)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && source_url && (
            <a
              href={source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border transition-all font-medium ${badge.colorClass}`}
            >
              <PrivacyWrapper keyName="maskLibraryModelName" placeholder="•••••" inline>{badge.label}</PrivacyWrapper>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {tech_details?.filament_type && (
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${theme.tag}`}>
              <PrivacyWrapper keyName="maskLibraryModelName" placeholder="•••••" inline>{tech_details.filament_type}</PrivacyWrapper>
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 pb-4 flex-grow flex flex-col justify-end">
        <div className={`grid grid-cols-2 gap-2 text-xs border-t pt-3 ${theme.grid}`}>
          <div className="flex items-center gap-2">
            <Scale className={`h-3.5 w-3.5 ${theme.icons.scale}`} />
            <PrivacyWrapper keyName="maskLibraryModelName" placeholder="•••" inline>{weightDisplay}</PrivacyWrapper>
          </div>
          <div className="flex items-center gap-2">
            <Clock className={`h-3.5 w-3.5 ${theme.icons.clock}`} />
            <PrivacyWrapper keyName="maskLibraryModelName" placeholder="•••" inline>
              {formatPrintTime(tech_details?.print_time_minutes)}
            </PrivacyWrapper>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className={`h-3.5 w-3.5 ${theme.icons.temp}`} />
            <PrivacyWrapper keyName="maskLibraryModelName" placeholder="•••" inline>
              {formatTempDisplay(tech_details?.nozzle_temp, tech_details?.bed_temp)}
            </PrivacyWrapper>
          </div>
          <div className="flex items-center gap-2">
            <Box className={`h-3.5 w-3.5 ${theme.icons.box}`} />
            <span className="truncate">
              <PrivacyWrapper keyName="maskLibraryModelName" placeholder="•••" inline>{dimDisplay}</PrivacyWrapper>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelCard;
