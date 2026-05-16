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
SERIAL = os.getenv("BAMBU_PRINTER_SERIAL", "").strip()
ACCESS_CODE = os.getenv("BAMBU_PRINTER_ACCESS_CODE", "").strip()

# Wildcard is perfect for this diagnostic script to sniff everything
TOPIC = "#"

messages = []
DURATION = 2  # 2 seconds


def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        logger.info(f"Connected to printer at {HOST}")
        client.subscribe(TOPIC)

        push_command = {"pushing": {"sequence_id": "0", "command": "pushall"}}
        request_topic = f"device/{SERIAL}/request"
        client.publish(request_topic, json.dumps(push_command))

        logger.info(f"Sent pushall command to {request_topic}. Waiting for data...")
    else:
        logger.error(f"Failed to connect, return code {rc}")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        entry = {"timestamp": time.time(), "topic": msg.topic, "payload": payload}
        messages.append(entry)
        logger.info(f"Captured message from topic: {msg.topic}")
    except Exception as e:
        logger.error(f"Error decoding message on {msg.topic}: {e}")


def main():
    if not HOST or not ACCESS_CODE or not SERIAL:
        logger.error(
            "Missing BAMBU_PRINTER_IP, BAMBU_PRINTER_SERIAL, or BAMBU_PRINTER_ACCESS_CODE in .env"
        )
        return

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set("bblp", ACCESS_CODE)
    client.tls_set(cert_reqs=ssl.CERT_NONE)
    client.tls_insecure_set(True)

    client.on_connect = on_connect
    client.on_message = on_message

    logger.info(f"Starting 2-seconds capture from {HOST} (Serial: {SERIAL})...")
    client.connect(HOST, 8883, 60)
    client.loop_start()

    start_time = time.time()
    try:
        while time.time() - start_time < DURATION:
            remaining = int(DURATION - (time.time() - start_time))
            if remaining % 30 == 0:
                logger.info(
                    f"Time remaining: {remaining} seconds. Total messages captured: {len(messages)}"
                )
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Capture interrupted by user.")
    finally:
        client.loop_stop()
        client.disconnect()

        output_file = "printer_data_dump.json"
        with open(output_file, "w") as f:
            json.dump(messages, f, indent=2)

        logger.info(
            f"Capture complete. Saved {len(messages)} messages to {output_file}"
        )

        # Parse and list unique keys caught in the payload
        all_keys = set()
        captured_topics = set()
        for m in messages:
            captured_topics.add(m["topic"])
            if isinstance(m["payload"], dict):
                print_obj = m["payload"].get("print", {})
                if isinstance(print_obj, dict):
                    all_keys.update(print_obj.keys())

        print("\n--- Captured MQTT Topics ---")
        for t in sorted(captured_topics):
            print(f"- {t}")

        print("\n--- Available Data Fields under payload -> 'print' ---")
        for key in sorted(all_keys):
            print(f"- {key}")


if __name__ == "__main__":
    main()
