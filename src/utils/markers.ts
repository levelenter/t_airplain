/**
 * マーカー（8th Wall の Image Target として登録する「画像ARマーカー」）の定義。
 *
 * `public/marker/ar_image_number/01.png`〜`06.png`（番号入り・3:4 縦）から生成した
 * `public/image-targets/number_0N.json` を使う。
 * name は public/image-targets/<name>.json の "name" フィールドと一致させること。
 * 生成手順は public/image-targets/README.md を参照。
 */
export interface MarkerDefinition {
  /** image-target-cli で生成したターゲット名（previewOnly のものは対応するターゲットを持たない） */
  name: string
  /** HUD に表示する日本語タイトル */
  title: string
  /** 対応するコンテンツ番号（pages/Contents1〜7.vue） */
  contentId: 1 | 2 | 3 | 4 | 5 | 6 | 7
  /**
   * true なら AR（カメラ画面・メニューの一覧）には出さず、開発用プレビュー（/preview）でだけ表示する。
   * 実験用コンテンツを実機から外しつつ、PC で見え方を確認し続けるために使う。
   */
  previewOnly?: boolean
}

export const MARKERS: MarkerDefinition[] = [
  { name: 'number_01', title: 'T-1Bの「鼻」のひみつ', contentId: 1 },
  { name: 'number_02', title: 'T-6G 主翼のひみつ', contentId: 2 },
  { name: 'number_03', title: 'ジェットエンジン', contentId: 3 },
  { name: 'number_04', title: 'C-1輸送機', contentId: 4 },
  { name: 'number_05', title: 'V-44 バートル：トルク打ち消し', contentId: 5 },
  { name: 'number_06', title: 'H-19 シコルスキー：テールローターの横押し', contentId: 6 },
  // マーカー画像（Image Target）は持たない。プレビューでは無地の板の上に表示される
  { name: 'preview_07', title: '風の実験：右から左へ', contentId: 7, previewOnly: true },
]

/** AR で実際に認識・表示するマーカー（previewOnly を除いたもの） */
export const AR_MARKERS: MarkerDefinition[] = MARKERS.filter((m) => !m.previewOnly)

export function findMarkerByName(name: string): MarkerDefinition | undefined {
  return MARKERS.find((m) => m.name === name)
}
