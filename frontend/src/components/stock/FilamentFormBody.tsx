import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FilamentType, FilamentColor } from '@/types';

export interface FilamentFormData {
  name: string;
  type_id: string;
  color_id: string;
  price_per_kg: string;
  remaining_weight_g: string;
  is_opened: boolean;
  notes: string;
  customType: string;
  customColor: string;
}

interface FilamentFormBodyProps {
  formData: FilamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<FilamentFormData>>;
  types: FilamentType[];
  colors: FilamentColor[];
}

const CustomInput = ({ 
  placeholder, value, onChange 
}: { 
  placeholder: string; value?: string; onChange: (val: string) => void;
}) => (
  <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
    <Input 
      placeholder={placeholder} 
      required 
      value={value} 
      onChange={(e) => onChange(e.target.value.toUpperCase())} 
      className="h-9 text-xs font-bold uppercase bg-blue-50 border-blue-100 text-blue-700 placeholder:text-blue-300"
    />
  </div>
);

export const FilamentFormBody = ({ formData, setFormData, types, colors }: FilamentFormBodyProps) => (
  <div className="p-6 space-y-5 bg-white text-slate-900">
    <div className="space-y-2">
      <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Name</Label>
      <Input 
        id="name" required value={formData.name} 
        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
        placeholder="e.g., Smart PLA Black" 
        className="h-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-slate-900/10"
      />
    </div>

    <div className="grid grid-cols-2 gap-5">
      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-semibold text-slate-700">Type</Label>
        <select 
          id="type" required value={formData.type_id} 
          onChange={(e) => setFormData({ ...formData, type_id: e.target.value })} 
          className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all"
        >
          <option value="">Select Type</option>
          {types.map(t => <option key={t.id} value={t.id.toString()}>{t.name}</option>)}
          <option value="custom" className="font-bold border-t italic text-blue-600">+ Custom Type</option>
        </select>
        {formData.type_id === 'custom' && (
          <CustomInput placeholder="ENTER CUSTOM TYPE" value={formData.customType} onChange={(val) => setFormData({ ...formData, customType: val })} />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="color" className="text-sm font-semibold text-slate-700">Color</Label>
        <select 
          id="color" required value={formData.color_id} 
          onChange={(e) => setFormData({ ...formData, color_id: e.target.value })} 
          className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all"
        >
          <option value="">Select Color</option>
          {colors.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
          <option value="custom" className="font-bold border-t italic text-blue-600">+ Custom Color</option>
        </select>
        {formData.color_id === 'custom' && (
          <CustomInput placeholder="ENTER CUSTOM COLOR" value={formData.customColor} onChange={(val) => setFormData({ ...formData, customColor: val })} />
        )}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-5">
      <div className="space-y-2">
        <Label htmlFor="price" className="text-sm font-semibold text-slate-700">Price (TL/kg)</Label>
        <Input 
          id="price" type="number" step="0.01" required value={formData.price_per_kg} 
          onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })} 
          className="h-10 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="weight" className="text-sm font-semibold text-slate-700">Weight (g)</Label>
        <Input 
          id="weight" type="number" step="0.1" required value={formData.remaining_weight_g} 
          onChange={(e) => setFormData({ ...formData, remaining_weight_g: e.target.value })} 
          className="h-10 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
        />
      </div>
    </div>

    <div className="flex items-center gap-3 py-2">
      <input 
        type="checkbox" id="is_opened" checked={formData.is_opened} 
        onChange={(e) => setFormData({ ...formData, is_opened: e.target.checked })} 
        className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer" 
      />
      <Label htmlFor="is_opened" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Already Opened</Label>
    </div>

    <div className="space-y-2">
      <Label htmlFor="notes" className="text-sm font-semibold text-slate-700">Notes</Label>
      <textarea 
        id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
        className="w-full min-h-[100px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400" 
        placeholder="Storage location, specific settings, etc." 
      />
    </div>
  </div>
);
