import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleCameraForm from './SimpleCameraForm';
import CameraList from './CameraList'; // [NEW] Thêm import bị thiếu
import './CameraManagement.css';

function CameraManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cameras');
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cameraData, setCameraData] = useState({
    rtspUrl: '',
    image: null,
    imagePreview: null
  });

  const tabs = [
    { id: 'cameras', label: '📷 Cameras', icon: '📹' },
  ];

  const handleNewCamera = () => {
    setCameraData({
      rtspUrl: '',
      image: null,
      imagePreview: null
    });
    setShowModal(true);
  };

  const handleNextStep = (data) => {
    // Điều hướng sang trang vẽ zone
    navigate('/draw-zone', { 
      state: { 
        cameraData: {
          rtspUrl: data.rtspUrl,
          imagePreview: data.imagePreview,
          image: data.image
        }
      } 
    });
    setShowModal(false);
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Nhận kết quả từ trang vẽ zone
  React.useEffect(() => {
    const handleReceiveConfig = (event) => {
      if (event.state?.savedConfig && event.state?.cameraData) {
        const newCamera = {
          cam_info: {
            url: event.state.cameraData.rtspUrl,
            cam_id: generateUUID()
          },
          config: event.state.savedConfig,
          image: event.state.cameraData.imagePreview
        };
        setCameras(prev => [...prev, newCamera]);
      }
    };

    window.addEventListener('popstate', handleReceiveConfig);
    return () => window.removeEventListener('popstate', handleReceiveConfig);
  }, []);

  return (
    <div className="camera-management">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <h2>CameraAdmin</h2>
          <span className="version">v2.0</span>
        </div>
        
        <nav className="nav-menu">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="server-status">
            <span className="status-dot"></span>
            <span>Server Online</span>
          </div>
          <div className="camera-stats">
            <small>{cameras.length} cameras</small>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <h1>Camera Management</h1>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={handleNewCamera}
            >
              <span>+</span> New Camera
            </button>
          </div>
        </div>

        <div className="content-area">
          {activeTab === 'cameras' && (
            <div className="cameras-view">
              {cameras.length > 0 ? (
                <CameraList 
                  cameras={cameras}
                  setCameras={setCameras}
                  onSelectCamera={(cam) => setSelectedCamera(cam)}
                />
              ) : (
                <div className="empty-state">
                  <p>Chưa có camera nào. Click "New Camera" để thêm mới!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📸 Thêm Camera Mới</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <SimpleCameraForm 
              onNext={handleNextStep}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraManagement;