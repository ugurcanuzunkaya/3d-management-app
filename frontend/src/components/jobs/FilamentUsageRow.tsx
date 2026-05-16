import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import type { Filament, JobFilament } from '@/types';

interface FilamentUsageRowProps {
  index: number;
  line: JobFilament;
  filaments: Filament[];
  onUpdate: (index: number, field: keyof JobFilament, value: number) => void;
  onRemove: (index: number) => void;
  isOnlyItem: boolean;
}

export const FilamentUsageRow = ({
  index,
  line,
  filaments,
  onUpdate,
  onRemove,
  isOnlyItem
}: FilamentUsageRowProps) => (
  <div className="flex gap-4 items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex-1 space-y-2">
      <Label>Filament</Label>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={line.filament_id}
        onChange={e => onUpdate(index, 'filament_id', parseInt(e.target.value))}
        required
      >
        <option value="0">Select Filament...</option>
        {filaments.map(f => (
          <option key={f.id} value={f.id}>
            {f.name} ({f.remaining_weight_g}g left)
          </option>
        ))}
      </select>
    </div>
    <div className="w-32 space-y-2">
      <Label>Weight (g)</Label>
      <Input
        type="number"
        value={line.grams_used}
        onChange={e => onUpdate(index, 'grams_used', parseFloat(e.target.value))}
        required
      />
    </div>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => onRemove(index)}
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
      disabled={isOnlyItem}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
);
