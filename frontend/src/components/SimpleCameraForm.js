/**
 * @file SimpleCameraForm.js
 * @description Form nhập liệu tối giản để lấy thông tin RTSP Camera và ảnh tĩnh trước khi vẽ zone.
 * Hỗ trợ validation nội dung cơ bản, preview hình ảnh.
 */
import React, { useState } from 'react';
import './SimpleCameraForm.css'; // [NEW] Import style từ file CSS ngoài

function SimpleCameraForm({ onNext, onCancel }) {
  const [rtspUrl, setRtspUrl] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');

  /**
   * Xử lý đọc file ảnh hiển thị preview lên màn hình.
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Xử lý xác nhận form tạo camera.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!rtspUrl) {
      setError('Vui lòng nhập đường dẫn RTSP URL hợp lệ.');
      return;
    }

    if (!image) {
      setError('Vui lòng cung cấp hình ảnh chụp từ camera để vẽ vùng nhận diện.');
      return;
    }

    onNext({
      rtspUrl: rtspUrl,
      image: image,
      imagePreview: imagePreview
    });
  };

  return (
    <div className="simple-camera-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Đường dẫn luồng RTSP:</label>
          <input
            type="text"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            placeholder="rtsp://username:password@ip:port/stream"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Ảnh Tĩnh Camera (Làm nền vẽ AI):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="form-input"
            required
          />
        </div>

        {/* Khung hiển thị trước hình ảnh (Preview) */}
        {imagePreview && (
          <div className="image-preview-container">
            <img 
              src={imagePreview} 
              alt="Preview camera upload" 
              className="image-preview-img" 
            />
          </div>
        )}

        {/* Khung báo lỗi validation */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Hủy Bỏ
          </button>
          <button type="submit" className="btn-submit">
            Tiếp tục vẽ Zone →
          </button>
        </div>
      </form>
    </div>
  );
}

export default SimpleCameraForm;