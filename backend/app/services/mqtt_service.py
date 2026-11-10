import copy
import json
import logging
import ssl
import threading
import time
from typing import Any, Callable, Dict, Optional
import paho.mqtt.client as mqtt
from sqlmodel import Session
from app.database import engine
from app.services.job_service import JobService

logger = logging.getLogger(__name__)


def _deep_merge(target: Dict[str, Any], source: Dict[str, Any]) -> Dict[str, Any]:
    for key, value in source.items():
        if key in target and isinstance(target[key], dict) and isinstance(value, dict):
            _deep_merge(target[key], value)
        else:
            target[key] = copy.deepcopy(value)
    return target


class PrinterConnection:
    def __init__(
        self,
        printer_id: int,
        host: str,
        serial: str,
        access_code: str,
        session_factory: Optional[Callable[[], Session]] = None,
    ):
        self.printer_id = printer_id
        self.host = host.strip()
        self.serial = serial.strip()
        self.access_code = access_code.strip()
        self.session_factory = session_factory
        self._lock = threading.Lock()
        callback_api = getattr(mqtt, "CallbackAPIVersion", None)
        if callback_api is not None:
            self.client = mqtt.Client(callback_api.VERSION2)
        else:
            self.client = mqtt.Client()
        self.client.username_pw_set("bblp", self.access_code)

        # Configure TLS to bypass certificate verification for local printer
        self.client.tls_set(cert_reqs=ssl.CERT_NONE)
        self.client.tls_insecure_set(True)

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.last_status: Dict[str, Any] = {}
        self.received_first_message = False
        self.last_request_time = 0.0

    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            logger.info(
                f"Connected to Bambu Printer MQTT for ID {self.printer_id} ({self.serial})"
            )
            self.client.subscribe(f"device/{self.serial}/report")
            push_command = {"pushing": {"sequence_id": "0", "command": "pushall"}}
            self.client.publish(
                f"device/{self.serial}/request", json.dumps(push_command)
            )
            self.last_request_time = time.time()
        else:
            logger.error(
                f"Failed to connect to MQTT for printer ID {self.printer_id}, rc: {rc}"
            )

    def _handle_print_finished(self, status_snapshot: Dict[str, Any]) -> None:
        try:
            if self.session_factory is not None:
                sess = self.session_factory()
                JobService.create_pending_job_from_mqtt(
                    sess, self.printer_id, status_snapshot
                )
            else:
                with Session(engine) as sess:
                    JobService.create_pending_job_from_mqtt(
                        sess, self.printer_id, status_snapshot
                    )
        except Exception as e:
            logger.error(
                f"Error creating pending print job for printer ID {self.printer_id}: {e}"
            )

    def on_message(self, client, userdata, msg):
        try:
            current_time = time.time()
            payload = json.loads(msg.payload.decode())

            if isinstance(payload, dict) and isinstance(payload.get("print"), dict):
                print_data = payload["print"]
                status_snapshot: Optional[Dict[str, Any]] = None
                with self._lock:
                    prev_state = self.last_status.get("gcode_state")
                    _deep_merge(self.last_status, print_data)
                    self.last_status["_internal_timestamp"] = current_time
                    new_state = self.last_status.get("gcode_state")
                    if (
                        prev_state in ("RUNNING", "PAUSE", "PREPARE")
                        and new_state == "FINISH"
                    ):
                        status_snapshot = copy.deepcopy(self.last_status)

                if status_snapshot is not None:
                    self._handle_print_finished(status_snapshot)

                if not self.received_first_message:
                    logger.info(
                        f"Connected and received data from printer ID {self.printer_id} ({self.serial})"
                    )
                    self.received_first_message = True

        except Exception as e:
            logger.error(
                f"Error parsing MQTT message for printer ID {self.printer_id}: {e}"
            )

    def manual_poll(self):
        if not self.host:
            return
        self.last_request_time = time.time()
        push_command = {"pushing": {"sequence_id": "0", "command": "pushall"}}
        self.client.publish(f"device/{self.serial}/request", json.dumps(push_command))
        logger.info(
            f"Manual poll requested for printer ID {self.printer_id} ({self.serial})"
        )

    def set_ams_filament_setting(
        self,
        slot_index: int,
        tray_type: str,
        tray_color_hex: str,
        nozzle_temp_min: int = 190,
        nozzle_temp_max: int = 240,
    ) -> None:
        clean_hex = tray_color_hex.lstrip("#").upper()
        if len(clean_hex) == 6:
            clean_hex = f"{clean_hex}FF"
        elif len(clean_hex) != 8:
            clean_hex = "FFFFFFFF"

        ams_id = 255 if slot_index == 254 else 0
        command_payload = {
            "print": {
                "sequence_id": "0",
                "command": "ams_filament_setting",
                "ams_id": ams_id,
                "tray_id": slot_index,
                "tray_info_idx": "GFL99",
                "tray_color": clean_hex,
                "nozzle_temp_min": nozzle_temp_min,
                "nozzle_temp_max": nozzle_temp_max,
                "tray_type": tray_type or "PLA",
            }
        }
        self.client.publish(
            f"device/{self.serial}/request", json.dumps(command_payload)
        )
        logger.info(
            f"Published ams_filament_setting for printer ID {self.printer_id} slot {slot_index}"
        )

    def get_status(self):
        current_time = time.time()

        # Check connection status (supporting mock client in tests)
        try:
            is_connected = self.client.is_connected()
            if not isinstance(is_connected, bool):
                is_connected = getattr(self.client.is_connected, "return_value", True)
                if not isinstance(is_connected, bool):
                    is_connected = True
        except Exception:
            is_connected = False

        with self._lock:
            status_data = copy.deepcopy(self.last_status)

        # Normalize Bambu Lab P2S nested telemetry fields
        if status_data.get("chamber_temper") is None:
            ctc_temp = (
                status_data.get("device", {}).get("ctc", {}).get("info", {}).get("temp")
                if isinstance(status_data.get("device"), dict)
                else None
            )
            info_temp = (
                status_data.get("info", {}).get("temp")
                if isinstance(status_data.get("info"), dict)
                else None
            )
            resolved_chamber = ctc_temp if ctc_temp is not None else info_temp
            if resolved_chamber is not None:
                status_data["chamber_temper"] = resolved_chamber

        three_d = status_data.get("3D")
        if isinstance(three_d, dict):
            if status_data.get("layer_num") is None and "layer_num" in three_d:
                status_data["layer_num"] = three_d["layer_num"]
            if (
                status_data.get("total_layer_num") is None
                and "total_layer_num" in three_d
            ):
                status_data["total_layer_num"] = three_d["total_layer_num"]

        vir_slot = status_data.get("vir_slot")
        if (
            "vt_tray" not in status_data
            and isinstance(vir_slot, list)
            and len(vir_slot) > 0
            and isinstance(vir_slot[0], dict)
        ):
            status_data["vt_tray"] = vir_slot[0]

        # Determine offline status based on connection, request-response timeouts, and telemetry data
        is_offline = False

        if not is_connected:
            is_offline = True
        elif not self.received_first_message:
            # If we connected but haven't received anything yet, check if we've been waiting too long
            if self.last_request_time > 0 and (
                current_time - self.last_request_time > 10.0
            ):
                is_offline = True
        else:
            # We received messages before. Let's check if the telemetry is stale or if we requested status and got no response
            last_ts = self.last_status.get("_internal_timestamp", 0)
            if current_time - last_ts > 300.0:  # 5 minutes stale
                is_offline = True
            elif self.last_request_time > last_ts and (
                current_time - self.last_request_time > 15.0
            ):
                # We sent a poll request, but haven't received any update in 15 seconds
                is_offline = True

            # Check the printer's own reported online status if available
            if not is_offline and "online" in self.last_status:
                online_val = self.last_status["online"]
                if isinstance(online_val, dict):
                    if not online_val.get("ahb", True):
                        is_offline = True
                elif isinstance(online_val, bool):
                    if not online_val:
                        is_offline = True

        if is_offline:
            status_data["online"] = {"ahb": False}
            status_data["gcode_state"] = "OFFLINE"
        else:
            if "online" not in status_data:
                status_data["online"] = {"ahb": True}

        status_data["last_updated"] = (
            self.last_status.get("_internal_timestamp") if self.last_status else None
        )
        return status_data

    def start(self):
        if not self.host:
            logger.warning(
                f"No IP host configured for printer ID {self.printer_id}, skipping connection."
            )
            return
        self.last_request_time = time.time()
        try:
            self.client.connect_async(self.host, 8883, 60)
            self.client.loop_start()
        except Exception as e:
            logger.error(
                f"Failed to start async connection to printer ID {self.printer_id}: {e}"
            )

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()


