# Amazon Japan スポンサー商品スクレイパー

Amazon Japanのスポンサー商品を取得するためのPuppeteerベースのスクレイパーです。AWS Lambdaでの実行に最適化されています。

## 機能

- 🎯 Amazon Japanのスポンサー商品のみを抽出
- 🤖 Puppeteer Stealthプラグインでボット検出を回避
- ☁️ AWS Lambdaでのサーバーレス実行
- 🚀 Serverless Frameworkによる簡単デプロイ
- 🧪 Jest による包括的なテスト
- 📱 日本語検索キーワードに対応

## プロジェクト構成

```
src/
├── amazon-scraper.ts           # メインのスクレイピング機能
├── lambda-handler.ts           # AWS Lambda ハンドラー
└── __tests__/
    └── amazon-scraper.test.ts  # テストファイル
```

## 主要関数

### `buildAmazonJapanSearchUrl(searchTerms: string[]): string`
検索キーワードの配列からAmazon Japan検索URLを生成します。

### `scrapeAmazonJapanSponsoredProducts(searchTerms: string[]): Promise<Array<{title: string}>>`
Amazon Japanからスポンサー商品を取得し、商品タイトルの配列を返します。

## セットアップ

### 前提条件
- Node.js 20.x
- npm または yarn
- AWS CLI（デプロイ用）

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd puppeteer

# 依存関係をインストール
npm install
```

### 環境変数
以下の環境変数が利用可能です：

- `PUPPETEER_EXECUTABLE_PATH`: Chromeの実行可能ファイルパス（Lambda環境では自動設定）
- `NODE_ENV`: 実行環境（production/development）

## 使用方法

### ローカル開発

```bash
# TypeScriptをビルド
npm run build

# テストを実行
npm test
```

### AWS Lambdaデプロイ

```bash
# 開発環境にデプロイ
npm run deploy:dev

# 本番環境にデプロイ
npm run deploy:prod

# デフォルト環境にデプロイ
npm run deploy
```

### ローカルでLambda関数をテスト

```bash
# Serverless Offlineを使用してローカルサーバーを起動
npm run local

# Lambda関数をローカルで実行
npm run invoke:local
```

### ログの確認

```bash
# ログを表示
npm run logs

# ログをリアルタイムで監視
npm run logs:tail
```

## API エンドポイント

デプロイ後、以下のHTTP APIエンドポイントが利用可能になります：

```
GET /scrape?q=検索キーワード1,検索キーワード2
```

### レスポンス例

```json
{
  "success": true,
  "searchTerms": ["化粧水", "美白"],
  "count": 12,
  "products": [
    {
      "title": "美白化粧水 薬用ホワイトニング 200ml"
    },
    {
      "title": "プレミアム美白化粧水セット"
    }
  ]
}
```

### エラーレスポンス

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "message": "Amazon sponsored productsの取得に失敗しました"
}
```

## 使用例

### cURLでの使用

```bash
# 基本的な検索
curl "https://your-api-gateway-url/scrape?q=化粧水,美白"

# 複数キーワードでの検索
curl "https://your-api-gateway-url/scrape?q=スマートフォン,iPhone,Android"
```

### JavaScriptでの使用

```javascript
// fetch APIを使用
const response = await fetch('https://your-api-gateway-url/scrape?q=化粧水,美白');
const data = await response.json();

if (data.success) {
  console.log(`${data.count}個のスポンサー商品が見つかりました`);
  data.products.forEach(product => {
    console.log(product.title);
  });
}
```

## テスト

プロジェクトには包括的なテストスイートが含まれています：

### ユニットテスト
- URL生成機能のテスト
- 特殊文字エンコーディングのテスト
- エラーハンドリングのテスト

### 実行可能なテストコマンド

```bash
# すべてのテストを実行
npm test

# ユニットテストのみ実行
npm run test:unit

# 統合テストのみ実行（スキップされています）
npm run test:integration

# ウォッチモードでテスト
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

## 技術仕様

### 使用技術
- **TypeScript**: 型安全な開発
- **Puppeteer Core**: 軽量なヘッドレスブラウザ自動化
- **Chrome AWS Lambda**: AWS Lambda最適化Chromeバイナリ
- **AWS Lambda**: サーバーレス実行環境
- **Serverless Framework**: インフラストラクチャ管理
- **Jest**: テストフレームワーク

### システム要件
- **Runtime**: Node.js 20.x
- **Memory**: 1024MB（Lambda）
- **Timeout**: 300秒（5分）
- **Network**: インターネット接続必須

### セキュリティ機能
- ボット検出回避のためのStealth Plugin
- User-Agentの偽装
- ヒューマンライクなスクロール動作
- automation指標の除去

## トラブルシューティング

### よくある問題

#### 1. スポンサー商品が取得できない
```bash
# ヘッドレスモードの確認
console.log('Starting Amazon scraper...');
```
ログを確認してスクレイピングプロセスを追跡してください。

#### 2. Lambdaでのタイムアウト
現在のタイムアウトは300秒（5分）に設定されています。必要に応じて`serverless.yml`で調整可能です。

#### 3. デプロイエラー
```bash
# 認証情報の確認
aws configure list

# Serverless設定の確認
npx serverless info
```

### デバッグ

```bash
# 詳細なログを有効化
VERBOSE_TESTS=true npm test

# TypeScriptコンパイルエラーのチェック
npm run check
```

## 注意事項

- このツールは防御的なセキュリティ目的でのみ使用してください
- Amazon.co.jpの利用規約を遵守してください
- レート制限を考慮して適切な間隔でリクエストを送信してください
- ログイン必須ページへのアクセスは行いません

## 貢献

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/新機能`)
3. 変更をコミット (`git commit -am '新機能を追加'`)
4. ブランチをプッシュ (`git push origin feature/新機能`)
5. プルリクエストを作成

## ライセンス

ISC

## サポート

問題や質問がある場合は、GitHubのIssuesページで報告してください。