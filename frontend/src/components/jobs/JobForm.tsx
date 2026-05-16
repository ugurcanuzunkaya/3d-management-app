import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calculator } from 'lucide-react';
import type { PrintJob, Filament, JobFilament, Settings, PrintJobCreate } from '@/types';
import { FilamentUsageRow } from './FilamentUsageRow';

interface JobFormProps {
  initialData?: PrintJob | null;
  filaments: Filament[];
  settings: Settings | null;
  onSubmit: (data: PrintJobCreate) => void;
  onCancel: () => void;
  isPending?: boolean;
}

interface FormData {
  name: string;
  job_type: string;
  duration_minutes: number;
  total_cost: number;
  production_cost: number;
  filaments: JobFilament[];
}

interface FormFieldsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  productionCost: number;
}

const FormFields = ({ formData, setFormData, productionCost }: FormFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-2"><Label htmlFor="name">Job Name</Label><Input id="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required /></div>
    <div className="space-y-2"><Label htmlFor="type">Type</Label><Input id="type" value={formData.job_type} onChange={e => setFormData(p => ({ ...p, job_type: e.target.value }))} /></div>
    <div className="space-y-2"><Label htmlFor="duration">Time (min)</Label><Input id="duration" type="number" value={formData.duration_minutes} onChange={e => setFormData(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} /></div>
    <div className="space-y-2"><Label htmlFor="price">Sales Price (TL)</Label><Input id="price" type="number" step="0.01" value={formData.total_cost} onChange={e => setFormData(p => ({ ...p, total_cost: parseFloat(e.target.value) || 0 }))} />
      <div className="mt-2 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <div><p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Prod. Cost</p><p className="text-2xl font-black text-blue-700 dark:text-blue-300">₺{productionCost.toFixed(2)}</p></div>
      </div>
    </div>
  </div>
);

const FilamentUsageSection = ({ 
  filaments, selectedFilaments, setFormData 
}: { 
  filaments: Filament[]; selectedFilaments: JobFilament[]; setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Label className="text-lg font-bold">Filaments Used</Label>
      <Button 
        type="button" variant="outline" size="sm" 
        onClick={() => setFormData(p => ({ ...p, filaments: [...p.filaments, { filament_id: 0, grams_used: 0 }] }))} 
        className="gap-2"
      ><Plus className="w-3 h-3" /> Add</Button>
    </div>
    {selectedFilaments.map((line, idx) => (
      <FilamentUsageRow 
        key={idx} index={idx} line={line} filaments={filaments} 
        onUpdate={(i, f, v) => setFormData(p => { const n = [...p.filaments]; n[i] = { ...n[i], [f]: v }; return { ...p, filaments: n }; })} 
        onRemove={(i) => setFormData(p => ({ ...p, filaments: p.filaments.filter((_, idx2) => idx2 !== i) }))} 
        isOnlyItem={selectedFilaments.length === 1} 
      />
    ))}
  </div>
);

export const JobForm: React.FC<JobFormProps> = ({
  initialData, filaments, settings, onSubmit, onCancel, isPending
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '', job_type: initialData?.job_type || 'Generic', duration_minutes: initialData?.duration_minutes || 0,
    total_cost: initialData?.total_cost || 0, production_cost: initialData?.production_cost || 0, filaments: initialData?.job_filaments || [{ filament_id: 0, grams_used: 0 }]
  });

  const electricityCost = (formData.duration_minutes * ((settings?.electric_price || 0) * ((settings?.fallback_wattage || 200) / 1000) / 60));
  
  const productionCost = useMemo(() => {
    let fCost = 0;
    formData.filaments.forEach(jf => {
      const f = filaments.find(filt => filt.id === jf.filament_id);
      if (f && jf.grams_used > 0) fCost += (f.price_per_kg / 1000) * jf.grams_used;
    });
    return fCost + electricityCost;
  }, [formData.filaments, electricityCost, filaments]);

  useEffect(() => {
    if (formData.total_cost === 0 && productionCost > 0) {
      const t = setTimeout(() => setFormData(p => ({ ...p, total_cost: parseFloat(productionCost.toFixed(2)) })), 0);
      return () => clearTimeout(t);
    }
  }, [productionCost, formData.total_cost]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      ...formData, 
      production_cost: productionCost, 
      filaments: formData.filaments.filter(f => f.filament_id > 0 && f.grams_used > 0) 
    });
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <CardHeader><CardTitle>{initialData ? 'Edit Job' : 'Create New Job'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormFields formData={formData} setFormData={setFormData} productionCost={productionCost} />
          <FilamentUsageSection filaments={filaments} selectedFilaments={formData.filaments} setFormData={setFormData} />
          <div className="pt-4 flex gap-4"><Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button><Button type="submit" className="flex-1 h-12 text-lg font-bold" disabled={isPending}>{isPending ? 'Saving...' : (initialData ? 'Update Job' : 'Save Job')}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
};
