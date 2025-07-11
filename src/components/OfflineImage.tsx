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
    if (!url && !navigator.onLine) {
      getHDImageFromLocal(markerId).then(blob => {
        if (blob) {
          const objUrl = URL.createObjectURL(blob);
          setSrc(objUrl);
        }
      });
    }
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
