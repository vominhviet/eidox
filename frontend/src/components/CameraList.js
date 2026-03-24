import React from 'react';

function CameraList({ cameras, setCameras, onSelectCamera }) {
  if (!cameras || cameras.length === 0) {
    return null;
  }

  const handleDelete = (camId) => {
    if (window.confirm('Xóa camera này?')) {
      const updatedCameras = cameras.filter(cam => cam.cam_info?.cam_id !== camId);
      setCameras(updatedCameras);
    }
  };

  return (
    <div className="camera-list">
      <h3>Danh sách Camera ({cameras.length})</h3>
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
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
              </div>
            )}
            <div className="camera-info">
              <h4>Camera {index + 1}</h4>
              <p className="camera-url">
                <strong>URL:</strong> {camera.cam_info?.url || 'N/A'}
              </p>
              <div className="camera-actions">
                <button 
                  onClick={() => onSelectCamera(camera)}
                  className="btn-select"
                >
                  Chọn
                </button>
                <button 
                  onClick={() => handleDelete(camera.cam_info?.cam_id)}
                  className="btn-delete"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .camera-list {
          padding: 20px;
        }

        .camera-list h3 {
          margin-bottom: 20px;
          color: #333;
        }

        .camera-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .camera-card {
          border: 1px solid #e0e4e8;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .camera-image {
          height: 180px;
          background: #f5f5f5;
          overflow: hidden;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .camera-info {
          padding: 15px;
        }

        .camera-info h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .camera-url {
          font-size: 12px;
          color: #666;
          margin-bottom: 15px;
          word-break: break-all;
        }

        .camera-actions {
          display: flex;
          gap: 10px;
        }

        .btn-select,
        .btn-delete {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .btn-select {
          background: #007bff;
          color: white;
        }

        .btn-select:hover {
          background: #0056b3;
        }

        .btn-delete {
          background: #dc3545;
          color: white;
        }

        .btn-delete:hover {
          background: #c82333;
        }
      `}</style>
    </div>
  );
}

export default CameraList;