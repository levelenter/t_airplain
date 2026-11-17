/**
 * 調整パネルのスライダー範囲の定義と、値から範囲を決める純粋関数。
 * スライダーの細かさを保つため、範囲は切り替え式にしている。
 */

/** 位置スライダーの範囲（±半幅。メートル） */
export const POSITION_RANGES = [1, 5, 20] as const
export type PositionRange = (typeof POSITION_RANGES)[number]

/** 倍率スライダーの範囲（10 の指数の下限と上限） */
export const SCALE_RANGES = [
  { min: -4, max: 1 },
  { min: -2, max: 3 },
] as const
export type ScaleRange = (typeof SCALE_RANGES)[number]

/** 位置スライダーの既定範囲（±1） */
export const DEFAULT_POSITION_RANGE: PositionRange = POSITION_RANGES[0]

/** 倍率スライダーの既定範囲（指数 -4〜1） */
export const DEFAULT_SCALE_RANGE: ScaleRange = SCALE_RANGES[0]

/** 位置スライダーの step。範囲に比例（±1 → 0.005） */
export function positionStep(range: PositionRange): number {
  return range * 0.005
}

/** 3 軸の絶対値の最大を含む最小の位置範囲。最大範囲も超えるときは最大範囲を返す */
export function pickPositionRange(position: readonly number[]): PositionRange {
  const peak = Math.max(0, ...position.map((v) => Math.abs(v)))
  return POSITION_RANGES.find((range) => peak <= range) ?? POSITION_RANGES[POSITION_RANGES.length - 1]!
}

/** 倍率を含む最小の倍率範囲。最大範囲を超えるときは最大範囲、不正・下限未満のときは最小範囲を返す */
export function pickScaleRange(scale: number): ScaleRange {
  if (!(scale > 0)) return SCALE_RANGES[0]
  const exponent = Math.log10(scale)
  // 浮動小数の誤差で 10 や 0.0001 ちょうどが範囲外にならないよう、わずかに許容する
  const eps = 1e-9
  // 最小範囲より小さい値は最小範囲のまま（つまみは左端に張り付く）
  if (exponent < SCALE_RANGES[0].min - eps) return SCALE_RANGES[0]
  return (
    SCALE_RANGES.find((r) => exponent >= r.min - eps && exponent <= r.max + eps) ??
    SCALE_RANGES[SCALE_RANGES.length - 1]!
  )
}

/** 位置が現在の範囲の外なら、含む最小の範囲へ広げる（狭めはしない） */
export function widenPositionRange(current: PositionRange, position: readonly number[]): PositionRange {
  const wanted = pickPositionRange(position)
  return wanted > current ? wanted : current
}

/** 倍率が現在の範囲の外なら、含む範囲へ広げる（狭めはしない） */
export function widenScaleRange(current: ScaleRange, scale: number): ScaleRange {
  const wanted = pickScaleRange(scale)
  return SCALE_RANGES.indexOf(wanted) > SCALE_RANGES.indexOf(current) ? wanted : current
}
