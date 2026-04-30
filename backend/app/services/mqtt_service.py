import json
import logging
import os
from datetime import datetime
import paho.mqtt.client as mqtt
from sqlmodel import Session, select
from ..database import engine
from ..models import PrintJob, Filament, Model3D, Settings

logger = logging.getLogger(__name__)

class BambuMQTTService:
    def __init__(self):
        self.host = os.getenv("BAMBU_PRINTER_IP")
        self.serial = os.getenv("BAMBU_PRINTER_SERIAL")
        self.access_code = os.getenv("BAMBU_PRINTER_ACCESS_CODE")
        self.client = mqtt.Client()
        self.client.username_pw_set("bblp", self.access_code)
        self.client.tls_set() # Bambu uses TLS
        self.client.tls_insecure_set(True)
        
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Connected to Bambu Printer MQTT")
            self.client.subscribe(f"device/{self.serial}/report")
        else:
            logger.error(f"Failed to connect to MQTT, rc: {rc}")

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            if "print" in payload:
                print_data = payload["print"]
                gcode_state = print_data.get("gcode_state")
                
                if gcode_state == "FINISH":
                    self.handle_print_finish(print_data)
        except Exception as e:
            logger.error(f"Error parsing MQTT message: {e}")

    def handle_print_finish(self, data):
        with Session(engine) as session:
            # Create a pending PrintJob based on report data
            job = PrintJob(
                duration_minutes=data.get("mc_remaining_time", 0), # Or calculate from start
                used_filament_g=data.get("filament_used_g", 0.0),
                power_usage_kwh=0.0, # Placeholder, will use real-time if available
                status="pending"
            )
            session.add(job)
            session.commit()
            logger.info(f"New pending print job created from MQTT for serial {self.serial}")

    def start(self):
        if not self.host:
            logger.warning("BAMBU_PRINTER_IP not set, skipping MQTT connection.")
            return
        self.client.connect(self.host, 8883, 60)
        self.client.loop_start()

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()
