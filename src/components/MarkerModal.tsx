import React, { useState, useEffect } from 'react';
import UploadArea from './UploadArea';
import CompareCanvas from './CompareCanvas';
import { uploadToServer, download } from '../utils/upload';
import './MarkerModal.css';

interface Point {
  id: string;
  name: string;
  episode?: string;
  ref?: string;
}

interface CheckinInfo {
  hasImage: boolean;
  url?: string;
}

interface Props {
  data: Point;
  checkin?: CheckinInfo;
  onClose: () => void;
  onUpdate: (info?: CheckinInfo) => void;
  onUpload?: (file: File) => void;
}

type Status = 'none' | 'noImage' | 'compose' | 'withImage';

const MarkerModal: React.FC<Props> = ({ data, checkin, onClose, onUpdate, onUpload }) => {
  const initial: Status = checkin ? (checkin.hasImage ? 'withImage' : 'noImage') : 'none';
  const [status, setStatus] = useState<Status>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [shotUrl, setShotUrl] = useState('');
  const [mergedUrl, setMergedUrl] = useState(checkin?.url || '');

  const handleSelect = (f: File) => {
    setFile(f);
    setShotUrl(URL.createObjectURL(f));
    setStatus('compose');
    if (onUpload) onUpload(f);
  };

  const handleGenerate = async () => {
    if (!shotUrl || !data.ref) return;
    const blob = await composeImages(data.ref.replace('./', '/data/'), shotUrl);
    const url = await uploadToServer(blob);
    setMergedUrl(url);
    onUpdate({ hasImage: true, url });
    setStatus('withImage');
  };

  const handleDelete = () => {
    onUpdate({ hasImage: false });
    setStatus('noImage');
  };

  const handleCheckin = () => {
    onUpdate({ hasImage: false });
    setStatus('noImage');
  };

  const handleCancelCheckin = () => {
    onUpdate(undefined);
    setStatus('none');
  };

  const handleCancelCompose = () => {
    setStatus(checkin ? 'noImage' : 'none');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{data.name}</h2>
          <p>第 {data.episode || '？'} 话</p>
        </div>

        <div className="modal-screenshot">
          {data.ref ? (
            <img src={data.ref.replace('./', '/data/')} alt="原作截图" />
          ) : (
            <div className="modal-placeholder">暂无截图</div>
          )}
        </div>

        {/* … 在 MarkerModal 的 return JSX 中找到这一段 … */}
<div className="modal-actions">
  {status === 'none' && (
    <>
      <UploadArea onSelect={handleSelect}>
        <button className="btn-outline">上传对比图</button>
      </UploadArea>
      <button className="btn-primary" onClick={handleCheckin}>
        直接打卡
      </button>
    </>
  )}

  {status === 'noImage' && (
    <>
      <UploadArea onSelect={handleSelect}>
        <button className="btn-outline">上传对比图</button>
      </UploadArea>
      <button className="btn-primary" onClick={handleCancelCheckin}>
        取消打卡
      </button>
    </>
  )}

  {status === 'compose' && (
    <>
      <CompareCanvas
        official={data.ref!.replace('./', '/data/')}
        shot={shotUrl}
      />
      <button className="btn-primary" onClick={handleGenerate}>
        生成对比图
      </button>
      <button className="btn-outline" onClick={handleCancelCompose}>
        取消
      </button>
    </>
  )}

  {status === 'withImage' && (
    <>
      <img src={mergedUrl} alt="对比图" className="modal-preview" />
      <button className="btn-primary" onClick={() => download(mergedUrl)}>
        下载
      </button>
      <UploadArea onSelect={handleSelect}>
        <button className="btn-outline">重新上传</button>
      </UploadArea>
      <button className="btn-outline" onClick={handleDelete}>
        删除对比图
      </button>
    </>
  )}
</div>

      </div>
    </div>
  );
};

export default MarkerModal;

const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((ok, err) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => ok(img);
  img.onerror = err;
  img.src = src;
});

const composeImages = async (src1: string, src2: string): Promise<Blob> => {
  const [img1, img2] = await Promise.all([loadImg(src1), loadImg(src2)]);
  const canvas = document.createElement('canvas');
  const width = Math.max(img1.width, img2.width);
  const height = Math.max(img1.height, img2.height);
  canvas.width = width * 2;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img1, 0, 0, width, height);
  ctx.drawImage(img2, width, 0, width, height);
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.9));
};

