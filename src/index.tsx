import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ThemeProvider } from "@material-tailwind/react";

// GitHub Pagesのベースパスを環境変数から取得、またはデフォルト値を設定
const getBasename = () => {
  // 開発環境では空文字列、本番環境ではリポジトリ名を返す
  return process.env.NODE_ENV === 'development' 
    ? '/' 
    : '/kosodateshienseido';
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);