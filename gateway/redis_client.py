import redis
import redis
from config import REDIS_HOST, REDIS_PORT

r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True
)