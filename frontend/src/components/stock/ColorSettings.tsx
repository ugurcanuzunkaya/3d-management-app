import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Plus, Trash2 } from 'lucide-react';
import type { FilamentColor } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

interface ColorSettingsProps {
  colors: FilamentColor[];
  createColor: (data: { name: string; hex_code: string }) => void;
  deleteColor: (id: number) => void;
  isCreating?: boolean;
}

export const ColorSettings = ({ colors, createColor, deleteColor, isCreating }: ColorSettingsProps) => {
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const { isMasked } = usePrivacy();

  const handleAdd = () => {
    if (!newColorName.trim()) return;
    createColor({ name: newColorName.trim(), hex_code: newColorHex });
    setNewColorName('');
    setNewColorHex('#000000');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Filament Colors</CardTitle>
        </div>
        <CardDescription>Manage your color palette with hex codes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <form
            className="flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              handleAdd();
            }}
          >
            <Input
              placeholder="Color name..."
              value={newColorName}
              onChange={e => setNewColorName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="color"
              value={newColorHex}
              onChange={e => setNewColorHex(e.target.value)}
              className="w-12 p-1 h-9"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Add Filament Color"
              disabled={!newColorName.trim() || isCreating}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
          {colors.map(color => (
            <div key={color.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border shadow-sm"
                  style={{ backgroundColor: isMasked('maskStockSettingsList') ? '#000000' : color.hex_code }}
                />
                <span className="text-sm font-medium">
                  <PrivacyWrapper keyName="maskStockSettingsList" placeholder="•••••" inline>
                    {color.name}
                  </PrivacyWrapper>
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  <PrivacyWrapper keyName="maskStockSettingsList" placeholder="•••••" inline>
                    {color.hex_code}
                  </PrivacyWrapper>
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteColor(color.id)}
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
