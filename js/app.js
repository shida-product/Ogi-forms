/**
 * オオギ薬局 入会フォーム（日本語版）
 * フォームエンジン — DOM生成・ステップ制御・バリデーション・送信処理
 */

import { CONFIG as CONFIG_JA } from './config.js';
import { CONFIG as CONFIG_EN } from './config_en.js';

const isEN = document.documentElement.lang === 'en';
const CONFIG = isEN ? CONFIG_EN : CONFIG_JA;

// ── 開発・テストモード ──
const DEV_MODE = false;  // false: バリデーション有効 (本番と同じ挙動) | true: 必須項目スキップ可（デザイン確認用）
const MOCK_SUBMIT = false; // false: 本番のGASへ実際にデータを送信する

// ── テキスト辞書のショートカット ──
const T = CONFIG.i18n;

// ── State ──
const state = {
  currentStep: -1, // -1 = イントロ
  answers: {},
  store: null,
};

// ── ローカルストレージ一時保存・復元 ──
const STORAGE_KEY = 'ogi_forms_answers';

function saveAnswers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
}

function loadAnswers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state.answers = JSON.parse(saved);
    } catch (e) {
      console.warn('保存された回答データの読み込みに失敗しました:', e);
    }
  }
}

function clearAnswers() {
  localStorage.removeItem(STORAGE_KEY);
}

// 表示対象セクション（条件によって自動スキップ）
function getVisibleSections() {
  const allSections = Object.keys(T.sections).map(Number);
  return allSections.filter(s => {
    const fieldsInSection = CONFIG.fields.filter(f => f.section === s);
    // そのセクションに「表示条件がない（常に表示される）」または「表示条件を満たす」項目が1つでもあれば、セクション全体を表示する
    return fieldsInSection.some(f => !f.condition || f.condition(state.answers));
  });
}

function getTotalSteps() {
  return getVisibleSections().length;
}

// ── 電話番号フォーマッター ──
// 日本の市外局番を正確なLookupテーブルで判定し、ハイフンを自動挿入する

// 2桁市外局番
const TWO_DIGIT_AREAS = ['03', '06'];

// 3桁市外局番（主要都市のみ。ここに無い 0XX は4桁市外局番として扱う）
const THREE_DIGIT_AREAS = [
  '011', '015', '017', '018', '019',
  '022', '023', '024', '025', '026', '027', '028', '029',
  '042', '043', '044', '045', '047', '048', '049',
  '052', '053', '054', '055', '058', '059',
  '072', '073', '075', '076', '077', '078', '079',
  '082', '083', '084', '086', '087', '088', '089',
  '092', '093', '095', '096', '097', '098', '099',
];

function formatWithPattern(digits, pattern) {
  const parts = [];
  let pos = 0;
  for (const len of pattern) {
    if (pos >= digits.length) break;
    parts.push(digits.substring(pos, pos + len));
    pos += len;
  }
  return parts.join('-');
}

function formatPhoneNumber(digits) {
  if (!digits) return '';
  const clean = digits.replace(/[^0-9]/g, '');
  if (clean.length === 0) return '';

  // 携帯・IP電話 (070/080/090/050): 3-4-4
  if (/^(070|080|090|050)/.test(clean)) return formatWithPattern(clean, [3, 4, 4]);
  // フリーダイヤル (0120/0800): 4-3-3
  if (/^(0120|0800)/.test(clean)) return formatWithPattern(clean, [4, 3, 3]);
  // 2桁市外局番: 2-4-4
  if (TWO_DIGIT_AREAS.some(a => clean.startsWith(a))) return formatWithPattern(clean, [2, 4, 4]);
  // 3桁市外局番: 3-3-4
  const prefix3 = clean.substring(0, 3);
  if (THREE_DIGIT_AREAS.includes(prefix3)) return formatWithPattern(clean, [3, 3, 4]);
  // その他（4桁市外局番として扱う: 0463等）: 4-2-4
  if (clean.startsWith('0') && clean.length > 1) return formatWithPattern(clean, [4, 2, 4]);

  return clean;
}

// ── 初期化 ──
document.addEventListener('DOMContentLoaded', () => {
  initStore();
  loadAnswers();
  renderStep(state.currentStep);
  initNavigation();
});

