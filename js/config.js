/**
 * オオギ薬局 入会フォーム（日本語版）
 * フィールド定義 & テキスト辞書
 */

export const CONFIG = {
  // セキュリティトークン
  apiToken: 'ogi-forms-prod-dfbd023c40ce3bcc',

  // Google Apps Script (GAS) Web API URL
  // ※現在の本番環境URL
  gasUrl: 'https://script.google.com/macros/s/AKfycbwOTKmwEitxHSBmev-CnNAzI7r3GRfrqC2luzMSySUJaOOY3SwaTHm7blpH0P_BG8-Y/exec',

  // 薬局情報
  pharmacy: {
    name: 'オオギ薬局',
    tagline: '入会申込',
  },

  // 店舗設定（line は店舗ごとに公式アカウントが違うため stores 配下で持つ）
  stores: {
    shibuya: {
      name: '渋谷店',
      label: 'オオギ薬局 渋谷店',
      line: {
        title: 'オオギ薬局「渋谷店」 公式LINE',
        description: 'お薬のご相談や次回予約など、LINEでやりとりできます。ぜひ友だち追加をお願いします。',
        button: '友だち追加する',
        url: 'https://lin.ee/WGb4cXx',
      },
    },
    ebisu: {
      name: '恵比寿店',
      label: 'オオギ薬局 恵比寿店',
      line: {
        title: 'オオギ薬局「恵比寿店」 公式LINE',
        description: 'お薬のご相談や次回予約など、LINEでやりとりできます。ぜひ友だち追加をお願いします。',
        button: '友だち追加する',
        url: 'https://lin.ee/pRLA2xC',
      },
    },
  },
  defaultStore: 'shibuya',

  // フォームフィールド定義
  fields: [
    // === セクション1: 基本情報 ===
    {
      id: 'name_kanji',
      type: 'text',
      required: true,
      section: 1,
    },
    {
      id: 'name_kana',
      type: 'text',
      required: true,
      section: 1,
      validation: { pattern: '^[ァ-ヶー　 ]+$' },
    },
    {
      id: 'birth_date',
      type: 'date-select',
      required: true,
      section: 1,
    },
    {
      id: 'sex',
      type: 'radio',
      required: true,
      section: 1,
      options: ['male', 'female'],
    },
    {
      id: 'phone',
      type: 'tel',
      required: true,
      section: 1,
    },
    {
      id: 'postal_code',
      type: 'postal',
      required: true,
      section: 1,
    },
    {
      id: 'address',
      type: 'text',
      required: true,
      section: 1,
    },
    {
      id: 'address_detail',
      type: 'text',
      required: true,
      section: 1,
    },
    {
      id: 'email',
      type: 'email',
      required: false,
      section: 1,
    },
    {
      id: 'occupation',
      type: 'text',
      required: false,
      section: 1,
    },

    // === セクション2: アレルギー・副作用 ===
    {
      id: 'side_effect',
      type: 'radio',
      required: true,
      section: 2,
      options: ['no', 'yes'],
    },
    {
      id: 'side_effect_detail',
      type: 'textarea',
      required: true,
      section: 2,
      condition: (answers) => answers.side_effect === 'yes',
    },
    {
      id: 'allergy',
      type: 'radio',
      required: true,
      section: 2,
      options: ['no', 'yes'],
    },
    {
      id: 'allergy_detail',
      type: 'checkbox-group',
      required: true,
      section: 2,
      options: ['egg', 'milk', 'asthma_allergy', 'atopic', 'pollen', 'allergy_other'],
      condition: (answers) => answers.allergy === 'yes',
      hasOther: true,
    },

    {
      id: 'current_disease',
      type: 'radio',
      required: true,
      section: 2,
      options: ['no', 'yes'],
    },
    {
      id: 'current_disease_detail',
      type: 'checkbox-group',
      required: true,
      section: 2,
      options: ['hypertension', 'diabetes', 'glaucoma', 'prostate', 'disease_other'],
      condition: (answers) => answers.current_disease === 'yes',
      hasOther: true,
    },
    {
      id: 'current_medicine',
      type: 'radio',
      required: true,
      section: 2,
      options: ['no', 'yes'],
    },
    {
      id: 'current_medicine_detail',
      type: 'textarea',
      required: true,
      section: 2,
      condition: (answers) => answers.current_medicine === 'yes',
    },

    // === セクション3: 過去の病歴・生活習慣 ===
    {
      id: 'past_disease',
      type: 'radio',
      required: true,
      section: 3,
      options: ['no', 'yes'],
    },
    {
      id: 'past_disease_detail',
      type: 'textarea',
      required: true,
      section: 3,
      condition: (answers) => answers.past_disease === 'yes',
    },
    {
      id: 'current_otc',
      type: 'radio',
      required: true,
      section: 3,
      options: ['no', 'yes'],
    },
    {
      id: 'current_otc_detail',
      type: 'textarea',
      required: true,
      section: 3,
      condition: (answers) => answers.current_otc === 'yes',
    },
    {
      id: 'lifestyle',
      type: 'checkbox-group',
      required: true,
      section: 3,
      options: ['smoke', 'coffee', 'drive', 'machine', 'drink', 'contact_1day', 'contact_2week', 'contact_hard', 'lifestyle_none'],
      vertical: true,
    },

    // === セクション4: 女性への確認（条件付き表示） ===
    {
      id: 'pregnant',
      type: 'radio',
      required: true,
      section: 4,
      options: ['no', 'yes'],
      condition: (answers) => answers.sex === 'female',
    },
    {
      id: 'pregnant_detail',
      type: 'text',
      required: true,
      section: 4,
      condition: (answers) => answers.sex === 'female' && answers.pregnant === 'yes',
    },
    {
      id: 'breastfeeding',
      type: 'radio',
      required: true,
      section: 4,
      options: ['no', 'yes'],
      condition: (answers) => answers.sex === 'female',
    },
    {
      id: 'breastfeeding_detail',
      type: 'text',
      required: true,
      section: 4,
      condition: (answers) => answers.sex === 'female' && answers.breastfeeding === 'yes',
    },

    // === セクション5: アンケート・同意 ===
    {
      id: 'referral_source',
      type: 'checkbox-group',
      required: false,
      section: 5,
      options: ['search_medicine', 'ad', 'x_twitter', 'instagram', 'youtube', 'family', 'friend', 'hospital', 'passerby', 'map', 'flyer', 'search_other'],
      hasOther: true,
    },
  ],

  // テキスト辞書
  i18n: {
    // セクション名
    sections: {
      1: '基本情報',
      2: '体質・現在の治療',
      3: '過去の病歴・生活習慣',
      4: '女性の方への確認',
      5: 'アンケート',
    },
    // ステッパーラベル（短縮版）
    stepperLabels: {
      1: '基本情報',
      2: '体質・治療',
      3: '病歴・習慣',
      4: '女性',
      5: '確認',
    },
    // セクション説明
    descriptions: {
      1: 'お名前やご連絡先をご入力ください。',
      2: 'アレルギーの有無や、現在治療中の病気・お薬についてお答えください。',
      3: '過去の大きな病気や、生活習慣についてお答えください。',
      4: '対象の方のみお答えください。',
      5: '最後に簡単なアンケートにご協力をお願いいたします。',
    },
    // フィールドラベル
    labels: {
      name_kanji: 'お名前（漢字）',
      name_kana: 'お名前（フリガナ）',
      birth_date: '生年月日',
      sex: '性別',
      phone: '電話番号',
      postal_code: '郵便番号',
      address: 'ご住所（市区町村）',
      address_detail: 'ご住所（番地・部屋番号）',
      email: 'メールアドレス',
      occupation: 'ご職業 / 職種',
      side_effect: 'これまでに使用した薬で副作用が起きたことはありますか？',
      side_effect_detail: '薬品名とそのときの症状をご記入ください',
      allergy: '過去にアレルギー症状（食べ物・花粉症・喘息など）が出たことはありますか？',
      allergy_detail: 'その他のアレルギーをご記入ください',
      current_disease: '治療中の病気はありますか？',
      current_disease_detail: '当てはまるものを選択してください',
      past_disease: 'これまでに大きな病気にかかったことはありますか？',
      past_disease_detail: '具体的な病名や症状等',
      current_medicine: '医師から処方され服用している薬はありますか？',
      current_medicine_detail: '具体的な医薬品名',
      current_otc: '市販薬やサプリメント、健康食品など服用しているものはありますか？',
      current_otc_detail: '具体的な商品名',
      lifestyle: '以下に当てはまる項目があればチェックを入れてください（複数選択可）',
      pregnant: '妊娠中または妊娠している可能性はありますか？',
      pregnant_detail: 'だいたいの妊娠期間をご記入ください',
      breastfeeding: '授乳中ですか？',
      breastfeeding_detail: 'お子様の月齢をご記入ください',
      referral_source: 'オオギ薬局のことをお知りになったきっかけを教えてください。',
    },
    // 選択肢テキスト
    options: {
      yes: 'はい',
      no: 'いいえ',
      male: '男',
      female: '女',
      // アレルギー・病気
      egg: '卵',
      milk: '牛乳',
      asthma_allergy: '喘息',
      atopic: 'アトピー',
      pollen: '花粉症',
      allergy_other: 'その他',
      hypertension: '高血圧',
      diabetes: '糖尿病',
      glaucoma: '緑内障',
      prostate: '前立腺肥大症',
      disease_other: 'その他',
      // 生活習慣
      smoke: '喫煙する',
      coffee: 'コーヒーを飲む',
      drive: '車の運転をする',
      machine: '機械・高所作業をする',
      drink: '週3回以上飲酒する',
      contact_1day: 'コンタクトを使用している（1day）',
      contact_2week: 'コンタクトを使用している（2week）',
      contact_hard: 'コンタクトを使用している（ハード、その他）',
      lifestyle_none: '特に該当しない',
      // 認知経路
      search_medicine: 'くすりの名前で検索',
      ad: 'ネット広告',
      x_twitter: 'X（旧Twitter）',
      instagram: 'Instagram',
      youtube: 'YouTube',
      family: '家族の紹介',
      friend: '知人の紹介',
      hospital: '近隣の病院・薬局からの紹介',
      passerby: '通りすがり',
      map: '地図アプリ',
      flyer: 'チラシ',
      search_other: 'くすり以外のワードで検索',
    },
    // プレースホルダー
    placeholders: {
      name_kanji: '例：扇 太郎',
      name_kana: '例：オウギ タロウ',
      phone: '例：09012345678',
      postal_code: '例：1500041',
      address: '例：東京都渋谷区神南',
      address_detail: '例：1-12-16 和光ビル1A',
      email: '例：example@email.com',
      occupation: '例：会社員',
      allergy_detail: '例：エビ、ソバ など',
      side_effect_detail: '例：〇〇で薬疹が出た、〇〇でめまいがした',
      current_disease_detail: '例：痛風、てんかん など',
      past_disease_detail: '例：2020年に虫垂炎で手術',
      current_medicine_detail: '例：アムロジピン5mg',
      current_otc_detail: '例：ビタミンC、DHAサプリ',
      pregnant_detail: '例：妊娠5ヶ月',
      breastfeeding_detail: '例：6ヶ月',
    },
    // ヘルパーテキスト
    helpers: {
      name_kana: 'カタカナで入力してください。',
      phone: '数字のみ。ハイフンは自動で入ります。',
      postal_code: '半角数字7桁。住所が自動入力されます。',
      address: '郵便番号から自動入力されます。',
      address_detail: '市区町村は不要です。番地・建物名・部屋番号のみご入力ください。',
      allergy_detail: '※選択肢にない場合は「その他」を選択してご記入ください。',
      side_effect_detail: '※具体的な薬の名前とその時の症状をご入力ください。',
      current_disease_detail: '※「その他」を選択した場合は具体的な病名や症状等をご入力ください。',
      past_disease: '※入院や手術を要する病気・症状などがあれば「はい」を選択してください。',
      past_disease_detail: '※具体的な病名や症状をご入力ください。',
      current_medicine_detail: '※お薬手帳をお持ちの場合は「お薬手帳あり」とご入力いただいても構いません。',
      current_otc_detail: '※具体的な薬の名前やサプリメントの名前をご入力ください。',
    },
    // ボタン
    buttons: {
      next: '次へ',
      prev: '戻る',
      submit: '登録を完了する',
      submitting: '登録中...',
      start: '登録を始める',
    },
    // メッセージ
    messages: {
      success_title: '登録完了',
      success_body: 'ご入力ありがとうございました。\n登録が完了しました。',
      error_general: '送信中にエラーが発生しました。お手数ですが、もう一度お試しください。',
      required: 'この項目は必須です',
      invalid_kana: 'カタカナで入力してください',
      invalid_phone: '正しい電話番号を入力してください',
      invalid_postal: '7桁の半角数字で入力してください',
      invalid_email: '正しいメールアドレスを入力してください',
      privacy_required: '個人情報の取り扱いへの同意が必要です。',
      other_placeholder: 'その他（具体的にご入力ください）',
      optional: '- 任意',
    },
    // イントロページ
    intro: {
      greeting: 'オオギ薬局 会員登録フォーム',
      main: '当薬局を初めてご利用になる方へ。\n「会員登録」をお願いしております。',
      content: '【ご入力いただく内容】\n・基本情報（お名前・ご連絡先など）\n・健康状態（体質・現在のお薬など）\n・ご利用に関するアンケート',
      time: '所要時間：約3分',
      privacyNote: '※ご入力いただいた個人情報は、当店のプライバシーポリシーに基づき厳重に管理し、ご本人の同意なく第三者に開示・提供することはありません。',
    },
    // LINE 案内は店舗ごとに違うため CONFIG.stores[code].line を参照する（i18n.line は廃止）
  },
};
