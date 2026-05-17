export interface Model3D {
  id: number;
  name: string;
  estimated_weight_g: number;
  tech_details: {
    filament_type?: string;
    print_time_minutes?: number;
    nozzle_temp?: number;
    bed_temp?: number;
    dimensions?: string;
    [key: string]: unknown;
  };
  local_path?: string;
  source_url?: string;
}

export interface ModelExtractionResult {
  name: string;
  weight_g: number | null;
  filament_type: string | null;
  print_time_minutes: number | null;
  nozzle_temp: number | null;
  bed_temp: number | null;
  dimensions: string | null;
  tech_details: Record<string, string>;
}
