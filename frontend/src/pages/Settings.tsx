import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import api from '@/lib/api';
import { useState, useEffect } from 'react';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [electricPrice, setElectricPrice] = useState('0');
  const [fallbackWattage, setFallbackWattage] = useState('0');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/api/settings').then(res => res.data)
  });

  useEffect(() => {
    if (settings) {
      setElectricPrice(settings.electric_price.toString());
      setFallbackWattage(settings.fallback_wattage.toString());
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (newSettings: any) => api.post('/api/settings', newSettings),
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
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Financial Configuration</CardTitle>
          <CardDescription>Adjust electricity prices and fallback values for cost calculations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="electric">Electric Price (TL/kWh)</Label>
            <Input 
              id="electric" 
              type="number" 
              value={electricPrice} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setElectricPrice(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wattage">Fallback Printer Wattage (W)</Label>
            <Input 
              id="wattage" 
              type="number" 
              value={fallbackWattage} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFallbackWattage(e.target.value)} 
            />
          </div>
        </CardContent>
        <CardHeader className="pt-0">
          <Button onClick={handleSave} disabled={mutation.isPending}>
            <Save className="w-4 h-4 mr-1" /> Save Settings
          </Button>
        </CardHeader>
      </Card>
      
      <Card>
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

export default SettingsPage;
