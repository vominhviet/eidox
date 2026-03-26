import os
from dotenv import load_dotenv

load_dotenv()

PRITUNL_BASE = os.getenv("PRITUNL_BASE")
API_TOKEN = os.getenv("PRITUNL_TOKEN")
API_SECRET = os.getenv("PRITUNL_SECRET")
ORG_ID = os.getenv("PRITUNL_ORG")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

MQTT_HOST = os.getenv("MQTT_HOST", "mqtt")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))

VERIFY_SSL = False