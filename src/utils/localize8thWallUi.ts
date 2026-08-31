/**
 * 8th Wall が出す英語 UI を日本語に差し替える。
 *
 * 対象は 2 系統あり、どちらも文言をハードコードしていて設定では変えられない。
 *   - engine（xr.js）… モーションセンサーの許可ダイアログ（`.prompt-box-8w`）を JS で組み立てる
 *   - xrextras     … ローディング／カメラ許可まわりの UI を HTML 文字列で挿入する
 * どちらも DOM へ挿入されたあとに、テキストノード単位で置き換える。
 *
 * なお「カメラへのアクセスを許可しますか？」というブラウザ自身のダイアログは
 * OS / ブラウザの言語設定に従うため、ここからは変更できない。
 */

/** 日本語化の対象となるコンテナ。この配下だけを走査する */
const CONTAINER_SELECTORS = [
  '#loadingContainer',
  '#almostthereContainer',
  // engine が body 直下に差し込む許可ダイアログ
  '.prompt-box-8w',
]

/**
 * 英文 → 和文。テキストノードの内容（前後の空白を除いたもの）と完全一致で置き換える。
 *
 * xrextras の Android 手順は `<li>Tap the <img> in the top right</li>` のように
 * 画像を挟んで前後に分かれているため、日本語として自然な語順になるよう訳し分けている。
 */
const JA_TEXTS: Record<string, string> = {
  // engine: モーションセンサーの許可ダイアログ（iOS）
  'AR requires access to device motion sensors':
    'AR を表示するには端末のモーションセンサーの使用許可が必要です',
  Cancel: 'キャンセル',
  Continue: '続ける',

  // カメラ許可を求めている最中の案内
  "Tap 'Allow' to access AR": '「許可」をタップしてください',

  // iOS: カメラが許可されなかったとき
  'Reload the page and enable camera access':
    'ページを再読み込みして、カメラの使用を許可してください',
  'Ensure camera access is allowed in': 'カメラの使用が許可されているか確認してください:',
  'app settings': 'の設定',

  // Android: カメラが許可されなかったとき
  "Let's enable your camera": 'カメラを有効にしてください',
  'Tap the': '右上の',
  'in the top right': 'をタップ',
  'Tap Settings': '「設定」をタップ',
  'Site settings': 'サイトの設定',
  Camera: 'カメラ',
  Blocked: 'ブロック中',
  'CLEAR & RESET': '削除してリセット',
  Advanced: '詳細設定',
  'Manage website data': 'ウェブサイトデータの管理',
  'Press and hold': '長押し',
  DELETE: '削除',
  'Do the same for Camera': 'カメラについても同じ操作を行ってください',
  'Then, reload the page for AR!': 'その後、ページを再読み込みしてください',

  // 権限が拒否されたとき
  'Permissions were denied.': '権限が許可されませんでした',
  'You need to accept motion permissions to continue.':
    '続けるにはモーションセンサーの使用を許可してください',
  "You've prevented the page from accessing your motion sensors.":
    'モーションセンサーへのアクセスがブロックされています',
  'Please close': '',
  'app to reenable your motion sensors.': ' を終了してから、もう一度開いてください',
  Refresh: '再読み込み',

  // iOS: モーションセンサーの設定手順。
  // `<li>Open <img><b>Settings</b></li>` のように画像を挟むため、
  // 前置きの動詞を空にして、後ろの語に「〜を開く」までまとめて持たせる
  "Let's enable your motion sensors": 'モーションセンサーを有効にしてください',
  Open: '',
  Settings: '設定 を開く',
  Select: '',
  Safari: 'Safari を選択',
  Enable: '',
  'Motion & Orientation Access': '「モーションと画面の向きのアクセス」を ON',
  'Reload the page': 'ページを再読み込み',

  // 別ブラウザで開かせる画面。`<h2>Open in Safari<br/>to view AR</h2>` の形なので、
  // 前半に全文を持たせて後半は空にする
  'Open in Safari': 'Safari で開いて AR をご覧ください',
  'Open in Browser': 'ブラウザで開いて AR をご覧ください',
  'to view AR': '',
  'Start AR': 'AR を開始',
  'Copy Link': 'リンクをコピー',
  'Open your browser and paste.': 'ブラウザを開いて貼り付けてください',

  // マイクは使用しないため microphone 系の画面は対象外
}

function localizeIn(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const targets: Text[] = []

  while (walker.nextNode()) {
    targets.push(walker.currentNode as Text)
  }

  for (const node of targets) {
    // 原文には &nbsp; が混ざる箇所があるため、通常の空白に均してから引き当てる
    const key = node.textContent?.replace(/ /g, ' ').trim()
    if (!key) continue

    const translated = JA_TEXTS[key]
    // 置き換え済みなら辞書に一致しないので、繰り返し実行しても二重適用にならない。
    // 語順を入れ替えるために空文字へ置き換える項目があるので undefined で判定する
    if (translated !== undefined) node.textContent = translated
  }
}

/**
 * 日本語化を開始する。UI は非同期に挿入されるため MutationObserver で待ち受ける。
 * 戻り値を呼ぶと監視を止める（画面を離れるときに呼ぶこと）。
 */
export function localize8thWallUi(): () => void {
  const apply = () => {
    for (const selector of CONTAINER_SELECTORS) {
      for (const element of document.querySelectorAll<HTMLElement>(selector)) {
        localizeIn(element)
      }
    }
  }

  apply()

  const observer = new MutationObserver(apply)
  observer.observe(document.body, { childList: true, subtree: true })

  return () => observer.disconnect()
}
