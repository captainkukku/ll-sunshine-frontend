import React from 'react';
import './UploadArea.css';

interface Props {
  onSelect: (file: File) => void;
  label?: string;
  className?: string;
}

const UploadArea: React.FC<Props> = ({ onSelect, label, className }) => (
  <label className={`upload-area ${className || ''}`}>
    <input
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={e => e.target.files && onSelect(e.target.files[0])}
    />
    {label || '点击上传图片'}
  </label>
);

export default UploadArea;