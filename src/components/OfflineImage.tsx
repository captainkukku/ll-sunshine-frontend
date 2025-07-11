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
  let didCancel = false; // 避免组件卸载后 setState

  // 先尝试用本地缓存
  getHDImageFromLocal(markerId).then(blob => {
    if (didCancel) return;
    if (blob) {
      const objUrl = URL.createObjectURL(blob);
      setSrc(objUrl); // 先显示本地图
    }
  });

  // 如果有网络，再尝试加载 Supabase 图
  if (url) {
    fetch(url)
      .then(res => {
        if (didCancel) return;
        if (res.ok) {
          setSrc(url); // 更新为网络图
          // 更新缓存
          fetch(url)
            .then(r => r.blob())
            .then(blob => saveHDImageToLocal(markerId, blob));
        }
      })
      .catch(err => {
        console.error("获取 Supabase 图失败，用本地缓存代替：", err);
      });
  }

  return () => {
    didCancel = true; // 清理逻辑
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
