// src/components/UploadArea.tsx
import React, { useRef, PropsWithChildren } from 'react';
import './UploadArea.css';

interface UploadAreaProps {
  /** 选中文件后回调 */
  onSelect: (file: File) => void;
  /** 覆盖默认文字或节点，比如 <button>Upload</button> */
  children?: React.ReactNode;
  /** 额外的 className */
  className?: string;
  /** 如果不传 children，则显示该文案 */
  label?: string;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  onSelect,
  children,
  className = '',
  label = '点击上传图片'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击区域时触发文件选择框
  const handleClick = () => {
    inputRef.current?.click();
  };

  // 文件选中后回调，并清空 value 以便可重复选同一个文件
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
      e.target.value = '';
    }
  };

  return (
    <div
      className={`upload-area ${className}`}
      onClick={handleClick}
      role="button"
      style={{ cursor: 'pointer' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {children ?? label}
    </div>
  );
};

export default UploadArea;
