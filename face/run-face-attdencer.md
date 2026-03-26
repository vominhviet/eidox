# 1 Face attdencer
-  sẽ có 2 phần:
  
    + Phần chạy AI : hub.eidox.ai/ai/ds-aiview:2.1.3
    + Phần chạy App-boxai: hub.eidox.ai/ai/faceidapp_box:3.0.5
   
    ## 1.1 Cách chạy phần container AI:
   
   * comment file ssl của kafka khi không có ssl của kafka server nếu không cmt thì chạy sẽ lỗi **path**: data/config
     ### lệnh chạy:
   ```
    docker run -d   --name ds_coreai   --network host   --privileged   --runtime=nvidia   -e DISPLAY=:0   -e QT_X11_NO_MITSHM=1   -v /tmp/.X11-unix:/tmp/.X11-unix   -e CONFIG='{"list_camera":[{"cam_info":{"url":"rtsp://admin:eidox.ai2026@192.168.100.112:5552/","cam_id":"1"},"config":{"cf1":"v1", "usage":"customer", "user_id":"3BFFB93A-6F74-4C8B-A6C5-F03064BAA684", "udp":true}}]}'   -e BOX_ID=AF74FCE6-0790-4B69-9F47-7A0F4E152C6D   -e BOOTSTRAP_SERVER="gateway-1.hn.eidox.ai;9093"   -e SEARCH_TOPIC=production-gatewayhn-searching   -e HEALTHCHECK_TOPIC=product-gatewayhn-alert   -v /dev/video1:/dev/video1   --pull=missing   hub.eidox.ai/ai/ds-aiview:2.1.3
   ```
    ## 1.2 Cách chạy phần App-boxai:
   * Đây là phần hiển thị face trên màn hình box khi cắm màn DISPLAY=:0
```
  docker run -d \
  --name faceidapp \
  --restart always \
  --network host \
  --privileged \
  -e DISPLAY=":0" \
  -e BOX_ID="7e2c9b4a-5d13-4f8e-a6c1-9b3d2f7a6e55" \
  -e KAFKA_BROKER="gateway-1.hn.eidox.ai:9094" \
  -e KAFKA_TOPIC="product-gatewayhn-faceid" \
  -e CA_LOCATION="/certs/ca-root" \
  -e CERT_LOCATION="/certs/ca-cert" \
  -e KEY_LOCATION="/certs/ca-key" \
  -e APP="customer" \
  --device /dev/video1:/dev/video1 \
  --device /dev/video2:/dev/video2 \
  -v /certs:/certs \
  -v /tmp/tmpsock:/tmp/tmpsock \
  --pull=never \
  hub.eidox.ai/ai/faceidapp_box:3.0.5
```
  
