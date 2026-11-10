export interface AmsTrayInfo {
  id?: string;
  tray_type?: string;
  tray_color?: string;
  tray_weight?: string;
  remain?: number;
  tag_uid?: string;
  nozzle_temp_min?: string;
  nozzle_temp_max?: string;
}

export interface AmsUnitInfo {
  id?: string;
  humidity_raw?: number | string;
  humidity?: number | string;
  temp?: number | string;
  dry_time?: number;
  tray?: AmsTrayInfo[];
}

export interface SlotFilamentSummary {
  id: number;
  name: string;
  brand?: string | null;
  remaining_weight_g: number;
  price_per_kg: number;
  color_name: string;
  color_hex: string;
  type_name: string;
  is_low_stock: boolean;
}

export interface SlotAmsTelemetry {
  tray_type: string;
  tray_color: string;
  nozzle_temp_min: number;
  nozzle_temp_max: number;
  is_active_tray: boolean;
  humidity_raw?: string | null;
  ams_temp?: string | null;
  dry_time: number;
}

export interface PrinterSlot {
  slot_index: number;
  slot_type: 'ams' | 'external';
  slot_label: string;
  filament_id?: number | null;
  filament?: SlotFilamentSummary | null;
  ams_telemetry: SlotAmsTelemetry;
}

export interface PrinterStatus {
  last_updated?: number | null;
  gcode_state?: string;
  percent?: number;
  remain_time?: number;
  layer_num?: number;
  total_layer_num?: number;
  nozzle_temper?: number;
  nozzle_target_temper?: number;
  bed_temper?: number;
  bed_target_temper?: number;
  chamber_temper?: number;
  spd_lvl?: number;
  spd_mag?: number;
  nozzle_type?: string;
  nozzle_diameter?: string;
  subtask_name?: string;
  serial?: string;
  info?: { temp?: number };
  device?: { ctc?: { info?: { temp?: number } } };
  ams?: { ams?: AmsUnitInfo[]; tray_now?: string };
  vir_slot?: AmsTrayInfo[];
  vt_tray?: AmsTrayInfo;
  slots?: PrinterSlot[];
  online?: { ahb?: boolean; version?: number } | boolean;
}

export interface Printer {
  id: number;
  name: string;
  ip_address: string;
  serial_number: string;
  access_code: string;
  is_active: boolean;
}
