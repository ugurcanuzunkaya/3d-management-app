import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Download, Calculator, Layers, Database } from 'lucide-react';
import type { Settings } from '@/types';
import { SettingsSkeleton } from '@/components/ui/Skeleton';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';
import { useSettings } from '@/hooks/use-settings';
import { InventoryCatalogSection } from '@/pages/StockSettings';
import { settingsApi } from '@/api/settings';

type SettingsTab = 'financial' | 'inventory' | 'backup';

const FormulaPreviewCard = ({ sampleProd, sampleRetail }: { sampleProd: number; sampleRetail: number }) => (
  <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
    <CardHeader>
      <CardTitle>Live Formula Preview (Sample 100g @ 500/kg, 2 Hours)</CardTitle>
      <CardDescription>
        Production Cost = (Filament + Power + Machine Wear) × (1 + Failure Buffer %)
      </CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-between text-sm">
      <div>
        <span className="text-muted-foreground">Sample Production Cost: </span>
        <span className="font-bold text-blue-600 dark:text-blue-400">₺{sampleProd.toFixed(2)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Suggested Quote Price: </span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">₺{sampleRetail.toFixed(2)}</span>
      </div>
    </CardContent>
  </Card>
);

const FinancialSettingsTab = ({
  initialSettings,
  onSave,
  isPending,
}: {
  initialSettings: Settings;
  onSave: (data: Settings) => void;
  isPending: boolean;
}) => {
  const [electricPrice, setElectricPrice] = useState(initialSettings.electric_price.toString());
  const [fallbackWattage, setFallbackWattage] = useState(initialSettings.fallback_wattage.toString());
  const [markup, setMarkup] = useState((initialSettings.markup_multiplier ?? 3.0).toString());
  const [machineRate, setMachineRate] = useState((initialSettings.machine_hourly_rate ?? 5.0).toString());
  const [failurePct, setFailurePct] = useState((initialSettings.failure_rate_pct ?? 5.0).toString());
  const [currency, setCurrency] = useState(initialSettings.currency ?? 'TRY');
  const { isMasked } = usePrivacy();

  const handleSave = () => {
    onSave({
      electric_price: parseFloat(electricPrice) || 0,
      fallback_wattage: parseFloat(fallbackWattage) || 200,
      markup_multiplier: parseFloat(markup) || 3.0,
      machine_hourly_rate: parseFloat(machineRate) || 0,
      failure_rate_pct: parseFloat(failurePct) || 0,
      currency,
    });
  };

  const sampleProd =
    (50 + 2 * ((parseFloat(fallbackWattage) || 200) / 1000) * (parseFloat(electricPrice) || 0) + 2 * (parseFloat(machineRate) || 0)) *
    (1 + (parseFloat(failurePct) || 0) / 100);
  const sampleRetail = sampleProd * (parseFloat(markup) || 3.0);

  return (
    <div className="space-y-6">
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
        <CardHeader>
          <CardTitle>Financial & Pricing Configuration</CardTitle>
          <CardDescription>
            Configure electricity, machine wear, risk buffer, and markup multiplier for quotes and print jobs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="electric">Electric Price (per kWh)</Label>
              <PrivacyWrapper keyName="maskSettingsElectricPrice" placeholder="•••" inline>
                <Input id="electric" type={isMasked('maskSettingsElectricPrice') ? 'password' : 'text'} value={electricPrice} onChange={e => setElectricPrice(e.target.value)} />
              </PrivacyWrapper>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wattage">Fallback Printer Wattage (W)</Label>
              <PrivacyWrapper keyName="maskSettingsFallbackWattage" placeholder="•••" inline>
                <Input id="wattage" type={isMasked('maskSettingsFallbackWattage') ? 'password' : 'text'} value={fallbackWattage} onChange={e => setFallbackWattage(e.target.value)} />
              </PrivacyWrapper>
            </div>
            <div className="space-y-2">
              <Label htmlFor="markup">Default Markup Multiplier (x)</Label>
              <Input id="markup" type="number" step="0.1" value={markup} onChange={e => setMarkup(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="machineRate">Machine Hourly Rate (Wear/Depreciation)</Label>
              <Input id="machineRate" type="number" step="0.5" value={machineRate} onChange={e => setMachineRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="failurePct">Failure Rate Buffer (%)</Label>
              <Input id="failurePct" type="number" step="0.5" value={failurePct} onChange={e => setFailurePct(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={currency} onChange={e => setCurrency(e.target.value)} />
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Save className="w-4 h-4 mr-1.5" /> Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
      <FormulaPreviewCard sampleProd={sampleProd} sampleRetail={sampleRetail} />
    </div>
  );
};

const BackupExportTab = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backup = await settingsApi.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `3d-management-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
      <CardHeader>
        <CardTitle>Local Data Backup & Export</CardTitle>
        <CardDescription>
          Download a complete JSON snapshot of your filaments, print jobs, 3D models, printers (with access codes masked), and pricing settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExport} disabled={isExporting} className="gap-2">
          <Download className="w-4 h-4" />
          {isExporting ? 'Preparing Backup...' : 'Download JSON Backup'}
        </Button>
      </CardContent>
    </Card>
  );
};

const SettingsPage = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('financial');

  if (isLoading || !settings) return <SettingsSkeleton />;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          <PrivacyWrapper keyName="maskSettingsTitle" placeholder="•••••" inline>
            Settings
          </PrivacyWrapper>
        </h1>
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
          <Button
            type="button"
            variant={activeTab === 'financial' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('financial')}
            className="gap-1.5 text-xs"
          >
            <Calculator className="w-3.5 h-3.5" /> Financial & Pricing
          </Button>
          <Button
            type="button"
            variant={activeTab === 'inventory' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('inventory')}
            className="gap-1.5 text-xs"
          >
            <Layers className="w-3.5 h-3.5" /> Inventory & Catalog
          </Button>
          <Button
            type="button"
            variant={activeTab === 'backup' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('backup')}
            className="gap-1.5 text-xs"
          >
            <Database className="w-3.5 h-3.5" /> Backup & Data
          </Button>
        </div>
      </div>

      {activeTab === 'financial' && (
        <FinancialSettingsTab
          key={`${settings.electric_price}-${settings.fallback_wattage}-${settings.markup_multiplier}`}
          initialSettings={settings}
          onSave={updateSettings}
          isPending={isUpdating}
        />
      )}
      {activeTab === 'inventory' && <InventoryCatalogSection />}
      {activeTab === 'backup' && <BackupExportTab />}
    </div>
  );
};

export default SettingsPage;
