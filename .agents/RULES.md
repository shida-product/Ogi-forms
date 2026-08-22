# RULES — Ogi-forms 固有ルール

> **共通ルールの正本は `C:/dev/keystone/rules/CORE.md`。先にそちらを読むこと。**
> ここに共通ルールを複製しない。このリポでしか起きないことだけを書く。

---

## 1. プロジェクト概要

| 項目 | 内容 |
| --- | --- |
| 名称 | Ogi-forms（オオギ薬局 会員登録フォーム） |
| 主言語 | HTML / Vanilla JS / Tailwind CDN ＋ GAS |
| 本番 | Cloudflare Pages（`ogi-forms.pages.dev`）＋ GAS Web App |
| Grimoire | `60_Projects/Ogi-forms` |

親フォルダ `C:/dev/ogi/ogi-forms` はワークスペース用メタ（現行版メモ・旧GAS控え）。**Git 正本はこの `Ogi-forms/`**。平坦化は未実施（判断済み・後続可）。

---

## 2. Danger Zone（明示指示なしに触らない）

1. `js/config.js` / `js/config_en.js` の `gasUrl` / `apiToken`
2. `gas/server.gs` の `API_TOKEN` と Script Properties 連携
3. `_redirects`（店舗・言語の公開パス。現場 QR に直結）
4. スプレッドシート列順（「回答まとめ」互換）
5. `git push --force`（特に `main`）— Pages 自動デプロイあり

---

## 3. デプロイ

| 層 | 手順 |
| --- | --- |
| フロント | `main` へ push → Cloudflare Pages 自動デプロイ |
| GAS | `gas/server.gs` を手動貼り付け → **新しいデプロイ**（clasp 設定なし） |

フロントだけ先行すると店舗ルーティングとシート書き込みがずれることがある。恵比寿追加時と同様、**GAS とセットで確認**する。

---

## 4. 住所入力

- `address` = 郵便番号 API の市区町村、`address_detail` = 番地・建物
- 結合時の二重住所はフロント正規化 ＋ GAS `joinJapaneseAddress` で防御
- autocomplete は連絡先と住所ブロックを section 分離（住所へフル住所が流れ込まないようにする）
