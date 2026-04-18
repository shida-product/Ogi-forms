/**
 * オオギ薬局 入会フォーム (NFC対応)
 * Google Apps Script (GAS) バックエンド処理
 */

// 1. Controller 層: エントリーポイント
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const payload = JSON.parse(e.postData.contents);
    
    const processor = new FormProcessor(payload);
    processor.execute();
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// フォーム処理のオーケストレーター
class FormProcessor {
  constructor(payload) {
    this.payload = payload;
    this.transformer = new DataTransformer(payload);
    this.repository = new Repository();
  }

  execute() {
    // 1. データの整形 (既存のGoogleフォームまとめ構造に完全一致させる)
    const masterRow = this.transformer.buildMasterRow();
    
    // 2. データベース（スプレッドシート）への書き込み
    this.repository.writeAll(this.payload, masterRow);
  }
}

// 2. Transformer 層: データの整形とラベル変換
class DataTransformer {
  constructor(payload) {
    this.payload = payload;
    this.ans = payload.answers || {};
    this.lang = payload.lang || 'ja';
    this.isJa = (this.lang === 'ja');
    
    this.LABEL_MAP = {
      egg: '卵', milk: '牛乳', asthma_allergy: '喘息', atopic: 'アトピー', pollen: '花粉症', allergy_other: 'その他',
      hypertension: '高血圧', diabetes: '糖尿病', glaucoma: '緑内障', prostate: '前立腺肥大症', disease_other: 'その他',
      smoke: '喫煙する', coffee: 'コーヒーを飲む', drive: '車の運転をする', machine: '機械・高所作業をする', drink: '週3回以上飲酒する',
      contact_1day: 'コンタクト（1day）', contact_2week: 'コンタクト（2week）', contact_hard: 'コンタクト（ハード、その他）',
      lifestyle_none: '特に該当しない',
      search_medicine: 'くすりの名前で検索', ad: 'ネット広告', x_twitter: 'X（旧Twitter）', instagram: 'Instagram', youtube: 'YouTube',
      family: '家族の紹介', friend: '知人の紹介', hospital: '近隣の病院・薬局からの紹介', passerby: '通りすがり', map: '地図アプリ', flyer: 'チラシ', search_other: 'くすり以外のワードで検索',
      tourism: '観光', business: '短期ビジネス', resident: '在住者', student: '留学生', other: 'その他', 
      yes: 'はい', no: 'いいえ', male: '男', female: '女'
    };
  }

  translate(val) {
    if (!val) return '';
    if (Array.isArray(val)) {
      return val.map(v => this.LABEL_MAP[v] || v).join('、');
    }
    return this.LABEL_MAP[val] || val;
  }

