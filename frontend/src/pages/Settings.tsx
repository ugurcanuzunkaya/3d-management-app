import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import api from '@/lib/api';
import type { Settings } from '@/types';
import { useState } from 'react';
import { SettingsSkeleton } from '@/components/ui/Skeleton';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

const SettingsForm = ({ initialSettings }: { initialSettings: Settings }) => {
  const queryClient = useQueryClient();
  const [electricPrice, setElectricPrice] = useState(initialSettings.electric_price.toString());
  const [fallbackWattage, setFallbackWattage] = useState(initialSettings.fallback_wattage.toString());
  
  const { isMasked } = usePrivacy();

  const mutation = useMutation({
    mutationFn: (newSettings: Settings) => api.post('/api/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const handleSave = () => {
    mutation.mutate({
      electric_price: parseFloat(electricPrice),
      fallback_wattage: parseFloat(fallbackWattage)
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
        <PrivacyWrapper keyName="maskSettingsTitle" placeholder="•••••" inline>
          Settings
        </PrivacyWrapper>
      </h1>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
        <CardHeader>
          <CardTitle>Financial Configuration</CardTitle>
          <CardDescription>Adjust electricity prices and fallback values for cost calculations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="electric">Electric Price (TL/kWh)</Label>
            <PrivacyWrapper keyName="maskSettingsElectricPrice" placeholder="•••" inline>
              <Input
                id="electric"
                type={isMasked('maskSettingsElectricPrice') ? "password" : "text"}
                value={electricPrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setElectricPrice(e.target.value)}
              />
            </PrivacyWrapper>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wattage">Fallback Printer Wattage (W)</Label>
            <PrivacyWrapper keyName="maskSettingsFallbackWattage" placeholder="•••" inline>
              <Input
                id="wattage"
                type={isMasked('maskSettingsFallbackWattage') ? "password" : "text"}
                value={fallbackWattage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFallbackWattage(e.target.value)}
              />
            </PrivacyWrapper>
          </div>
          <div className="pt-2">
            <Button onClick={handleSave} disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Save className="w-4 h-4 mr-1.5" /> Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
        <CardHeader>
          <CardTitle>Cost Template</CardTitle>
          <CardDescription>Base formula: (Filament + Power) * 3</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground italic">
            The labor fee is automatically included by the 3x multiplier of production costs.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsPage = () => {
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/api/settings').then(res => res.data)
  });

  if (isLoading || !settings) return <SettingsSkeleton />;

  return <SettingsForm initialSettings={settings} />;
};

export default SettingsPage;
