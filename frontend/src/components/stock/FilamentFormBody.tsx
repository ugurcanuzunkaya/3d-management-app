import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale } from 'lucide-react';
import type { FilamentType, FilamentColor } from '@/types';

export interface FilamentFormData {
  name: string;
  brand: string;
  type_id: string;
  color_id: string;
  price_per_kg: string;
  initial_weight_g: string;
  empty_spool_weight_g: string;
  remaining_weight_g: string;
  is_opened: boolean;
  notes: string;
  customTypeName: string;
  customColorName: string;
  customColorHex: string;
}

interface FilamentFormBodyProps {
  formData: FilamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<FilamentFormData>>;
  types: FilamentType[];
  colors: FilamentColor[];
  busy?: boolean;
}

const CustomTypeFields = ({
  value,
  onChange,
  busy,
}: {
  value: string;
  onChange: (val: string) => void;
  busy?: boolean;
}) => (
  <div className="space-y-2 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
    <Label htmlFor="customTypeName" className="text-zinc-300">Custom Type Name</Label>
    <Input
      id="customTypeName"
      required
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="e.g., PLA-CF"
      className="bg-zinc-900 border-zinc-800 text-zinc-50"
      disabled={busy}
    />
  </div>
);

const CustomColorFields = ({
  name,
  hex,
  onNameChange,
  onHexChange,
  busy,
}: {
  name: string;
  hex: string;
  onNameChange: (val: string) => void;
  onHexChange: (val: string) => void;
  busy?: boolean;
}) => (
  <div className="space-y-2 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2 space-y-2">
        <Label htmlFor="customColorName" className="text-zinc-300">Custom Color Name</Label>
        <Input
          id="customColorName"
          required
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="e.g., Silk Gold"
          className="bg-zinc-900 border-zinc-800 text-zinc-50"
          disabled={busy}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customColorHex" className="text-zinc-300">Hex Code</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="color"
            id="customColorHex"
            value={hex}
            onChange={e => onHexChange(e.target.value)}
            className="w-10 h-10 p-1 border-zinc-800 bg-zinc-900 cursor-pointer rounded"
            disabled={busy}
          />
          <span className="text-[10px] font-mono text-zinc-400 uppercase">{hex}</span>
        </div>
      </div>
    </div>
  </div>
);

const TypeAndColorSelects = ({
  formData,
  setFormData,
  types,
  colors,
  busy,
}: FilamentFormBodyProps) => (
  <>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="type" className="text-zinc-200">Type</Label>
        <select
          id="type"
          required
          value={formData.type_id}
          onChange={e => setFormData({ ...formData, type_id: e.target.value })}
          className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none"
          disabled={busy}
        >
          <option value="" className="bg-zinc-900">Select Type</option>
          {types.map(t => (
            <option key={t.id} value={t.id.toString()} className="bg-zinc-900">{t.name}</option>
          ))}
          <option value="custom" className="bg-zinc-900 text-blue-400 font-bold">+ Custom...</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color" className="text-zinc-200">Color</Label>
        <select
          id="color"
          required
          value={formData.color_id}
          onChange={e => setFormData({ ...formData, color_id: e.target.value })}
          className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none"
          disabled={busy}
        >
          <option value="" className="bg-zinc-900">Select Color</option>
          {colors.map(c => (
            <option key={c.id} value={c.id.toString()} className="bg-zinc-900">{c.name}</option>
          ))}
          <option value="custom" className="bg-zinc-900 text-blue-400 font-bold">+ Custom...</option>
        </select>
      </div>
    </div>
    {formData.type_id === 'custom' && (
      <CustomTypeFields
        value={formData.customTypeName}
        onChange={val => setFormData({ ...formData, customTypeName: val })}
        busy={busy}
      />
    )}
    {formData.color_id === 'custom' && (
      <CustomColorFields
        name={formData.customColorName}
        hex={formData.customColorHex}
        onNameChange={val => setFormData({ ...formData, customColorName: val })}
        onHexChange={val => setFormData({ ...formData, customColorHex: val })}
        busy={busy}
      />
    )}
  </>
);

