/**
 * @file ZoneDrawingPage.js
 * @description Trang quản lý khu vực vẽ zone cho AI Camera. 
 * Nhận dữ liệu stream/ảnh từ page trước và mount giao diện Canvas vẽ.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DrawingCanvas from './DrawingCanvas';
import './ZoneDrawingPage.css'; // [NEW] Tích hợp CSS tách biệt

function ZoneDrawingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cameraData } = location.state || {};

  /**
   * @function handleSave
   * @description Gọi khi người dùng bấm lưu cấu hình json zone, điều hướng về màn hình quản lý.
   * @param {Object} config JSON config AI trả về từ Canvas
   */
  const handleSave = (config) => {
    navigate('/cameras', { 
      state: { 
        savedConfig: config,
        cameraData: cameraData 
      } 
    });
  };

  /**
   * @function handleBack
   * @description Quay lại trang quản lý camera
   */
  const handleBack = () => {
    navigate(-1); 
  };

  // Nếu truy cập URL trực tiếp mà không có data camera -> Hiển thị lỗi
  if (!cameraData) {
    return (
      <div className="zone-page-empty">
        <h2>Không có dữ liệu camera</h2>
        <p>Vui lòng quay lại và thử lại.</p>
        <button className="btn-back-light" onClick={handleBack}>
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="zone-page-container">
      {/* ---------------- Header ---------------- */}
      <div className="zone-header">
        <div className="header-left">
          <button className="btn-back-dark" onClick={handleBack}>
            ← Quay lại
          </button>
          <h2 className="header-title">✏️ Vẽ Zone AI</h2>
        </div>
        <div className="camera-url-badge">
          📹 {cameraData.rtspUrl || 'Unknown Camera stream'}
        </div>
      </div>

      {/* ---------------- Canvas Area ---------------- */}
      <div className="canvas-wrapper">
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