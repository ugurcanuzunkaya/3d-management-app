import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calculator, Trash2 } from 'lucide-react';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

export interface CustomCostRow {
  name: string;
  value: number;
}

export interface CostBreakdown {
  filamentCost: number;
  electricityCost: number;
  machineWearCost: number;
  failureBufferCost: number;
  productionCost: number;
  customCostsTotal: number;
  suggestedPrice: number;
}

export const CostBreakdownPanel: React.FC<{
  breakdown: CostBreakdown;
  displayedPrice: number;
}> = ({ breakdown, displayedPrice }) => {
  const netProfit = displayedPrice - breakdown.productionCost - breakdown.customCostsTotal;
  return (
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Calculated Production Cost
            </p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
              <PrivacyWrapper keyName="maskJobProductionCost" placeholder="•••.••" inline>
                ₺{breakdown.productionCost.toFixed(2)}
              </PrivacyWrapper>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Net Profit
          </p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            <PrivacyWrapper keyName="maskJobProfit" placeholder="•••.••" inline>
              ₺{netProfit.toFixed(2)}
            </PrivacyWrapper>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground border-t border-blue-200/50 dark:border-blue-800/50 pt-2">
        <span>Filament: ₺{breakdown.filamentCost.toFixed(2)}</span>
        <span>Power: ₺{breakdown.electricityCost.toFixed(2)}</span>
        <span>Wear/Risk: ₺{(breakdown.machineWearCost + breakdown.failureBufferCost).toFixed(2)}</span>
      </div>
    </div>
  );
};

export const CustomCostsSection: React.FC<{
  customCosts: CustomCostRow[];
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<CustomCostRow>) => void;
  onRemove: (idx: number) => void;
}> = ({ customCosts, onAdd, onUpdate, onRemove }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-semibold">Extra Costs (Packaging, Hardware, Labor)</Label>
      <Button type="button" variant="outline" size="sm" onClick={onAdd} className="h-7 text-xs gap-1">
        <Plus className="w-3 h-3" /> Add Extra Cost
      </Button>
    </div>
    {customCosts.map((c, idx) => (
      <div key={idx} className="flex items-center gap-2">
        <Input
          placeholder="Label (e.g. Box)"
          aria-label={`Extra cost name ${idx}`}
          value={c.name}
          onChange={e => onUpdate(idx, { name: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          type="number"
          step="0.5"
          aria-label={`Extra cost value ${idx}`}
          value={c.value}
          onChange={e => onUpdate(idx, { value: parseFloat(e.target.value) || 0 })}
          className="w-28 h-8 text-xs"
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(idx)} className="h-8 w-8 text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    ))}
  </div>
);
