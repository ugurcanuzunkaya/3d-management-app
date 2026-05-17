/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Sparkles, Loader2, Link, Image as ImageIcon, Check } from 'lucide-react';
import { modelsApi } from '@/api/models';
import type { Model3D, ModelExtractionResult } from '@/types';

interface ModelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Model3D, 'id'> & { id?: number }) => Promise<void>;
  model: Model3D | null;
}

const ModelFormModal = ({ isOpen, onClose, onSave, model }: ModelFormModalProps) => {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [filamentType, setFilamentType] = useState('PLA');
  const [printTime, setPrintTime] = useState('');
  const [nozzleTemp, setNozzleTemp] = useState('');
  const [bedTemp, setBedTemp] = useState('');
  const [dimensions, setDimensions] = useState('');

  // AI Scanning state
  const [scanUrl, setScanUrl] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [aiFields, setAiFields] = useState<Record<string, boolean>>({});
  const [scanTab, setScanTab] = useState<'link' | 'image'>('link');

  useEffect(() => {
    if (model) {
      setName(model.name);
      setWeight(model.estimated_weight_g?.toString() || '');
      setSourceUrl(model.source_url || '');
      setLocalPath(model.local_path || '');
      setFilamentType(model.tech_details?.filament_type || 'PLA');
      setPrintTime(model.tech_details?.print_time_minutes?.toString() || '');
      setNozzleTemp(model.tech_details?.nozzle_temp?.toString() || '');
      setBedTemp(model.tech_details?.bed_temp?.toString() || '');
      setDimensions(model.tech_details?.dimensions || '');
    } else {
      setName('');
      setWeight('');
      setSourceUrl('');
      setLocalPath('');
      setFilamentType('PLA');
      setPrintTime('');
      setNozzleTemp('');
      setBedTemp('');
      setDimensions('');
    }
    setAiFields({});
    setScanUrl('');
    setImageFile(null);
    setScanError('');
  }, [model, isOpen]);

  if (!isOpen) return null;

  const handleApplyScan = (result: ModelExtractionResult) => {
    setName(result.name || name);
    if (result.weight_g !== null) setWeight(result.weight_g.toString());
    if (result.filament_type) setFilamentType(result.filament_type);
    if (result.print_time_minutes !== null) setPrintTime(result.print_time_minutes.toString());
    if (result.nozzle_temp !== null) setNozzleTemp(result.nozzle_temp.toString());
    if (result.bed_temp !== null) setBedTemp(result.bed_temp.toString());
    if (result.dimensions) setDimensions(result.dimensions);

    const populated: Record<string, boolean> = {};
    if (result.name) populated.name = true;
    if (result.weight_g !== null) populated.weight = true;
    if (result.filament_type) populated.filamentType = true;
    if (result.print_time_minutes !== null) populated.printTime = true;
    if (result.nozzle_temp !== null) populated.nozzleTemp = true;
    if (result.bed_temp !== null) populated.bedTemp = true;
    if (result.dimensions) populated.dimensions = true;
    setAiFields(populated);
  };

  const runScan = async () => {
    setIsScanning(true);
    setScanError('');
    try {
      let result: ModelExtractionResult;
      if (scanTab === 'link') {
        if (!scanUrl) throw new Error('Please enter a website link to scan.');
        result = await modelsApi.analyzeLink(scanUrl, provider);
        setSourceUrl(scanUrl);
      } else {
        if (!imageFile) throw new Error('Please select an image file to scan.');
        result = await modelsApi.analyzeImage(imageFile, provider);
      }
      handleApplyScan(result);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      setScanError(error.response?.data?.detail || error.message || 'AI Scan failed. Please check your credentials.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await onSave({
      name,
      estimated_weight_g: parseFloat(weight) || 0.0,
      source_url: sourceUrl || undefined,
      local_path: localPath || undefined,
      tech_details: {
        filament_type: filamentType,
        print_time_minutes: parseInt(printTime) || undefined,
        nozzle_temp: parseInt(nozzleTemp) || undefined,
        bed_temp: parseInt(bedTemp) || undefined,
        dimensions: dimensions || undefined,
      },
      id: model?.id,
    });
  };

  const renderSparkle = (field: string) => {
    if (!aiFields[field]) return null;
    return (
      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded-full ml-2 flex items-center gap-0.5 select-none shrink-0">
        <Sparkles className="h-2.5 w-2.5 fill-amber-400" /> AI
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-950 text-zinc-50 w-full max-w-2xl rounded-xl border border-zinc-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">
            {model ? 'Edit 3D Model' : 'Add 3D Model'}
          </h2>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-900" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* AI Extraction Top Section */}
        <div className="p-4 bg-zinc-900/40 border-b border-zinc-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              AI Assistant Spec Scanner
            </span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-2.5 py-1 focus:ring-1 focus:ring-amber-500 font-medium outline-none"
            >
              <option value="gemini">Gemini (Default)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="claude">Claude (Sonnet)</option>
              <option value="ollama_qwen3.5">Ollama (Qwen 3.5)</option>
              <option value="ollama_gemma4">Ollama (Gemma 4)</option>
            </select>
          </div>

          <div className="flex border-b border-zinc-800 text-xs">
            <button
              onClick={() => setScanTab('link')}
              className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 font-medium transition-colors ${scanTab === 'link' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
            >
              <Link className="h-3.5 w-3.5" /> Scan Model Link
            </button>
            <button
              onClick={() => setScanTab('image')}
              className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 font-medium transition-colors ${scanTab === 'image' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
            >
              <ImageIcon className="h-3.5 w-3.5" /> Scan Slicer Screenshot / Image
            </button>
          </div>

          <div className="flex gap-2">
            {scanTab === 'link' ? (
              <Input
                placeholder="Paste Printables or MakerWorld URL here..."
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                disabled={isScanning}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus-visible:ring-amber-500"
              />
            ) : (
              <div className="flex-1 flex gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  disabled={isScanning}
                  className="hidden"
                  id="image-file-input"
                />
                <label
                  htmlFor="image-file-input"
                  className="flex-1 text-xs text-zinc-400 bg-zinc-900 border border-dashed border-zinc-800 rounded px-3 py-2 cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/80 transition-all truncate"
                >
                  {imageFile ? `Selected: ${imageFile.name}` : 'Click to select image file...'}
                </label>
              </div>
            )}
            <Button
              onClick={runScan}
              disabled={isScanning}
              className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/20 shrink-0 font-medium text-xs h-9"
            >
              {isScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
              Scan Spec
            </Button>
          </div>
          {scanError && <p className="text-xs text-rose-400 font-semibold">{scanError}</p>}
        </div>

        {/* Regular Fields Manual Form */}
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">
                Model Name {renderSparkle('name')}
              </label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus-visible:ring-zinc-700 focus-visible:ring-offset-0" />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">
                Weight (g) {renderSparkle('weight')}
              </label>
              <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus-visible:ring-zinc-700 focus-visible:ring-offset-0" />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">
                Material {renderSparkle('filamentType')}
              </label>
              <select
                value={filamentType}
                onChange={(e) => setFilamentType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700"
              >
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="TPU">TPU</option>
                <option value="ABS">ABS</option>
                <option value="ASA">ASA</option>
                <option value="Nylon">Nylon</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">
                Print Time (mins) {renderSparkle('printTime')}
              </label>
              <Input type="number" value={printTime} onChange={(e) => setPrintTime(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus-visible:ring-zinc-700 focus-visible:ring-offset-0" />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">
                Dimensions {renderSparkle('dimensions')}
              </label>
              <Input placeholder="e.g. 100x120x80mm" value={dimensions} onChange={(e) => setDimensions(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus-visible:ring-zinc-700 focus-visible:ring-offset-0" />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">
                Nozzle Temp (°C) {renderSparkle('nozzleTemp')}
              </label>
              <Input type="number" value={nozzleTemp} onChange={(e) => setNozzleTemp(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus-visible:ring-zinc-700 focus-visible:ring-offset-0" />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase flex items-center mb-1.5">
                Bed Temp (°C) {renderSparkle('bedTemp')}
              </label>
              <Input type="number" value={bedTemp} onChange={(e) => setBedTemp(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus-visible:ring-zinc-700 focus-visible:ring-offset-0" />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase mb-1.5">Source URL</label>
              <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus-visible:ring-zinc-700 focus-visible:ring-offset-0" />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase mb-1.5">Local File Path</label>
              <Input value={localPath} onChange={(e) => setLocalPath(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus-visible:ring-zinc-700 focus-visible:ring-offset-0" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-900" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground font-semibold">
              <Check className="h-4 w-4 mr-1.5" /> Save Model
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelFormModal;
