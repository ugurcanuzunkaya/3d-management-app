import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';
import type { Filament, FilamentType, FilamentColor, StockSettings } from '@/types';

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

const FilamentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  types,
  colors,
  stockSettings,
  isPending
}: FilamentFormModalProps) => {
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        name: initialData.name,
        type_id: initialData.type_id?.toString() || '',
        color_id: initialData.color_id?.toString() || '',
        price_per_kg: initialData.price_per_kg.toString(),
        remaining_weight_g: initialData.remaining_weight_g.toString(),
        is_opened: initialData.is_opened,
        notes: initialData.notes || ''
      };
    } else if (stockSettings) {
      return {
        name: '',
        type_id: '',
        color_id: '',
        price_per_kg: stockSettings.default_price_per_kg.toString(),
        remaining_weight_g: stockSettings.default_weight_g.toString(),
        is_opened: false,
        notes: ''
      };
    }
    return {
      name: '',
      type_id: '',
      color_id: '',
      price_per_kg: '',
      remaining_weight_g: '',
      is_opened: false,
      notes: ''
    };
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      type_id: parseInt(formData.type_id),
      color_id: parseInt(formData.color_id),
      price_per_kg: parseFloat(formData.price_per_kg),
      remaining_weight_g: parseFloat(formData.remaining_weight_g)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-zinc-950 text-zinc-50 w-full max-w-md rounded-xl border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold">{initialData ? 'Edit Filament' : 'Add New Filament'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-zinc-900 hover:text-zinc-100">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-200">Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Smart PLA Black"
              className="bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-zinc-200">Type</Label>
              <select
                id="type"
                required
                value={formData.type_id}
                onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-zinc-700"
              >
                <option value="" className="bg-zinc-900">Select Type</option>
                {types.map(t => (
                  <option key={t.id} value={t.id.toString()} className="bg-zinc-900">{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-zinc-200">Color</Label>
              <select
                id="color"
                required
                value={formData.color_id}
                onChange={(e) => setFormData({ ...formData, color_id: e.target.value })}
                className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-zinc-700"
              >
                <option value="" className="bg-zinc-900">Select Color</option>
                {colors.map(c => (
                  <option key={c.id} value={c.id.toString()} className="bg-zinc-900">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-zinc-200">Price (TL/kg)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                required
                value={formData.price_per_kg}
                onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-zinc-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-zinc-200">Weight (g)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                required
                value={formData.remaining_weight_g}
                onChange={(e) => setFormData({ ...formData, remaining_weight_g: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-zinc-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="is_opened"
              checked={formData.is_opened}
              onChange={(e) => setFormData({ ...formData, is_opened: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 accent-zinc-500 cursor-pointer"
            />
            <Label htmlFor="is_opened" className="cursor-pointer text-zinc-200">Already Opened</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-zinc-200">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full min-h-[80px] rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 placeholder:text-zinc-500"
              placeholder="Storage location, specific settings, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="hover:bg-zinc-900 hover:text-zinc-100 text-zinc-300">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? 'Update Filament' : 'Create Filament'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilamentFormModal;
