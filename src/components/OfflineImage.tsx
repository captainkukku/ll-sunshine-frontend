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

  // 先试本地缓存
  getHDImageFromLocal(markerId)
    .then(blob => {
      if (didCancel) return;
      if (blob) {
        const objUrl = URL.createObjectURL(blob);
        setSrc(objUrl);
      }
    })
    .catch(err => {
      console.error("本地缓存加载失败", err);
    });

  // 再试网络图
  if (url) {
    fetch(url)
      .then(res => {
        if (didCancel) return;
        if (res.ok) {
          setSrc(url);
          // 更新缓存
          res.blob().then(blob => saveHDImageToLocal(markerId, blob));
        }
      })
      .catch(err => {
        console.warn("Supabase 图片加载失败，继续用本地缓存", err);
      });
  }

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
