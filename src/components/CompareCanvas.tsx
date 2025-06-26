import React, { useRef, useEffect, useState } from 'react';
import './CompareCanvas.css';

interface Props {
  official: string;
  shot: string;
  onTransformChange?: (
    params: { scale: number; offsetX: number; offsetY: number; cropPercent: number }
  ) => void;
  initialCropPercent?: number;
}

const MAX_CANVAS_WIDTH = 800;
const isMobile = window.innerWidth < 768;
const MAX_CANVAS_HEIGHT = isMobile ? 100 : 140;

const CompareCanvas: React.FC<Props> = ({
  official,
  shot,
  onTransformChange,
  initialCropPercent = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [img1Size, setImg1Size] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [cropPercent, setCropPercent] = useState(initialCropPercent);
  const [draggingImg, setDraggingImg] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [initialized, setInitialized] = useState(false);

  const getCanvasScale = (w: number, h: number) => {
    const sw = MAX_CANVAS_WIDTH / w;
    const sh = MAX_CANVAS_HEIGHT / h;
    return Math.min(1, sw, sh);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img1 = new window.Image();
    const img2 = new window.Image();
    img1.crossOrigin = 'anonymous';
    img2.crossOrigin = 'anonymous';
    img1.src = official;
    img2.src = shot;

    Promise.all([
      new Promise((res) => (img1.onload = res)),
      new Promise((res) => (img2.onload = res)),
    ]).then(() => {
      const w1 = img1.width;
      const h1 = img1.height;
      setImg1Size({ width: w1, height: h1 });
      const _canvasScale = getCanvasScale(w1, h1);
      setCanvasScale(_canvasScale);

      if (!initialized) {
        setScale(1);
        setCropPercent(1);
        setInitialized(true);
      }

      const cropW = w1; // 固定右侧绘图区域逻辑宽度 = 左图宽度
      canvas.width = (w1 * 2) * _canvasScale; // 固定画布为 左 + 右原始宽度
      canvas.width = (w1 + cropW) * _canvasScale;
      canvas.height = h1 * _canvasScale;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        img1,
        0,
        0,
        w1,
        h1,
        0,
        0,
        w1 * _canvasScale,
        h1 * _canvasScale
      );

      ctx.save();
      ctx.beginPath();
      ctx.rect(w1 * _canvasScale, 0, w1 * cropPercent * _canvasScale, h1 * _canvasScale);
      ctx.clip();


      const displayW = img2.width * scale;
      const displayH = img2.height * scale;

      ctx.drawImage(
        img2,
        0,
        0,
        img2.width,
        img2.height,
        w1 * _canvasScale + offsetX * _canvasScale,
        offsetY * _canvasScale,
        displayW * _canvasScale,
        displayH * _canvasScale
      );

      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#222';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((w1 + cropW) * _canvasScale, 0);
      ctx.lineTo((w1 + cropW) * _canvasScale, h1 * _canvasScale);
      ctx.stroke();
      ctx.restore();

      onTransformChange?.({ scale, offsetX, offsetY, cropPercent });
    });
  };

  useEffect(draw, [official, shot, offsetX, offsetY, cropPercent, scale]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const touchHandler = (e: TouchEvent) => {
      if (draggingImg || resizing) e.preventDefault();
    };
    wrapper.addEventListener('touchmove', touchHandler, { passive: false });

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
    };
    wrapper.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      wrapper.removeEventListener('touchmove', touchHandler);
      wrapper.removeEventListener('wheel', wheelHandler);
    };
  }, [draggingImg, resizing]);

  const onMouseDownImg = (e: React.MouseEvent) => {
    if (resizing) return;
    setDraggingImg(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  };
  const onMouseMoveImg = (e: React.MouseEvent) => {
    if (draggingImg && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffsetX((x) => x + dx / canvasScale);
      setOffsetY((y) => y + dy / canvasScale);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
    if (resizing && dragStart.current && img1Size.width) {
      const dx = e.clientX - dragStart.current.x;
      setCropPercent((p) =>
        Math.max(0.1, Math.min(1.1, p + dx / (img1Size.width * canvasScale)))
      );
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };
  const onMouseUpAny = () => {
    setDraggingImg(false);
    setResizing(false);
    dragStart.current = null;
  };
  const onMouseDownResize = (e: React.MouseEvent) => {
    setResizing(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
    e.preventDefault();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (resizing) return;
    setDraggingImg(true);
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.stopPropagation();
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (draggingImg && dragStart.current) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setOffsetX((x) => x + dx / canvasScale);
      setOffsetY((y) => y + dy / canvasScale);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (resizing && dragStart.current && img1Size.width) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      setCropPercent((p) =>
        Math.max(0.1, Math.min(1.1, p + dx / (img1Size.width * canvasScale)))
      );
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchEnd = () => {
    setDraggingImg(false);
    setResizing(false);
    dragStart.current = null;
  };
  const onTouchStartResize = (e: React.TouchEvent) => {
    setResizing(true);
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.stopPropagation();
    e.preventDefault();
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.2, Math.min(5, s * (e.deltaY < 0 ? 1.08 : 0.92))));
  };

  return (
    <div style={{ userSelect: 'none', width: '100%' }}>
      <div
        ref={wrapperRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          maxWidth: MAX_CANVAS_WIDTH,
          maxHeight: MAX_CANVAS_HEIGHT,
          width: '100%',
          height: 'auto',
          margin: '0 auto',
          background: '#fafbfc',
          borderRadius: 16,
          touchAction: 'none',
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDownImg}
        onMouseMove={onMouseMoveImg}
        onMouseUp={onMouseUpAny}
        onMouseLeave={onMouseUpAny}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: MAX_CANVAS_HEIGHT,
            borderRadius: 16,
          }}
        />
        <div
          onMouseDown={onMouseDownResize}
          onTouchStart={onTouchStartResize}
          style={{
            position: 'absolute',
            top: '10%',
            bottom: '10%',
            right: 0,
            width: 16,
            cursor: 'ew-resize',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: resizing ? 'rgba(173, 216, 230, 0.2)' : 'rgba(0,0,0,0.03)',
            boxShadow: resizing ? '0 0 12px rgba(173, 216, 230, 0.6)' : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        >
          <div
            style={{
              width: 6,
              height: '90%',
              background: 'rgba(120,120,120,0.2)',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 0',
            }}
          >
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#fff',
              border: '2px solid #999',
            }} />
            <div style={{ flex: 1, width: 2, background: '#aaa' }} />
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#fff',
              border: '2px solid #999',
            }} />
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 6, textAlign: 'center' }}>
        {isMobile
          ? '用手指拖动图片，拖右侧手柄裁剪宽度，下方滑块缩放'
          : '拖动图片移动，滚轮缩放，拖动右侧手柄裁剪宽度'}
      </div>
      {isMobile && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <label style={{ fontSize: 12, color: '#666', marginRight: 8 }}>缩放:</label>
          <input
            type="range"
            min={0.2}
            max={5}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: '70%' }}
          />
        </div>
      )}
    </div>
  );
};

export default CompareCanvas;
