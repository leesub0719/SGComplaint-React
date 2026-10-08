import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './shared/public-legacy-pages.css';
import './shared/public-compat.css';
import './shared/admin-legacy.css';
import './shared/admin-compat.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
