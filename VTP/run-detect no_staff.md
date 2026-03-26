# 1. Truy cập vào container
docker exec -it ds-vtp-nostaff /bin/bash

# 2. Di chuyển đến folder của counting
cd /workspace/cxview-plugin-counting/build

--------------
# 3. Truyền các giá trị của ENV

export URI=rtsp://admin:eidox2026@dvhcam1.cameraddns.net:5554/live
export BOOTSTRAP_SERVER="gateway-1.hn.eidox.ai;9093"
export HEALTHCHECK_TOPIC="test"
export COUNTING_TOPIC="gateway-box-pchm"
export BOX_ID="a0555f7d-c454-456c-8eb1-d3135dc4a01a"
unset DISPLAY
export DEBUG=0
export USER_ID="test"


# 4. Export config của camera

config chỉ cho nhận diện nhân viên trong zone: no_staff


export CONFIG='{"list_camera":[{"cam_info":{"url":"rtsp://admin:eidox2026@dvhcam1.cameraddns.net:5554","cam_id":"24860033-7d0c-49b1-8895-1cbe0f9458de"},"config":{"direction":[],"heatmap":{},"layout":{},"zone":[{"ID":"abc","type":1,"coord":[0.423, 0.031, 0.884, 0.111, 0.748, 0.867, 0.233, 0.464],"axis":[]}],"reid":{"faiss_switch":0.6,"faiss_staff_db":0.8}}}]}'


# 5. SAU KHI EXPORT CONFIG THÌ THỰC HIỆN Dump Config:

./dump_config

NẾU CHẠY 2 cam:

export CONFIG='{"list_camera":[{"cam_info":{"url":"rtsp://admin:eidox2026@dvhcam2.cameraddns.net:5555/live","cam_id":"3c8d5f21-2a44-4f9d-b7c1-6e2a9d4c8f55"},"config":{"direction":[],"heatmap":{},"layout":{},"zone":[{"ID":"6bf6b48f-3c95-4701-a25e-77888a4fa12c","type":1,"axis":[0.506,0.795,0.528,0.461],"coord":[0.328,0.65,0.789,0.691]},{"ID":"6bf6b48f-3c95-4701-a25e-77888a4fa12d","type":2,"axis":[0.457,0.912,0.545,0.571],"coord":[0.329,0.703,0.726,0.833]}],"reid":{"faiss_switch":0.6,"faiss_staff_db":0.8}}},{"cam_info":{"url":"rtsp://admin:eidox2026@dvhcam1.cameraddns.net:5554/live","cam_id":"9f3c2a71-6b48-4d92-a3f7-81d5b0c7e4a1"},"config":{"direction":[],"heatmap":{},"layout":{},"zone":[{"ID":"6bf6b48f-3c95-4701-a25e-77888a4fa12e","type":1,"coord":[0.478,0.07,0.823,0.17,0.735,0.711,0.323,0.418],"axis":[]}],"reid":{"faiss_switch":0.6,"faiss_staff_db":0.8}}}]}'

----------------------
# 6. chạy pipline:

+ Nếu: 2sgie kafka + 1 cam

rtsp://admin:eidox2026@dvhcam3.cameraddns.net:5556/live

gst-launch-1.0 \
    uridecodebin uri=rtsp://admin:eidox2026@dvhcam3.cameraddns.net:5554/live protocols=4 ! m.sink_0 \
    nvstreammux name=m  batched-push-timeout=40000 batch-size=1 width=1920 height=1080 \
    ! nvinfer config-file-path=/workspace/data/configs/pgie_arm.txt ! yoloxparser ! nvbytetrack track-thresh=0.5 high-thresh=0.6 max-alive=1000 ! nvdsanalytics config-file=/data/configs/analytics.txt ! datafilter ! nvinfer config-file-path=/workspace/data/configs/sgie_arm.txt ! queue ! nvinfer config-file-path=/data/configs/sgie2_arm.txt ! dataprocess ! queue ! nvmsgconv config=/data/configs/msgconv.txt payload-type=257 ! nvmsgbroker proto-lib=/opt/nvidia/deepstream/deepstream-5.0/lib/libnvds_kafka_proto.so conn-str=$BOOTSTRAP_SERVER topic=$COUNTING_TOPIC config=/data/configs/kafka.txt sync=false

rtsp://admin:eidox2026@dvhcam1.cameraddns.net:5554/live

gst-launch-1.0 \
    uridecodebin uri=rtsp://admin:eidox2026@dvhcam1.cameraddns.net:5554/live protocols=4 ! m.sink_0 \
    nvstreammux name=m  batched-push-timeout=40000 batch-size=1 width=1920 height=1080 \
    ! nvinfer config-file-path=/workspace/data/configs/pgie_arm.txt ! yoloxparser ! nvbytetrack track-thresh=0.5 high-thresh=0.6 max-alive=1000 ! nvdsanalytics config-file=/data/configs/analytics.txt ! datafilter ! nvinfer config-file-path=/workspace/data/configs/sgie_arm.txt ! queue ! nvinfer config-file-path=/data/configs/sgie2_arm.txt ! dataprocess ! queue ! nvmsgconv config=/data/configs/msgconv.txt payload-type=257 ! nvmsgbroker proto-lib=/opt/nvidia/deepstream/deepstream-5.0/lib/libnvds_kafka_proto.so conn-str=$BOOTSTRAP_SERVER topic=$COUNTING_TOPIC config=/data/configs/kafka.txt sync=false

+ Nếu 2sgie kafka + 2 cam
  
gst-launch-1.0 \
    uridecodebin uri=rtsp://admin:eidox2026@dvhcam2.cameraddns.net:5555/live protocols=4 ! m.sink_0 \
    uridecodebin uri=rtsp://admin:eidox2026@dvhcam1.cameraddns.net:5554/live protocols=4 ! m.sink_1 \
    nvstreammux name=m  batched-push-timeout=40000 batch-size=2 width=1920 height=1080 \
    ! nvinfer config-file-path=/workspace/data/configs/pgie_arm.txt ! yoloxparser ! nvbytetrack track-thresh=0.5 high-thresh=0.6 max-alive=1000 ! nvdsanalytics config-file=/data/configs/analytics.txt ! queue ! datafilter ! nvinfer config-file-path=/workspace/data/configs/sgie_arm.txt ! queue ! nvinfer config-file-path=/data/configs/sgie2_arm.txt ! queue ! dataprocess ! queue ! nvmsgconv config=/data/configs/msgconv.txt payload-type=257 ! nvmsgbroker proto-lib=/opt/nvidia/deepstream/deepstream-5.0/lib/libnvds_kafka_proto.so conn-str=$BOOTSTRAP_SERVER topic=$COUNTING_TOPIC config=/data/configs/kafka.txt sync=false
