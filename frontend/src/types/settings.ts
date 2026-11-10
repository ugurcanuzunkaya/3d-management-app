export interface Settings {
  id?: number;
  electric_price: number;
  fallback_wattage: number;
  markup_multiplier?: number;
  machine_hourly_rate?: number;
  failure_rate_pct?: number;
  currency?: string;
}

export interface StockSettings {
  id?: number;
  default_price_per_kg: number;
  default_weight_g: number;
  low_stock_threshold?: number;
}
