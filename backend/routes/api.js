/**
 * @file api.js
 * @description Hệ thống định tuyến (API Router) quản lý Camera (CRUD) và Tích hợp Jenkins.
 * Cung cấp các Endpoint cho Frontend React để tạo mới camera, nhận thông tin cấu hình AI Zone, 
 * và kích hoạt Jenkins Pipeline.
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const jenkinsConfig = require('../config/jenkins');

// Data file path
const DATA_FILE = path.join(__dirname, '../data/cameras.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ list_camera: [] }, null, 2));
}

// Helper to read data
const readData = () => {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper to write data
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Get all cameras
router.get('/cameras', (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single camera by ID
router.get('/cameras/:camId', (req, res) => {
  try {
    const { camId } = req.params;
    const data = readData();
    const camera = data.list_camera.find(c => c.cam_info.cam_id === camId);
    
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    
    res.json(camera);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload image and add camera with payload
router.post('/cameras', (req, res) => {
  const upload = req.app.locals.upload;
  
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    try {
      const { rtspUrl, payload } = req.body;
      const imageFile = req.file;
      
      const data = readData();
      
      let newCamera;
      
      // Nếu có payload từ client gửi lên
      if (payload) {
        try {
          const parsedPayload = JSON.parse(payload);
          if (parsedPayload.list_camera && parsedPayload.list_camera.length > 0) {
            newCamera = parsedPayload.list_camera[0];
            
            // Đảm bảo camera có ID
            if (!newCamera.cam_info || !newCamera.cam_info.cam_id) {
              if (!newCamera.cam_info) newCamera.cam_info = {};
              newCamera.cam_info.cam_id = uuidv4();
            }
            
            // Đảm bảo có URL
            if (rtspUrl && (!newCamera.cam_info || !newCamera.cam_info.url)) {
              if (!newCamera.cam_info) newCamera.cam_info = {};
              newCamera.cam_info.url = rtspUrl;
            }
          }
        } catch (e) {
          console.error('Error parsing payload:', e);
        }
      }
      
      // Nếu không có payload hoặc payload không hợp lệ, tạo camera mới
      if (!newCamera) {
        if (!rtspUrl) {
          return res.status(400).json({ error: 'RTSP URL is required when no payload provided' });
        }
        
        newCamera = {
          cam_info: {
            url: rtspUrl,
            cam_id: uuidv4()
          },
          config: {
            direction: [],
            heatmap: {},
            layout: {},
            zone: [],
            reid: {
              faiss_switch: 0.6,
              faiss_staff_db: 0.8
            }
          }
        };
      }
      
      // Thêm thông tin image nếu có
      if (imageFile) {
        newCamera.image = `/uploads/${imageFile.filename}`;
      }
      
      data.list_camera.push(newCamera);
      writeData(data);
      
      res.status(201).json(newCamera);
    } catch (error) {
      console.error('Error adding camera:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Update camera zones
router.put('/cameras/:camId/zones', (req, res) => {
  try {
    const { camId } = req.params;
    const { zones } = req.body;
    
    const data = readData();
    const cameraIndex = data.list_camera.findIndex(c => c.cam_info.cam_id === camId);
    
    if (cameraIndex === -1) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    
    data.list_camera[cameraIndex].config.zone = zones;
    writeData(data);
    
    res.json(data.list_camera[cameraIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update camera config
router.put('/cameras/:camId/config', (req, res) => {
  try {
    const { camId } = req.params;
    const updates = req.body;
    
    const data = readData();
    const cameraIndex = data.list_camera.findIndex(c => c.cam_info.cam_id === camId);
    
    if (cameraIndex === -1) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    
    data.list_camera[cameraIndex].config = {
      ...data.list_camera[cameraIndex].config,
      ...updates
    };
    
    writeData(data);
    res.json(data.list_camera[cameraIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete camera
router.delete('/cameras/:camId', (req, res) => {
  try {
    const { camId } = req.params;
    
    const data = readData();
    const cameraIndex = data.list_camera.findIndex(c => c.cam_info.cam_id === camId);
    
    if (cameraIndex === -1) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    
    // Delete associated image if exists
    const camera = data.list_camera[cameraIndex];
    if (camera.image) {
      const imagePath = path.join(__dirname, '..', camera.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    data.list_camera.splice(cameraIndex, 1);
    writeData(data);
    
    res.json({ message: 'Camera deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export all cameras data
router.get('/export', (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import cameras data
router.post('/import', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !data.list_camera) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    writeData(data);
    res.json({ message: 'Data imported successfully', count: data.list_camera.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jenkins integration - Get jobs
router.get('/jenkins/jobs', async (req, res) => {
  try {
    // Lấy auth từ headers
    const authHeader = req.headers.authorization;
    let auth = {};
    
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      auth = { username, password };
    } else {
      auth = {
        username: jenkinsConfig.username,
        password: jenkinsConfig.token
      };
    }
    
    const response = await axios.get(
      `${jenkinsConfig.url}/api/json?tree=jobs[name,url,color,lastBuild[number,result,timestamp]]`,
      {
        auth,
        timeout: 10000
      }
    );
    
    const jobs = response.data.jobs.map(job => ({
      name: job.name,
      url: job.url,
      color: job.color,
      lastBuild: job.lastBuild ? {
        number: job.lastBuild.number,
        result: job.lastBuild.result,
        timestamp: job.lastBuild.timestamp
      } : null
    }));
    
    res.json(jobs);
  } catch (error) {
    console.error('Jenkins jobs error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Jenkins jobs',
      details: error.message,
      config: jenkinsConfig
    });
  }
});

// Jenkins integration - Trigger build
router.post('/jenkins/build', async (req, res) => {
  try {
    const { jobName, parameters } = req.body;
    
    if (!jobName) {
      return res.status(400).json({ error: 'Job name is required' });
    }
    
    // Lấy auth từ headers
    const authHeader = req.headers.authorization;
    let auth = {};
    
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      auth = { username, password };
    } else {
      auth = {
        username: jenkinsConfig.username,
        password: jenkinsConfig.token
      };
    }
    
    // Jenkins build với parameters
    const buildUrl = `${jenkinsConfig.url}/job/${encodeURIComponent(jobName)}/buildWithParameters`;
    
    const response = await axios.post(
      buildUrl,
      null,
      {
        auth,
        params: parameters || {},
        timeout: 10000
      }
    );
    
    res.json({ 
      message: 'Build triggered successfully',
      status: response.status,
      location: response.headers.location
    });
  } catch (error) {
    console.error('Jenkins build error:', error.message);
    res.status(500).json({ 
      error: 'Failed to trigger Jenkins build',
      details: error.message
    });
  }
});

// Jenkins integration - Trigger build with camera payload
router.post('/jenkins/build-with-payload', async (req, res) => {
  try {
    const { jobName, payload, parameters } = req.body;
    
    if (!jobName) {
      return res.status(400).json({ error: 'Job name is required' });
    }
    
    // Lấy auth từ headers
    const authHeader = req.headers.authorization;
    let auth = {};
    
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      auth = { username, password };
    } else {
      auth = {
        username: jenkinsConfig.username,
        password: jenkinsConfig.token
      };
    }
    
    // Chuẩn bị parameters với camera payload
    const buildParams = {
      ...(parameters || {}),
      CAMERA_CONFIG: JSON.stringify(payload)
    };
    
    const buildUrl = `${jenkinsConfig.url}/job/${encodeURIComponent(jobName)}/buildWithParameters`;
    
    const response = await axios.post(
      buildUrl,
      null,
      {
        auth,
        params: buildParams,
        timeout: 10000
      }
    );
    
    res.json({ 
      message: 'Build triggered successfully with payload',
      status: response.status,
      location: response.headers.location
    });
  } catch (error) {
    console.error('Jenkins build with payload error:', error.message);
    res.status(500).json({ 
      error: 'Failed to trigger Jenkins build',
      details: error.message
    });
  }
});

// Jenkins integration - Get build info
router.get('/jenkins/build/:jobName/:buildNumber', async (req, res) => {
  try {
    const { jobName, buildNumber } = req.params;
    
    // Lấy auth từ headers
    const authHeader = req.headers.authorization;
    let auth = {};
    
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      auth = { username, password };
    } else {
      auth = {
        username: jenkinsConfig.username,
        password: jenkinsConfig.token
      };
    }
    
    const response = await axios.get(
      `${jenkinsConfig.url}/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json`,
      {
        auth,
        timeout: 10000
      }
    );
    
    res.json({
      number: response.data.number,
      result: response.data.result,
      timestamp: response.data.timestamp,
      duration: response.data.duration,
      url: response.data.url
    });
  } catch (error) {
    console.error('Jenkins build info error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch build info',
      details: error.message
    });
  }
});

// Test Jenkins connection
router.get('/jenkins/test', async (req, res) => {
  try {
    // Lấy auth từ headers
    const authHeader = req.headers.authorization;
    let auth = {};
    
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      auth = { username, password };
    } else {
      auth = {
        username: jenkinsConfig.username,
        password: jenkinsConfig.token
      };
    }
    
    const response = await axios.get(
      `${jenkinsConfig.url}/api/json?tree=nodeName`,
      {
        auth,
        timeout: 5000
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Connected to Jenkins successfully',
      server: response.data.nodeName || 'Jenkins'
    });
  } catch (error) {
    console.error('Jenkins test error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to connect to Jenkins',
      details: error.message
    });
  }
});

module.exports = router;