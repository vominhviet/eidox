# HƯỚNG DẪN CÀI ĐẶT FACE ATTENDANCE


# 1. THÔNG TIN IMAGE:
-------------------------------------------------------------
- AI Core:  hub.eidox.ai/ai/ds-aiview:2.1.3
- App Box:  hub.eidox.ai/ai/faceidapp_box:3.0.10


# 2. RUN CONTAINER
## PHẦN 1: CONTAINER AI (coreai)
-------------------------------------------------------------
* Lưu ý: Nếu không dùng SSL cho Kafka, hãy comment cấu hình SSL 
  trong file tại đường dẫn: data/config
* Lưu ý: Cần thay thế chính xác BOX_ID, Camera_ID, User_ID **( công thức user_id : a + uuid _ )**
* Lưu ý: nếu chạy **customer **"usage:customer"**** / chạy **attendace : "usage:attendance"**

Lệnh chạy:
```
docker run -d \
  --name ss-coreai \
  --network host \
  --privileged \
  --runtime=nvidia \
  --pull=missing \
  -e CONFIG='{"list_camera":[{"cam_info":{"url":"rtsp://admin:Samsung2026@192.168.1.101/profile2/media.smp","cam_id":"2d8f1c7a-9b34-4e6a-a5c2-7f1e3b9d6c40"},"config":{"cf1":"v1","usage":"customer","user_id":"a8c6a4f6e_3a1e_4d7f_9b6c_1b8a9d2f4c3e","udp":true}}]}' \
  -e BOX_ID=7e2c9b4a-5d13-4f8e-a6c1-9b3d2f7a6e55 \
  -e BOOTSTRAP_SERVER="gateway-1.hn.eidox.ai:9094" \
  -e SEARCH_TOPIC=product-gatewayhn-searching \
  -e HEALTHCHECK_TOPIC=product-gatewayhn-alert \
  -v /dev/video1:/dev/video1 \
  -v /certs:/certs \
  hub.eidox.ai/ai/ds-aiview:2.1.3
```

 ## PHẦN 2: APP BOX AI (faceidapp)
-------------------------------------------------------------
* Chức năng: Hiển thị face trên màn hình Box (DISPLAY=:0)


Lệnh chạy:
```
docker run -d \
  --name faceidapp \
  --restart always \
  --network host \
  --privileged \
  --pull=never \
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
  hub.eidox.ai/ai/faceidapp_box:3.0.10
```
