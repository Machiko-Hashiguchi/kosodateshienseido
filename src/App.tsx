import { DataValidator } from './components/DataValidator';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <DataValidator />
    </main>
  )
}
// GitHub Pagesのベースパスを環境変数から取得、またはデフォルト値を設定
const getBasename = () => {
  // 開発環境では空文字列、本番環境ではリポジトリ名を返す
  return process.env.NODE_ENV === 'development' 
    ? '/' 
    : '/kosodateshienseido';
};

export default App