  /**
   * まとめ.js の30カラム (Index 0 ~ 29 => C列〜AF列) に完全に一致する配列を生成する
   * 副作用やアレルギーの「はい/いいえ」と「詳細」を別のセルに分ける。
   */
  buildMasterRow() {
    const timestamp = this.payload.submitted_at || new Date().toISOString();
    
    // C〜L: 基本情報
    const nameKanji = this.isJa ? this.ans.name_kanji : this.ans.full_name;
    const nameKana  = this.isJa ? this.ans.name_kana : '';
    const birth     = this.isJa ? this.ans.birth_date : (this.ans.dob_year ? `${this.ans.dob_year}/${this.ans.dob_month}/${this.ans.dob_day}` : this.ans.birth_date);
    const zip       = this.isJa ? this.ans.postal_code : (this.ans.postal_code || '');
    const addr      = this.isJa ? `${this.ans.address || ''}${this.ans.address_detail || ''}` : `${this.ans.address || this.ans.address_hotel || ''} ${this.ans.address_detail || ''}`.trim();
    const phone     = this.isJa ? this.ans.phone : '';
    const email     = this.ans.email || '';
    const occ       = this.isJa ? this.ans.occupation : '';

    // M〜AC: 問診情報
    const q1 = this.translate(this.ans.side_effect);
    const q2 = this.ans.side_effect_detail || '';
    
    const q3 = this.translate(this.ans.allergy);
    let q4 = this.translate(this.ans.allergy_detail);
    if (this.ans.allergy_detail_other) q4 += `（${this.ans.allergy_detail_other}）`;
    
    const q5 = this.translate(this.ans.current_disease);
    let q6 = this.translate(this.ans.current_disease_detail);
    if (this.ans.current_disease_detail_other) q6 += `（${this.ans.current_disease_detail_other}）`;
    
    const q7 = this.translate(this.ans.current_medicine);
    const q8 = this.ans.current_medicine_detail || '';
    
    const q9 = this.translate(this.ans.past_disease);
    const q10 = this.ans.past_disease_detail || '';
    
    const q11 = this.translate(this.ans.current_otc);
    const q12 = this.ans.current_otc_detail || '';
    
    const q13 = this.translate(this.ans.pregnant);
    const q14 = this.ans.pregnant_detail || '';
    
    // Q15(授乳)は旧版では詳細欄が分かれていなかったため、詳細があれば「はい（Xヶ月）」として括弧書きで結合する
    let q15 = this.translate(this.ans.breastfeeding);
    if (q15 === 'はい' && this.ans.breastfeeding_detail) q15 += `（${this.ans.breastfeeding_detail}）`;
    
    const q16 = this.translate(this.ans.lifestyle);
    
    let q17 = this.translate(this.ans.referral_source);
    if (this.ans.referral_source_other) q17 += `（${this.ans.referral_source_other}）`;

    // AD〜AF: 英語フォーム専用フィールド
    const nat = this.isJa ? '' : this.ans.nationality;
    const res = this.isJa ? '' : this.translate(this.ans.residence_status);
    const motive = '';

    // 計30要素を配列にして返す（「回答まとめ」シートのC列〜AF列に対応）
    const rawArray = [
      timestamp, nameKanji, nameKana, birth, this.translate(this.ans.sex), phone, zip, addr, email, occ,
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17,
      nat || '', res || '', motive || ''
    ];

    // スプレッドシートの数式インジェクション（CSV Injection）対策
    // 入力が = + - @ で始まる場合、先頭にシングルクォートを追加して強制的に文字列化する
    return rawArray.map(val => {
      if (typeof val === 'string' && /^[=+\-@]/.test(val)) {
        return "'" + val;
      }
      return val;
    });
  }
}

// 3. Repository 層: スプレッドシート操作
class Repository {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  writeAll(payload, masterRow) {
    const timestamp = masterRow[0]; // 送信日時
    const storeObj = payload.store || 'unknown';
    const storeName = typeof storeObj === 'string' ? storeObj : '不明';

    // 1. NFC専用シートへの振り分け書き込み
    const nfcSheetName = '回答（NFC）';
    let nfcSheet = this.ss.getSheetByName(nfcSheetName);
    if (!nfcSheet) {
      nfcSheet = this.ss.insertSheet(nfcSheetName);
      nfcSheet.appendRow(['送信日時', '店舗', '生データ (JSON)']);
      nfcSheet.getRange('A1:C1').setFontWeight('bold').setBackground('#f3f4f6');
      nfcSheet.setFrozenRows(1);
    }
    // バックアップ用としてNFCシートにJSONをそのままダンプ
    nfcSheet.appendRow([timestamp, storeName, JSON.stringify(payload.answers || {})]);

    // 2. 「回答まとめ」シートへの統合書き込み
    const masterSheetName = '回答まとめ';
    let masterSheet = this.ss.getSheetByName(masterSheetName);
    if (!masterSheet) {
      masterSheet = this.ss.insertSheet(masterSheetName);
    }
    
    // A列＝チェックボックス用空欄, B列＝経路と言語, C列以降＝整形済み30列データ
    const langLabel = (payload.lang === 'ja' ? `NFC(JA:${storeName})` : `NFC(EN:${storeName})`);
    const finalRow = ['', langLabel, ...masterRow];
    
    masterSheet.appendRow(finalRow);
    
    // 挿入した行のA列にチェックボックスを生成する
    const lastRow = masterSheet.getLastRow();
    masterSheet.getRange(lastRow, 1).insertCheckboxes();
  }
}
