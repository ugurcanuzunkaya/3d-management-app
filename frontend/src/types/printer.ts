export interface PrinterStatus {
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
  serial?: string;
  info?: { temp?: number };
  ams?: { ams?: Array<{ humidity_raw?: number; humidity?: number; temp?: number }> };
}

export interface Printer {
  id: number;
  name: string;
  ip_address: string;
  serial_number: string;
  access_code: string;
  is_active: boolean;
}
