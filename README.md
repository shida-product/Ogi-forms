# oogi-form — オオギ薬局 入会申込フォーム

## 概要

Googleフォームで運用していた入会申込フォームを独自フォームに移行したもの。
QRコード（将来的にNFC）で薬局店頭からアクセスし、スマホで入力する。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | HTML / JS / Tailwind CDN |
| バックエンド/DB | Supabase（PostgreSQL） |
| ホスティング | Cloudflare Pages |

## URL

- **本番**: `https://oogi-form.pages.dev`
- **店舗別**: `https://oogi-form.pages.dev?store=shibuya`

## ローカル開発

```bash
npx serve ./
```

## ファイル構成

```
├── index.html       # フォーム本体
├── css/style.css    # カスタムスタイル
├── js/config.js     # フォーム定義・店舗設定
├── js/app.js        # フォームエンジン
├── supabase/        # DBマイグレーション
└── README.md
```
