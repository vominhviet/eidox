/**
 * @file DrawingCanvas.js
 * @description Engine vẽ zone AI dựa trên canvas HTML5.
 * Chuyển đổi tọa độ trên ảnh tĩnh thành JSON cấu hình phù hợp với mô hình AI.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './DrawingCanvas.css'; // [NEW] Import style từ file CSS đã tách

const FIXED_WIDTH = 800;
const FIXED_HEIGHT = 450;

// Khai báo các loại logic nhận diện mà AI hỗ trợ
const ZONE_TYPES = [
  { value: 1, label: 'UNKNOWN_PERSON', hasAxis: true, limit: 2, desc: 'Trục + Hướng + 2 điểm (Intrusion/Line cross)' },
  { value: 4, label: 'STAFF', hasAxis: false, limit: 4, desc: 'Vùng 4 điểm (8 chỉ số - Staff detection)' }
];

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, c => (c==='x'?Math.random()*16|0:(Math.random()*16|0&0x3|0x8)).toString(16));

function DrawingCanvas({ cameraData, onSave }) {
  if (!cameraData) {
    return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '100px', background: '#050505', minHeight: '100vh' }}>⚠️ Chờ dữ liệu Camera...</div>;
  }

  const canvasRef = useRef(null);

  // States
  const [currentStep, setCurrentStep] = useState(1); 
  const [drawing, setDrawing] = useState(false);
  const [zones, setZones] = useState([]);
  const [currentZone, setCurrentZone] = useState({ name: '', type: 1, lines: [], polyPoints: [] });
  const [ix, setIx] = useState(-1);
  const [iy, setIy] = useState(-1);
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState(1);

  /**
   * Tính toán và cấu trúc lại các zone theo đúng định dạng JSON chuẩn của AI service.
   * Format: Chuyển đổi pixel tuyệt đối -> relative coords (0..1).
   */
  const generateJSON = useCallback(() => {
    const allZones = [...zones];
    if (currentZone.polyPoints.length > 0 || currentZone.lines.length > 0) {
      allZones.push({ ...currentZone, type: zoneType });
    }

    return {
      list_camera: [{
        cam_info: { url: cameraData.rtspUrl || "", cam_id: "AI_CAM_01" },
        config: { 
          zone: allZones.map(z => {
            const typeInfo = ZONE_TYPES.find(t => t.value === z.type);
            const limit = typeInfo?.limit || 4;
            
            // Xử lý tọa độ (Coord) - padding nếu chưa đủ điểm
            const pts = [...z.polyPoints];
            while (pts.length < limit) pts.push({ x: 0, y: 0 });
            const coord = pts.slice(0, limit).flatMap(p => [
              Number((p.x / FIXED_WIDTH).toFixed(3)), 
              Number((p.y / FIXED_HEIGHT).toFixed(3))
            ]);
            
            // Xử lý hướng/trục (Axis)
            let axis = [];
            if (typeInfo?.hasAxis && z.lines.length >= 1) {
              const l1 = z.lines[0]; // Chỉ lấy trục chính để chuẩn hoá
              axis = [
                Number((l1[0] / FIXED_WIDTH).toFixed(3)), 
                Number((l1[1] / FIXED_HEIGHT).toFixed(3)), 
                Number((l1[2] / FIXED_WIDTH).toFixed(3)), 
                Number((l1[3] / FIXED_HEIGHT).toFixed(3))
              ];
            }

            return { ID: generateUUID(), type: z.type, axis, coord };
          })
        }
      }]
    };
  }, [zones, currentZone, zoneType, cameraData]);

  /**
   * Vẽ đường thẳng hoặc mũi tên (hướng) trên canvas context gốc.
   */
  const drawLineOrArrow = useCallback((ctx, fromX, fromY, toX, toY, color, isArrow = false) => {
    ctx.beginPath(); 
    ctx.strokeStyle = color; 
    ctx.lineWidth = 3;
    ctx.moveTo(fromX, fromY); 
    ctx.lineTo(toX, toY); 
    ctx.stroke();

    if (isArrow) {
      const head = 12; 
      const angle = Math.atan2(toY - fromY, toX - fromX);
      ctx.beginPath(); 
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - head * Math.cos(angle - Math.PI/6), toY - head * Math.sin(angle - Math.PI/6));
      ctx.lineTo(toX - head * Math.cos(angle + Math.PI/6), toY - head * Math.sin(angle + Math.PI/6));
      ctx.closePath(); 
      ctx.fillStyle = color; 
      ctx.fill();
    }
  }, []);

  /**
   * Cập nhật hiển thị (Render logic gốc) lại khi frame/draw thay đổi.
   */
  const redrawAll = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.src = cameraData.imagePreview;
    img.onload = () => {
      // 1. Fill ảnh camera nền
      ctx.drawImage(img, 0, 0, FIXED_WIDTH, FIXED_HEIGHT);

      // 2. Loop & vẽ lại các zones đã save & zone đang vẽ
      [...zones, currentZone].forEach((z) => {
        const typeInfo = ZONE_TYPES.find(t => t.value === z.type);
        
        // Vẽ trục 
        if (typeInfo?.hasAxis) {
          if (z.lines[0]) drawLineOrArrow(ctx, z.lines[0][0], z.lines[0][1], z.lines[0][2], z.lines[0][3], '#3b82f6', false);
          if (z.lines[1]) drawLineOrArrow(ctx, z.lines[1][0], z.lines[1][1], z.lines[1][2], z.lines[1][3], '#10b981', true);
        }

        // Vẽ vùng khoanh (Polygon)
        if (z.polyPoints.length > 0) {
          ctx.beginPath(); 
          ctx.strokeStyle = '#ef4444'; 
          ctx.lineWidth = 2;
          z.polyPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
          if (z.polyPoints.length > 2) ctx.closePath();
          ctx.stroke(); 
          
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; 
          ctx.fill();
          
          // Vẽ góc point rõ ràng hơn
          z.polyPoints.forEach(p => { 
            ctx.fillStyle = '#ef4444'; 
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, 4, 0, Math.PI*2); 
            ctx.fill(); 
          });
        }
      });
    };
  }, [cameraData.imagePreview, zones, currentZone, drawLineOrArrow]);

  useEffect(() => { 
    redrawAll(); 
  }, [redrawAll]);

  // Hook logic lấy offsetX/Y chính xác
  const resolveCoord = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (FIXED_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (FIXED_HEIGHT / rect.height);
    return { x, y };
  };

  const handleMouseDown = (e) => {
    const { x, y } = resolveCoord(e);
    const typeInfo = ZONE_TYPES.find(t => t.value === zoneType);
    
    // Nếu rule có Axis vẽ (vd: Line Cross)
    if (typeInfo?.hasAxis && currentStep < 3) { 
      setDrawing(true); 
      setIx(x); 
      setIy(y); 
    } else { 
      // Rule vẽ đa giác 4+ điểm
      setCurrentZone(p => ({ ...p, polyPoints: [...p.polyPoints, {x, y}] })); 
    }
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const { x, y } = resolveCoord(e);
    redrawAll();
    drawLineOrArrow(canvasRef.current.getContext('2d'), ix, iy, x, y, currentStep === 1 ? '#3b82f6' : '#10b981', currentStep === 2);
  };

  const handleMouseUp = (e) => {
    if (!drawing) return;
    const { x, y } = resolveCoord(e);
    setCurrentZone(p => ({ ...p, lines: [...p.lines, [ix, iy, x, y]] }));
    setDrawing(false); 
    setCurrentStep(s => s + 1);
  };

  const handleReset = () => { 
    setCurrentZone({ name: '', type: zoneType, lines: [], polyPoints: [] }); 
    setCurrentStep(1); 
  };

  return (
    <div className="canvas-container">
      {/* ---------------- TRÁI: KHU VỰC CANVAS VÀ JSON OUTPUT ---------------- */}
      <div className="canvas-left-area">
        <div className="canvas-header">
          <h2 className="canvas-title">Hệ Thống Thiết Lập Zone AI</h2>
          <div className="step-indicators">
            <span className={`step-badge ${currentStep === 1 ? 'step-badge-blue' : 'step-badge-inactive'}`}>1. Trục Axis</span>
            <span className={`step-badge ${currentStep === 2 ? 'step-badge-green' : 'step-badge-inactive'}`}>2. Hướng Đi</span>
            <span className={`step-badge ${currentStep >= 3 ? 'step-badge-red' : 'step-badge-inactive'}`}>3. Vùng Coord</span>
          </div>
        </div>

        {/* Khung vẽ thực tế */}
        <div className="canvas-wrapper">
          <canvas 
            ref={canvasRef} 
            width={FIXED_WIDTH} 
            height={FIXED_HEIGHT} 
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
            className="ai-canvas"
          />
        </div>

        {/* Real-time Code Output (Payload) */}
        <div className="json-preview">
          <div className="json-header">
            <span>Real-time Output Configuration</span>
            <span className="json-format-label">Format: AI-Standard-v2</span>
          </div>
          <pre className="json-code">
            {JSON.stringify(generateJSON(), null, 2)}
          </pre>
        </div>
      </div>

      {/* ---------------- PHẢI: KHU VỰC THAO TÁC (CONTROLS) ---------------- */}
      <div className="canvas-right-area">
        
        {/* Form thiết lập thông số Zone mới */}
        <div className="control-panel">
          <h4 className="panel-title">Tham số khu vực</h4>
          <input 
            placeholder="Nhập tên Zone (ví dụ: Cửa chính)..." 
            value={zoneName} 
            onChange={e => setZoneName(e.target.value)} 
            className="zone-name-input"
          />
          
          <div className="zone-types-list">
            {ZONE_TYPES.map(t => (
              <div 
                key={t.value} 
                className={`zone-type-item ${zoneType === t.value ? 'zone-type-item-selected' : 'zone-type-item-unselected'}`}
                onClick={() => { setZoneType(t.value); handleReset(); }} 
              >
                <div className={`type-label ${zoneType === t.value ? 'type-label-selected' : 'type-label-unselected'}`}>
                  {t.label}
                </div>
                <div className="type-desc">{t.desc}</div>
              </div>
            ))}
          </div>

          <button className="btn-save-zone" onClick={() => {
            if(!zoneName) return alert("Vui lòng nhập tên (ví dụ: Cửa Ra, Cửa Vào)!");
            setZones([...zones, { ...currentZone, name: zoneName, type: zoneType }]);
            handleReset(); 
            setZoneName('');
          }}>LƯU CẤU HÌNH AI</button>
          
          <button className="btn-reset-zone" onClick={handleReset}>
            LÀM MỚI VÙNG ĐANG VẼ
          </button>
        </div>

        {/* Danh sách các Zone đã lưu thành công */}
        <div className="zone-list-panel">
          <h4 className="panel-title">Vùng đã thiết lập ({zones.length})</h4>
          <div className="zone-list">
            {zones.map((z, i) => (
              <div key={i} className={`zone-item ${z.type === 4 ? 'zone-item-type-staff' : 'zone-item-type-person'}`}>
                <div>
                  <div className="zone-item-name">{z.name}</div>
                  <div className="zone-item-type-label">{z.type === 4 ? 'STAFF DETECTION' : 'PERSON COUNTER'}</div>
                </div>
                <button 
                  className="btn-remove-zone" 
                  onClick={() => setZones(zones.filter((_, idx) => idx !== i))}
                  title="Xoá zone này"
                >✕</button>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DrawingCanvas;
