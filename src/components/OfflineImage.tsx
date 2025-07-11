import React, { useEffect, useState } from 'react';
import { getHDImageFromLocal } from '../utils/compareImageManager';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  markerId: string;
  url?: string;
}

const OfflineImage: React.FC<Props> = ({ markerId, url, ...rest }) => {
  const [src, setSrc] = useState<string | undefined>(url);

  useEffect(() => {
    setSrc(url);
  }, [url]);

useEffect(() => {
  let didCancel = false;

  const loadImage = async () => {
    try {
      // 先加载本地缓存
      const blob = await getHDImageFromLocal(markerId);
      if (didCancel) return;
      if (blob) {
        const objUrl = URL.createObjectURL(blob);
        setSrc(objUrl);
      } else if (url) {
        // 本地没有 → 试加载网络图
        const res = await fetch(url);
        if (didCancel) return;
        if (res.ok) {
          setSrc(url);
          // 保存到本地缓存
          const newBlob = await res.blob();
          await saveHDImageToLocal(markerId, newBlob);
        } else {
          console.warn("网络图加载失败，使用本地缓存");
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
    const blob = await getHDImageFromLocal(markerId);
    if (blob) {
      const objUrl = URL.createObjectURL(blob);
      setSrc(objUrl);
    }
  };

  return <img src={src} onError={handleError} {...rest} />;
};

export default OfflineImage;
