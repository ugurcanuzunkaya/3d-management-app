import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import type { PrintJob, Filament, JobFilament, Settings, PrintJobCreate, Model3D, Printer } from '@/types';
import { FilamentUsageRow } from './FilamentUsageRow';
import {
  CostBreakdownPanel,
  CustomCostsSection,
  type CostBreakdown,
  type CustomCostRow,
} from './JobFormCostSections';
import { useModels } from '@/hooks/use-models';
import { usePrinter } from '@/hooks/use-printer';

interface JobFormProps {
  initialData?: PrintJob | null;
  filaments: Filament[];
  settings: Settings | null | undefined;
  onSubmit: (data: PrintJobCreate) => void;
  onCancel: () => void;
  isPending?: boolean;
}

interface FormData {
  name: string;
  job_type: string;
  model_id: number | null;
  printer_id: number | null;
  duration_minutes: number;
  markup_multiplier: number;
  total_cost: number;
  isCustomPrice: boolean;
  filaments: JobFilament[];
  customCosts: CustomCostRow[];
}

const mapJobFilaments = (initialData?: PrintJob | null): JobFilament[] => {
  if (!initialData) return [{ filament_id: 0, grams_used: 0 }];
  if (initialData.job_filaments && initialData.job_filaments.length > 0) {
    return initialData.job_filaments;
  }
  const mapped = initialData.filaments?.map(f => ({ filament_id: f.id, grams_used: 0 }));
  return mapped && mapped.length > 0 ? mapped : [{ filament_id: 0, grams_used: 0 }];
};

const buildInitialFormData = (initialData?: PrintJob | null, settings?: Settings | null): FormData => {
  const base = initialData ?? {
    name: '',
    job_type: 'Generic',
    model_id: null,
    printer_id: null,
    duration_minutes: 0,
    total_cost: 0,
  };
  return {
    name: base.name,
    job_type: base.job_type,
    model_id: base.model_id ?? null,
    printer_id: base.printer_id ?? null,
    duration_minutes: base.duration_minutes,
    markup_multiplier: settings?.markup_multiplier ?? 3.0,
    total_cost: base.total_cost,
    isCustomPrice: base.total_cost > 0,
    filaments: mapJobFilaments(initialData),
    customCosts: [],
  };
};

const computeBreakdown = (
  formData: FormData,
  filaments: Filament[],
  settings?: Settings | null
): CostBreakdown => {
  const hours = Math.max(0, formData.duration_minutes / 60);
  const electricPrice = settings?.electric_price ?? 0;
  const wattage = settings?.fallback_wattage ?? 200;
  const machineRate = settings?.machine_hourly_rate ?? 0;
  const failurePct = settings?.failure_rate_pct ?? 0;

  const filamentCost = formData.filaments.reduce((sum, jf) => {
    const f = filaments.find(filt => filt.id === jf.filament_id);
    if (!f || jf.grams_used <= 0) return sum;
    return sum + (f.price_per_kg / 1000) * jf.grams_used;
  }, 0);

  const electricityCost = hours * (wattage / 1000) * electricPrice;
  const machineWearCost = hours * machineRate;
  const baseCost = filamentCost + electricityCost + machineWearCost;
  const failureBufferCost = baseCost * (Math.max(0, failurePct) / 100);
  const productionCost = baseCost + failureBufferCost;
  const customCostsTotal = formData.customCosts.reduce((s, c) => s + (c.value || 0), 0);
  const multiplier = formData.markup_multiplier > 0 ? formData.markup_multiplier : 3.0;
  const suggestedPrice = productionCost * multiplier + customCostsTotal;

  return {
    filamentCost,
    electricityCost,
    machineWearCost,
    failureBufferCost,
    productionCost,
    customCostsTotal,
    suggestedPrice,
  };
};

