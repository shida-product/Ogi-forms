# oogi-form — オオギ薬局 会員登録フォーム

## 概要

店舗のGoogleフォームで運用していた入会フォームを、モバイル特化型の独自Webフォーム（NFC・QR対応）に移行したプロジェクト。
フロントエンドを分離し、バックエンドを Google Apps Script で処理することで、現行の「回答まとめ」スプレッドシート運用をそのまま引き継ぎながら、最新のUI/UXを提供します。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | HTML / Vanilla JS (ES Modules) / Tailwind CDN |
| バックエンド | Google Apps Script (GAS) |
| データストア | Google Sheets（回答まとめ／回答NFC） |
| 通知 | Slack Webhook（送信成功・失敗時） |
| ホスティング | Cloudflare Pages |

## URL

本番ドメイン：`https://ogi-forms.pages.dev`

| 店舗 | 言語 | URL |
|---|---|---|
| 渋谷店 | 日本語 | `https://ogi-forms.pages.dev/shibuya` |
| 渋谷店 | English | `https://ogi-forms.pages.dev/shibuya/en` |
| 恵比寿店 | 日本語 | `https://ogi-forms.pages.dev/ebisu`（**後日実装**） |
| 恵比寿店 | English | `https://ogi-forms.pages.dev/ebisu/en`（**後日実装**） |

ルーティングは `_redirects` で実現。内部的には `index.html?store=<店舗>` / `index_en.html?store=<店舗>` にリライトされる。

## ファイル構成

```text
Ogi-forms/
├── .gitignore
├── _redirects          # Cloudflare Pages URLルーティング（パス方式）
├── README.md
├── index.html          # 日本語版 フォーム本体
├── index_en.html       # 英語版 フォーム本体
├── css/
│   └── style.css       # カスタムスタイル（Linear & Solid デザイン）
├── js/
│   ├── app.js          # フォームエンジン（DOM生成・バリデーション・一時保存・送信）
│   ├── config.js       # 日本語版 設定（i18n、フィールド定義、APIトークン、GAS URL、店舗設定）
│   └── config_en.js    # 英語版 設定
├── image/              # ロゴ画像
└── gas/
    ├── server.gs       # バックエンド（doPost、保存ロジック、Slack通知）
    └── utils.gs        # スプレッドシート用ユーティリティ（和暦変換など）
```

## 主な機能

### フロントエンド
- モバイル特化のステップ型フォーム（ステッパー表示）
- リアルタイムバリデーション（フリガナ／電話番号／郵便番号／メール）
- 郵便番号から住所自動入力
- **入力データの自動一時保存・復元**（localStorage）: 通信切断・画面誤閉じ時の再入力負担を解消し、送信成功時に自動クリーンアップ
- 多言語対応（日本語 / English）
- OSネイティブフォントによる高速描画

### バックエンド（GAS）
- **簡易APIトークン認証**: クライアントの `config.js` と `server.gs` の定数を照合し、外部からの直接リクエストやスパム送信を遮断
- スプレッドシート式インジェクション（CSV Injection）対策
- 既存「回答まとめ」「回答NFC」シートへの同時書き込み
- **Slack通知**: 正常送信時の通知に加え、シート書き込み失敗などの例外検知時に**緊急エラー通知**を行い、入力データをペイロード添付してデータ損失を防止

## デプロイ・運用フロー

### フロントエンド
1. ローカルで `index.html` を開くか、`js/app.js` の `MOCK_SUBMIT = true` で送信モック動作を確認
2. `main` ブランチにプッシュ → Cloudflare Pages が自動デプロイ

### バックエンド（GAS）
1. `gas/server.gs` を GAS プロジェクトに貼り付け
2. 「新しいデプロイ」を実行して Web App URL を取得
3. 取得した URL を `js/config.js` / `js/config_en.js` の `gasUrl` に反映
4. API トークン値を `apiToken`（クライアント） と `server.gs` の `API_TOKEN`（サーバー）で**完全一致**させる

### 開発・テスト用フラグ（`js/app.js`）

| 定数 | 本番値 | テスト時 |
|---|---|---|
| `DEV_MODE` | `false`（バリデーション有効） | `true` で必須チェックをスキップ |
| `MOCK_SUBMIT` | `false`（GASへ実送信） | `true` で送信せず成功画面を表示 |

## セキュリティ

- API トークンによるリクエスト認証（簡易）
- `noindex, nofollow` メタタグでクローラー除外
- スプレッドシート式インジェクション対策（`'` プレフィックス）
- Slack エラー通知によるデータ損失リスクの最小化
