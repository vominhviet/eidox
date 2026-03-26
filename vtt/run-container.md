# RUN CONTAINER HÀNG HÓA
docker run 
--name name_images 
--runtime nvidia 
--restart always 
--network host 
name_images:latest
main.py --show_video --send_api

##Run Available Container
docker pull phong163/hanghoa_vtp:v2
docker run 
--name hanghoa_vtp 
--runtime nvidia 
--restart always 
--network host 
phong163/hanghoa_vtp:v2
main.py --show_video --send_api
