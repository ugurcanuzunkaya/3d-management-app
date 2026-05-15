import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, Scale, AlertTriangle } from 'lucide-react';
import type { Filament } from '@/types';

interface StockSummaryProps {
  filaments: Filament[];
}

const StockSummary = ({ filaments }: StockSummaryProps) => {
  const totalWeightG = filaments.reduce((acc, f) => acc + f.remaining_weight_g, 0);
  const lowStockCount = filaments.filter(f => f.remaining_weight_g < 200).length;
  const inventoryValue = filaments.reduce((acc, f) => acc + (f.remaining_weight_g / 1000) * f.price_per_kg, 0);
  const sealedCount = filaments.filter(f => !f.is_opened).length;
  const openedCount = filaments.filter(f => f.is_opened).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Filaments</CardTitle>
          <Box className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filaments.length}</div>
          <p className="text-xs text-muted-foreground">
            {sealedCount} Sealed, {openedCount} Opened
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(totalWeightG / 1000).toFixed(2)} kg</div>
          <p className="text-xs text-muted-foreground">Across all spools</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockCount}</div>
          <p className="text-xs text-muted-foreground">Below 200g remaining</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          <div className="text-xs font-bold text-muted-foreground">TL</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inventoryValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground">Estimated total value</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockSummary;
