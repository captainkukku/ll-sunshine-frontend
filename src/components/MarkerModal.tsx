// 📁 src/components/MarkerModal.tsx
import React, { useState } from 'react';
import UploadArea from './UploadArea';
import CompareCanvas from './CompareCanvas';
import CommunityWallPage from './CommunityWallPage';
import './MarkerModal.css';
import { composeImages } from '../utils/composeImages';
import { uploadAndCache } from '../utils/compareImageManager';
import { deleteImageFromSupabase } from '../utils/compareImageManager';
import { deleteHDImageFromLocal } from '../utils/compareImageManager';
import { postMessageToServer } from '../utils/communityWallManager';
import { deleteMessageByPointAndUser } from '../utils/communityAPI'
import { supabase } from '../utils/supabaseClient'
import { getUserUUID } from '../utils/compareImageManager'


function download(url: string, filename = 'compare.jpg') {
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    });
}
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

type Status = 'none' | 'noImage' | 'withImage' | 'compose' | 'loading' | 'default';


function formatTime(sec: number): string {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
const MarkerModal: React.FC<Props> = ({ data, checkin, onClose, onUpdate, onUpload }) => {
  const initial: Status = checkin ? (checkin.hasImage ? 'withImage' : 'noImage') : 'none';

  const [status, setStatus] = useState<Status>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [shotUrl, setShotUrl] = useState('');
  const [mergedUrl, setMergedUrl] = useState(checkin?.url || '');
  const [activeTab, setActiveTab] = useState<'info' | 'community'>('info');

  // 留言区状态
  const [newMessage, setNewMessage] = useState('');
  const [withImage, setWithImage] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0)


  // 从 CompareCanvas 同步的参数
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [cropPercent, setCropPercent] = useState(0.3);

  const handleSelect = (f: File) => {
    setFile(f);
    setShotUrl(URL.createObjectURL(f));
    setStatus('compose');
    onUpload?.(f);
  };

const handleGenerate = async () => {
  if (!file || !data.ref) return;
  setStatus('loading');

  const blob = await composeImages(
    data.ref.replace('./', '/data/'),
    shotUrl,
    scale,
    offsetX,
    offsetY,
    cropPercent
  );
console.log('🧪 Blob 大小:', blob.size, blob); 
  try {
    const url = await uploadAndCache(blob, data.id);
    console.log('[生成成功]', url); // ✅ 关键调试语句

    setMergedUrl(url);
    onUpdate({ hasImage: true, url });
    setStatus('withImage');
  } catch (err) {
    console.error('❌ 上传失败', err); // ✅ 关键调试语句
    setStatus('default');
  }
};

const handleDelete = async () => {
  if (!checkin?.url) return;
  const path = checkin.url.split('/').slice(-2).join('/'); // 提取 Supabase 存储路径

  await deleteImageFromSupabase(path);       // 删云端压缩图
  await deleteHDImageFromLocal(data.id); 
  setMergedUrl('')   // 删本地高清缓存
  onUpdate({ hasImage: false });
  setStatus('noImage');
};

  const handleCheckin = () => {
    onUpdate({ hasImage: false });
    setStatus('noImage');
  };
const handleCancelCheckin = async () => {
  try {
    await deleteMessageByPointAndUser(data.id) // ✅ data.id 是当前点位的 ID，如 "krzb38ia6"
    console.log('🧼 已取消打卡并删除留言')
  } catch (err) {
    console.error('❌ 删除留言失败:', err)
  }

  onUpdate(undefined)
  setStatus('none')
}
  const handleCancelCompose = () => {
    setStatus(checkin ? 'noImage' : 'none');
  };

const handleSubmit = async () => {
  if (status === 'none') {
    alert('😝 先打卡才能留言哦！')
    return
  }

  if (!newMessage.trim()) return

  const finalUrl = withImage && mergedUrl ? mergedUrl : null

  try {
    await supabase.from('wall_messages').insert({
      point_id: data.id,
      user_id: getUserUUID(),
      message: newMessage,
      url: finalUrl,
      has_image: !!finalUrl,
      like_count: 0,
    })

    console.log('✅ 留言成功！写入内容：', {
      withImage,
      mergedUrl,
      finalUrl,
    })

    setNewMessage('')
    setWithImage(false)         // 🧽 清除勾选状态
    setReloadFlag(f => f + 1)   // 🔁 刷新留言列表
  } catch (err: any) {
    console.error('❌ 留言失败：', err)
    alert('留言失败：' + err.message)
  }
}



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
                    <img src={data.ref.replace('./', '/data/')} alt="原作截图" />
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
                    <button className="btn-outline" onClick={handleCancelCheckin}>
                      取消打卡
                    </button>
                  </>
                )}
               {status === 'compose' && (
                  <div className="compose-outer-wrapper">
                    <div className="compare-area">
                   <CompareCanvas
                        official={data.ref!.replace('./', '/data/')}
                        shot={shotUrl}
                        initialCropPercent={cropPercent}
                        onTransformChange={({ scale, offsetX, offsetY, cropPercent }) => {
                        setScale(scale);
                        setOffsetX(offsetX);
                        setOffsetY(offsetY);
                        setCropPercent(cropPercent);
              }}
            />
               </div>
              <div className="button-area-horizontal">
              <button className="btn-primary wide-btn" onClick={handleGenerate}>
           生成对比图
            </button>
             <button className="btn-outline wide-btn" onClick={handleCancelCompose}>
           取消
         </button>
       </div>

     </div>
   )}


                {status === 'withImage' && (
                  <div className="modal-preview-wrapper">
                    <img src={mergedUrl} className="modal-preview" alt="对比图" />
                    <div className="modal-preview-buttons">
                      <button className="btn-primary" onClick={() => download(mergedUrl, `compare-${data.id}.jpg`)}>
                        下载对比图
                      </button>
                      <UploadArea onSelect={handleSelect} label="重新上传" className="btn-outline" />
                      <button className="btn-outline" onClick={handleDelete}>
                        删除对比图
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

{activeTab === 'community' && (
  <>
    {/* 列表永远可见 */}
    <CommunityWallPage pointId={data.id} reloadFlag={reloadFlag} />

    {/* 发布区也永远渲染，只是在 handleSubmit 里会拦截 */}
    <div className="wall-input-bar">
      <textarea
        className="wall-textarea"
        placeholder="留下你的留言吧（最多60字）..."
        maxLength={60}
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
      />
      <div className="wall-tools">
        <label className="wall-toggle">
          <input
            type="checkbox"
            className="toggle-switch"
            checked={withImage}
            onChange={() => setWithImage(!withImage)}
          />
          附图
        </label>
        <button
          className="wall-submit-btn"
          onClick={handleSubmit}
          disabled={!newMessage.trim()}
        >
          发布
        </button>
      </div>
    </div>
  </>
)}


        </div>
      </div>
    </div>
  );
};

export default MarkerModal;


