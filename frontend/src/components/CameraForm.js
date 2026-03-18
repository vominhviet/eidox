import React from 'react';

function CameraList({ cameras, setCameras, onSelectCamera }) {
  // Nếu không có camera, không hiển thị gì
  if (!cameras || cameras.length === 0) {
    return null;
  }

  const handleDelete = (camId) => {
    if (window.confirm('Xóa camera này?')) {
      const updatedCameras = cameras.filter(cam => cam.cam_info?.cam_id !== camId);
      setCameras(updatedCameras);
    }
  };

  const handleViewConfig = (camera) => {
    onSelectCamera(camera);
  };

  return (
    <div className="camera-list">
      <div className="camera-list-header">
        <h3>📹 Danh sách Camera</h3>
        <span className="camera-count">{cameras.length} camera</span>
      </div>
      
      <div className="camera-grid">
        {cameras.map((camera, index) => (
          <div key={camera.cam_info?.cam_id || index} className="camera-card">
            {camera.image && (
              <div className="camera-image">
                <img 
                  src={`http://localhost:5000${camera.image}`} 
                  alt={`Camera ${index + 1}`}
                  className="preview-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x180?text=No+Image';
                  }}
                />
                <div className="camera-status">
                  <span className="status-dot"></span>
                  <span className="status-text">Active</span>
                </div>
              </div>
            )}
            
            <div className="camera-info">
              <div className="camera-header">
                <h4>Camera {index + 1}</h4>
                <span className="camera-id">
                  {camera.cam_info?.cam_id?.substring(0, 8)}...
                </span>
              </div>
              
              <p className="camera-url">
                <span className="label">URL:</span>
                <span className="value">{camera.cam_info?.url || 'N/A'}</span>
              </p>
              
              <div className="camera-stats">
                <div className="stat-item">
                  <span className="stat-label">Zones:</span>
                  <span className="stat-value">{camera.config?.zone?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Type:</span>
                  <span className="stat-value">
                    {camera.config?.zone?.[0]?.type === 1 ? 'UNKNOWN_PERSON' : 
                     camera.config?.zone?.[0]?.type === 2 ? 'NO_UNIFORM' : 
                     camera.config?.zone?.[0]?.type === 3 ? 'ENTRY' : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="camera-actions">
                <button 
                  onClick={() => handleViewConfig(camera)}
                  className="btn-select"
                  title="Xem cấu hình camera"
                >
                  <span className="btn-icon">🔍</span>
                  <span className="btn-text">Xem Config</span>
                </button>
                
                <button 
                  onClick={() => handleDelete(camera.cam_info?.cam_id)}
                  className="btn-delete"
                  title="Xóa camera"
                >
                  <span className="btn-icon">🗑️</span>
                  <span className="btn-text">Xóa</span>
                </button>
              </div>
            </div>

            {/* Hiển thị preview nếu có axis/coord */}
            {(camera.config?.zone?.[0]?.axis || camera.config?.zone?.[0]?.coord) && (
              <div className="zone-preview">
                <div className="preview-label">Zone Preview:</div>
                <div className="preview-coords">
                  {camera.config.zone[0].axis && (
                    <div className="coord-item">
                      <span className="coord-type">Axis:</span>
                      <span className="coord-value">
                        [{camera.config.zone[0].axis.map(v => v.toFixed(2)).join(', ')}]
                      </span>
                    </div>
                  )}
                  {camera.config.zone[0].coord && (
                    <div className="coord-item">
                      <span className="coord-type">Coord:</span>
                      <span className="coord-value">
                        [{camera.config.zone[0].coord.map(v => v.toFixed(2)).join(', ')}]
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .camera-list {
          padding: 20px;
          background: #f8f9fa;
          min-height: 100%;
        }

        .camera-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding: 0 10px;
        }

        .camera-list-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 20px;
          font-weight: 600;
        }

        .camera-count {
          background: #3498db;
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .camera-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 25px;
        }

        .camera-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid #e9ecef;
        }

        .camera-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

        .camera-image {
          position: relative;
          height: 200px;
          background: #2c3e50;
          overflow: hidden;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .camera-card:hover .preview-image {
          transform: scale(1.05);
        }

        .camera-status {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(4px);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #2ecc71;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .camera-info {
          padding: 18px;
        }

        .camera-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .camera-header h4 {
          margin: 0;
          color: #2c3e50;
          font-size: 16px;
          font-weight: 600;
        }

        .camera-id {
          color: #7f8c8d;
          font-size: 12px;
          background: #ecf0f1;
          padding: 3px 8px;
          border-radius: 12px;
        }

        .camera-url {
          margin-bottom: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 13px;
          border: 1px solid #e9ecef;
        }

        .camera-url .label {
          color: #6c757d;
          font-weight: 500;
          margin-right: 8px;
        }

        .camera-url .value {
          color: #2c3e50;
          word-break: break-all;
          font-family: monospace;
        }

        .camera-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 18px;
          padding: 10px;
          background: #f1f8ff;
          border-radius: 6px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 11px;
          color: #6c757d;
          text-transform: uppercase;
          margin-bottom: 3px;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
        }

        .camera-actions {
          display: flex;
          gap: 10px;
        }

        .btn-select,
        .btn-delete {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-select {
          background: #3498db;
          color: white;
        }

        .btn-select:hover {
          background: #2980b9;
          box-shadow: 0 4px 8px rgba(52,152,219,0.3);
        }

        .btn-delete {
          background: #e74c3c;
          color: white;
        }

        .btn-delete:hover {
          background: #c0392b;
          box-shadow: 0 4px 8px rgba(231,76,60,0.3);
        }

        .btn-icon {
          font-size: 16px;
        }

        .btn-text {
          font-size: 13px;
        }

        .zone-preview {
          margin: 0 18px 18px 18px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 3px solid #3498db;
        }

        .preview-label {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preview-coords {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .coord-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }

        .coord-type {
          color: #3498db;
          font-weight: 600;
          min-width: 40px;
        }

        .coord-value {
          color: #2c3e50;
          font-family: monospace;
          word-break: break-all;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .camera-grid {
            grid-template-columns: 1fr;
          }
          
          .camera-list-header {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
          
          .camera-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default CameraList;