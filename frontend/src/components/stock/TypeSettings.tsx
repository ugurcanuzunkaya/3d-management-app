import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Trash2 } from 'lucide-react';
import type { FilamentType } from '@/types';

interface TypeSettingsProps {
  types: FilamentType[];
  createType: (name: string) => void;
  deleteType: (id: number) => void;
}

export const TypeSettings = ({ types, createType, deleteType }: TypeSettingsProps) => {
  const [newTypeName, setNewTypeName] = useState('');

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete type "${name}"?`)) {
      deleteType(id);
    }
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <CardTitle>Filament Types</CardTitle>
        </div>
        <CardDescription>Add or remove filament categories (e.g., PLA, PETG).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="New type name..."
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
          />
          <Button size="icon" onClick={() => { createType(newTypeName); setNewTypeName(''); }} disabled={!newTypeName}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
          {types.map(type => (
            <div key={type.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium">{type.name}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(type.id, type.name)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
