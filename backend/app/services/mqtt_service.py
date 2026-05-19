import json
import logging
import ssl
import time
from typing import Dict
import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)


class PrinterConnection:
    def __init__(self, printer_id: int, host: str, serial: str, access_code: str):
        self.printer_id = printer_id
        self.host = host.strip()
        self.serial = serial.strip()
        self.access_code = access_code.strip()
        self.client = mqtt.Client()
        self.client.username_pw_set("bblp", self.access_code)

        # Configure TLS to bypass certificate verification for local printer
        self.client.tls_set(cert_reqs=ssl.CERT_NONE)
        self.client.tls_insecure_set(True)

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.last_status: Dict = {}
        self.received_first_message = False
        self.last_request_time = 0.0

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info(
                f"Connected to Bambu Printer MQTT for ID {self.printer_id} ({self.serial})"
            )
            self.client.subscribe("#")
            push_command = {"pushing": {"sequence_id": "0", "command": "pushall"}}
            self.client.publish(
                f"device/{self.serial}/request", json.dumps(push_command)
            )
            self.last_request_time = time.time()
        else:
            logger.error(
                f"Failed to connect to MQTT for printer ID {self.printer_id}, rc: {rc}"
            )

    def on_message(self, client, userdata, msg):
        try:
            current_time = time.time()
            payload = json.loads(msg.payload.decode())

            if "print" in payload:
                print_data = payload["print"]

                # Throttle processing to once per 5 seconds
                last_update = self.last_status.get("_internal_timestamp", 0)
                if current_time - last_update < 5:
                    return

                print_data["_internal_timestamp"] = current_time
                self.last_status.update(print_data)

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

        status_data = {**self.last_status}

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
    def __init__(self):
        self.connections: Dict[int, PrinterConnection] = {}
        self.is_running = False

    def register_printer(
        self, printer_id: int, host: str, serial: str, access_code: str
    ):
        if printer_id in self.connections:
            self.unregister_printer(printer_id)

        conn = PrinterConnection(printer_id, host, serial, access_code)
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
