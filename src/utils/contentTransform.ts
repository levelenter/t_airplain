/**
 * 各コンテンツ（pages/Contents1〜5.vue）の表示位置・向き・大きさの定義。
 *
 * 実機で調整した結果は `?debug=true` を付けて開いた調整パネルから JSON として書き出し、
 * その JSON で `src/config/content-transforms.json` を差し替えると次のビルドから反映される。
 * 手順は README.md の「コンテンツの配置調整」を参照。
 */

import savedTransforms from '@/config/content-transforms.json'

/** 調整対象のコンテンツ番号（markers.ts の contentId に対応） */
export type ContentId = 1 | 2 | 3 | 4 | 5

export type Vec3 = [number, number, number]

export interface ContentTransform {
  /** マーカー原点からの位置 [x, y, z]（メートル） */
  position: Vec3
  /** 向き [x, y, z]（度） */
  rotation: Vec3
  /** 表示倍率。素材ごとに実寸が大きく異なるため絶対値で持つ */
  scale: number
  /** Y 軸まわりにゆっくり自動回転させるか */
  autoRotate: boolean
}

export type ContentTransformMap = Record<ContentId, ContentTransform>

export const CONTENT_IDS: readonly ContentId[] = [1, 2, 3, 4, 5]

/** JSON が無い・壊れている場合に使う既定値（コード上の初期配置） */
const DEFAULTS: ContentTransformMap = {
  1: { position: [0, 0.15, 0], rotation: [0, 0, 0], scale: 0.5, autoRotate: false },
  2: { position: [0, 0.1, 0], rotation: [0, 0, 0], scale: 0.0008, autoRotate: true },
  3: { position: [0, 0.1, 0], rotation: [0, 0, 0], scale: 0.07, autoRotate: true },
  4: { position: [0, 0.15, 0], rotation: [0, 0, 0], scale: 0.03, autoRotate: true },
  5: { position: [0, 0.15, 0], rotation: [0, 0, 0], scale: 0.0008, autoRotate: true },
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function isVec3(value: unknown): value is Vec3 {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n))
  )
}

export function cloneTransform(t: ContentTransform): ContentTransform {
  return {
    position: [...t.position],
    rotation: [...t.rotation],
    scale: t.scale,
    autoRotate: t.autoRotate,
  }
}

/** 既定値を返す（呼び出し側で書き換えても壊れないようコピーを渡す） */
export function defaultTransform(id: ContentId): ContentTransform {
  return cloneTransform(DEFAULTS[id])
}

/** 外部 JSON の 1 件分を検証し、欠けている項目は既定値で補う */
function normalize(raw: unknown, fallback: ContentTransform): ContentTransform {
  if (!raw || typeof raw !== 'object') return cloneTransform(fallback)

  const source = raw as Record<string, unknown>
  const scale = source.scale

  return {
    position: isVec3(source.position) ? [...source.position] : [...fallback.position],
    rotation: isVec3(source.rotation) ? [...source.rotation] : [...fallback.rotation],
    scale: typeof scale === 'number' && Number.isFinite(scale) && scale > 0 ? scale : fallback.scale,
    autoRotate: typeof source.autoRotate === 'boolean' ? source.autoRotate : fallback.autoRotate,
  }
}

/** src/config/content-transforms.json を読み込む（不正な値は既定値にフォールバック） */
export function loadTransforms(): ContentTransformMap {
  const saved = savedTransforms as Record<string, unknown>

  return {
    1: normalize(saved['1'], DEFAULTS[1]),
    2: normalize(saved['2'], DEFAULTS[2]),
    3: normalize(saved['3'], DEFAULTS[3]),
    4: normalize(saved['4'], DEFAULTS[4]),
    5: normalize(saved['5'], DEFAULTS[5]),
  }
}

/** A-Frame の position / rotation 属性用の文字列 */
export function toVec3Attr(v: Vec3): string {
  return `${round(v[0], 4)} ${round(v[1], 4)} ${round(v[2], 4)}`
}

/** A-Frame の scale 属性用の文字列（3 軸等倍） */
export function toScaleAttr(scale: number): string {
  const s = round(scale, 6)
  return `${s} ${s} ${s}`
}

/** 調整結果を配布用 JSON 文字列にする */
export function toJson(transforms: ContentTransformMap): string {
  const out: Record<string, ContentTransform> = {}

  for (const id of CONTENT_IDS) {
    const t = transforms[id]
    out[String(id)] = {
      position: [round(t.position[0], 4), round(t.position[1], 4), round(t.position[2], 4)],
      rotation: [round(t.rotation[0], 1), round(t.rotation[1], 1), round(t.rotation[2], 1)],
      scale: round(t.scale, 6),
      autoRotate: t.autoRotate,
    }
  }

  return `${JSON.stringify(out, null, 2)}\n`
}
