from fastapi import FastAPI
import threading
import mqtt_worker

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

# chạy MQTT worker song song
threading.Thread(target=mqtt_worker.start, daemon=True).start()