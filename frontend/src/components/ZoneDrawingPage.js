import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DrawingCanvas from './DrawingCanvas';

function ZoneDrawingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cameraData } = location.state || {};

  const handleSave = (config) => {
    // Quay lại trang trước với config đã vẽ
    navigate('/cameras', { 
      state: { 
        savedConfig: config,
        cameraData: cameraData 
      } 
    });
  };

  const handleBack = () => {
    navigate(-1); // Quay lại trang trước
  };

  if (!cameraData) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: 'white'
      }}>
        <h2>Không có dữ liệu camera</h2>
        <p>Vui lòng quay lại và thử lại.</p>
        <button 
          onClick={handleBack}
          style={{
            padding: '12px 30px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 20px auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        padding: '15px 30px',
        borderRadius: '12px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={handleBack}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ← Quay lại
          </button>
          <h2 style={{ margin: 0 }}>✏️ Vẽ Zone</h2>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px'
        }}>
          📹 {cameraData.rtspUrl || 'Camera'}
        </div>
      </div>

      {/* Drawing Canvas */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <DrawingCanvas 
          cameraData={cameraData}
          onSave={handleSave}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

export default ZoneDrawingPage;