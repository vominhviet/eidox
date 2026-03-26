import json
import paho.mqtt.client as mqtt
import os

DEVICE_ID = "jetson_01"

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT")

    client.subscribe(f"vpn/config/{DEVICE_ID}")

    # gửi register
    client.publish("device/register", json.dumps({
        "device_id": DEVICE_ID
    }))

def on_message(client, userdata, msg):
    print("Received VPN config")

    data = json.loads(msg.payload.decode())
    ovpn = data["ovpn"]

    path = "/etc/openvpn/client.ovpn"

    with open(path, "w") as f:
        f.write(ovpn)

    print("Saved ovpn file")

    # restart VPN
    os.system("systemctl restart openvpn-client@client")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect("YOUR_GATEWAY_IP", 1883)
client.loop_forever()