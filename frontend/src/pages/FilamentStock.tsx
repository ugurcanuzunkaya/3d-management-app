import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Filament, PrinterStatus } from '@/types';
import { useFilaments, useFilamentTypes, useColors } from '@/hooks/use-filaments';
import { useStockSettings } from '@/hooks/use-settings';
import { usePrinter } from '@/hooks/use-printer';
import StockSummary from '@/components/stock/StockSummary';
import FilamentSearchBar from '@/components/stock/FilamentSearchBar';
import FilamentCard from '@/components/stock/FilamentCard';
import FilamentFormModal from '@/components/stock/FilamentFormModal';
import DeleteConfirmModal from '@/components/stock/DeleteConfirmModal';
import { PaginationControl } from '@/components/stock/PaginationControl';
import { StockSkeleton } from '@/components/ui/Skeleton';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

const matchesFilamentFilters = (
  f: Filament,
  search: string,
  typeFilter: string,
  colorFilter: string,
  statusFilter: string
) => {
  const q = search.toLowerCase();
  const matchesSearch =
    f.name.toLowerCase().includes(q) || Boolean(f.brand && f.brand.toLowerCase().includes(q));
  const matchesType = typeFilter === 'all' || f.type_id?.toString() === typeFilter;
  const matchesColor = colorFilter === 'all' || f.color_id?.toString() === colorFilter;
  const matchesStatus =
    statusFilter === 'all' ||
    (statusFilter === 'sealed' && !f.is_opened) ||
    (statusFilter === 'opened' && f.is_opened);
  return matchesSearch && matchesType && matchesColor && matchesStatus;
};

const buildSlotByFilamentMap = (allStatuses: Record<string, PrinterStatus>): Record<number, string> => {
  const map: Record<number, string> = {};
  for (const status of Object.values(allStatuses)) {
    for (const s of status.slots ?? []) {
      if (s.filament_id) {
        map[s.filament_id] = s.slot_index === 254 ? 'On External Holder' : `In AMS A${s.slot_index + 1}`;
      }
    }
  }
  return map;
};

const StockHeader = ({ onAddClick }: { onAddClick: () => void }) => (
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        <PrivacyWrapper keyName="maskStockTitle" placeholder="•••••" inline>Filament Stock</PrivacyWrapper>
      </h1>
      <p className="text-muted-foreground">Manage your filament inventory and track usage.</p>
    </div>
    <div className="flex gap-2">
      <Link to="/stock/settings">
        <Button variant="outline" size="icon"><Settings2 className="h-4 w-4" /></Button>
      </Link>
      <Button onClick={onAddClick}><Plus className="h-4 w-4 mr-2" /> Add Filament</Button>
    </div>
  </div>
);

const FilamentGridSection = ({
  paginatedFilaments,
  totalFiltered,
  currentPage,
  totalPages,
  pageSize,
  slotByFilamentId,
  onEdit,
  onDelete,
  onQuickAdjust,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
}: {
  paginatedFilaments: Filament[];
  totalFiltered: number;
  currentPage: number;
  totalPages: number;
  pageSize: number | 'all';
  slotByFilamentId: Record<number, string>;
  onEdit: (f: Filament) => void;
  onDelete: (f: Filament) => void;
  onQuickAdjust: (f: Filament, delta: number) => void;
  onPageChange: (p: number | ((prev: number) => number)) => void;
  onPageSizeChange: (s: number | 'all') => void;
  onClearFilters: () => void;
}) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {paginatedFilaments.map(filament => (
        <FilamentCard
          key={filament.id}
          filament={filament}
          mountedSlotLabel={slotByFilamentId[filament.id] ?? null}
          onEdit={onEdit}
          onDelete={onDelete}
          onQuickAdjust={onQuickAdjust}
        />
      ))}
    </div>
    {totalFiltered > 0 ? (
      <PaginationControl
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalFiltered={totalFiltered}
        shownCount={paginatedFilaments.length}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    ) : (
      <div className="text-center py-20 border-2 border-dashed rounded-xl">
        <p className="text-muted-foreground">No filaments found matching your filters.</p>
        <Button variant="link" onClick={onClearFilters}>Clear all filters</Button>
      </div>
    )}
  </>
);

