/**
 * @file server.js
 * @description Điểm vào (Entry point) chính của hệ thống Node.js Backend cho Camera Admin.
 * Khởi tạo Express server, cấu hình CORS, xử lý JSON, và tích hợp các bộ định tuyến (router).
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware
app.use(cors()); // Cho phép giao diện Frontend React gọi API
app.use(express.json({ limit: '50mb' })); // Hỗ trợ body JSON lớn (cho zone payload)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Đường dẫn static cho các file upload (như ảnh camera)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ------------------------------------------------------------------
// CẤU HÌNH JENKINS TỪ .ENV
// ------------------------------------------------------------------
const JENKINS_AUTH = Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_TOKEN}`).toString('base64');
const JENKINS_JOB_URL = `${process.env.JENKINS_URL}/job/${process.env.JENKINS_JOB_NAME}/buildWithParameters`;

/**
 * @api {post} /api/deploy-config 
 * @description API Nhận JSON chứa thông tin cấu hình (Zone Camera) từ React và gửi sang Jenkins.
 */
app.post('/api/deploy-config', async (req, res) => {
    try {
        const configData = req.body; 

        console.log(`\n🚀 Đang gửi cấu hình tới Jenkins...`);
        console.log(`📹 URL Camera: ${configData.list_camera?.[0]?.cam_info?.url || 'Unknown'}`);

        // Gửi HTTP POST tới Jenkins để kích hoạt Pipeline (buildWithParameters)
        // kèm tham số CONFIG_DATA là chuỗi JSON
        const response = await axios.post(JENKINS_JOB_URL, null, {
            params: {
                CONFIG_DATA: JSON.stringify(configData)
            },
            headers: {
                'Authorization': `Basic ${JENKINS_AUTH}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        res.status(200).json({ 
            success: true, 
            message: "Gửi lệnh tới Jenkins thành công!",
            jenkins_http_status: response.status 
        });

    } catch (error) {
        console.error("❌ Jenkins API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            error: "Lỗi kết nối Jenkins Server hoặc cấu hình .env không hợp lệ.",
            details: error.message
        });
    }
});

// ------------------------------------------------------------------
// MOUNT CÁC ROUTER KHÁC (API CRUD Cameras)
// ------------------------------------------------------------------
try {
    const apiRouter = require('./routes/api');
    app.use('/api', apiRouter);
    console.log('✅ Mounted /routes/api.js successfully.');
} catch (error) {
    console.warn("⚠️ API routes (/routes/api.js) encountered an issue or is missing:", error.message);
}

// Khởi động Server
app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🌐 Server is running on http://localhost:${PORT}`);
    console.log(`🔧 Jenkins URL: ${process.env.JENKINS_URL || 'Chưa cấu hình (Kiểm tra file .env)'}`);
    console.log(`==============================================\n`);
});
