import React, { useRef, useEffect, useState } from 'react';
import './CompareCanvas.css';

interface CompareCanvasProps {
  official: string; // /data/... 原作图
  shot: string;     // 用户拍摄图 URL
}

const CompareCanvas: React.FC<CompareCanvasProps> = ({
  official,
  shot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 用户图的缩放 & 偏移
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // 图片对象引用
    const offImg = useRef<HTMLImageElement | null>(null);
    const shotImg = useRef<HTMLImageElement | null>(null);

  // load both
  useEffect(() => {
    const o = new Image();
    o.crossOrigin = 'anonymous';
    o.src = official;
    o.onload = () => {
      offImg.current = o;
      draw();
    };

    const s = new Image();
    s.crossOrigin = 'anonymous';
    s.src = shot;
    s.onload = () => {
      shotImg.current = s;
      draw();
    };
  }, [official, shot]);

  // redraw on offset/scale change
  useEffect(draw, [offset, scale]);

  function draw() {
    const c = canvasRef.current;
    const o = offImg.current;
    if (!c || !o) return;
    const ctx = c.getContext('2d')!;
    const w = o.width;
    const h = o.height;
    c.width = w * 2;
    c.height = h;
    ctx.clearRect(0, 0, c.width, c.height);

    // 左半：原作
    ctx.drawImage(o, 0, 0, w, h);

    // 右半：用户图，带偏移 & 缩放
    const u = shotImg.current;
    if (u) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(w, 0, w, h);
      ctx.clip();

      const iw = u.width * scale;
      const ih = u.height * scale;
      const dx = w + offset.x;
      const dy = offset.y;
      ctx.drawImage(u, dx, dy, iw, ih);
      ctx.restore();
    }
  }

  // 拖拽移动
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(off => ({ x: off.x + dx, y: off.y + dy }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // 滚轮缩放
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(0.2, Math.min(5, s - e.deltaY * 0.001)));
  };

  return (
    <canvas
      ref={canvasRef}
      className="compare-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
    />
  );
};

export default CompareCanvas;