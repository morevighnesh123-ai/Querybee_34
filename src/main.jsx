import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { QueryBeeWidget } from './querybee-widget.jsx';

const el = document.getElementById('querybee-root');
if (el) {
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <QueryBeeWidget />
    </React.StrictMode>
  );
}
