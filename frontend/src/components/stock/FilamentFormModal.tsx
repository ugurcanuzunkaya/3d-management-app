import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { filamentsApi } from '@/api/filaments';
import type { Filament, FilamentType, FilamentColor, StockSettings } from '@/types';
import { FilamentFormBody, type FilamentFormData } from './FilamentFormBody';

interface FilamentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Filament>) => void;
  initialData?: Filament | null;
  types: FilamentType[];
  colors: FilamentColor[];
  stockSettings?: StockSettings;
  isPending?: boolean;
}

const buildInitialFormData = (
  initialData?: Filament | null,
  stockSettings?: StockSettings
): FilamentFormData => {
  if (initialData) {
    return {
      name: initialData.name,
      brand: initialData.brand || '',
      type_id: initialData.type_id ? String(initialData.type_id) : '',
      color_id: initialData.color_id ? String(initialData.color_id) : '',
      price_per_kg: String(initialData.price_per_kg),
      initial_weight_g: String(initialData.initial_weight_g ?? 1000),
      empty_spool_weight_g: String(initialData.empty_spool_weight_g ?? 200),
      remaining_weight_g: String(initialData.remaining_weight_g),
      is_opened: initialData.is_opened,
      notes: initialData.notes || '',
      customTypeName: '',
      customColorName: '',
      customColorHex: '#000000',
    };
  }
  const defaultWeight = String(stockSettings?.default_weight_g ?? 1000);
  const defaultPrice = String(stockSettings?.default_price_per_kg ?? 500);
  return {
    name: '',
    brand: '',
    type_id: '',
    color_id: '',
    price_per_kg: defaultPrice,
    initial_weight_g: defaultWeight,
    empty_spool_weight_g: '200',
    remaining_weight_g: defaultWeight,
    is_opened: false,
    notes: '',
    customTypeName: '',
    customColorName: '',
    customColorHex: '#000000',
  };
};

const resolveCustomCatalogIds = async (
  formData: FilamentFormData
): Promise<{ finalTypeId: number; finalColorId: number }> => {
  let finalTypeId = parseInt(formData.type_id, 10);
  let finalColorId = parseInt(formData.color_id, 10);

  if (formData.type_id === 'custom') {
    if (!formData.customTypeName.trim()) {
      throw new Error('Custom type name is required');
    }
    const createdType = await filamentsApi.createType({ name: formData.customTypeName, is_custom: true });
    finalTypeId = createdType.id;
  }

  if (formData.color_id === 'custom') {
    if (!formData.customColorName.trim()) {
      throw new Error('Custom color name is required');
    }
    const createdColor = await filamentsApi.createColor({
      name: formData.customColorName,
      hex_code: formData.customColorHex,
    });
    finalColorId = createdColor.id;
  }

  return { finalTypeId, finalColorId };
};

const FilamentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  types,
  colors,
  stockSettings,
  isPending,
}: FilamentFormModalProps) => {
  const [formData, setFormData] = useState<FilamentFormData>(() =>
    buildInitialFormData(initialData, stockSettings)
  );
  const [localPending, setLocalPending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalPending(true);
    try {
      const { finalTypeId, finalColorId } = await resolveCustomCatalogIds(formData);
      onSubmit({
        name: formData.name,
        brand: formData.brand.trim() || null,
        type_id: finalTypeId,
        color_id: finalColorId,
        price_per_kg: parseFloat(formData.price_per_kg),
        initial_weight_g: parseFloat(formData.initial_weight_g) || 1000,
        empty_spool_weight_g: parseFloat(formData.empty_spool_weight_g) || 200,
        remaining_weight_g: Math.max(0, parseFloat(formData.remaining_weight_g) || 0),
        is_opened: formData.is_opened,
        notes: formData.notes,
      });
    } catch (error: unknown) {
      const err = error as Error;
      alert(err.message || 'Failed to create custom type or color. Please try again.');
    } finally {
      setLocalPending(false);
    }
  };

  const busy = Boolean(isPending || localPending);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-950 text-zinc-50 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold">{initialData ? 'Edit Filament' : 'Add New Filament'}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-zinc-900 hover:text-zinc-100"
            disabled={busy}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <FilamentFormBody
            formData={formData}
            setFormData={setFormData}
            types={types}
            colors={colors}
            busy={busy}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={busy}
              className="hover:bg-zinc-900 hover:text-zinc-100 text-zinc-300"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? 'Update Filament' : 'Create Filament'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilamentFormModal;
