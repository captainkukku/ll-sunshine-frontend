import React, { useState } from 'react';
import UploadArea from './UploadArea';
import CompareCanvas from './CompareCanvas';
import { uploadToServer, download } from '../utils/upload';
import CommunityWallPage from './CommunityWallPage';
import './MarkerModal.css';

interface Point {
  id: string;
  name: string;
  ep?: number | null;
  s?: number | null;
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

function formatTime(sec: number): string {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const MarkerModal: React.FC<Props> = ({
  data,
  checkin,
  onClose,
  onUpdate,
  onUpload,
}) => {
  const initial: Status = checkin
    ? checkin.hasImage
      ? 'withImage'
      : 'noImage'
    : 'none';

  const [status, setStatus] = useState<Status>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [shotUrl, setShotUrl] = useState('');
  const [mergedUrl, setMergedUrl] = useState(checkin?.url || '');
  const [activeTab, setActiveTab] = useState<'info' | 'community'>('info');

  const handleSelect = (f: File) => {
    setFile(f);
    setShotUrl(URL.createObjectURL(f));
    setStatus('compose');
    onUpload && onUpload(f);
  };

  const handleGenerate = async () => {
    if (!file || !data.ref) return;
    const blob = await composeImages(
      data.ref.replace('./', '/data/'),
      shotUrl
    );
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
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="browser-style-tabs">
          <div
            className={`wall-browser-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📍 打卡
          </div>
          <div
            className={`wall-browser-tab ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            💬 留言板
          </div>
        </div>

        <div className="modal-content">
          {activeTab === 'info' && (
            <>
              <div className="modal-header">
                <h2>{data.name}</h2>
                <p>
                  第 {data.ep ?? '?'} 话
                  {data.s != null && ` ${formatTime(data.s)}`}
                </p>
              </div>

              {(status === 'none' || status === 'noImage') && (
                <div className="modal-screenshot">
                  {data.ref ? (
                    <img
                      src={data.ref.replace('./', '/data/')}
                      alt="原作截图"
                    />
                  ) : (
                    <div className="modal-placeholder">暂无截图</div>
                  )}
                </div>
              )}

              <div className="modal-actions">
                {status === 'none' && (
                  <>
                    <UploadArea onSelect={handleSelect} label="点击上传图片" />
                    <button className="btn-primary" onClick={handleCheckin}>
                      打卡
                    </button>
                  </>
                )}

                {status === 'noImage' && (
                  <>
                    <UploadArea onSelect={handleSelect} label="点击上传图片" />
                    <button
                      className="btn-outline"
                      onClick={handleCancelCheckin}
                    >
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
                    <img
                      src={mergedUrl}
                      alt="对比图"
                      className="modal-preview"
                    />
                    <button
                      className="btn-primary"
                      onClick={() => download(mergedUrl)}
                    >
                      下载对比图
                    </button>
                    <UploadArea
                      onSelect={handleSelect}
                      label="重新上传"
                      className="btn-outline"
                    />
                    <button className="btn-outline" onClick={handleDelete}>
                      删除对比图
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {activeTab === 'community' && (
            <CommunityWallPage pointId={data.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkerModal;

const loadImg = (src: string): Promise<HTMLImageElement> =>
  new Promise((ok, err) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = err;
    img.src = src;
  });

const composeImages = async (src1: string, src2: string): Promise<Blob> => {
  const [img1, img2] = await Promise.all([loadImg(src1), loadImg(src2)]);
  const canvas = document.createElement('canvas');
  const w = img1.width;
  const h = img1.height;
  canvas.width = w * 2;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img1, 0, 0, w, h);
  ctx.drawImage(img2, w, 0, w, h);
  return new Promise(resolve =>
    canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9)
  );
};