const ScaleTareSection = ({
  formData,
  setFormData,
  busy,
}: {
  formData: FilamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<FilamentFormData>>;
  busy?: boolean;
}) => {
  const [grossScaleWeight, setGrossScaleWeight] = useState('');

  const handleGrossChange = (val: string) => {
    setGrossScaleWeight(val);
    const gross = parseFloat(val);
    const tare = parseFloat(formData.empty_spool_weight_g) || 0;
    if (!Number.isNaN(gross)) {
      const net = Math.max(0, Math.round((gross - tare) * 10) / 10);
      setFormData(prev => ({ ...prev, remaining_weight_g: String(net) }));
    }
  };

  return (
    <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <Scale className="w-3.5 h-3.5" /> Scale / Tare Weight Calculator
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor="initialWeight" className="text-[11px] text-zinc-400">Full Spool (g)</Label>
          <Input id="initialWeight" type="number" step="1" value={formData.initial_weight_g} onChange={e => setFormData({ ...formData, initial_weight_g: e.target.value })} className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-50" disabled={busy} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="emptySpoolWeight" className="text-[11px] text-zinc-400">Empty Tare (g)</Label>
          <Input id="emptySpoolWeight" type="number" step="1" value={formData.empty_spool_weight_g} onChange={e => setFormData({ ...formData, empty_spool_weight_g: e.target.value })} className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-50" disabled={busy} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="grossScaleWeight" className="text-[11px] text-emerald-400">Scale Gross (g)</Label>
          <Input id="grossScaleWeight" type="number" step="0.1" placeholder="e.g. 680" value={grossScaleWeight} onChange={e => handleGrossChange(e.target.value)} className="h-8 text-xs bg-zinc-900 border-emerald-800/60 text-zinc-50" disabled={busy} />
        </div>
      </div>
    </div>
  );
};

export const FilamentFormBody = (props: FilamentFormBodyProps) => {
  const { formData, setFormData, busy } = props;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-zinc-200">Spool Name</Label>
          <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., PLA+ Cold White" className="bg-zinc-900 border-zinc-800 text-zinc-50" disabled={busy} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand" className="text-zinc-200">Brand</Label>
          <Input id="brand" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g., eSUN, Polymaker" className="bg-zinc-900 border-zinc-800 text-zinc-50" disabled={busy} />
        </div>
      </div>
      <TypeAndColorSelects {...props} />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price" className="text-zinc-200">Price (TL/kg)</Label>
          <Input id="price" type="number" step="0.01" required value={formData.price_per_kg} onChange={e => setFormData({ ...formData, price_per_kg: e.target.value })} className="bg-zinc-900 border-zinc-800 text-zinc-50" disabled={busy} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weight" className="text-zinc-200">Net Remaining (g)</Label>
          <Input id="weight" type="number" step="0.1" required value={formData.remaining_weight_g} onChange={e => setFormData({ ...formData, remaining_weight_g: e.target.value })} className="bg-zinc-900 border-zinc-800 text-zinc-50" disabled={busy} />
        </div>
      </div>
      <ScaleTareSection formData={formData} setFormData={setFormData} busy={busy} />
      <div className="flex items-center gap-2 py-1">
        <input type="checkbox" id="is_opened" checked={formData.is_opened} onChange={e => setFormData({ ...formData, is_opened: e.target.checked })} className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 accent-zinc-500 cursor-pointer" disabled={busy} />
        <Label htmlFor="is_opened" className="cursor-pointer text-zinc-200">Already Opened</Label>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-zinc-200">Notes</Label>
        <textarea id="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full min-h-[60px] rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none" placeholder="Storage location, specific settings, etc." disabled={busy} />
      </div>
    </div>
  );
};
