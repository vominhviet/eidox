my-ai-camera-project/
├── frontend/                   # React.js App
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraManagement.js    # Giao diện chính & Quản lý danh sách
│   │   │   ├── DrawingCanvas.js       # Engine vẽ Zone (Đã gộp Logic & CSS)
│   │   │   └── SimpleCameraForm.js    # Form nhập RTSP & Upload ảnh
│   │   ├── App.js                     # Cấu hình Routes
│   │   └── index.js
│   └── package.json
├── backend/                    # Node.js Express (Bridge to Jenkins)
│   ├── server.js               # API nhận JSON và gọi Jenkins API
│   ├── .env                    # Lưu biến môi trường (Jenkins URL, Token)
│   └── package.json
├── jenkins/
│   └── Jenkinsfile             # Script Pipeline để Jenkins chạy tự động
└── ai-deployment/              # (Trên Ubuntu Server)
    ├── config.json             # File cấu hình Jenkins đẩy xuống
    └── main_ai.py              # Script AI của bạn đọc file config này


# quy trình hoạt động

graph TD
    A[Người dùng: Vẽ Zone trên React] -->|Bấm Lưu - Gửi JSON| B(Backend Node.js)
    B -->|Gọi API buildWithParameters| C{Jenkins Server}
    C -->|Bước 1: Nhận chuỗi JSON| D[Jenkins Pipeline]
    D -->|Bước 2: Ghi JSON vào file| E[new_config.json]
    E -->|Bước 3: SCP / SSH| F[Ubuntu Server - AI Engine]
    F -->|Bước 4: Restart Service| G[Hệ thống AI nhận Config mới]