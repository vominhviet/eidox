import React, { useState } from 'react';

function SimpleCameraForm({ onNext, onCancel }) {
  const [rtspUrl, setRtspUrl] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!rtspUrl) {
      setError('Vui lòng nhập RTSP URL');
      return;
    }

    if (!image) {
      setError('Vui lòng upload ảnh camera');
      return;
    }

    onNext({
      rtspUrl: rtspUrl,
      image: image,
      imagePreview: imagePreview
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            RTSP URL:
          </label>
          <input
            type="text"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            placeholder="rtsp://username:password@ip:port/stream"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Ảnh Camera:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            required
          />
        </div>

        {imagePreview && (
          <div style={{ 
            marginBottom: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            overflow: 'hidden',
            background: '#f5f5f5'
          }}>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ 
                width: '100%', 
                maxHeight: '200px', 
                objectFit: 'contain',
                display: 'block'
              }} 
            />
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '10px',
            background: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Hủy
          </button>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '12px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Vẽ Zone →
          </button>
        </div>
      </form>
    </div>
  );
}

export default SimpleCameraForm;