const JobMainFieldsGrid = ({
  formData,
  setFormData,
  models,
  printers,
  onModelChange,
  displayedPrice,
  breakdown,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  models: Model3D[];
  printers: Printer[];
  onModelChange: (val: string) => void;
  displayedPrice: number;
  breakdown: CostBreakdown;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-2">
      <Label htmlFor="name">Job Name</Label>
      <Input id="name" placeholder="e.g. Desk Organizer v2" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
    </div>
    <div className="space-y-2">
      <Label htmlFor="type">Type</Label>
      <Input id="type" placeholder="e.g. Prototype" value={formData.job_type} onChange={e => setFormData(p => ({ ...p, job_type: e.target.value }))} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="modelSelect">Linked 3D Model</Label>
      <select id="modelSelect" value={formData.model_id ?? ''} onChange={e => onModelChange(e.target.value)} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm">
        <option value="">-- Optional 3D Model --</option>
        {models.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
      </select>
    </div>
    <div className="space-y-2">
      <Label htmlFor="printerSelect">Assigned Printer</Label>
      <select id="printerSelect" value={formData.printer_id ?? ''} onChange={e => setFormData(p => ({ ...p, printer_id: e.target.value ? parseInt(e.target.value, 10) : null }))} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm">
        <option value="">-- Optional Printer --</option>
        {printers.map(pr => (<option key={pr.id} value={pr.id}>{pr.name}</option>))}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="duration">Total Time (minutes)</Label>
        <Input id="duration" type="number" value={formData.duration_minutes} onChange={e => setFormData(p => ({ ...p, duration_minutes: parseInt(e.target.value, 10) || 0 }))} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="markup">Markup Multiplier (x)</Label>
        <Input id="markup" type="number" step="0.1" value={formData.markup_multiplier} onChange={e => setFormData(p => ({ ...p, markup_multiplier: parseFloat(e.target.value) || 1 }))} />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="price">Estimated Sales Price (TL)</Label>
      <Input id="price" type="number" step="0.01" value={displayedPrice} onChange={e => setFormData(p => ({ ...p, isCustomPrice: true, total_cost: parseFloat(e.target.value) || 0 }))} />
      <CostBreakdownPanel breakdown={breakdown} displayedPrice={displayedPrice} />
    </div>
  </div>
);

export const JobForm: React.FC<JobFormProps> = ({
  initialData,
  filaments,
  settings,
  onSubmit,
  onCancel,
  isPending,
}) => {
  const { models } = useModels();
  const { printers } = usePrinter(undefined, { pollStatuses: false });
  const [formData, setFormData] = useState<FormData>(() => buildInitialFormData(initialData, settings));
  const isEditing = Boolean(initialData && initialData.id > 0);

  const breakdown = useMemo(() => computeBreakdown(formData, filaments, settings), [formData, filaments, settings]);
  const displayedPrice = formData.isCustomPrice ? formData.total_cost : parseFloat(breakdown.suggestedPrice.toFixed(2));

  const handleModelChange = (modelIdStr: string) => {
    const mid = modelIdStr ? parseInt(modelIdStr, 10) : null;
    const selectedModel = models.find(m => m.id === mid);
    if (!selectedModel) {
      setFormData(p => ({ ...p, model_id: null }));
      return;
    }
    const rawMins = selectedModel.tech_details?.print_time_minutes;
    const mins = typeof rawMins === 'number' ? rawMins : formData.duration_minutes;
    const defaultFilId = filaments[0]?.id ?? 0;
    setFormData(p => ({
      ...p,
      model_id: selectedModel.id,
      name: p.name || selectedModel.name,
      duration_minutes: mins,
      filaments: selectedModel.estimated_weight_g && defaultFilId
        ? [{ filament_id: defaultFilId, grams_used: selectedModel.estimated_weight_g }]
        : p.filaments,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      job_type: formData.job_type,
      model_id: formData.model_id,
      printer_id: formData.printer_id,
      duration_minutes: formData.duration_minutes,
      total_cost: displayedPrice,
      production_cost: parseFloat(breakdown.productionCost.toFixed(2)),
      filaments: formData.filaments.filter(f => f.filament_id > 0 && f.grams_used > 0),
    });
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <CardHeader><CardTitle>{isEditing ? 'Edit Job' : 'Create New Job'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <JobMainFieldsGrid formData={formData} setFormData={setFormData} models={models} printers={printers} onModelChange={handleModelChange} displayedPrice={displayedPrice} breakdown={breakdown} />
          <CustomCostsSection
            customCosts={formData.customCosts}
            onAdd={() => setFormData(p => ({ ...p, customCosts: [...p.customCosts, { name: 'Packaging', value: 0 }] }))}
            onUpdate={(idx, patch) => setFormData(p => ({ ...p, customCosts: p.customCosts.map((item, i) => (i === idx ? { ...item, ...patch } : item)) }))}
            onRemove={idx => setFormData(p => ({ ...p, customCosts: p.customCosts.filter((_, i) => i !== idx) }))}
          />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold">Filaments Used</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setFormData(p => ({ ...p, filaments: [...p.filaments, { filament_id: 0, grams_used: 0 }] }))} className="gap-2">
                <Plus className="w-3 h-3" /> Add Filament
              </Button>
            </div>
            {formData.filaments.map((line, idx) => (
              <FilamentUsageRow
                key={idx}
                index={idx}
                line={line}
                filaments={filaments}
                onUpdate={(i, f, v) => setFormData(p => { const next = [...p.filaments]; next[i] = { ...next[i], [f]: v }; return { ...p, filaments: next }; })}
                onRemove={i => setFormData(p => ({ ...p, filaments: p.filaments.filter((_, idx2) => idx2 !== i) }))}
                isOnlyItem={formData.filaments.length === 1}
              />
            ))}
          </div>
          <div className="pt-4 flex gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 h-12 text-lg font-bold" disabled={isPending}>
              {isPending ? 'Saving Job...' : isEditing ? 'Update Job' : 'Save Job & Update Stock'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
