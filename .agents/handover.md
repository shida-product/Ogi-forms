# AI引継ぎ — Ogi-forms

> 共通ルール：`C:/dev/keystone/rules/CORE.md`  
> 親ワークスペースの旧メモ：`C:/dev/ogi/ogi-forms/.agents/handover.md`（履歴アーカイブ）

---

## 完了ログ

### [2026-08-22] 住所二重表示の修正 ＋ Keystone/Grimoire 連携適切化

- **住所**: 番地欄に市区町村が混入すると結合で二重になる問題を修正（`js/app.js` 正規化、`gas/server.gs` の `joinJapaneseAddress`、autocomplete section 分離）。コミット `b9b038b`。GAS は手動デプロイ済み。
- **連携**: ローカル Git ディレクトリを `oogi-form` → `Ogi-forms` に改名（GitHub 名に統一）。Tier0（AGENTS / RULES / handover / harness.json / `.githooks`）を整備。親フォルダ平坦化は見送り。
- **影響なし**: 本番 URL・現場 QR はローカルフォルダ名と無関係。

### 以前の経緯

詳細な履歴は親の `.agents/handover.md` を参照。

---

## 次アクション

- [ ] README 更新（住所・autocomplete・GAS手動デプロイ注記）が未コミットならコミット
- [ ] 親 `ogi-forms` 配下の未整理ファイル（現行版メモ・旧GAS）の扱い — 平坦化判断は後続
- [ ] `gas-sheet-shibuya` / `gas-sheet-ebisu` のリポ取り込み要否
