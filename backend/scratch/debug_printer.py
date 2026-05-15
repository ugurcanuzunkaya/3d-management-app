import json
import logging
import os
import ssl
import time
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

load_dotenv()

HOST = os.getenv("BAMBU_PRINTER_IP", "").strip()
ACCESS_CODE = os.getenv("BAMBU_PRINTER_ACCESS_CODE", "").strip()
# Use a wildcard to see everything
TOPIC = "#"

messages = []
start_time = time.time()
DURATION = 300  # 5 minutes


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info(f"Connected to printer at {HOST}")
        client.subscribe(TOPIC)
        # Request data push
        push_command = {"pushing": {"sequence_id": "0", "command": "pushall"}}
        client.publish(
            "device/request", json.dumps(push_command)
        )  # Generic request topic or try serial-specific if we find it
        logger.info("Sent pushall command. Waiting for messages...")
    else:
        logger.error(f"Failed to connect, return code {rc}")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        entry = {"timestamp": time.time(), "topic": msg.topic, "payload": payload}
        messages.append(entry)
        logger.info(f"Captured message from {msg.topic}")
    except Exception as e:
        logger.error(f"Error decoding message on {msg.topic}: {e}")


def main():
    if not HOST or not ACCESS_CODE:
        logger.error("BAMBU_PRINTER_IP or BAMBU_PRINTER_ACCESS_CODE not found in .env")
        return

    client = mqtt.Client()
    client.username_pw_set("bblp", ACCESS_CODE)
    client.tls_set(cert_reqs=ssl.CERT_NONE)
    client.tls_insecure_set(True)

    client.on_connect = on_connect
    client.on_message = on_message

    logger.info(f"Starting 5-minute capture from {HOST}...")
    client.connect(HOST, 8883, 60)
    client.loop_start()

    try:
        while time.time() - start_time < DURATION:
            remaining = int(DURATION - (time.time() - start_time))
            if remaining % 30 == 0:
                logger.info(
                    f"Time remaining: {remaining} seconds. Messages captured: {len(messages)}"
                )
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopped by user.")
    finally:
        client.loop_stop()
        client.disconnect()

        output_file = "printer_data_dump.json"
        with open(output_file, "w") as f:
            json.dump(messages, f, indent=2)

        logger.info(
            f"Capture complete. Saved {len(messages)} messages to {output_file}"
        )

        # Also create a summary of keys found
        all_keys = set()
        for m in messages:
            if isinstance(m["payload"], dict):
                for k, v in m["payload"].items():
                    if k == "print" and isinstance(v, dict):
                        all_keys.update(v.keys())

        print("\n--- Available Data Fields in 'print' object ---")
        for key in sorted(all_keys):
            print(f"- {key}")


if __name__ == "__main__":
    main()
