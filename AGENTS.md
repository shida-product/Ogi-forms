# AGENTS.md — Ogi-forms

> 共通ルールの正本：`C:/dev/keystone/rules/CORE.md`

会員登録フォーム（日本語 / English）。コード正本はこのディレクトリ。

## 作業前

1. `C:/dev/keystone/rules/CORE.md`
2. `.agents/RULES.md`（このリポ固有）
3. `.agents/handover.md`
4. 対象の `README.md` / 変更ファイル

## 注意

- APIトークン・Webhook・患者・会員情報をリポジトリやチャットへ出さない
- 本番URL（`ogi-forms.pages.dev`）と QR 導線は、ローカルフォルダ名変更では影響しない
- `gas/` は clasp 未設定。変更時は GAS エディタへ手動貼り付け → 再デプロイ
