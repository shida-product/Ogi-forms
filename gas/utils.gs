/**
 * オオギ薬局 入会フォーム
 * Google Apps Script (GAS) ユーティリティ
 */

/**
 * スプレッドシートが開かれたときに実行される関数
 * スプレッドシート上部のメニューに専用のボタンを追加します。
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('確認用シートをリセット')
    .addItem('リセットを実行する', 'resetConfirmationSheet')
    .addToUi();
}

/**
 * 確認用シートをテンプレート（確認用シート_原本）から復元する処理
 */
function resetConfirmationSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const targetSheetName = '確認用シート';
  const templateSheetName = '確認用シート_原本'; // ここがテンプレート（非表示推奨）
  
  const currentSheet = ss.getSheetByName(targetSheetName);
  const templateSheet = ss.getSheetByName(templateSheetName);
  
  // 原本がない場合はエラー
  if (!templateSheet) {
    SpreadsheetApp.getUi().alert('エラー: 「確認用シート_原本」が見つかりません。');
    return;
  }
  
  // 現在の「確認用シート」が無い場合は新しく作る
  if (!currentSheet) {
    const newSheet = templateSheet.copyTo(ss);
    newSheet.setName(targetSheetName);
    newSheet.showSheet();
    newSheet.getRange('A2').setFormula('=QUERY(\'回答まとめ\'!A2:AA, "WHERE A=TRUE")');
    return;
  }
  
  let sheetIndex = currentSheet.getIndex();
  
  // 1. 原本を丸ごとコピー（一瞬で全ての幅・書式・値が完全に再現）
  const newSheet = templateSheet.copyTo(ss);
  
  // 2. 新しいシートを表示し、アクティブにする（古いシートから目線を外す）
  newSheet.showSheet();
  ss.setActiveSheet(newSheet);
  
  // 3. 古いシートをまるごと削除してクリーンにする
  ss.deleteSheet(currentSheet);
  
  // 4. 新しいシートに名前をつけ直し、元のタブ位置に戻す
  newSheet.setName(targetSheetName);
  ss.moveActiveSheet(sheetIndex);
  
  // 5. A2セルにQUERY関数を設定（A2列〜AA列を取得）
  newSheet.getRange('A2').setFormula('=QUERY(\'回答まとめ\'!A2:AA, "WHERE A=TRUE")');
}

/**
 * 西暦-和暦のマスタ
 */
const SEIREKI_WAREKI_MST = [
    ['2019/05/01', '令和'],
    ['1989/01/08', '平成'],
    ['1926/12/25', '昭和'],
    ['1912/07/30', '大正'],
    ['1873/01/01', '明治']
];

/**
 * 西暦の日付を和暦で表示します。
 * 日付が未設定の場合は現在日時を西暦で表示します。
 * 明治以前の日付は西暦のまま表示されます。
 * 
 * @param {Date} 西暦の日付
 * @return 和暦
 * @customfunction
 */
function WAREKI(d) {
    let df = new Date();
    try {
        if(d) df = new Date(d);
    } catch (ex) {
        throw new Error("日付を引数に設定してください。");
    }

    for (let i = 0; i < SEIREKI_WAREKI_MST.length; i++) {
        let rdate = new Date(SEIREKI_WAREKI_MST[i][0]);
        if (rdate <= df) {
            let y = df.getFullYear() - rdate.getFullYear() + 1;
            if (y == 1) y = '元';
            return `${SEIREKI_WAREKI_MST[i][1]}${y}年${Utilities.formatDate(df, 'Asia/Tokyo', 'M月d日')}`;
        }
    }
    return Utilities.formatDate(df, 'Asia/Tokyo', 'yyyy年M月d日');
}
