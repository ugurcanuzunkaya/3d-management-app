import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, Scale, AlertTriangle, Coins } from 'lucide-react';
import type { Filament } from '@/types';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

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
      {/* Total Filaments Card */}
      <Card className="group relative overflow-hidden transition-all duration-300 border-l-4 border-l-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 bg-white dark:bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-indigo-950/70 dark:text-indigo-200/70">Total Filaments</CardTitle>
          <Box className="h-4 w-4 text-indigo-500 transition-transform duration-300 group-hover:scale-110" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-950 dark:text-indigo-50">
            <PrivacyWrapper keyName="maskStockStats" placeholder="••" inline>
              {filaments.length}
            </PrivacyWrapper>
          </div>
          <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70 mt-1">
            <PrivacyWrapper keyName="maskStockStats" placeholder="•• Sealed, •• Opened" inline>
              {sealedCount} Sealed, {openedCount} Opened
            </PrivacyWrapper>
          </p>
        </CardContent>
      </Card>

      {/* Total Weight Card */}
      <Card className="group relative overflow-hidden transition-all duration-300 border-l-4 border-l-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:-translate-y-0.5 bg-white dark:bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-emerald-950/70 dark:text-emerald-200/70">Total Weight</CardTitle>
          <Scale className="h-4 w-4 text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">
            <PrivacyWrapper keyName="maskStockStats" placeholder="••" inline>
              {(totalWeightG / 1000).toFixed(2)}{' '}
              <span className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80">kg</span>
            </PrivacyWrapper>
          </div>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-300/70 mt-1">Across all spools</p>
        </CardContent>
      </Card>

      {/* Low Stock Card */}
      <Card className={`group relative overflow-hidden transition-all duration-300 border-l-4 ${
        lowStockCount > 0 
          ? 'border-l-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.12)]' 
          : 'border-l-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.12)]'
      } hover:-translate-y-0.5 bg-white dark:bg-zinc-900`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className={`text-sm font-medium ${
            lowStockCount > 0 ? 'text-red-950/70 dark:text-red-200/70' : 'text-amber-950/70 dark:text-amber-200/70'
          }`}>Low Stock</CardTitle>
          <AlertTriangle className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${
            lowStockCount > 0 ? 'text-red-500 animate-pulse' : 'text-amber-500'
          }`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            lowStockCount > 0 ? 'text-red-950 dark:text-red-50' : 'text-amber-950 dark:text-amber-50'
          }`}>
            <PrivacyWrapper keyName="maskStockStats" placeholder="••" inline>
              {lowStockCount}
            </PrivacyWrapper>
          </div>
          <p className={`text-xs mt-1 ${
            lowStockCount > 0 ? 'text-red-600/70 dark:text-red-300/70' : 'text-amber-600/70 dark:text-amber-300/70'
          }`}>Below 200g remaining</p>
        </CardContent>
      </Card>

      {/* Inventory Value Card */}
      <Card className="group relative overflow-hidden transition-all duration-300 border-l-4 border-l-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.12)] hover:-translate-y-0.5 bg-white dark:bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-cyan-950/70 dark:text-cyan-200/70">Inventory Value</CardTitle>
          <Coins className="h-4 w-4 text-cyan-500 transition-transform duration-300 group-hover:scale-110" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-950 dark:text-cyan-50">
            <PrivacyWrapper keyName="maskInventoryValue" placeholder="•••••• TL" inline>
              {inventoryValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
            </PrivacyWrapper>
          </div>
          <p className="text-xs text-cyan-600/70 dark:text-cyan-300/70 mt-1">Estimated total value</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockSummary;
