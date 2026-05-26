/**
 * オオギ薬局 入会フォーム (NFC対応)
 * Google Apps Script (GAS) バックエンド処理
 */

// セキュリティトークン
const API_TOKEN = 'ogi-forms-prod-dfbd023c40ce3bcc';

// 「回答まとめ」シート C 列以降の 30 列、および「回答（NFC）」シートの整形列に
// 共通で使うヘッダー定義。buildMasterRow() が返す配列と並びを 1:1 で合わせる。
const MASTER_HEADERS = [
  '送信日時', 'お名前', 'フリガナ', '生年月日', '性別', '電話番号', '郵便番号', '住所', 'メールアドレス', 'ご職業/職種',
  'Q1 副作用歴', 'Q2 副作用詳細', 'Q3 アレルギー歴', 'Q4 アレルギー詳細', 'Q5 治療中の病気', 'Q6 治療中の病気の内容',
  'Q7 処方薬の服用', 'Q8 処方薬の内容', 'Q9 既往歴（大きな病気）', 'Q10 既往歴の内容', 'Q11 市販薬・サプリ', 'Q12 市販薬・サプリの内容',
  'Q13 妊娠の有無', 'Q14 妊娠の詳細', 'Q15 授乳の有無', 'Q16 その他チェック項目', 'アンケート',
  '国籍(EN)', '滞在ステータス(EN)', '言語'
];

// 1. Controller 層: エントリーポイント
function doPost(e) {
  const lock = LockService.getScriptLock();
  let payload = null;
  try {
    lock.waitLock(30000);
    payload = JSON.parse(e.postData.contents);
    
    // トークン検証
    if (!payload || payload.token !== API_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: 'Forbidden: Invalid API Token' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const processor = new FormProcessor(payload);
    processor.execute();
    
    // 正常時のSlack通知送信
    const masterRow = processor.transformer.buildMasterRow();
    const slackMessage = buildSlackMessage(payload, masterRow, false);
    sendToSlack(slackMessage);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    const errorStr = error.toString();
    
    // 【エラー緊急対処】データ保存失敗時、入力データをSlackに緊急エスケープ通知
    if (payload) {
      try {
        const transformer = new DataTransformer(payload);
        const masterRow = transformer.buildMasterRow();
        const emergencyMessage = buildSlackMessage(payload, masterRow, true, errorStr);
        sendToSlack(emergencyMessage);
      } catch (innerError) {
        sendToSlack(`⚠️ *【緊急・システムエラー】入会フォームの処理中に深刻なエラーが発生しました。*\nエラー: \`${errorStr}\`\n生データ: \`${e.postData.contents}\``);
      }
    } else {
      sendToSlack(`⚠️ *【緊急・システムエラー】JSONパース前のフェーズでエラーが発生しました。*\nエラー: \`${errorStr}\``);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: errorStr }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Slackへメッセージを送信する共通関数
 */
function sendToSlack(message) {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
  if (!webhookUrl) {
    Logger.log('SLACK_WEBHOOK_URL が設定されていません');
    return;
  }
  try {
    UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: message })
    });
  } catch (e) {
    Logger.log('Slack送信失敗: ' + e.toString());
  }
}

/**
 * 送信されたデータからSlack送信用メッセージを組み立てる
 */
