import React, { useState } from 'react';
import { usePrivacy } from '@/context/PrivacyContext';
import { Save, Check, Trash2, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const PrivacyEditPanel: React.FC = () => {
  const {
    isEditMode,
    toggleEditMode,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  } = usePrivacy();

  const [presetName, setPresetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  if (!isEditMode) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    try {
      await savePreset(presetName.trim());
      setPresetName('');
      setShowSaveInput(false);
    } catch (err) {
      console.error('Failed to save preset', err);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col md:flex-row items-center gap-4 px-6 py-4 bg-zinc-950/85 dark:bg-zinc-900/85 backdrop-blur-md border border-zinc-800 text-white rounded-2xl shadow-2xl min-w-[320px] max-w-[90vw]">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-bold flex items-center gap-1.5 text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>Configuring Page Privacy</span>
            </div>
            <span className="text-[10px] text-zinc-400">Click elements on the page to hide/show them.</span>
          </div>
        </div>

        {/* Preset loading/saving */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            {presets.length > 0 && (
              <select
                onChange={(e) => {
                  const preset = presets.find((p) => p.id === parseInt(e.target.value));
                  if (preset) loadPreset(preset);
                }}
                className="bg-zinc-800 text-xs text-white rounded-lg px-2.5 py-1.5 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[140px]"
                defaultValue=""
              >
                <option value="" disabled>Load Preset...</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            )}

            {/* List and delete presets */}
            <div className="flex items-center gap-1 max-h-[32px] overflow-x-auto max-w-[100px] no-scrollbar">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => deletePreset(preset.id)}
                  className="text-zinc-500 hover:text-rose-400 p-1 transition-colors rounded hover:bg-zinc-800"
                  title={`Delete preset "${preset.name}"`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {showSaveInput ? (
            <form onSubmit={handleSave} className="flex items-center gap-1.5">
              <Input
                type="text"
                placeholder="Preset Name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="h-8 text-xs bg-zinc-800 border-zinc-700 text-white w-28 focus-visible:ring-indigo-500"
                autoFocus
              />
              <Button type="submit" size="sm" className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-500">
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                onClick={() => setShowSaveInput(false)}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSaveInput(true)}
              className="h-8 text-xs border-zinc-800 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded-lg"
            >
              <Save className="w-3.5 h-3.5 mr-1" /> Save Preset
            </Button>
          )}
        </div>

        <Button
          onClick={toggleEditMode}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-8 px-4 rounded-xl shadow-lg shadow-indigo-600/20 w-full md:w-auto"
        >
          Done
        </Button>
      </div>
    </div>
  );
};
