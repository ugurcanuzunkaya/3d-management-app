import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Sparkles, Loader2, Link, Image as ImageIcon, Check } from 'lucide-react';
import { modelsApi } from '@/api/models';
import { queryKeys } from '@/lib/query-keys';
import type { Model3D, ModelExtractionResult } from '@/types';

interface ModelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Model3D, 'id'> & { id?: number }) => Promise<void>;
  model: Model3D | null;
}

interface FormFields {
  name: string;
  weight: string;
  sourceUrl: string;
  localPath: string;
  filamentType: string;
  printTime: string;
  nozzleTemp: string;
  bedTemp: string;
  dimensions: string;
}

const EMPTY_FIELDS: FormFields = {
  name: '',
  weight: '',
  sourceUrl: '',
  localPath: '',
  filamentType: 'PLA',
  printTime: '',
  nozzleTemp: '',
  bedTemp: '',
  dimensions: '',
};

const toStr = (val?: number | string | null): string => (val !== undefined && val !== null ? String(val) : '');

const getInitialFields = (model: Model3D | null): FormFields => {
  if (!model) return EMPTY_FIELDS;
  const td = model.tech_details || {};
  return {
    name: model.name,
    weight: toStr(model.estimated_weight_g),
    sourceUrl: toStr(model.source_url),
    localPath: toStr(model.local_path),
    filamentType: td.filament_type || 'PLA',
    printTime: toStr(td.print_time_minutes),
    nozzleTemp: toStr(td.nozzle_temp),
    bedTemp: toStr(td.bed_temp),
    dimensions: toStr(td.dimensions),
  };
};

const mergeScanResult = (
  prev: FormFields,
  result: ModelExtractionResult,
  scannedUrl?: string
): { nextFields: FormFields; populated: Record<string, boolean> } => {
  const nextFields: FormFields = {
    ...prev,
    name: result.name || prev.name,
    weight: result.weight_g !== null ? String(result.weight_g) : prev.weight,
    filamentType: result.filament_type || prev.filamentType,
    printTime: result.print_time_minutes !== null ? String(result.print_time_minutes) : prev.printTime,
    nozzleTemp: result.nozzle_temp !== null ? String(result.nozzle_temp) : prev.nozzleTemp,
    bedTemp: result.bed_temp !== null ? String(result.bed_temp) : prev.bedTemp,
    dimensions: result.dimensions || prev.dimensions,
    sourceUrl: scannedUrl || prev.sourceUrl,
  };
  const populated: Record<string, boolean> = {
    name: Boolean(result.name),
    weight: result.weight_g !== null,
    filamentType: Boolean(result.filament_type),
    printTime: result.print_time_minutes !== null,
    nozzleTemp: result.nozzle_temp !== null,
    bedTemp: result.bed_temp !== null,
    dimensions: Boolean(result.dimensions),
  };
  return { nextFields, populated };
};

