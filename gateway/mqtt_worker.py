import json
import time
import paho.mqtt.client as mqtt
from redis_client import r
import pritunl
from config import MQTT_HOST, MQTT_PORT

REGISTER_TOPIC = "device/register"

def build_name(device_id):
    return f"cam_{device_id}"

# 🔒 lock chống tạo trùng user
def acquire_lock(device_id, ttl=5):
    key = f"lock:vpn:{device_id}"
    if r.setnx(key, 1):
        r.expire(key, ttl)
        return True
    return False

def release_lock(device_id):
    r.delete(f"lock:vpn:{device_id}")

def handle_register(device_id, client):
    name = build_name(device_id)

    try:
        # 🔹 1. check Redis cache
        user_id = r.get(f"vpn:user:{device_id}")
        ovpn = r.get(f"vpn:ovpn:{device_id}")

        if not user_id or not ovpn:
            # 🔒 lock tránh race condition
            if not acquire_lock(device_id):
                print(f"[LOCK] Device {device_id} is being processed")
                return

            try:
                print(f"[CREATE] Creating VPN for {device_id}")
                user_id, ovpn = pritunl.create_and_get_ovpn(name)

                # lưu Redis với TTL (1 ngày)
                r.set(f"vpn:user:{device_id}", user_id, ex=86400)
                r.set(f"vpn:ovpn:{device_id}", ovpn, ex=86400)

            finally:
                release_lock(device_id)

        else:
            print(f"[CACHE] Found VPN for {device_id}")

        # 🔹 2. publish config
        topic = f"vpn/config/{device_id}"
        payload = json.dumps({
            "username": name,
            "ovpn": ovpn
        })

        client.publish(topic, payload, qos=1)
        print(f"[PUBLISH] Sent VPN config to {device_id}")

    except Exception as e:
        print(f"[ERROR] {device_id}: {e}")

# 📡 MQTT callback
def on_connect(client, userdata, flags, rc):
    print(f"[MQTT] Connected with code {rc}")
    client.subscribe(REGISTER_TOPIC, qos=1)

def on_message(client, userdata, msg):
    try:
        if msg.topic == REGISTER_TOPIC:
            data = json.loads(msg.payload.decode())
            device_id = data.get("device_id")

            if not device_id:
                print("[WARN] Missing device_id")
                return

            handle_register(device_id, client)

    except Exception as e:
        print(f"[MQTT ERROR] {e}")

def on_disconnect(client, userdata, rc):
    print("[MQTT] Disconnected. Reconnecting...")
    while True:
        try:
            client.reconnect()
            break
        except:
            time.sleep(2)

# 🚀 start worker
def start():
    client = mqtt.Client()

    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect

    client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)

    client.loop_forever()