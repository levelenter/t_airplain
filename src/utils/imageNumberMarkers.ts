/**
 * 8th Wall の Image Target として登録する「画像番号マーカー」の定義。
 *
 * `public/marker/ar_image_number/01.png`〜`06.png`（番号入り・3:4 縦）から生成した
 * `public/image-targets/number_0N.json` を使う。生成手順は `public/image-targets/README.md`。
 * AR.js 版（src/utils/markerAr.ts の marker_01〜）とは名前を分けてあり、
 * title / contentId の対応は同じ（同じ Contents1〜6 を表示する）。
 */
import type { MarkerDefinition } from './markers'

export const IMAGE_NUMBER_MARKERS: MarkerDefinition[] = [
  { name: 'number_01', title: 'T-1Bの「鼻」のひみつ', contentId: 1 },
  { name: 'number_02', title: 'T-6G 主翼のひみつ', contentId: 2 },
  { name: 'number_03', title: 'ジェットエンジン', contentId: 3 },
  { name: 'number_04', title: 'C-1輸送機', contentId: 4 },
  { name: 'number_05', title: 'V-44 バートル：トルク打ち消し', contentId: 5 },
  { name: 'number_06', title: 'H-19 シコルスキー：テールローターの横押し', contentId: 6 },
]