function buildSlackMessage(payload, masterRow, isError, errorMessage) {
  const storeCode = payload.store || 'unknown';
  const storeName = storeCode === 'shibuya' ? '渋谷店' : storeCode;
  const lang = payload.lang === 'ja' ? '日本語' : '英語';
  
  let headerText = '';
  if (isError) {
    headerText = `⚠️ *【緊急・システムエラー】スプレッドシートへの保存に失敗しました！*\n` +
                 `エラー内容: \`${errorMessage}\`\n` +
                 `※データ消失防止のため、入力内容をここに通知します。店舗スタッフは手動でスプレッドシートに転記してください。\n\n`;
  } else {
    headerText = `📢 *【入会申込】NFCフォームから登録がありました（${lang}・${storeName}）*\n\n`;
  }

  const lines = [];
  for (let i = 0; i < masterRow.length; i++) {
    const val = masterRow[i];
    if (val !== undefined && val !== null && val !== '') {
      let displayVal = String(val);
      if (displayVal.startsWith("'")) {
        displayVal = displayVal.substring(1);
      }
      lines.push(`• *${MASTER_HEADERS[i]}*: ${displayVal}`);
    }
  }

  return headerText + lines.join('\n');
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
      // EN版 referral_source 選択肢の和訳（config_en.js: map / search_medicine / referral / walked_by / other_survey）
      referral: '友人・家族の紹介', walked_by: '通りすがり', other_survey: 'その他',
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
    // タイムスタンプは「回答まとめ」C列の表記仕様に合わせ JST の yyyy/MM/dd HH:mm:ss で固定。
    // クライアントの submitted_at に依存せず、サーバー時刻で再生成して時計ズレを防ぐ。
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
    
    // C〜L: 基本情報
    const nameKanji = this.isJa ? this.ans.name_kanji : this.ans.full_name;
    const nameKana  = this.isJa ? this.ans.name_kana : '';
    // 生年月日：EN 版の旧 Google フォームは dob_year/month/day の 3 分割形式だったため後方互換で受け取り、
    // 新システムは birth_date（YYYY-MM-DD）に統一済み。出力は YYYY/MM/DD で揃える。
    const rawBirth  = this.ans.dob_year
      ? `${this.ans.dob_year}/${this.ans.dob_month}/${this.ans.dob_day}`
      : (this.ans.birth_date || '');
    const birth     = String(rawBirth).replace(/-/g, '/');
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
    
    // Q16: JA はチェックボックス群（lifestyle）、EN は自由記述（other_info）を充てる
    const q16 = this.isJa ? this.translate(this.ans.lifestyle) : (this.ans.other_info || '');
    
    let q17 = this.translate(this.ans.referral_source);
    if (this.ans.referral_source_other) q17 += `（${this.ans.referral_source_other}）`;

    // AD〜AF: 英語フォーム由来の追加情報（JA 版では原則空欄）
    const nat = this.isJa ? '' : this.ans.nationality;
    const res = this.isJa ? '' : this.translate(this.ans.residence_status);
    const langCell = this.isJa ? '' : 'English';

    // 計30要素を配列にして返す（「回答まとめ」シートのC列〜AF列に対応）
    const rawArray = [
      timestamp, nameKanji, nameKana, birth, this.translate(this.ans.sex), phone, zip, addr, email, occ,
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17,
      nat || '', res || '', langCell
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

    // 1. 「回答（NFC）」シートへの書き込み
    //    列構成： A=店舗 / B=言語 / C〜AF=整形 30 列（MASTER_HEADERS と一致）
    //    生データ復旧網は Slack エラー緊急通知で確保しているため、シートには重複保持しない。
    const nfcSheetName = '回答（NFC）';
    const NFC_HEADERS = ['店舗', '言語', ...MASTER_HEADERS];
    let nfcSheet = this.ss.getSheetByName(nfcSheetName);
    if (!nfcSheet) {
      nfcSheet = this.ss.insertSheet(nfcSheetName);
      nfcSheet.appendRow(NFC_HEADERS);
      nfcSheet.getRange(1, 1, 1, NFC_HEADERS.length).setFontWeight('bold').setBackground('#f3f4f6');
      nfcSheet.setFrozenRows(1);
    }
    const langDisplay = (payload.lang === 'ja' ? '日本語' : '英語');
    nfcSheet.appendRow([storeName, langDisplay, ...masterRow]);

    // 2. 「回答まとめ」シートへの統合書き込み
    const masterSheetName = '回答まとめ';
    let masterSheet = this.ss.getSheetByName(masterSheetName);
    if (!masterSheet) {
      masterSheet = this.ss.insertSheet(masterSheetName);
    }
    
    // 書き込み位置：C列（タイムスタンプ列）の最終入力行 + 1
    // appendRow は A/B 列に手動メモがあると下にズレるため、旧 onFormSubmit と同じく
    // C 列基準で「データの最終位置」を見て連続性を保つ。
    const cValues = masterSheet.getRange('C:C').getValues();
    let lastRowC = 0;
    for (let i = cValues.length - 1; i >= 0; i--) {
      if (cValues[i][0] !== '' && cValues[i][0] !== null) {
        lastRowC = i + 1;
        break;
      }
    }
    const writeRow = lastRowC + 1;

    // 列の役割：
    //   A 列＝チェックボックス（自動挿入）
    //   B 列＝手動入力の会員番号（絶対に上書きしない）
    //   C 列以降＝整形済み 30 列データ
    masterSheet.getRange(writeRow, 3, 1, masterRow.length).setValues([masterRow]);
    masterSheet.getRange(writeRow, 1).insertCheckboxes();
  }
}
