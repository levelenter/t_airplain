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
  // サンプル: 8th Wall 公式サンプルのターゲット（動作確認用）。実運用では差し替える。
  { name: 'model-target', title: '会式一号機', contentId: 1 },
  { name: 'marker2', title: 'アンリ・ファルマン機', contentId: 2 },
  { name: 'marker3', title: '九一式戦闘機', contentId: 3 },
  { name: 'marker4', title: 'C-46A輸送機', contentId: 4 },
  { name: 'marker5', title: '航空発祥の地・所沢', contentId: 5 },
]

export function findMarkerByName(name: string): MarkerDefinition | undefined {
  return MARKERS.find((m) => m.name === name)
}
