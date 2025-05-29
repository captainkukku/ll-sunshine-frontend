import React, { useState } from 'react';
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

const MarkerModal: React.FC<Props> = ({
  data,
  checkin,
  onClose,
  onUpdate,
  onUpload,
}) => {
  // 根据当前是否已打卡+有无图片 决定初始态
  const initial: Status = checkin
    ? checkin.hasImage
      ? 'withImage'
      : 'noImage'
    : 'none';

  const [status, setStatus] = useState<Status>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [shotUrl, setShotUrl] = useState('');
  const [mergedUrl, setMergedUrl] = useState(checkin?.url || '');

  // 用户选图
  const handleSelect = (f: File) => {
    setFile(f);
    setShotUrl(URL.createObjectURL(f));
    setStatus('compose');
    onUpload && onUpload(f);
  };

  // 点击「生成对比图」
  const handleGenerate = async () => {
    if (!file || !data.ref) return;
    // 合成并上传
    const blob = await composeImages(
      data.ref.replace('./', '/data/'),
      shotUrl
    );
    const url = await uploadToServer(blob);
    setMergedUrl(url);
    onUpdate({ hasImage: true, url });
    setStatus('withImage');
  };

  // 删除对比图
  const handleDelete = () => {
    onUpdate({ hasImage: false });
    setStatus('noImage');
  };

  // 直接打卡（无图）
  const handleCheckin = () => {
    onUpdate({ hasImage: false });
    setStatus('noImage');
  };

  // 取消打卡
  const handleCancelCheckin = () => {
    onUpdate(undefined);
    setStatus('none');
  };

  // 从合成态退回上一个状态
  const handleCancelCompose = () => {
    setStatus(checkin ? 'noImage' : 'none');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* 标题 + 第几话 */}
        <div className="modal-header">
          <h2>{data.name}</h2>
          <p>第 {data.episode || '?'} 话</p>
        </div>

        {/* 原作截图 */} {/* ★ 只有在非「compose」时才显示这块 */}
         {(status === 'none' || status === 'noImage') && (
          <div className="modal-screenshot">
            {data.ref ? (
              <img src={data.ref.replace('./', '/data/')} alt="原作截图" />
            ) : (
              <div className="modal-placeholder">暂无截图</div>
          )}
        </div>
      )}
        {/* 底部动作区 */}
        <div className="modal-actions">
          {/* 1. none: 未打卡 */}
          {status === 'none' && (
            <>
              <UploadArea onSelect={handleSelect} label="点击上传图片" />
              <button className="btn-primary" onClick={handleCheckin}>
                打卡
              </button>
            </>
          )}

          {/* 2. noImage: 已打卡但还没传图 */}
          {status === 'noImage' && (
            <>
              <UploadArea onSelect={handleSelect} label="点击上传图片" />
              <button className="btn-outline" onClick={handleCancelCheckin}>
                取消打卡
              </button>
            </>
          )}

          {/* 3. compose: 合成预览，可拖拽/缩放 */}
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

          {/* 4. withImage: 已生成对比图 */}
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
      </div>
    </div>
  );
};

export default MarkerModal;

/** helper: 合并左右两张图，返回 Blob */
const loadImg = (src: string): Promise<HTMLImageElement> =>
  new Promise((ok, err) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = err;
    img.src = src;
  });

const composeImages = async (
  src1: string,
  src2: string
): Promise<Blob> => {
  const [img1, img2] = await Promise.all([loadImg(src1), loadImg(src2)]);
  const canvas = document.createElement('canvas');
  const w = img1.width;
  const h = img1.height;
  canvas.width = w * 2;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // 左边原作
  ctx.drawImage(img1, 0, 0, w, h);
  // 右边用户图（按照画布宽高自动拉伸／裁剪）
  ctx.drawImage(img2, w, 0, w, h);
  return new Promise(resolve =>
    canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9)
  );
};
