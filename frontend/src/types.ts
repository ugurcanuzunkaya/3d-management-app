export interface FilamentType {
  id: number;
  name: string;
  is_custom: boolean;
}

export interface FilamentColor {
  id: number;
  name: string;
  hex_code: string;
}

export interface Filament {
  id: number;
  name: string;
  type_id: number | null;
  color_id: number | null;
  series_id: number | null;
  price_per_kg: number;
  remaining_weight_g: number;
  is_opened: boolean;
  notes: string | null;
  filament_type: FilamentType | null;
  filament_color: FilamentColor | null;
}

export interface Model3D {
  id: number;
  name: string;
  estimated_weight_g: number;
  tech_details: {
    filament_type?: string;
    [key: string]: string | number | boolean | null | undefined | object;
  };
  local_path?: string;
  source_url?: string;
}

export interface JobFilament {
  filament_id: number;
  grams_used: number;
}

export interface PrintJob {
  id: number;
  name: string;
  job_type: string;
  duration_minutes: number;
  total_cost: number;
  production_cost: number;
  status: string;
  created_at: string;
  filaments?: Filament[];
  job_filaments?: JobFilament[];
}

export interface Settings {
  electric_price: number;
  fallback_wattage: number;
}

export interface StockSettings {
  id?: number;
  default_price_per_kg: number;
  default_weight_g: number;
}
