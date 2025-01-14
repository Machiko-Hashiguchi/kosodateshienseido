# データ品質チェッカー MVP要件定義書
## 概要
シンプルな単一ページのWebアプリケーションとして、ファイルアップロードとバリデーション結果の表示に特化している。
Excelファイル、JSONファイル、データ定義スキーマの整合性を検証し、結果を画面表示およびCSVファイルとして出力する。
## 機能要件
1. 最小限の機能セット
   - 3種類のファイル（Excel、JSON、スキーマCSV）アップロード
2. バリデーション実行
   - レコード数チェック
     - Excel・JSONファイル間のレコード数一致確認
   - データ定義整合性チェック
     - スキーマで定義された各項目とExcelデータの整合性確認
     - 必須項目チェック
     - データ型チェック
     - 許容値チェック
3. 結果表示
  - 画面表示
     - レコード数チェック結果をアラートとして表示
     - エラー件数のサマリー表示
  - CSV出力
     - スキーマバリデーション結果をCSVファイルとして出力
     - エラーがあるレコードのみを出力

## 非機能要件
### アーキテクチャ
フロントエンドのみの構成（バックエンド不要）
GitHub Pagesで無料ホスティング

### 技術スタック
React + TypeScript + Tailwind CSS + Material Tailwind
外部ライブラリ:
SheetJS (Excelファイル読み込み)
PapaParse (CSV読み込み)

## 画面構成
シングルページで構成:
1. ファイルアップロードエリア
   - 3つのファイル選択ボタン
   - アップロード状態表示

2. 結果表示エリア
   - チェック結果一覧
   - エラー箇所のハイライト
   - レコード数チェック結果
     - Excel件数
     - JSON件数
     - 一致/不一致ステータス
   - バリデーションサマリー
     - 総エラー件数
     - 項目別エラー件数
   - CSVダウンロードボタン

## 出力ファイル仕様
バリデーション結果csv
| 行番号 | psid                        | 自治体名 | 通称   | エラー項目名 | エラー内容   |
| :----- | --------------------------- | -------- | ------ | ------------ | ------------ |
| 1      | psid3.0+8000020130001+1+UM1 | 東京都   | 妊娠届 | 概要         | 必須項目です |

## 使用方法
1. 3つのファイル（Excel、JSON、スキーマCSV）をアップロード
2. 「実行」ボタンをクリック
3. 結果が自動的に表示され、エラーがある場合は該当箇所と内容が表示されます

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
