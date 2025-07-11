import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';
import 'leaflet/dist/leaflet.css';
import { processPendingUploads } from './utils/compareImageManager';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />);

processPendingUploads();
window.addEventListener('online', processPendingUploads);


