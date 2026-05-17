import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, Sparkles, Box } from 'lucide-react';
import { modelsApi } from '@/api/models';
import ModelCard from '@/components/models/ModelCard';
import ModelFormModal from '@/components/models/ModelFormModal';
import DeleteConfirmModal from '@/components/models/DeleteConfirmModal';
import type { Model3D } from '@/types';

const ModelLibrary = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);

  // Fetch models library
  const { data: models = [], isLoading } = useQuery<Model3D[]>({
    queryKey: ['models'],
    queryFn: modelsApi.list,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Model3D, 'id'>) => modelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setIsFormOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Model3D, 'id'>> }) =>
      modelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setIsFormOpen(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => modelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setIsDeleteOpen(false);
    },
  });

  const handleEditClick = (model: Model3D) => {
    setSelectedModel(model);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (model: Model3D) => {
    setSelectedModel(model);
    setIsDeleteOpen(true);
  };

  const handleAddNewClick = () => {
    setSelectedModel(null);
    setIsFormOpen(true);
  };

  const handleSaveModel = async (formData: Omit<Model3D, 'id'> & { id?: number }) => {
    if (formData.id) {
      await updateMutation.mutateAsync({ id: formData.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedModel) {
      await deleteMutation.mutateAsync(selectedModel.id);
    }
  };

  // Filter models based on search term
  const filteredModels = models.filter((model) => {
    const term = searchTerm.toLowerCase();
    const matchesName = model.name.toLowerCase().includes(term);
    const matchesFilament = model.tech_details?.filament_type?.toLowerCase().includes(term);
    return matchesName || matchesFilament;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading your 3D models library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Model Library
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage physical specifications, slicing parameters, and AI-scanned assets.
          </p>
        </div>

        <Button
          onClick={handleAddNewClick}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add 3D Model
        </Button>
      </div>

      {/* Control Panel: Search & Statistics */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models by name or material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground shrink-0 border border-zinc-200 bg-white px-3 py-1.5 rounded-lg shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground text-sm">{models.length}</span>
            <span>Total Models</span>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-xl p-12 text-center bg-zinc-50/50">
          <div className="bg-zinc-100 p-3 rounded-full border border-zinc-200 mb-4">
            <Box className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900">No 3D Models Found</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm">
            {searchTerm
              ? "No models match your search criteria. Try a different query!"
              : "Start by creating a model manually or scanning Makerworld/Printables via our AI Assistant Scanner!"}
          </p>
          {!searchTerm && (
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={handleAddNewClick}
                className="border-zinc-200 hover:bg-zinc-50 font-medium text-zinc-700 bg-white shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Manual Create
              </Button>
              <Button
                onClick={handleAddNewClick}
                className="bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-md shadow-amber-500/10"
              >
                <Sparkles className="h-4 w-4 mr-1.5" /> Use AI Scanner
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <ModelFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveModel}
        model={selectedModel}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        model={selectedModel}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default ModelLibrary;
