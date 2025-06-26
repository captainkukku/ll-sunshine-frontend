import React from 'react';
import './ConfirmDialog.css';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="confirm-buttons">
          <button className="btn-danger" onClick={onConfirm}>确认</button>
          <button className="btn-outline" onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
