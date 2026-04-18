# oogi-form — オオギ薬局 会員登録フォーム

## 概要

店舗のGoogleフォームで運用していた入会フォームを、モバイル特化型の独自Webフォーム（NFC・QR対応）に移行したプロジェクト。
フロントエンドを分離し、バックエンドをGASで処理することで、現行の「回答まとめ」スプレッドシートの運用をそのまま引き継ぎながら最新のUI/UXを提供します。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | HTML / Vanilla JS / Tailwind CDN |
| バックエンド | Google Apps Script (GAS) |
| DB | Google Sheets (回答まとめ、回答NFC) |
| ホスティング | Cloudflare Pages |

## URL

- **本番**: `https://oogi-form.pages.dev` （※予定）
- **店舗別**: `https://oogi-form.pages.dev?store=shibuya` （パラメータで店舗名を切り替え可能）

## ファイル構成

```text
oogi-form/
├── index.html          # 日本語版 フォーム本体
├── index_en.html       # 英語版 フォーム本体 (仮)
├── ui-samples.html     # UIデザインとコンポーネントのテスト用モック
├── css/
│   └── style.css       # カスタムスタイル (Linear & Solid デザイン)
├── js/
│   ├── app.js          # フォームエンジン (DOM生成・バリデーション・送信)
│   ├── config.js       # 日本語版 設定ファイル (i18n, フィールド定義)
│   └── config_en.js    # 英語版 設定ファイル
├── image/              # ロゴ画像などのアセット
└── gas/
    ├── server.gs       # バックエンド (doPost エンドポイント / DB保存ロジック)
    └── utils.gs        # スプレッドシート用ユーティリティ (和暦変換など)
```

## 開発・運用フロー

1. 初期開発やテスト時は `js/app.js` の `MOCK_SUBMIT = true` で通信をモックできます。
2. デプロイ時は `js/config.js` に本番のGAS Web API URLを設定した上で Cloudflare Pages へアップロードします。
3. バックエンド (`gas/server.gs`) を更新した際は、連携先のGASプロジェクトにコードを貼り付けて「新しいデプロイ」を行ってください。