/** URLパラメータ（?store=）から店舗を判定 */
function initStore() {
  const params = new URLSearchParams(window.location.search);
  const storeCode = params.get('store') || CONFIG.defaultStore;
  const storeConfig = CONFIG.stores[storeCode];

  state.store = storeConfig ? storeCode : CONFIG.defaultStore;
  const titleEl = document.getElementById('store-title');
  if (titleEl) {
    const store = CONFIG.stores[state.store];
    titleEl.textContent = store ? store.label : CONFIG.pharmacy.name;
  }
}

// ── ステッパー（プログレスバー） ──
function initStepper() {
  const container = document.getElementById('stepper-container');
  if (!container) return;
  
  if (container.children.length === 0) {
    container.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="flex-1 h-[3px] bg-sumi/10 rounded-full overflow-hidden">
          <div id="progress-bar-fill" class="h-full bg-accent transition-all duration-500 ease-out w-0"></div>
        </div>
        <span id="progress-text" class="text-[11px] font-bold text-sumi/50 tracking-widest text-right whitespace-nowrap min-w-[2rem]"></span>
      </div>
    `;
  }
}

function updateStepper() {
  const sections = getVisibleSections();
  const currentIdx = sections.indexOf(state.currentStep);
  
  const total = sections.length;
  const current = currentIdx + 1;
  const percent = total > 0 ? (current / total) * 100 : 0;

  const fill = document.getElementById('progress-bar-fill');
  const text = document.getElementById('progress-text');

  if (fill) fill.style.width = `${percent}%`;
  if (text) text.textContent = `${current} / ${total}`;
}

// ── ステップ描画 ──
function renderStep(step, direction = 'right') {
  if (step === -1) {
    renderIntroPage();
    return;
  }

  // ステッパーを再構築（Step4スキップ対応のため毎回）
  initStepper();

  const container = document.getElementById('fields-area');
  const section = T.sections[step];
  if (!container || !section) return;

  // ヘッダー・ステッパー再表示
  const stepper = document.getElementById('stepper-container');
  const title = document.getElementById('step-title');
  const desc = document.getElementById('step-desc');
  if (stepper) stepper.style.display = '';
  if (title) { title.style.display = ''; title.textContent = section; }
  if (desc) { desc.style.display = ''; desc.textContent = T.descriptions[step] || ''; }

  // フィールド描画
  container.innerHTML = '';
  // 各質問がカードになるため均等な5の余白（20px）とする
  container.className = `flex-1 space-y-5 ${direction === 'right' ? 'slide-in-right' : 'slide-in-left'}`;
  container.offsetHeight; // reflow

  const fields = CONFIG.fields.filter(f => f.section === step);
  let currentCard = null;

  fields.forEach((field, index) => {
    // 依存フィールド（子要素）かどうかの判定
    let isChild = false;
    if (index > 0 && field.id.startsWith(fields[index - 1].id + '_')) isChild = true;
    if (field.id.endsWith('_detail') || field.id.endsWith('_text') || field.id.endsWith('_amount')) isChild = true;

    // 子要素でない場合、新しいカードを作成する
    if (!isChild || !currentCard) {
      currentCard = document.createElement('div');
      currentCard.className = 'bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-sumi/5 transition-all duration-300';
      container.appendChild(currentCard);
    }

    const wrapper = createFieldElement(field);
    if (wrapper) {
      // 親と同じカードに入れる場合、区切り線を付ける
      if (isChild && currentCard.children.length > 0) {
        wrapper.classList.add('mt-5', 'pt-5', 'border-t', 'border-sumi/10', 'border-dashed', 'slide-down');
      }
      currentCard.appendChild(wrapper);
    }
  });

  // 万が一空のカードができてしまったら削除
  Array.from(container.children).forEach(card => {
    if (card.children.length === 0) card.remove();
  });

  updateNavButtons();
  updateStepper();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── フィールド生成 ──
function createFieldElement(field) {
  if (field.condition && !field.condition(state.answers)) return null;

  const wrapper = document.createElement('div');
  wrapper.className = 'field-wrapper w-full';
  wrapper.dataset.fieldId = field.id;

  // ラベル
  if (field.type !== 'checkbox') {
    const labelEl = document.createElement('label');
    labelEl.className = 'block text-sm font-medium text-sumi/80 mb-2';
    labelEl.innerHTML = T.labels[field.id] || field.id;
    if (field.required) {
      labelEl.innerHTML += ' <span class="text-red-500 ml-0.5">※</span>';
    } else if (T.messages.optional && field.type !== 'info') {
      labelEl.innerHTML += `<span class="text-xs text-sumi/50 ml-2 font-normal">${T.messages.optional}</span>`;
    }
    wrapper.appendChild(labelEl);
  }

  // ヘルパーテキスト（checkbox型はコンポーネント内部で表示するためスキップ）
  if (T.helpers[field.id] && field.type !== 'checkbox') {
    const helperEl = document.createElement('p');
    helperEl.className = 'text-xs text-sumi/60 mb-3 leading-relaxed';
    helperEl.textContent = T.helpers[field.id];
    wrapper.appendChild(helperEl);
  }

  // タイプ別レンダリング
  switch (field.type) {
    case 'text': case 'email': case 'tel':
      wrapper.appendChild(createTextInput(field));
      break;
    case 'textarea':
      wrapper.appendChild(createTextarea(field));
      break;
    case 'radio':
      wrapper.appendChild(createRadioGroup(field));
      break;
    case 'checkbox-group':
      wrapper.appendChild(createCheckboxGroup(field));
      break;
    case 'checkbox':
      wrapper.appendChild(createSingleCheckbox(field));
      break;
    case 'date-select':
      wrapper.appendChild(createDateSelect(field));
      break;
    case 'postal':
      wrapper.appendChild(createPostalCodeInput(field));
      break;
    case 'info':
      wrapper.appendChild(createInfoBlock(field));
      break;
  }

  // エラー表示エリア
  const errorEl = document.createElement('p');
  errorEl.className = 'text-xs text-red-500 mt-1.5 hidden';
  errorEl.id = `error-${field.id}`;
  wrapper.appendChild(errorEl);

  return wrapper;
}

// ── 入力フィールド生成 ──

function createTextInput(field) {
  const container = document.createElement('div');
  container.className = 'relative w-full';

  const input = document.createElement('input');
  input.type = field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'text';
  input.id = field.id;
  input.name = field.id;
  input.className = 'form-input';
  input.placeholder = T.placeholders[field.id] || '';
  input.autocomplete = 'off';
  if (field.type === 'tel') input.inputMode = 'tel';
  if (field.type === 'email') input.inputMode = 'email';

  // 電話番号: 値の復元（フォーマット済み）
  if (field.type === 'tel' && state.answers[field.id]) {
    input.value = formatPhoneNumber(state.answers[field.id]);
  } else if (state.answers[field.id]) {
    input.value = state.answers[field.id];
  }

  input.addEventListener('input', (e) => {
    if (field.type === 'tel') {
      const digits = e.target.value.replace(/[^0-9]/g, '');
      state.answers[field.id] = digits;
      e.target.value = formatPhoneNumber(digits);
    } else {
      state.answers[field.id] = e.target.value;
    }
    clearError(field.id);
    saveAnswers();
  });

  container.appendChild(input);
  return container;
}

function createTextarea(field) {
  const container = document.createElement('div');
  container.className = 'relative w-full';

  const textarea = document.createElement('textarea');
  textarea.id = field.id;
  textarea.name = field.id;
  textarea.className = 'form-input';
  textarea.placeholder = T.placeholders[field.id] || '';
  textarea.rows = 3;
  textarea.autocomplete = 'off';
  if (state.answers[field.id]) textarea.value = state.answers[field.id];

  textarea.addEventListener('input', (e) => {
    state.answers[field.id] = e.target.value;
    clearError(field.id);
    saveAnswers();
  });

  container.appendChild(textarea);
  return container;
}

function createRadioGroup(field) {
  const group = document.createElement('div');
  const isBinary = !field.vertical && field.options.length === 2;
  group.className = field.vertical
    ? 'flex flex-col gap-3'
    : (isBinary ? 'grid grid-cols-2 w-full' : 'flex gap-3 flex-wrap');

  field.options.forEach(optionKey => {
    const label = document.createElement('label');
    label.className = isBinary
      ? 'pill-radio w-3/4 justify-self-center'
      : 'pill-radio flex-1';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = field.id;
    input.value = optionKey;
    input.autocomplete = 'off';
    if (state.answers[field.id] === optionKey) input.checked = true;

    input.addEventListener('change', () => {
      state.answers[field.id] = optionKey;
      clearError(field.id);
      rerenderConditionalFields();
      saveAnswers();
    });

    const span = document.createElement('span');
    span.className = 'pill-label';
    span.textContent = T.options[optionKey] || optionKey;

    label.appendChild(input);
    label.appendChild(span);
    group.appendChild(label);
  });

  return group;
}

function createCheckboxGroup(field) {
  const group = document.createElement('div');
  group.className = 'space-y-3';

  if (!state.answers[field.id]) state.answers[field.id] = [];

  field.options.forEach(optionKey => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-3 cursor-pointer py-1';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = optionKey;
    input.className = 'custom-checkbox';
    input.autocomplete = 'off';
    if (Array.isArray(state.answers[field.id]) && state.answers[field.id].includes(optionKey)) {
      input.checked = true;
    }

    input.addEventListener('change', () => {
      if (!Array.isArray(state.answers[field.id])) state.answers[field.id] = [];
      if (input.checked) {
        state.answers[field.id].push(optionKey);
      } else {
        state.answers[field.id] = state.answers[field.id].filter(v => v !== optionKey);
      }
      clearError(field.id);
      rerenderConditionalFields();
      saveAnswers();
    });

    const span = document.createElement('span');
    span.className = 'text-sm text-sumi/80';
    span.textContent = T.options[optionKey] || optionKey;

    label.appendChild(input);
    label.appendChild(span);
    group.appendChild(label);
  });

  // その他入力フィールド
  if (field.hasOther) {
    const otherWrapper = document.createElement('div');
    otherWrapper.className = 'mt-2';

    const otherInput = document.createElement('input');
    otherInput.type = 'text';
    otherInput.className = 'form-input text-sm';
    otherInput.placeholder = T.messages.other_placeholder;
    otherInput.autocomplete = 'off';
    otherInput.id = `${field.id}_other`;

    const otherKey = `${field.id}_other`;
    if (state.answers[otherKey]) otherInput.value = state.answers[otherKey];

    otherInput.addEventListener('input', (e) => {
      state.answers[otherKey] = e.target.value;
      saveAnswers();
    });

    otherWrapper.appendChild(otherInput);
    group.appendChild(otherWrapper);
  }

  return group;
}

function createSingleCheckbox(field) {
  const label = document.createElement('label');
  label.className = 'flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-sumi/10 bg-white/50';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = field.id;
  input.className = 'custom-checkbox mt-0.5';
  input.autocomplete = 'off';
  if (state.answers[field.id]) input.checked = true;

  input.addEventListener('change', () => {
    state.answers[field.id] = input.checked;
    clearError(field.id);
    saveAnswers();
  });

  const textWrapper = document.createElement('div');

  const labelText = document.createElement('span');
  labelText.className = 'text-sm font-medium text-sumi/80 block';
  labelText.textContent = T.labels[field.id] || field.id;
  textWrapper.appendChild(labelText);

  if (T.helpers[field.id]) {
    const helperText = document.createElement('span');
    helperText.className = 'text-xs text-sumi/50 leading-relaxed mt-1 block';
    helperText.textContent = T.helpers[field.id];
    textWrapper.appendChild(helperText);
  }

  label.appendChild(input);
  label.appendChild(textWrapper);
  return label;
}

function createDateSelect(field) {
  const group = document.createElement('div');
  group.className = 'flex gap-2 items-end';

  const currentYear = new Date().getFullYear();
  const dLabels = T.dateLabels || { 
    yearPlaceholder: '年', monthPlaceholder: '月', dayPlaceholder: '日', 
    yearSuffix: '年', monthSuffix: '月', daySuffix: '日' 
  };

  const yearSelect = createSelect(`${field.id}_year`, dLabels.yearPlaceholder, () => {
    const options = [];
    for (let y = currentYear; y >= 1920; y--) options.push({ value: y, label: `${y}${dLabels.yearSuffix}` });
    return options;
  });

  const monthSelect = createSelect(`${field.id}_month`, dLabels.monthPlaceholder, () => {
    const options = [];
    for (let m = 1; m <= 12; m++) {
      const label = dLabels.monthNames ? dLabels.monthNames[m - 1] : `${m}${dLabels.monthSuffix}`;
      options.push({ value: m, label: label });
    }
    return options;
  });

  const daySelect = createSelect(`${field.id}_day`, dLabels.dayPlaceholder, () => {
    return getDayOptions(null, null);
  });

  /** 年・月に応じた日数を取得（閏年対応） */
  function getDayOptions(year, month) {
    let maxDay = 31;
    if (year && month) {
      // new Date(year, month, 0) で前月の末日 = 当月の日数を取得
      maxDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    }
    const options = [];
    for (let d = 1; d <= maxDay; d++) options.push({ value: d, label: `${d}${dLabels.daySuffix}` });
    return options;
  }

  /** 日の選択肢を動的に更新 */
  function updateDayOptions() {
    const y = yearSelect.querySelector('select').value;
    const m = monthSelect.querySelector('select').value;
    const daySel = daySelect.querySelector('select');
    const currentDay = daySel.value;

    // 選択肢を再構築
    const newOptions = getDayOptions(y, m);
    // デフォルトオプション以外を削除
    while (daySel.options.length > 1) daySel.remove(1);
    newOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      daySel.appendChild(option);
    });

    // 元の日を復元（範囲内なら）
    if (currentDay && parseInt(currentDay) <= newOptions.length) {
      daySel.value = currentDay;
    } else if (currentDay) {
      // 選択していた日が範囲外（例: 31日→2月）なら末日にセット
      daySel.value = newOptions.length;
    }
  }

  // 既存の値を復元
  if (state.answers[field.id]) {
    const parts = state.answers[field.id].split('-');
    if (parts.length === 3) {
      yearSelect.querySelector('select').value = parseInt(parts[0]);
      monthSelect.querySelector('select').value = parseInt(parts[1]);
      updateDayOptions();
      daySelect.querySelector('select').value = parseInt(parts[2]);
    }
  }

  const updateDate = () => {
    const y = yearSelect.querySelector('select').value;
    const m = monthSelect.querySelector('select').value;
    const d = daySelect.querySelector('select').value;
    if (y && m && d) {
      state.answers[field.id] = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      clearError(field.id);
      saveAnswers();
    }
  };

  yearSelect.querySelector('select').addEventListener('change', () => { updateDayOptions(); updateDate(); });
  monthSelect.querySelector('select').addEventListener('change', () => { updateDayOptions(); updateDate(); });
  daySelect.querySelector('select').addEventListener('change', updateDate);

  group.appendChild(yearSelect);
  group.appendChild(monthSelect);
  group.appendChild(daySelect);
  return group;
}

function createSelect(id, placeholder, optionsFn) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex-1';

  const select = document.createElement('select');
  select.id = id;
  select.className = 'form-input text-sm';
  select.autocomplete = 'off';

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = placeholder;
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  select.appendChild(defaultOpt);

  optionsFn().forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    select.appendChild(option);
  });

  wrapper.appendChild(select);
  return wrapper;
}

function createPostalCodeInput(field) {
  const group = document.createElement('div');
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'relative';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = field.id;
  input.name = field.id;
  input.className = 'form-input';
  input.placeholder = T.placeholders[field.id] || '';
  input.inputMode = 'numeric';
  input.maxLength = 8; // ハイフン込み: 123-4567
  input.autocomplete = 'off';
  if (state.answers[field.id]) {
    const d = state.answers[field.id];
    input.value = d.length > 3 ? d.substring(0, 3) + '-' + d.substring(3) : d;
  }

  input.addEventListener('input', async (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    state.answers[field.id] = digits;
    // ハイフン自動挿入（3桁-4桁）
    e.target.value = digits.length > 3 ? digits.substring(0, 3) + '-' + digits.substring(3, 7) : digits;
    clearError(field.id);
    saveAnswers();

    if (digits.length === 7) {
      await fetchAddress(digits);
    }
  });

  inputWrapper.appendChild(input);
  group.appendChild(inputWrapper);
  return group;
}

/** 情報表示専用コンポーネント (info) — 画像内デザインを優先するため外殻装飾なし */
function createInfoBlock(field) {
  const container = document.createElement('div');
  container.className = 'info-block mt-2';

  const infoData = T.info[field.id];
  if (!infoData) return container;

  if (infoData.text) {
    const p = document.createElement('p');
    p.className = 'text-sumi/80 text-sm leading-relaxed mb-4 whitespace-pre-wrap';
    p.textContent = infoData.text;
    container.appendChild(p);
  }

  if (infoData.image) {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'w-full flex justify-center';
    const img = document.createElement('img');
    img.src = infoData.image;
    img.alt = infoData.alt || '';
    img.className = 'max-w-full h-auto';
    imgWrapper.appendChild(img);
    container.appendChild(imgWrapper);
  }

  return container;
}

/** 郵便番号APIで住所を取得 */
async function fetchAddress(postalCode) {
  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const address = `${result.address1}${result.address2}${result.address3}`;
      state.answers.address = address;
      saveAnswers();

      const addressField = document.getElementById('address');
      if (addressField) {
        addressField.value = address;
        // inputイベントを発火してstateを同期させる
        addressField.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const detailField = document.getElementById('address_detail');
      if (detailField) detailField.focus();
    }
  } catch (err) {
    console.warn('郵便番号からの住所取得に失敗:', err);
  }
}

// ── 条件分岐フィールドの再描画 ──
function rerenderConditionalFields() {
  const container = document.getElementById('fields-area');
  if (!container) return;

  const fields = CONFIG.fields.filter(f => f.section === state.currentStep);

  fields.forEach((field, idx) => {
    const existing = container.querySelector(`[data-field-id="${field.id}"]`);

    if (field.condition) {
      const shouldShow = field.condition(state.answers);

      if (shouldShow && !existing) {
        const newEl = createFieldElement(field);
        if (newEl) {
          let isChild = false;
          if (idx > 0 && field.id.startsWith(fields[idx - 1].id + '_')) isChild = true;
          if (field.id.endsWith('_detail') || field.id.endsWith('_text') || field.id.endsWith('_amount')) isChild = true;

          const prevField = fields.slice(0, idx).reverse().find(f => container.querySelector(`[data-field-id="${f.id}"]`));
          const prevRef = prevField ? container.querySelector(`[data-field-id="${prevField.id}"]`) : null;

          if (isChild && prevRef) {
            // 親アイテムと同じカード内にスライドインさせる
            newEl.classList.add('mt-5', 'pt-5', 'border-t', 'border-sumi/10', 'border-dashed');
            newEl.style.opacity = '0';
            newEl.style.transform = 'translateY(-10px)';
            prevRef.parentElement.appendChild(newEl);

            requestAnimationFrame(() => {
              newEl.style.transition = 'opacity 0.3s, transform 0.3s';
              newEl.style.opacity = '1';
              newEl.style.transform = 'translateY(0)';
            });
          } else if (prevRef) {
            // 独立した新規カードとしてスライドインさせる
            const card = document.createElement('div');
            card.className = 'bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-sumi/5 transition-all duration-300';
            card.appendChild(newEl);
            card.style.opacity = '0';
            card.style.transform = 'translateY(-10px)';
            
            prevRef.parentElement.after(card);

            requestAnimationFrame(() => {
              card.style.transition = 'opacity 0.3s, transform 0.3s';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          } else {
            // 前に要素がない場合（通常あり得ないがフォールバック）
            const card = document.createElement('div');
            card.className = 'bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-sumi/5';
            card.appendChild(newEl);
            container.appendChild(card);
          }
        }
      } else if (!shouldShow && existing) {
        existing.style.transition = 'opacity 0.2s, transform 0.2s';
        existing.style.opacity = '0';
        existing.style.transform = 'translateY(-10px)';
        
        const card = existing.parentElement;
        setTimeout(() => {
          existing.remove();
          if (card && card.children.length === 0) card.remove();
        }, 200);

        delete state.answers[field.id];
        if (field.hasOther) delete state.answers[`${field.id}_other`];
        saveAnswers();
      }
    }
  });
}

// ── ナビゲーション ──
function initNavigation() {
  document.getElementById('next-btn')?.addEventListener('click', handleNext);
  document.getElementById('prev-btn')?.addEventListener('click', handlePrev);
}

function updateNavButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextText = document.getElementById('next-text');
  const nextArrow = document.getElementById('next-arrow');
  const nextCheck = document.getElementById('next-check');

  const sections = getVisibleSections();
  const isLastStep = state.currentStep === sections[sections.length - 1];

  if (prevBtn) prevBtn.classList.toggle('hidden', state.currentStep <= 1);

  if (state.currentStep === -1) {
    if (nextText) nextText.textContent = T.buttons.start;
    if (nextArrow) nextArrow.classList.remove('hidden');
    if (nextCheck) nextCheck.classList.add('hidden');
  } else if (isLastStep) {
    if (nextText) nextText.textContent = T.buttons.submit;
    if (nextArrow) nextArrow.classList.add('hidden');
    if (nextCheck) nextCheck.classList.remove('hidden');
  } else {
    if (nextText) nextText.textContent = T.buttons.next;
    if (nextArrow) nextArrow.classList.remove('hidden');
    if (nextCheck) nextCheck.classList.add('hidden');
  }
}

function handleNext() {
  if (state.currentStep === -1) {
    const sections = getVisibleSections();
    state.currentStep = sections[0];
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    renderStep(state.currentStep, 'right');
    return;
  }

  if (!validateCurrentStep()) return;

  const sections = getVisibleSections();
  const currentIdx = sections.indexOf(state.currentStep);
  const isLastStep = currentIdx === sections.length - 1;

  if (isLastStep) {
    submitForm();
  } else {
    state.currentStep = sections[currentIdx + 1];
    renderStep(state.currentStep, 'right');
  }
}

function handlePrev() {
  const sections = getVisibleSections();
  const currentIdx = sections.indexOf(state.currentStep);
  if (currentIdx > 0) {
    state.currentStep = sections[currentIdx - 1];
    renderStep(state.currentStep, 'left');
  }
}

// ── バリデーション ──
function validateCurrentStep() {
  if (DEV_MODE) return true;

  const fields = CONFIG.fields.filter(f => f.section === state.currentStep);
  let isValid = true;

  for (const field of fields) {
    if (field.condition && !field.condition(state.answers)) continue;

    const value = state.answers[field.id];

    if (field.required) {
      if (field.type === 'checkbox') {
        if (!value) { showError(field.id, T.messages.privacy_required); isValid = false; continue; }
      } else if (field.type === 'checkbox-group') {
        if (!Array.isArray(value) || value.length === 0) { showError(field.id, T.messages.required); isValid = false; continue; }
      } else if (field.type === 'date-select') {
        if (!value || value.includes('undefined')) { showError(field.id, T.messages.required); isValid = false; continue; }
        // 存在しない日付のチェック（2月30日等）
        const parts = value.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
          const date = new Date(y, m - 1, d);
          if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
            showError(field.id, '存在しない日付です');
            isValid = false;
            continue;
          }
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        showError(field.id, T.messages.required);
        isValid = false;
        continue;
      }
    }

    // パターンバリデーション
    if (field.validation?.pattern && value) {
      if (!new RegExp(field.validation.pattern).test(value)) {
        const msg = field.id === 'name_kana' ? T.messages.invalid_kana : T.messages.required;
        showError(field.id, msg);
        isValid = false;
      }
    }

    // 電話番号バリデーション
    if (field.type === 'tel' && value) {
      const digits = value.replace(/[^0-9]/g, '');
      if (digits.length < 10 || digits.length > 11) {
        showError(field.id, T.messages.invalid_phone);
        isValid = false;
      }
    }

    // メールバリデーション
    if (field.type === 'email' && value && value.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        showError(field.id, T.messages.invalid_email);
        isValid = false;
      }
    }

    // 郵便番号バリデーション
    if (field.type === 'postal' && value) {
      if (!/^[0-9]{7}$/.test(value)) {
        showError(field.id, T.messages.invalid_postal);
        isValid = false;
      }
    }
  }

  if (!isValid) {
    const firstError = document.querySelector('.text-red-500:not(.hidden)');
    if (firstError) {
      const wrapper = firstError.closest('.field-wrapper');
      if (wrapper) {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        wrapper.classList.remove('shake');
        void wrapper.offsetWidth;
        wrapper.classList.add('shake');
        setTimeout(() => wrapper.classList.remove('shake'), 400);
      }
    }
  }

  return isValid;
}

function showError(fieldId, message) {
  const el = document.getElementById(`error-${fieldId}`);
  if (el) { el.textContent = message; el.classList.remove('hidden'); }
}

function clearError(fieldId) {
  const el = document.getElementById(`error-${fieldId}`);
  if (el) el.classList.add('hidden');
}

// ── フォーム送信 ──
async function submitForm() {
  const nextBtn = document.getElementById('next-btn');
  const nextText = document.getElementById('next-text');
  const spinner = document.getElementById('submit-spinner');

  if (nextBtn) nextBtn.disabled = true;
  if (nextText) nextText.textContent = T.buttons.submitting;
  if (spinner) spinner.classList.remove('hidden');

  try {
    const payload = {
      store: state.store,
      lang: isEN ? 'en' : 'ja',
      token: CONFIG.apiToken,
      answers: { ...state.answers },
      submitted_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
    };

    if (MOCK_SUBMIT) {
      console.log('📋 [DEV] 送信データ:', payload);
      clearAnswers();
      showSuccess();
      return;
    }

    const res = await fetch(CONFIG.gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    clearAnswers();
    showSuccess();
  } catch (err) {
    console.error('送信エラー:', err);
    alert(T.messages.error_general);
  } finally {
    if (nextBtn) nextBtn.disabled = false;
    if (nextText) nextText.textContent = T.buttons.submit;
    if (spinner) spinner.classList.add('hidden');
  }
}

// ── 送信完了画面 ──
function showSuccess() {
  const modal = document.getElementById('success-modal');

  // テキストを辞書から注入
  const titleEl = document.getElementById('success-title');
  const msgEl = document.getElementById('success-message');
  const lineTitleEl = document.getElementById('line-title');
  const lineDescEl = document.getElementById('line-desc');
  const lineBtnEl = document.getElementById('line-add-btn');
  const lineBtnText = document.getElementById('line-btn-text');

  if (titleEl) titleEl.textContent = T.messages.success_title;
  if (msgEl) msgEl.innerHTML = T.messages.success_body.replace(/\n/g, '<br>');
  // LINE 案内は店舗ごとに異なるため CONFIG.stores[state.store].line を参照する
  const storeLine = CONFIG.stores[state.store]?.line;
  if (storeLine) {
    if (lineTitleEl) lineTitleEl.textContent = storeLine.title;
    if (lineDescEl) lineDescEl.textContent = storeLine.description;
    if (lineBtnEl) lineBtnEl.href = storeLine.url;
    if (lineBtnText) lineBtnText.textContent = storeLine.button;
  } else {
    const lineSection = document.getElementById('line-section');
    if (lineSection) lineSection.style.display = 'none';
  }

  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

// ── イントロページ描画 ──
function renderIntroPage() {
  const container = document.getElementById('fields-area');
  const stepper = document.getElementById('stepper-container');
  const title = document.getElementById('step-title');
  const desc = document.getElementById('step-desc');
  const nextBtn = document.getElementById('next-btn');

  if (stepper) stepper.style.display = 'none';
  if (title) title.style.display = 'none';
  if (desc) desc.style.display = 'none';

  container.innerHTML = '';
  container.className = 'flex-1 space-y-6 fade-up';

  const intro = T.intro;

  // 挨拶
  const greeting = document.createElement('h2');
  greeting.className = 'text-center text-xl sm:text-2xl font-bold text-sumi mb-2';
  greeting.textContent = intro.greeting;
  container.appendChild(greeting);

  // メイン説明
  const mainP = document.createElement('p');
  mainP.className = 'text-sm sm:text-base text-sumi/70 leading-relaxed text-center';
  mainP.innerHTML = intro.main.replace(/\n/g, '<br>');
  container.appendChild(mainP);

  const hr1 = document.createElement('div');
  hr1.className = 'border-t border-sumi/10 my-6';
  container.appendChild(hr1);

  // 登録内容
  if (intro.content) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bg-white border border-sumi/10 shadow-sm rounded-xl p-5';
    const contentP = document.createElement('p');
    contentP.className = 'text-sm sm:text-base text-sumi/80 leading-relaxed whitespace-pre-line';
    contentP.textContent = intro.content;
    contentDiv.appendChild(contentP);
    container.appendChild(contentDiv);
  }

  // 所要時間
  const timeDiv = document.createElement('div');
  timeDiv.className = 'flex items-center justify-center gap-2 text-sm sm:text-base font-medium text-sumi/80 bg-white border border-sumi/10 shadow-sm rounded-xl px-5 py-3 mx-auto w-fit mt-6';
  timeDiv.innerHTML = `<svg class="w-5 h-5 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>${intro.time}</span>`;
  container.appendChild(timeDiv);

  // プライバシー注釈
  if (intro.privacyNote) {
    const privacyP = document.createElement('p');
    privacyP.className = 'mt-8 text-[11px] text-sumi/50 leading-relaxed text-center px-4';
    privacyP.textContent = intro.privacyNote;
    container.appendChild(privacyP);
  }

  updateNavButtons();

  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}
