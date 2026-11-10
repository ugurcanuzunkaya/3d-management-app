import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Trash2 } from 'lucide-react';
import type { FilamentType } from '@/types';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

interface TypeSettingsProps {
  types: FilamentType[];
  createType: (name: string) => void;
  deleteType: (id: number) => void;
  isCreating?: boolean;
}

export const TypeSettings = ({ types, createType, deleteType, isCreating }: TypeSettingsProps) => {
  const [newTypeName, setNewTypeName] = useState('');

  const handleAdd = () => {
    if (!newTypeName.trim()) return;
    createType(newTypeName.trim());
    setNewTypeName('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <CardTitle>Filament Types</CardTitle>
        </div>
        <CardDescription>Add or remove filament categories (e.g., PLA, PETG).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <Input
            placeholder="New type name..."
            value={newTypeName}
            onChange={e => setNewTypeName(e.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Add Filament Type"
            disabled={!newTypeName.trim() || isCreating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
          {types.map(type => (
            <div key={type.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium">
                <PrivacyWrapper keyName="maskStockSettingsList" placeholder="•••••" inline>
                  {type.name}
                </PrivacyWrapper>
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteType(type.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
