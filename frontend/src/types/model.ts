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
