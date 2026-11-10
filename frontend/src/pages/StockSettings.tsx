import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Settings, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SettingsSkeleton } from '@/components/ui/Skeleton';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';
import { useFilamentTypes, useColors } from '@/hooks/use-filaments';
import { useStockSettings } from '@/hooks/use-settings';
import { TypeSettings } from '@/components/stock/TypeSettings';
import { ColorSettings } from '@/components/stock/ColorSettings';

const InventoryDefaultsForm = ({
  price,
  weight,
  threshold,
  masked,
  isUpdating,
  onSave,
}: {
  price: number;
  weight: number;
  threshold: number;
  masked: boolean;
  isUpdating: boolean;
  onSave: (data: { default_price_per_kg: number; default_weight_g: number; low_stock_threshold: number }) => void;
}) => (
  <form
    className="grid grid-cols-1 md:grid-cols-3 gap-6"
    onSubmit={e => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      onSave({
        default_price_per_kg: parseFloat(formData.get('price') as string),
        default_weight_g: parseFloat(formData.get('weight') as string),
        low_stock_threshold: parseFloat(formData.get('threshold') as string) || 200,
      });
    }}
  >
    <div className="space-y-2">
      <Label htmlFor="price">Default Price (TL/kg)</Label>
      <PrivacyWrapper keyName="maskStockSettingsList" placeholder="•••" inline>
        <Input id="price" name="price" type={masked ? 'text' : 'number'} step="0.01" defaultValue={masked ? '•••' : price} />
      </PrivacyWrapper>
    </div>
    <div className="space-y-2">
      <Label htmlFor="weight">Default Spool Weight (g)</Label>
      <PrivacyWrapper keyName="maskStockSettingsList" placeholder="•••" inline>
        <Input id="weight" name="weight" type={masked ? 'text' : 'number'} step="0.1" defaultValue={masked ? '•••' : weight} />
      </PrivacyWrapper>
    </div>
    <div className="space-y-2">
      <Label htmlFor="threshold">Low-Stock Alert Threshold (g)</Label>
      <PrivacyWrapper keyName="maskStockSettingsList" placeholder="•••" inline>
        <Input id="threshold" name="threshold" type={masked ? 'text' : 'number'} step="10" defaultValue={masked ? '•••' : threshold} />
      </PrivacyWrapper>
    </div>
    <div className="md:col-span-3 flex justify-end">
      <Button type="submit" disabled={isUpdating}>
        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Defaults
      </Button>
    </div>
  </form>
);

export const InventoryCatalogSection = () => {
  const { isMasked } = usePrivacy();
  const { types, createType, deleteType, isCreatingType } = useFilamentTypes();
  const { colors, createColor, deleteColor, isCreatingColor } = useColors();
  const { stockSettings, updateStockSettings, isUpdatingStock } = useStockSettings();
  const masked = isMasked('maskStockSettingsList');
  const price = stockSettings?.default_price_per_kg ?? 500;
  const weight = stockSettings?.default_weight_g ?? 1000;
  const threshold = stockSettings?.low_stock_threshold ?? 200;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Inventory Defaults</CardTitle>
          </div>
          <CardDescription>Default values used when adding new filaments to stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryDefaultsForm
            key={`${price}-${weight}-${threshold}-${masked}`}
            price={price}
            weight={weight}
            threshold={threshold}
            masked={masked}
            isUpdating={isUpdatingStock}
            onSave={updateStockSettings}
          />
        </CardContent>
      </Card>

      <TypeSettings types={types} createType={createType} deleteType={deleteType} isCreating={isCreatingType} />
      <ColorSettings colors={colors} createColor={createColor} deleteColor={deleteColor} isCreating={isCreatingColor} />
    </div>
  );
};

const StockSettingsPage = () => {
  const { isLoading: loadingTypes } = useFilamentTypes();
  const { isLoading: loadingColors } = useColors();
  const { isLoading: loadingSettings } = useStockSettings();

  if (loadingTypes || loadingColors || loadingSettings) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/stock">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <PrivacyWrapper keyName="maskStockSettingsTitle" placeholder="•••••" inline>Stock Settings</PrivacyWrapper>
          </h1>
          <p className="text-muted-foreground">Configure defaults, types, and colors for your inventory.</p>
        </div>
      </div>
      <InventoryCatalogSection />
    </div>
  );
};

export default StockSettingsPage;
