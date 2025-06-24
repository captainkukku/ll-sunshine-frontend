// 导出函数，跟 CompareCanvas 保持参数一致
export const composeImages = async (
  official: string,
  shot: string,
  scale: number,
  offsetX: number,
  offsetY: number,
  cropPercent: number
): Promise<Blob> => {
  // 加载原图和上传图
  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((ok, err) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => ok(img);
      img.onerror = err;
      img.src = src;
    });
  const [img1, img2] = await Promise.all([loadImg(official), loadImg(shot)]);

  const w = img1.width, h = img1.height;
  const cropW = w * cropPercent;
  const canvas = document.createElement('canvas');
  canvas.width = w + cropW;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // 原作图
  ctx.drawImage(img1, 0, 0, w, h);
  // 用户上传图
  ctx.save();
  ctx.beginPath();
  ctx.rect(w, 0, cropW, h);
  ctx.clip();
  ctx.drawImage(
    img2,
    offsetX, offsetY, cropW / scale, h / scale,
    w, 0, cropW, h
  );
  ctx.restore();

return new Promise((resolve, reject) => {
  canvas.toBlob(blob => {
    if (blob) resolve(blob);
    else reject(new Error('Canvas toBlob failed — possibly empty canvas'));
  }, 'image/jpeg', 0.92);
});
}