class BambuMQTTService:
    def __init__(self, session_factory: Optional[Callable[[], Session]] = None):
        self.connections: Dict[int, PrinterConnection] = {}
        self.is_running = False
        self.session_factory = session_factory

    def register_printer(
        self, printer_id: int, host: str, serial: str, access_code: str
    ):
        if printer_id in self.connections:
            self.unregister_printer(printer_id)

        conn = PrinterConnection(
            printer_id,
            host,
            serial,
            access_code,
            session_factory=self.session_factory,
        )
        self.connections[printer_id] = conn
        if self.is_running:
            try:
                conn.start()
            except Exception as e:
                logger.error(f"Error starting printer ID {printer_id}: {e}")

    def unregister_printer(self, printer_id: int):
        conn = self.connections.pop(printer_id, None)
        if conn:
            try:
                conn.stop()
            except Exception as e:
                logger.error(f"Error stopping printer ID {printer_id}: {e}")

    def get_status(self, printer_id: int) -> Dict:
        conn = self.connections.get(printer_id)
        if conn:
            return conn.get_status()
        return {}

    def get_all_statuses(self) -> Dict[int, Dict]:
        return {p_id: conn.get_status() for p_id, conn in self.connections.items()}

    def manual_poll(self, printer_id: int):
        conn = self.connections.get(printer_id)
        if conn:
            conn.manual_poll()

    def set_ams_filament_setting(
        self,
        printer_id: int,
        slot_index: int,
        tray_type: str,
        tray_color_hex: str,
        nozzle_temp_min: int = 190,
        nozzle_temp_max: int = 240,
    ) -> None:
        conn = self.connections.get(printer_id)
        if conn:
            conn.set_ams_filament_setting(
                slot_index=slot_index,
                tray_type=tray_type,
                tray_color_hex=tray_color_hex,
                nozzle_temp_min=nozzle_temp_min,
                nozzle_temp_max=nozzle_temp_max,
            )

    def manual_poll_all(self):
        for conn in self.connections.values():
            try:
                conn.manual_poll()
            except Exception as e:
                logger.error(f"Error polling printer ID {conn.printer_id}: {e}")

    def start(self):
        self.is_running = True
        for conn in self.connections.values():
            try:
                conn.start()
            except Exception as e:
                logger.error(f"Error starting printer ID {conn.printer_id}: {e}")

    def stop(self):
        self.is_running = False
        for p_id in list(self.connections.keys()):
            self.unregister_printer(p_id)
