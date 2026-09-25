/**
 * AR.js（pattern マーカー）で表示する番号入りマーカーの定義。
 *
 * `public/marker/01.png`〜`06.png`（番号入り）から生成した `public/ar-patterns/marker_0N.patt`
 * を使う。8th Wall 側の `marker_1`〜`marker_7`（写真マーカー、src/utils/markers.ts）とは
 * 別の仕組み・別名前空間で、同じ Contents1〜6（3D モデル・エフェクト）を表示する。
 * 生成手順は `public/ar-patterns/README.md` を参照。
 */
export interface MarkerArDefinition {
  /** マーカー名。ArContent がこの名前から .patt の URL を組み立てる */
  name: string
  /** HUD に表示する日本語タイトル */
  title: string
  /** 対応するコンテンツ番号（pages/Contents1〜6.vue） */
  contentId: 1 | 2 | 3 | 4 | 5 | 6
}

export const MARKER_AR_MARKERS: MarkerArDefinition[] = [
  { name: 'marker_01', title: 'T-1Bの「鼻」のひみつ', contentId: 1 },
  { name: 'marker_02', title: 'T-6G 主翼のひみつ', contentId: 2 },
  { name: 'marker_03', title: 'ジェットエンジン', contentId: 3 },
  { name: 'marker_04', title: 'C-1輸送機', contentId: 4 },
  { name: 'marker_05', title: 'V-44 バートル：トルク打ち消し', contentId: 5 },
  { name: 'marker_06', title: 'H-19 シコルスキー：テールローターの横押し', contentId: 6 },
]

/** ArContent が使う .patt の URL（サイトルート相対） */
export function markerArPatternUrl(name: string): string {
  return `${import.meta.env.BASE_URL}ar-patterns/${name}.patt`
}
