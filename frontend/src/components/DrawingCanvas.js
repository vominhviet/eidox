import React, { useState, useRef, useEffect } from 'react';

function DrawingCanvas({ cameraData, onSave }) {
  // Kiểm tra cameraData
  if (!cameraData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Không có dữ liệu camera. Vui lòng thử lại.</p>
      </div>
    );
  }

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [zones, setZones] = useState([]);
  const [currentZone, setCurrentZone] = useState({
    name: '',
    type: 1,
    lines: [],
    polyPoints: []
  });
  const [ix, setIx] = useState(-1);
  const [iy, setIy] = useState(-1);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState(1);
  const [realtimeOutput, setRealtimeOutput] = useState(null);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const FIXED_WIDTH = 800;
  const FIXED_HEIGHT = 450;

  // Zone types
  const zoneTypes = [
    { value: 1, label: 'UNKNOWN_PERSON', color: '#3b82f6', bgColor: '#eff6ff', hasAxis: true },
    { value: 2, label: 'NO_UNIFORM', color: '#10b981', bgColor: '#f0fdf4', hasAxis: true },
    { value: 3, label: 'ENTRY', color: '#f59e0b', bgColor: '#fffbeb', hasAxis: false }
  ];

  // Khởi tạo canvas
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = FIXED_WIDTH;
      canvasRef.current.height = FIXED_HEIGHT;
    }
  }, []);

  // Vẽ ảnh lên canvas
  useEffect(() => {
    if (canvasRef.current && cameraData.imagePreview) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.src = cameraData.imagePreview;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, FIXED_WIDTH, FIXED_HEIGHT);
        redrawAll();
      };
    }
  }, [cameraData.imagePreview]);

  // Format output realtime
  const generateRealtimeOutput = () => {
    const allZones = [...zones];
    
    if (currentZone.polyPoints.length > 0 || currentZone.lines.length > 0) {
      const tempZone = { ...currentZone };
      allZones.push(tempZone);
    }

    if (allZones.length > 0) {
      const formattedZones = allZones.map((zone) => {
        const zoneTypeInfo = zoneTypes.find(t => t.value === zone.type) || zoneTypes[0];
        
        const axis = (zoneTypeInfo.hasAxis && zone.lines[0]) ? [
          Number((zone.lines[0][0] / FIXED_WIDTH).toFixed(3)),
          Number((zone.lines[0][1] / FIXED_HEIGHT).toFixed(3)),
          Number((zone.lines[0][2] / FIXED_WIDTH).toFixed(3)),
          Number((zone.lines[0][3] / FIXED_HEIGHT).toFixed(3))
        ] : [];

        const coord = zone.polyPoints.length > 0 ? 
          zone.polyPoints.flatMap(p => [
            Number((p.x / FIXED_WIDTH).toFixed(3)),
            Number((p.y / FIXED_HEIGHT).toFixed(3))
          ]) : [];

        if (zone.type === 3) {
          return {
            ID: generateUUID(),
            type: zone.type,
            coord: coord
          };
        }

        return {
          ID: generateUUID(),
          type: zone.type,
          ...(axis.length > 0 && { axis: axis }),
          coord: coord
        };
      });

      return {
        list_camera: [
          {
            cam_info: {
              url: cameraData.rtspUrl || "",
              cam_id: generateUUID()
            },
            config: {
              direction: [],
              heatmap: {},
              layout: {},
              zone: formattedZones,
              reid: {
                faiss_switch: 0.6,
                faiss_staff_db: 0.8
              }
            }
          }
        ]
      };
    }
    
    return {
      list_camera: [
        {
          cam_info: {
            url: cameraData.rtspUrl || "",
            cam_id: generateUUID()
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
        }
      ]
    };
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Xử lý mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = FIXED_WIDTH / rect.width;
    const scaleY = FIXED_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (x < 0 || x > FIXED_WIDTH || y < 0 || y > FIXED_HEIGHT) return;

    if (zoneType === 3) {
      const newPoint = { x, y };
      setCurrentZone({
        ...currentZone,
        polyPoints: [...currentZone.polyPoints, newPoint]
      });
    } else if (currentStep === 3) {
      const newPoint = { x, y };
      setCurrentZone({
        ...currentZone,
        polyPoints: [...currentZone.polyPoints, newPoint]
      });
    } else {
      setDrawing(true);
      setIx(x);
      setIy(y);
    }
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    if (!drawing || !canvasRef.current) return;
    if (zoneType === 3 || currentStep === 3) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = FIXED_WIDTH / rect.width;
    const scaleY = FIXED_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (x < 0 || x > FIXED_WIDTH || y < 0 || y > FIXED_HEIGHT) return;

    const ctx = canvasRef.current.getContext('2d');
    redrawAll();
    
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(x, y);
    
    if (currentStep === 1) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (currentStep === 2) {
      drawArrow(ctx, ix, iy, x, y, '#ef4444', 2, true);
    }
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    if (!drawing || !canvasRef.current) return;
    if (zoneType === 3 || currentStep === 3) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = FIXED_WIDTH / rect.width;
    const scaleY = FIXED_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (x < 0 || x > FIXED_WIDTH || y < 0 || y > FIXED_HEIGHT) return;

    const newLine = [ix, iy, x, y];
    setCurrentZone({
      ...currentZone,
      lines: [...currentZone.lines, newLine]
    });
    setDrawing(false);
    
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Hoàn thành zone
  const handleCompleteZone = () => {
    if (!zoneName.trim()) {
      alert('Vui lòng nhập tên cho zone!');
      return;
    }

    const zoneTypeInfo = zoneTypes.find(t => t.value === zoneType);

    if (zoneTypeInfo.hasAxis && currentZone.lines.length < 2) {
      alert('Chưa vẽ đủ Axis và Coord!');
      return;
    }

    if (currentZone.polyPoints.length < 3) {
      alert('Vui lòng vẽ ít nhất 3 điểm cho polygon!');
      return;
    }

    const newZone = {
      name: zoneName,
      type: zoneType,
      lines: zoneTypeInfo.hasAxis ? currentZone.lines : [],
      polyPoints: currentZone.polyPoints
    };

    setZones([...zones, newZone]);
    setCurrentZone({ name: '', type: 1, lines: [], polyPoints: [] });
    setZoneName('');
    setZoneType(1);
    setCurrentStep(1);
    setSelectedZoneIndex(zones.length);
  };

  // Xóa zone
  const handleDeleteZone = (index) => {
    const newZones = zones.filter((_, i) => i !== index);
    setZones(newZones);
    if (selectedZoneIndex === index) {
      setSelectedZoneIndex(null);
    }
  };

  // Hàm vẽ
  const drawPoint = (ctx, x, y, number, color = '#ef4444') => {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, x, y);
  };

  const drawLine = (ctx, x1, y1, x2, y2, color, width = 2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY, color, width, isPreview = false) => {
    const headLength = isPreview ? 15 : 20;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (isPreview) ctx.setLineDash([5, 5]);
    ctx.stroke();
    if (isPreview) ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawPolygon = (ctx, points, color, isSelected = false) => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    
    for (let i = 0; i < points.length - 1; i++) {
      drawLine(ctx, points[i].x, points[i].y, points[i+1].x, points[i+1].y, color, isSelected ? 3 : 2);
    }
    
    if (points.length >= 3) {
      drawLine(ctx, points[points.length-1].x, points[points.length-1].y, points[0].x, points[0].y, color, isSelected ? 3 : 2);
      
      ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }
    
    points.forEach((point, index) => {
      drawPoint(ctx, point.x, point.y, index + 1, isSelected ? '#ef4444' : color);
    });
  };

  const drawZone = (ctx, zone, isSelected = false) => {
    const zoneTypeInfo = zoneTypes.find(t => t.value === zone.type) || zoneTypes[0];
    const color = isSelected ? '#ef4444' : zoneTypeInfo.color;
    
    if (zone.type === 3) {
      if (zone.polyPoints.length > 0) {
        drawPolygon(ctx, zone.polyPoints, color, isSelected);
      }
    } else {
      if (zone.lines[0]) {
        const [x1, y1, x2, y2] = zone.lines[0];
        drawLine(ctx, x1, y1, x2, y2, isSelected ? '#ef4444' : '#000000', isSelected ? 4 : 3);
      }

      if (zone.lines[1]) {
        const [x1, y1, x2, y2] = zone.lines[1];
        drawArrow(ctx, x1, y1, x2, y2, isSelected ? '#ef4444' : '#ef4444', isSelected ? 5 : 4, false);
      }

      if (zone.polyPoints.length > 0) {
        drawPolygon(ctx, zone.polyPoints, color, isSelected);
      }
    }

    if (zone.name && zone.polyPoints.length > 0) {
      const centerX = zone.polyPoints.reduce((sum, p) => sum + p.x, 0) / zone.polyPoints.length;
      const centerY = zone.polyPoints.reduce((sum, p) => sum + p.y, 0) / zone.polyPoints.length;
      
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = isSelected ? '#ef4444' : '#1f2937';
      ctx.fillText(zone.name, centerX - 25, centerY - 15);
    }
  };

  const redrawAll = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    
    if (cameraData.imagePreview) {
      const img = new Image();
      img.src = cameraData.imagePreview;
      ctx.drawImage(img, 0, 0, FIXED_WIDTH, FIXED_HEIGHT);
    }
    
    zones.forEach((zone, index) => {
      drawZone(ctx, zone, index === selectedZoneIndex);
    });
    
    if (currentZone.polyPoints.length > 0 || currentZone.lines.length > 0) {
      drawZone(ctx, currentZone, true);
    }
  };

  const handleSaveAll = () => {
    const output = generateRealtimeOutput();
    onSave(output.list_camera[0].config);
  };

  const handleReset = () => {
    setZones([]);
    setCurrentZone({ name: '', type: 1, lines: [], polyPoints: [] });
    setZoneName('');
    setZoneType(1);
    setCurrentStep(1);
    setDrawing(false);
    setSelectedZoneIndex(null);
    
    if (canvasRef.current && cameraData.imagePreview) {
      const ctx = canvasRef.current.getContext('2d');
      const img = new Image();
      img.src = cameraData.imagePreview;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, FIXED_WIDTH, FIXED_HEIGHT);
      };
    }
  };

  useEffect(() => {
    redrawAll();
    setRealtimeOutput(generateRealtimeOutput());
  }, [zones, currentZone, selectedZoneIndex]);

  const totalZones = zones.length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px 20px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>✏️ Vẽ Zone</h2>
        <div style={{ 
          background: '#3b82f6', 
          color: 'white', 
          padding: '6px 16px', 
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 500
        }}>
          {totalZones} zones
        </div>
      </div>

      {/* Form nhập thông tin zone */}
      <div style={{ 
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#4b5563' }}>
            Tên zone
          </label>
          <input
            type="text"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            placeholder="VD: Cổng chính, Khu vực A, Lối vào..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#4b5563' }}>
            Loại zone
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {zoneTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setZoneType(type.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: zoneType === type.value ? type.color : 'white',
                  color: zoneType === type.value ? 'white' : '#4b5563',
                  border: `1px solid ${type.color}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hướng dẫn vẽ */}
      <div style={{ 
        background: '#f9fafb',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#4b5563',
        border: '1px solid #e5e7eb'
      }}>
        <strong style={{ color: '#1f2937' }}>Hướng dẫn:</strong>{' '}
        {zoneType === 3 ? (
          'Click chuột để vẽ polygon (tối thiểu 3 điểm)'
        ) : (
          currentStep === 1 ? 'Kéo thả chuột để vẽ Axis' :
          currentStep === 2 ? 'Kéo thả chuột để vẽ Coord' :
          'Click chuột để vẽ polygon (tối thiểu 3 điểm)'
        )}
      </div>

      {/* Canvas */}
      <div style={{ 
        background: '#f3f4f6',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <canvas
          ref={canvasRef}
          width={FIXED_WIDTH}
          height={FIXED_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setDrawing(false)}
          style={{
            width: '100%',
            height: 'auto',
            cursor: 'crosshair',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            background: '#ffffff',
            display: 'block'
          }}
        />
      </div>

      {/* Nút hoàn thành zone */}
      <button 
        onClick={handleCompleteZone}
        disabled={!(zoneName && currentZone.polyPoints.length >= 3)}
        style={{
          width: '100%',
          padding: '14px',
          background: zoneName && currentZone.polyPoints.length >= 3 ? '#10b981' : '#9ca3af',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 500,
          cursor: zoneName && currentZone.polyPoints.length >= 3 ? 'pointer' : 'not-allowed',
          marginBottom: '20px',
          transition: 'background-color 0.2s'
        }}
      >
        ✅ Hoàn thành zone {totalZones + 1}
      </button>

      {/* Danh sách zones */}
      {zones.length > 0 && (
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1f2937' }}>
            📋 Danh sách zones ({zones.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {zones.map((zone, index) => {
              const typeInfo = zoneTypes.find(t => t.value === zone.type);
              return (
                <div
                  key={index}
                  onClick={() => setSelectedZoneIndex(index)}
                  style={{
                    padding: '12px',
                    background: selectedZoneIndex === index ? '#f3f4f6' : 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 500, color: '#1f2937' }}>{zone.name}</span>
                    <span style={{
                      padding: '4px 8px',
                      background: typeInfo?.bgColor || '#f3f4f6',
                      color: typeInfo?.color || '#4b5563',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {typeInfo?.label}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {zone.polyPoints.length} điểm
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteZone(index);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview JSON */}
      {realtimeOutput && (
        <div style={{ 
          background: '#1f2937',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#f3f4f6' }}>
              📦 Kết quả JSON
            </h3>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(realtimeOutput, null, 2));
                alert('Đã copy!');
              }}
              style={{
                padding: '6px 12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Copy
            </button>
          </div>
          
          <pre style={{ 
            background: '#111827',
            color: '#e5e7eb',
            padding: '12px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace',
            margin: 0,
            maxHeight: '200px'
          }}>
            {JSON.stringify(realtimeOutput, null, 2)}
          </pre>
        </div>
      )}

      {/* Nút điều khiển */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleReset}
          style={{
            flex: 1,
            padding: '12px',
            background: 'white',
            color: '#4b5563',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
          onMouseLeave={(e) => e.target.style.background = 'white'}
        >
          ⟲ Vẽ lại
        </button>
        <button 
          onClick={handleSaveAll}
          style={{
            flex: 1,
            padding: '12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#2563eb'}
          onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
        >
          💾 Lưu ({totalZones} zones)
        </button>
      </div>
    </div>
  );
}

export default DrawingCanvas;