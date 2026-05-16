import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Settings2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Filament, FilamentType, FilamentColor, StockSettings } from '@/types';

import StockSummary from '@/components/stock/StockSummary';
import FilamentSearchBar from '@/components/stock/FilamentSearchBar';
import FilamentCard from '@/components/stock/FilamentCard';
import FilamentFormModal from '@/components/stock/FilamentFormModal';
import DeleteConfirmModal from '@/components/stock/DeleteConfirmModal';

const FilamentStock = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSearch = (s: string) => { setSearch(s); setCurrentPage(1); };
  const handleType = (t: string) => { setTypeFilter(t); setCurrentPage(1); };
  const handleColor = (c: string) => { setColorFilter(c); setCurrentPage(1); };
  const handleStatus = (s: string) => { setStatusFilter(s); setCurrentPage(1); };
  const handlePageSize = (s: number | 'all') => { setPageSize(s); setCurrentPage(1); };

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingFilament, setDeletingFilament] = useState<Filament | null>(null);

  const { data: filaments, isLoading } = useQuery<Filament[]>({
    queryKey: ['filaments'],
    queryFn: () => api.get('/api/filaments').then(res => res.data)
  });

  const { data: types } = useQuery<FilamentType[]>({
    queryKey: ['filament-types'],
    queryFn: () => api.get('/api/filaments/types').then(res => res.data)
  });

  const { data: colors } = useQuery<FilamentColor[]>({
    queryKey: ['filament-colors'],
    queryFn: () => api.get('/api/filaments/colors').then(res => res.data)
  });

  const { data: stockSettings } = useQuery<StockSettings>({
    queryKey: ['stock-settings'],
    queryFn: () => api.get('/api/settings/stock').then(res => res.data)
  });

  const upsertMutation = useMutation({
    mutationFn: (data: Partial<Filament>) => {
      if (editingFilament) {
        return api.put(`/api/filaments/${editingFilament.id}`, data);
      }
      return api.post('/api/filaments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      queryClient.invalidateQueries({ queryKey: ['filament-types'] });
      queryClient.invalidateQueries({ queryKey: ['filament-colors'] });
      setIsFormOpen(false);
      setEditingFilament(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/filaments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      setIsDeleteOpen(false);
      setDeletingFilament(null);
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(20);

  const filteredFilaments = useMemo(() => {
    if (!filaments) return [];
    return filaments.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || f.type_id?.toString() === typeFilter;
      const matchesColor = colorFilter === 'all' || f.color_id?.toString() === colorFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'sealed' && !f.is_opened) ||
        (statusFilter === 'opened' && f.is_opened);

      return matchesSearch && matchesType && matchesColor && matchesStatus;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [filaments, search, typeFilter, colorFilter, statusFilter]);

  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.ceil(filteredFilaments.length / pageSize);
  }, [filteredFilaments, pageSize]);

  const paginatedFilaments = useMemo(() => {
    if (pageSize === 'all') return filteredFilaments;
    const start = (currentPage - 1) * pageSize;
    return filteredFilaments.slice(start, start + pageSize);
  }, [filteredFilaments, currentPage, pageSize]);


  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setColorFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Filament Stock</h1>
          <p className="text-muted-foreground">Manage your filament inventory and track usage.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/stock/settings">
            <Button variant="outline" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </Link>
          <Button onClick={() => { setEditingFilament(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Filament
          </Button>
        </div>
      </div>

      <StockSummary filaments={filaments || []} />

      <FilamentSearchBar
        search={search}
        setSearch={handleSearch}
        typeFilter={typeFilter}
        setTypeFilter={handleType}
        colorFilter={colorFilter}
        setColorFilter={handleColor}
        statusFilter={statusFilter}
        setStatusFilter={handleStatus}
        types={types || []}
        colors={colors || []}
        clearFilters={clearFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedFilaments.map((filament) => (
          <FilamentCard
            key={filament.id}
            filament={filament}
            onEdit={(f) => { setEditingFilament(f); setIsFormOpen(true); }}
            onDelete={(f) => { setDeletingFilament(f); setIsDeleteOpen(true); }}
          />
        ))}
      </div>

      {filteredFilaments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {paginatedFilaments.length} of {filteredFilaments.length} filaments</span>
            <div className="flex items-center gap-1 ml-4">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-transparent border rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
              <span>per page</span>
            </div>
          </div>

          {pageSize !== 'all' && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 px-4 text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {filteredFilaments.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">No filaments found matching your filters.</p>
          <Button variant="link" onClick={clearFilters}>Clear all filters</Button>
        </div>
      )}

      <FilamentFormModal
        key={editingFilament?.id ?? 'new'}
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingFilament(null); }}
        onSubmit={(data) => upsertMutation.mutate(data)}
        initialData={editingFilament}
        types={types || []}
        colors={colors || []}
        stockSettings={stockSettings}
        isPending={upsertMutation.isPending}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeletingFilament(null); }}
        onConfirm={() => deletingFilament && deleteMutation.mutate(deletingFilament.id)}
        filament={deletingFilament}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default FilamentStock;
