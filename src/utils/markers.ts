/**
 * 画像マーカーの定義。
 * name は public/image-targets/<name>.json の "name" フィールドと一致させること。
 * マーカーの追加手順は public/image-targets/README.md を参照。
 */
export interface MarkerDefinition {
  /** image-target-cli で生成したターゲット名 */
  name: string
  /** HUD に表示する日本語タイトル */
  title: string
  /** 対応するコンテンツ番号（pages/Contents1〜5.vue） */
  contentId: 1 | 2 | 3 | 4 | 5
}

export const MARKERS: MarkerDefinition[] = [
  { name: 'marker_1', title: '会式一号機', contentId: 1 },
  { name: 'marker_2', title: 'プロペラ機', contentId: 2 },
  { name: 'marker_3', title: 'ジェットエンジン', contentId: 3 },
  { name: 'marker_4', title: 'ダグラス DC-3', contentId: 4 },
  { name: 'marker_5', title: 'ヘリコプター', contentId: 5 },
]

export function findMarkerByName(name: string): MarkerDefinition | undefined {
  return MARKERS.find((m) => m.name === name)
}
