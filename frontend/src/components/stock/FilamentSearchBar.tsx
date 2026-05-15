import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { FilamentType, FilamentColor } from '@/types';

interface FilamentSearchBarProps {
  search: string;
  setSearch: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (t: string) => void;
  colorFilter: string;
  setColorFilter: (c: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  types: FilamentType[];
  colors: FilamentColor[];
  clearFilters: () => void;
}

const FilamentSearchBar = ({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  colorFilter,
  setColorFilter,
  statusFilter,
  setStatusFilter,
  types,
  colors,
  clearFilters
}: FilamentSearchBarProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">
      <div className="flex-1 w-full space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search filaments by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 w-full md:w-auto">
        <div className="space-y-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All Types</option>
            {types.sort((a, b) => a.name.localeCompare(b.name)).map(t => (
              <option key={t.id} value={t.id.toString()}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All Colors</option>
            {colors.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All Status</option>
            <option value="sealed">Sealed</option>
            <option value="opened">Opened</option>
          </select>
        </div>

        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
};

export default FilamentSearchBar;
