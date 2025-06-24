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

const MAX_CANVAS_WIDTH = 800;  // 你喜欢多少宽都行
const MAX_CANVAS_HEIGHT = 140; // 或360，看你弹窗最大能装多少

const CompareCanvas: React.FC<Props> = ({
  official,
  shot,
  onTransformChange,
  initialCropPercent = 0.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img1Size, setImg1Size] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [cropPercent, setCropPercent] = useState(initialCropPercent);
  const [draggingImg, setDraggingImg] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);

  // 算比例锁宽高，不超弹窗最大
  const getCanvasScale = (w: number, h: number) => {
    const sw = MAX_CANVAS_WIDTH / w;
    const sh = MAX_CANVAS_HEIGHT / h;
    return Math.min(1, sw, sh);
  };

  // 渲染合成画布
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

      const cropW = Math.max(1, Math.min(w1 * 1.1, w1 * cropPercent));
      canvas.width = (w1 + cropW) * _canvasScale;
      canvas.height = h1 * _canvasScale;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 原作
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

      // 用户图（裁剪，变换）
      ctx.save();
      ctx.beginPath();
      ctx.rect(w1 * _canvasScale, 0, cropW * _canvasScale, h1 * _canvasScale);
      ctx.clip();
      ctx.drawImage(
        img2,
        offsetX / scale,
        offsetY / scale,
        cropW / scale,
        h1 / scale,
        w1 * _canvasScale,
        0,
        cropW * _canvasScale,
        h1 * _canvasScale
      );
      ctx.restore();

      // 裁剪手柄线
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

  useEffect(draw, [official, shot, scale, offsetX, offsetY, cropPercent]);

  // 拖动用户图
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
    // 拖拽裁剪条
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

  // 拖拽裁剪手柄
  const onMouseDownResize = (e: React.MouseEvent) => {
    setResizing(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
    e.preventDefault();
  };

  // 缩放用户图（鼠标滚轮）
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.2, Math.min(5, s * (e.deltaY > 0 ? 1.08 : 0.92))));
  };

  // 视觉部分
  return (
    <div style={{ userSelect: 'none', width: '100%' }}>
      <div
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
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDownImg}
        onMouseMove={onMouseMoveImg}
        onMouseUp={onMouseUpAny}
        onMouseLeave={onMouseUpAny}
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
        {/* 裁剪手柄 */}
        {img1Size.width > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `calc(${
                ((img1Size.width + img1Size.width * cropPercent) /
                  (img1Size.width + img1Size.width * cropPercent)) *
                100
              }% - 16px)`, // 始终右边
              width: '16px',
              height: '100%',
              transform: `translateX(-50%)`,
              cursor: 'ew-resize',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseDown={onMouseDownResize}
          >
            {/* 视觉手柄 */}
            <div
              style={{
                width: '6px',
                height: '80%',
                background: 'rgba(100,100,100,0.18)',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid #999',
                  marginBottom: 2,
                }}
              />
              <div style={{ flex: 1, width: 2, background: '#aaa' }} />
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid #999',
                  marginTop: 2,
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 6, textAlign: 'center' }}>
        拖动图片移动，滚轮缩放，拖动右侧手柄裁剪宽度
      </div>
    </div>
  );
};

export default CompareCanvas;
