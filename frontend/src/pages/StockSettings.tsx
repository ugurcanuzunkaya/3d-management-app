import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Trash2, Palette, Layers, Settings, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { FilamentType, FilamentColor, StockSettings } from '@/types';
import { SettingsSkeleton } from '@/components/ui/Skeleton';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

const StockSettingsPage = () => {
  const queryClient = useQueryClient();
  const [newTypeName, setNewTypeName] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const { isMasked } = usePrivacy();

  const { data: types, isLoading: loadingTypes } = useQuery<FilamentType[]>({
    queryKey: ['filament-types'],
    queryFn: () => api.get('/api/filaments/types').then(res => res.data)
  });

  const { data: colors, isLoading: loadingColors } = useQuery<FilamentColor[]>({
    queryKey: ['filament-colors'],
    queryFn: () => api.get('/api/filaments/colors').then(res => res.data)
  });

  const { data: settings, isLoading: loadingSettings } = useQuery<StockSettings>({
    queryKey: ['stock-settings'],
    queryFn: () => api.get('/api/settings/stock').then(res => res.data)
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<StockSettings>) => api.put('/api/settings/stock', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-settings'] })
  });

  const addTypeMutation = useMutation({
    mutationFn: (name: string) => api.post('/api/filaments/types', { name, is_custom: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filament-types'] });
      setNewTypeName('');
    }
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/filaments/types/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filament-types'] })
  });

  const addColorMutation = useMutation({
    mutationFn: (data: { name: string, hex_code: string }) => api.post('/api/filaments/colors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filament-colors'] });
      setNewColorName('');
      setNewColorHex('#000000');
    }
  });

  const deleteColorMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/filaments/colors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filament-colors'] })
  });

  if (loadingTypes || loadingColors || loadingSettings) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/stock">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <PrivacyWrapper keyName="maskStockSettingsTitle" placeholder="•••••" inline>
              Stock Settings
            </PrivacyWrapper>
          </h1>
          <p className="text-muted-foreground">Configure defaults, types, and colors for your inventory.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Default Values */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Inventory Defaults</CardTitle>
            </div>
            <CardDescription>Default values used when adding new filaments to stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateSettingsMutation.mutate({
                  default_price_per_kg: parseFloat(formData.get('price') as string),
                  default_weight_g: parseFloat(formData.get('weight') as string)
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="price">Default Price (TL/kg)</Label>
                <PrivacyWrapper keyName="maskStockSettingsList" placeholder="•••" inline>
                  <Input
                    id="price"
                    name="price"
                    type={isMasked('maskStockSettingsList') ? 'text' : 'number'}
                    step="0.01"
                    defaultValue={isMasked('maskStockSettingsList') ? '•••' : settings?.default_price_per_kg}
                  />
                </PrivacyWrapper>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Default Spool Weight (g)</Label>
                <PrivacyWrapper keyName="maskStockSettingsList" placeholder="•••" inline>
                  <Input
                    id="weight"
                    name="weight"
                    type={isMasked('maskStockSettingsList') ? 'text' : 'number'}
                    step="0.1"
                    defaultValue={isMasked('maskStockSettingsList') ? '•••' : settings?.default_weight_g}
                  />
                </PrivacyWrapper>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Defaults
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Filament Types */}
        <Card>
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
              <Button size="icon" onClick={() => addTypeMutation.mutate(newTypeName)} disabled={!newTypeName || addTypeMutation.isPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {types?.map(type => (
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
                    onClick={() => deleteTypeMutation.mutate(type.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filament Colors */}
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
                <Button size="icon" onClick={() => addColorMutation.mutate({ name: newColorName, hex_code: newColorHex })} disabled={!newColorName || addColorMutation.isPending}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {colors?.map(color => (
                <div key={color.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border shadow-sm"
                      style={{ backgroundColor: isMasked('maskStockSettingsList') ? '#000000' : color.hex_code }}
                    ></div>
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
                    onClick={() => deleteColorMutation.mutate(color.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockSettingsPage;
