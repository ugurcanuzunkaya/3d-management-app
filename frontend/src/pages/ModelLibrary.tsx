import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Box, Sparkles } from 'lucide-react';
import type { Model3D } from '@/types';
import { useModels } from '@/hooks/use-models';
import { ModelCard } from '@/components/models/ModelCard';
import { ModelFormModal } from '@/components/models/ModelFormModal';
import DeleteConfirmModal from '@/components/stock/DeleteConfirmModal';
import { StockSkeleton } from '@/components/ui/Skeleton';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

const EmptyModelsState = ({
  hasSearch,
  onClearSearch,
  onAddNew,
}: {
  hasSearch: boolean;
  onClearSearch: () => void;
  onAddNew: () => void;
}) => (
  <div className="text-center py-24 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/20">
    <div className="bg-zinc-100 dark:bg-zinc-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-800 shadow-inner">
      <Box className="h-8 w-8 text-zinc-400" />
    </div>
    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">No 3D Models Found</h3>
    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
      {hasSearch
        ? 'No models match your search query. Try a different keyword.'
        : 'Your library is currently empty. Add your first model manually or let AI extract the details from a link or screenshot!'}
    </p>
    {hasSearch ? (
      <Button variant="outline" onClick={onClearSearch}>Clear Search</Button>
    ) : (
      <Button onClick={onAddNew} className="bg-indigo-600 hover:bg-indigo-500 text-white">
        <Sparkles className="h-4 w-4 mr-2" /> Add First Model with AI
      </Button>
    )}
  </div>
);

const ModelLibraryHeader = ({
  search,
  setSearch,
  count,
  onAddNew,
}: {
  search: string;
  setSearch: (v: string) => void;
  count: number;
  onAddNew: () => void;
}) => (
  <>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <PrivacyWrapper keyName="maskModelsTitle" placeholder="•••••" inline>Model Library</PrivacyWrapper>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-3 h-3" /> AI Powered
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Organize your 3D models, track print metadata, and auto-scan details from MakerWorld or screenshots.
        </p>
      </div>
      <Button onClick={onAddNew} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 shrink-0">
        <Plus className="h-4 w-4 mr-2" /> Add 3D Model
      </Button>
    </div>

    <div className="flex items-center gap-3 bg-zinc-100/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search models by name, material, or weight..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
        />
      </div>
      <div className="text-xs text-muted-foreground font-medium px-2 hidden sm:block">
        {count} {count === 1 ? 'model' : 'models'}
      </div>
    </div>
  </>
);

const ModelLibrary = () => {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model3D | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingModel, setDeletingModel] = useState<Model3D | null>(null);

  const { models, isLoading, saveModelAsync, deleteModelAsync, isDeleting } = useModels();

  const filteredModels = useMemo(() => {
    const q = search.toLowerCase();
    return models
      .filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          (m.tech_details?.filament_type || '').toLowerCase().includes(q) ||
          String(m.estimated_weight_g || '').includes(q)
      )
      .sort((a, b) => b.id - a.id);
  }, [models, search]);

  const openAddNew = () => {
    setEditingModel(null);
    setIsFormOpen(true);
  };

  const handleSave = async (data: Omit<Model3D, 'id'> & { id?: number }) => {
    await saveModelAsync(data);
    setIsFormOpen(false);
    setEditingModel(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingModel) return;
    await deleteModelAsync(deletingModel.id);
    setIsDeleteOpen(false);
    setDeletingModel(null);
  };

  if (isLoading) return <StockSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <ModelLibraryHeader search={search} setSearch={setSearch} count={filteredModels.length} onAddNew={openAddNew} />

      {filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              onEdit={m => { setEditingModel(m); setIsFormOpen(true); }}
              onDelete={m => { setDeletingModel(m); setIsDeleteOpen(true); }}
            />
          ))}
        </div>
      ) : (
        <EmptyModelsState hasSearch={Boolean(search)} onClearSearch={() => setSearch('')} onAddNew={openAddNew} />
      )}

      <ModelFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingModel(null); }}
        onSave={handleSave}
        model={editingModel}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeletingModel(null); }}
        onConfirm={handleConfirmDelete}
        filament={
          deletingModel
            ? {
                id: deletingModel.id,
                name: deletingModel.name,
                type_id: 0,
                color_id: 0,
                price_per_kg: 0,
                remaining_weight_g: 0,
                is_opened: false,
                notes: null,
                filament_type: null,
                filament_color: null,
              }
            : null
        }
        isPending={isDeleting}
      />
    </div>
  );
};

export default ModelLibrary;
