import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

const FilamentStock = () => {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['filaments'],
    queryFn: () => api.get('/api/filaments').then(res => res.data)
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Filament Stock</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filaments?.map((filament: any) => (
          <Card key={filament.id} className="overflow-hidden">
            <div className="h-2 w-full" style={{ backgroundColor: filament.color.toLowerCase() }}></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{filament.name}</CardTitle>
                <Badge variant={filament.is_opened ? "default" : "outline"}>
                  {filament.is_opened ? "Opened" : "Sealed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-bold">{filament.remaining_weight_g}g</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all" 
                    style={{ width: `${Math.min(100, (filament.remaining_weight_g / 1000) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-4">
                  <span>Type: {filament.type}</span>
                  <span>Price: {filament.price_per_kg}TL/kg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FilamentStock;
