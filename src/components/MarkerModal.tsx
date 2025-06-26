// 📁 src/components/MarkerModal.tsx
import React, { useState, useEffect } from 'react';
import UploadArea from './UploadArea';
import CompareCanvas from './CompareCanvas';
import CommunityWallPage from './CommunityWallPage';
import ConfirmDialog from './ConfirmDialog';
import './MarkerModal.css';
import { composeImages } from '../utils/composeImages';
import { uploadAndCache, deleteImageFromSupabase, deleteHDImageFromLocal, getUserUUID } from '../utils/compareImageManager';
import { postMessageToServer } from '../utils/communityWallManager';
import { deleteMessageByPointAndUser } from '../utils/communityAPI';
import { supabase } from '../utils/supabaseClient';

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

function getCacheBustingUrl(url?: string) {
  return url ? `${url}?cb=${Date.now()}` : '';
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
  const [newMessage, setNewMessage] = useState('');
  const [withImage, setWithImage] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [cropPercent, setCropPercent] = useState(0.3);
  const [confirmDialog, setConfirmDialog] = useState<null | { message: string, onConfirm: () => void }>(null);

  // 🧹 一键清除缓存（仅调试时启用）
  const ENABLE_DEV_CACHE_CLEANUP = false; // 👈 发布后改为 false 或注释掉

  useEffect(() => {
    if (ENABLE_DEV_CACHE_CLEANUP && 'caches' in window) {
      console.log('[🧹 DEV MODE] 清除所有缓存');
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }
  }, []);

  const handleSelect = (f: File) => {
    const startNewUpload = () => {
      setFile(f);
      setShotUrl(URL.createObjectURL(f));
      setStatus('compose');
      onUpload?.(f);
    };
    if (status === 'withImage') {
      setConfirmDialog({
        message: '将删除原有的对比图与留言，确定重新上传吗？',
        onConfirm: async () => {
          setConfirmDialog(null);
          await confirmDelete();
          startNewUpload();
        }
      });
    } else {
      startNewUpload();
    }
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
    try {
      const url = await uploadAndCache(blob, data.id);
      setMergedUrl(url);
      onUpdate({ hasImage: true, url });
      setStatus('withImage');
    } catch (err) {
      console.error('❌ 上传失败', err);
      setStatus('default');
    }
  };

  const confirmDelete = async () => {
    if (!checkin?.url) return;
    const path = checkin.url.split('/').slice(-2).join('/');
    await deleteImageFromSupabase(path);
    await deleteHDImageFromLocal(data.id);
    await deleteMessageByPointAndUser(data.id);
    setMergedUrl('');
    onUpdate({ hasImage: false });
    setStatus('noImage');
  };

  const handleDelete = () => {
    setConfirmDialog({
      message: '将会永久删除此点位的对比图与留言，确定继续吗？',
      onConfirm: async () => {
        setConfirmDialog(null);
        await confirmDelete();
      }
    });
  };

  const handleCancelCheckin = async () => {
    try {
      await deleteMessageByPointAndUser(data.id);
    } catch (err) {
      console.error('❌ 删除留言失败:', err);
    }
    onUpdate(undefined);
    setStatus('none');
  };

  const handleCancelCompose = () => {
    setStatus(checkin ? 'noImage' : 'none');
  };

  const handleSubmit = async () => {
    if (status === 'none') {
      alert('😝 先打卡才能留言哦！');
      return;
    }
    if (!newMessage.trim()) return;
    const finalUrl = withImage && mergedUrl ? mergedUrl : null;
    try {
      await supabase.from('wall_messages').insert({
        point_id: data.id,
        user_id: getUserUUID(),
        message: newMessage,
        url: finalUrl,
        has_image: !!finalUrl,
        like_count: 0,
      });
      setNewMessage('');
      setWithImage(false);
      setReloadFlag(f => f + 1);
    } catch (err: any) {
      console.error('❌ 留言失败：', err);
      alert('留言失败：' + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="browser-style-tabs">
          <div className={`wall-browser-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>📍 打卡</div>
          <div className={`wall-browser-tab ${activeTab === 'community' ? 'active' : ''}`} onClick={() => setActiveTab('community')}>💬 留言板</div>
        </div>
        <div className="modal-content">
          {activeTab === 'info' && (
            <>
              <div className="modal-header">
                <h2>{data.name}</h2>
                <p>第 {data.ep ?? '?'} 话{data.s != null && ` ${formatTime(data.s)}`}</p>
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
                    <button className="btn-primary" onClick={() => onUpdate({ hasImage: false })}>打卡</button>
                  </>
                )}
                {status === 'noImage' && (
                  <>
                    <UploadArea onSelect={handleSelect} label="点击上传图片" />
                    <button className="btn-outline" onClick={handleCancelCheckin}>取消打卡</button>
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
                      <button className="btn-primary wide-btn" onClick={handleGenerate}>生成对比图</button>
                      <button className="btn-outline wide-btn" onClick={handleCancelCompose}>取消</button>
                    </div>
                  </div>
                )}
                {status === 'withImage' && (
                  <div className="modal-preview-wrapper">
                    <img src={getCacheBustingUrl(mergedUrl)} className="modal-preview" alt="对比图" />
                    <div className="modal-preview-buttons">
                      <button className="btn-primary" onClick={() => download(mergedUrl, `compare-${data.id}.jpg`)}>下载对比图</button>
                      <UploadArea onSelect={handleSelect} label="重新上传" className="btn-outline" />
                      <button className="btn-outline" onClick={handleDelete}>删除对比图</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {activeTab === 'community' && (
            <>
              <CommunityWallPage pointId={data.id} reloadFlag={reloadFlag} />
              <div className="wall-input-bar">
                <textarea className="wall-textarea" placeholder="留下你的留言吧（最多60字）..." maxLength={60} value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                <div className="wall-tools">
                  <label className="wall-toggle">
                    <input type="checkbox" className="toggle-switch" checked={withImage} onChange={() => setWithImage(!withImage)} /> 附图
                  </label>
                  <button className="wall-submit-btn" onClick={handleSubmit} disabled={!newMessage.trim()}>发布</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};

export default MarkerModal;
