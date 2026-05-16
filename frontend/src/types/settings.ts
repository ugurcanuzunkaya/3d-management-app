export interface Settings {
  electric_price: number;
  fallback_wattage: number;
}

export interface StockSettings {
  id?: number;
  default_price_per_kg: number;
  default_weight_g: number;
}
