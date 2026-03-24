/**
 * @file CameraList.js
 * @description Thành phần (Component) hiển thị danh sách các camera đang quản lý.
 * Cho phép xem nhanh thông số camera và xoá camera khỏi danh sách.
 */
import React from 'react';

function CameraList({ cameras, setCameras, onSelectCamera }) {
  const handleDelete = (indexToDelete, e) => {
    e.stopPropagation();
    const updatedCameras = cameras.filter((_, idx) => idx !== indexToDelete);
    setCameras(updatedCameras);
  };

  return (
    <div className="camera-list-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '20px' }}>
      {cameras.map((cam, index) => {
        // Trích xuất số lượng zone cho UI
        const zoneCount = cam.config?.zone?.length || 0;
        const camUrl = cam.cam_info?.url || 'No URL provided';
        
        return (
          <div 
            key={cam.cam_info?.cam_id || index} 
            className="camera-card" 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
            onClick={() => onSelectCamera && onSelectCamera(cam)}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
          >
            {/* Hiển thị ảnh chụp từ luồng camera */}
            <div className="camera-preview" style={{ height: '180px', background: '#f8fafc', position: 'relative' }}>
              {cam.image ? (
                <img 
                  src={cam.image} 
                  alt="Camera Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  No Preview Image
                </div>
              )}
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                {zoneCount} Zones
              </div>
            </div>

            {/* Thông tin metadata camera */}
            <div className="camera-info" style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {camUrl}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                ID: {cam.cam_info?.cam_id?.substring(0, 10)}...
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <span style={{ padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  AI Active
                </span>
                <button 
                  onClick={(e) => handleDelete(index, e)}
                  style={{
                    background: 'transparent', border: 'none', color: '#ef4444',
                    cursor: 'pointer', padding: '4px 8px', borderRadius: '4px'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Xoá
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CameraList;
