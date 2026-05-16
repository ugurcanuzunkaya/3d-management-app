import type { Filament } from "./filament";

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

export interface PrintJobCreate {
  name: string;
  job_type: string;
  model_id?: number | null;
  duration_minutes: number;
  total_cost: number;
  production_cost: number;
  filaments: JobFilament[];
}
