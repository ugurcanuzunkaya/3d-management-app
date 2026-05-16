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
