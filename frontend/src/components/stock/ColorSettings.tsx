import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Plus, Trash2 } from 'lucide-react';
import type { FilamentColor } from '@/types';

interface ColorSettingsProps {
  colors: FilamentColor[];
  createColor: (data: { name: string; hex_code: string }) => void;
  deleteColor: (id: number) => void;
}

export const ColorSettings = ({ colors, createColor, deleteColor }: ColorSettingsProps) => {
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete color "${name}"?`)) {
      deleteColor(id);
    }
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Filament Colors</CardTitle>
        </div>
        <CardDescription>Manage your color palette with hex codes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Color name..."
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="w-12 p-1 h-9"
            />
            <Button size="icon" onClick={() => { createColor({ name: newColorName, hex_code: newColorHex }); setNewColorName(''); }} disabled={!newColorName}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
          {colors.map(color => (
            <div key={color.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: color.hex_code }}></div>
                <span className="text-sm font-medium">{color.name}</span>
                <span className="text-xs text-muted-foreground uppercase">{color.hex_code}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(color.id, color.name)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