const FilamentStock = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(20);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingFilament, setDeletingFilament] = useState<Filament | null>(null);

  const { filaments, isLoading, createFilamentAsync, updateFilamentAsync, deleteFilamentAsync, isUpserting, isDeleting } = useFilaments();
  const { types } = useFilamentTypes();
  const { colors } = useColors();
  const { stockSettings } = useStockSettings();
  const { allStatuses } = usePrinter();

  const slotByFilamentId = useMemo(() => buildSlotByFilamentMap(allStatuses), [allStatuses]);
  const filteredFilaments = useMemo(
    () => filaments.filter(f => matchesFilamentFilters(f, search, typeFilter, colorFilter, statusFilter)).sort((a, b) => a.name.localeCompare(b.name)),
    [filaments, search, typeFilter, colorFilter, statusFilter]
  );

  const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredFilaments.length / pageSize);
  const paginatedFilaments = pageSize === 'all' ? filteredFilaments : filteredFilaments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const clearFilters = () => {
    setSearch(''); setTypeFilter('all'); setColorFilter('all'); setStatusFilter('all'); setCurrentPage(1);
  };

  const handleUpsert = async (data: Partial<Filament>) => {
    if (editingFilament) await updateFilamentAsync({ id: editingFilament.id, data });
    else await createFilamentAsync(data);
    setIsFormOpen(false);
    setEditingFilament(null);
  };

  const handleQuickAdjust = async (filament: Filament, deltaGrams: number) => {
    const nextWeight = Math.max(0, Math.round((filament.remaining_weight_g + deltaGrams) * 10) / 10);
    await updateFilamentAsync({ id: filament.id, data: { remaining_weight_g: nextWeight } });
  };

  const handleDelete = async () => {
    if (!deletingFilament) return;
    await deleteFilamentAsync(deletingFilament.id);
    setIsDeleteOpen(false);
    setDeletingFilament(null);
  };

  if (isLoading) return <StockSkeleton />;

  return (
    <div className="space-y-6">
      <StockHeader onAddClick={() => { setEditingFilament(null); setIsFormOpen(true); }} />
      <StockSummary filaments={filaments} />
      <FilamentSearchBar
        search={search}
        setSearch={s => { setSearch(s); setCurrentPage(1); }}
        typeFilter={typeFilter}
        setTypeFilter={t => { setTypeFilter(t); setCurrentPage(1); }}
        colorFilter={colorFilter}
        setColorFilter={c => { setColorFilter(c); setCurrentPage(1); }}
        statusFilter={statusFilter}
        setStatusFilter={s => { setStatusFilter(s); setCurrentPage(1); }}
        types={types}
        colors={colors}
        clearFilters={clearFilters}
      />
      <FilamentGridSection
        paginatedFilaments={paginatedFilaments}
        totalFiltered={filteredFilaments.length}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        slotByFilamentId={slotByFilamentId}
        onEdit={f => { setEditingFilament(f); setIsFormOpen(true); }}
        onDelete={f => { setDeletingFilament(f); setIsDeleteOpen(true); }}
        onQuickAdjust={handleQuickAdjust}
        onPageChange={setCurrentPage}
        onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
        onClearFilters={clearFilters}
      />
      <FilamentFormModal
        key={`${editingFilament?.id ?? 'new'}-${isFormOpen ? 'open' : 'closed'}-${stockSettings?.default_price_per_kg ?? 500}-${stockSettings?.default_weight_g ?? 1000}`}
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingFilament(null); }}
        onSubmit={handleUpsert}
        initialData={editingFilament}
        types={types}
        colors={colors}
        stockSettings={stockSettings}
        isPending={isUpserting}
      />
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeletingFilament(null); }}
        onConfirm={handleDelete}
        filament={deletingFilament}
        isPending={isDeleting}
      />
    </div>
  );
};

export default FilamentStock;
