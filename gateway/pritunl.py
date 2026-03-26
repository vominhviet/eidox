import time
import uuid
import hmac
import hashlib
import json
import requests
from config import *

def _auth_headers(method, path, body=""):
    timestamp = str(int(time.time()))
    nonce = str(uuid.uuid4())

    message = method + path + timestamp + nonce + body

    signature = hmac.new(
        API_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    return {
        "Auth-Token": API_TOKEN,
        "Auth-Timestamp": timestamp,
        "Auth-Nonce": nonce,
        "Auth-Signature": signature,
        "Content-Type": "application/json"
    }

def create_user(name):
    path = f"/user/{ORG_ID}"
    url = PRITUNL_BASE + path

    body = json.dumps({"name": name})
    headers = _auth_headers("POST", path, body)

    res = requests.post(url, headers=headers, data=body, verify=VERIFY_SSL)
    return res.json()

def get_ovpn(user_id):
    path = f"/key/{ORG_ID}/{user_id}.ovpn"
    url = PRITUNL_BASE + path

    headers = _auth_headers("GET", path)

    res = requests.get(url, headers=headers, verify=VERIFY_SSL)
    return res.text

def create_and_get_ovpn(name):
    user = create_user(name)
    user_id = user["id"]
    ovpn = get_ovpn(user_id)
    return user_id, ovpn