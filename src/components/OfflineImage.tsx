import React, { useEffect, useState } from 'react';
import { getHDImageFromLocal, saveHDImageToLocal } from '../utils/compareImageManager';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  markerId: string;
  url?: string;
}

const OfflineImage: React.FC<Props> = ({ markerId, url, ...rest }) => {
  const [src, setSrc] = useState<string | undefined>(url);

  useEffect(() => {
    let didCancel = false;

    const loadImage = async () => {
      try {
        // 1. 尝试本地缓存
        const blob = await getHDImageFromLocal(markerId);
        if (didCancel) return;
        if (blob) {
          const objUrl = URL.createObjectURL(blob);
          setSrc(objUrl);
          return;
        }

        // 2. 本地没有 → fetch 网络图（加超时防御）
        if (url) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000); // 5 秒超时
          try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            if (didCancel) return;
            if (res.ok) {
              const newBlob = await res.blob();
              setSrc(url);
              await saveHDImageToLocal(markerId, newBlob);
            } else {
              console.warn("网络图加载失败，未找到对比图");
            }
          } catch (err) {
            clearTimeout(timeout);
            console.error("fetch 请求失败或超时", err);
          }
        }
      } catch (err) {
        console.error("加载对比图失败", err);
      }
    };

    loadImage();

    return () => {
      didCancel = true;
    };
  }, [url, markerId]);

  useEffect(() => {
    return () => {
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    };
  }, [src]);

  const handleError = async () => {
    try {
      const blob = await getHDImageFromLocal(markerId);
      if (blob) {
        const objUrl = URL.createObjectURL(blob);
        setSrc(objUrl);
      } else {
        console.warn("onError fallback 本地缓存失败");
      }
    } catch (err) {
      console.error("onError fallback 加载失败", err);
    }
  };

  return <img src={src} onError={handleError} {...rest} />;
};

export default OfflineImage;