const AiScannerPanel = ({
  onScanned,
}: {
  onScanned: (result: ModelExtractionResult, scannedUrl?: string) => void;
}) => {
  const [scanUrl, setScanUrl] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanTab, setScanTab] = useState<'link' | 'image'>('link');

  const { data: ollamaModels = [], isLoading: isLoadingOllama } = useQuery<string[]>({
    queryKey: queryKeys.ollamaModels,
    queryFn: modelsApi.listOllamaModels,
    staleTime: 30_000,
  });

  const runScan = async () => {
    setIsScanning(true);
    setScanError('');
    try {
      if (scanTab === 'link') {
        if (!scanUrl) throw new Error('Please enter a website link to scan.');
        onScanned(await modelsApi.analyzeLink(scanUrl, provider), scanUrl);
      } else {
        if (!imageFile) throw new Error('Please select an image file to scan.');
        onScanned(await modelsApi.analyzeImage(imageFile, provider));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      setScanError(error.response?.data?.detail || error.message || 'AI Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-4 bg-zinc-900/40 border-b border-zinc-800/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> AI Assistant Spec Scanner
        </span>
        <select aria-label="AI Provider" value={provider} onChange={e => setProvider(e.target.value)} className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-2.5 py-1 focus:ring-1 focus:ring-amber-500 font-medium outline-none">
          <option value="gemini">Gemini (Default)</option>
          <option value="openai">OpenAI (GPT-4o)</option>
          <option value="claude">Claude (Sonnet)</option>
          {ollamaModels.length > 0 ? (
            ollamaModels.map(m => (
              <option key={m} value={`ollama:${m}`}>
                Ollama ({m})
              </option>
            ))
          ) : (
            <option value="ollama" disabled>
              {isLoadingOllama ? 'Ollama (Checking local models...)' : 'Ollama (No local models detected)'}
            </option>
          )}
        </select>
      </div>
      <div className="flex border-b border-zinc-800 text-xs">
        <button type="button" onClick={() => setScanTab('link')} className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 font-medium transition-colors ${scanTab === 'link' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}>
          <Link className="h-3.5 w-3.5" /> Scan Model Link
        </button>
        <button type="button" onClick={() => setScanTab('image')} className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 font-medium transition-colors ${scanTab === 'image' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}>
          <ImageIcon className="h-3.5 w-3.5" /> Scan Slicer Screenshot / Image
        </button>
      </div>
      <div className="flex gap-2">
        {scanTab === 'link' ? (
          <Input placeholder="Paste Printables or MakerWorld URL here..." value={scanUrl} onChange={e => setScanUrl(e.target.value)} disabled={isScanning} className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus-visible:ring-amber-500" />
        ) : (
          <div className="flex-1 flex gap-2 items-center">
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} disabled={isScanning} className="hidden" id="image-file-input" />
            <label htmlFor="image-file-input" className="flex-1 text-xs text-zinc-400 bg-zinc-900 border border-dashed border-zinc-800 rounded px-3 py-2 cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/80 transition-all truncate">
              {imageFile ? `Selected: ${imageFile.name}` : 'Click to select image file...'}
            </label>
          </div>
        )}
        <Button type="button" onClick={runScan} disabled={isScanning} className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/20 shrink-0 font-medium text-xs h-9">
          {isScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />} Scan Spec
        </Button>
      </div>
      {scanError && <p className="text-xs text-rose-400 font-semibold">{scanError}</p>}
    </div>
  );
};

const SparkleBadge = ({ show }: { show?: boolean }) => {
  if (!show) return null;
  return (
    <span className="text-[10px] text-amber-400 font-bold bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded-full ml-2 flex items-center gap-0.5 select-none shrink-0">
      <Sparkles className="h-2.5 w-2.5 fill-amber-400" /> AI
    </span>
  );
};

const ModelSpecGrid = ({
  fields,
  aiFields,
  setField,
}: {
  fields: FormFields;
  aiFields: Record<string, boolean>;
  setField: (key: keyof FormFields, val: string) => void;
}) => {
  const inputCls = 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus-visible:ring-zinc-700 focus-visible:ring-offset-0';
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">Model Name <SparkleBadge show={aiFields.name} /></label>
        <Input required value={fields.name} onChange={e => setField('name', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">Weight (g) <SparkleBadge show={aiFields.weight} /></label>
        <Input type="number" step="0.1" value={fields.weight} onChange={e => setField('weight', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">Material <SparkleBadge show={aiFields.filamentType} /></label>
        <select value={fields.filamentType} onChange={e => setField('filamentType', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700">
          {['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'Nylon'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">Print Time (mins) <SparkleBadge show={aiFields.printTime} /></label>
        <Input type="number" value={fields.printTime} onChange={e => setField('printTime', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">Dimensions <SparkleBadge show={aiFields.dimensions} /></label>
        <Input placeholder="e.g. 100x120x80mm" value={fields.dimensions} onChange={e => setField('dimensions', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">Nozzle Temp (°C) <SparkleBadge show={aiFields.nozzleTemp} /></label>
        <Input type="number" value={fields.nozzleTemp} onChange={e => setField('nozzleTemp', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">Bed Temp (°C) <SparkleBadge show={aiFields.bedTemp} /></label>
        <Input type="number" value={fields.bedTemp} onChange={e => setField('bedTemp', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase mb-1.5">Source URL</label>
        <Input value={fields.sourceUrl} onChange={e => setField('sourceUrl', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase mb-1.5">Local File Path</label>
        <Input value={fields.localPath} onChange={e => setField('localPath', e.target.value)} className={inputCls} />
      </div>
    </div>
  );
};

const ModelFormContent = ({ onClose, onSave, model }: Omit<ModelFormModalProps, 'isOpen'>) => {
  const [fields, setFields] = useState<FormFields>(() => getInitialFields(model));
  const [aiFields, setAiFields] = useState<Record<string, boolean>>({});
  const setField = (key: keyof FormFields, val: string) => setFields(prev => ({ ...prev, [key]: val }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.name) return;
    await onSave({
      name: fields.name,
      estimated_weight_g: parseFloat(fields.weight) || 0.0,
      source_url: fields.sourceUrl || undefined,
      local_path: fields.localPath || undefined,
      tech_details: {
        filament_type: fields.filamentType,
        print_time_minutes: parseInt(fields.printTime, 10) || undefined,
        nozzle_temp: parseInt(fields.nozzleTemp, 10) || undefined,
        bed_temp: parseInt(fields.bedTemp, 10) || undefined,
        dimensions: fields.dimensions || undefined,
      },
      id: model?.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-950 text-zinc-50 w-full max-w-2xl rounded-xl border border-zinc-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">{model ? 'Edit 3D Model' : 'Add 3D Model'}</h2>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-900" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AiScannerPanel
          onScanned={(res, scannedUrl) => {
            const { nextFields, populated } = mergeScanResult(fields, res, scannedUrl);
            setFields(nextFields);
            setAiFields(populated);
          }}
        />
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <ModelSpecGrid fields={fields} aiFields={aiFields} setField={setField} />
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-900" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
              <Check className="h-4 w-4 mr-1.5" /> Save Model
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ModelFormModal = ({ isOpen, onClose, onSave, model }: ModelFormModalProps) => {
  if (!isOpen) return null;
  return <ModelFormContent key={model?.id ?? 'new'} onClose={onClose} onSave={onSave} model={model} />;
};

export default ModelFormModal;
