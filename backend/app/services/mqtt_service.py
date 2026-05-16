import json
import logging
import os
import ssl
import paho.mqtt.client as mqtt
import time

logger = logging.getLogger(__name__)


class BambuMQTTService:
    def __init__(self):
        self.host = os.getenv("BAMBU_PRINTER_IP", "").strip()
        self.serial = os.getenv("BAMBU_PRINTER_SERIAL", "").strip()
        self.access_code = os.getenv("BAMBU_PRINTER_ACCESS_CODE", "").strip()
        self.client = mqtt.Client()
        self.client.username_pw_set("bblp", self.access_code)

        logger.info(
            f"Initializing MQTT for printer {self.host} (Serial: {self.serial})"
        )

        # Configure TLS to bypass certificate verification for local printer
        self.client.tls_set(cert_reqs=ssl.CERT_NONE)
        self.client.tls_insecure_set(True)

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.last_status = {}
        self.received_first_message = False

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Connected to Bambu Printer MQTT")
            # Subscribe to ALL topics for debugging
            self.client.subscribe("#")
            # Request all data immediately
            push_command = {"pushing": {"sequence_id": "0", "command": "pushall"}}
            self.client.publish(
                f"device/{self.serial}/request", json.dumps(push_command)
            )
            logger.info(f"Requested initial data push for serial {self.serial}")
        else:
            logger.error(f"Failed to connect to MQTT, rc: {rc}")

    def on_message(self, client, userdata, msg):
        try:
            current_time = time.time()
            payload = json.loads(msg.payload.decode())

            if "print" in payload:
                print_data = payload["print"]
                gcode_state = print_data.get("gcode_state")

                # Throttle processing to once per 60 seconds for general updates
                last_update = self.last_status.get("_internal_timestamp", 0)
                if current_time - last_update < 60:
                    return

                # Update in-memory status
                print_data["_internal_timestamp"] = current_time
                self.last_status.update(print_data)

                if not self.received_first_message:
                    logger.info(
                        f"Connected and received data from printer {self.serial}"
                    )
                    self.received_first_message = True

        except Exception as e:
            logger.error(f"Error parsing MQTT message: {e}")



    def manual_poll(self):
        if not self.host:
            return
        push_command = {"pushing": {"sequence_id": "0", "command": "pushall"}}
        self.client.publish(f"device/{self.serial}/request", json.dumps(push_command))
        logger.info(f"Manual poll requested for serial {self.serial}")

    def get_status(self):
        # Return last status with a timestamp of the update
        return {
            **self.last_status,
            "last_updated": time.time() if self.last_status else None,
        }

    def start(self):
        if not self.host:
            logger.warning("BAMBU_PRINTER_IP not set, skipping MQTT connection.")
            return
        self.client.connect(self.host, 8883, 60)
        self.client.loop_start()

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()
