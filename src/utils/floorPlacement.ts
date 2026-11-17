/**
 * 床面配置 AR の計算（A-Frame / three に依存しない純粋関数）。
 *
 * 8th Wall のワールドトラッキングでは、床が y=0 の水平面になる。
 * 座標系は右手系・Y 上向き。カメラの既定の前方は -Z。
 */

export interface Vec3 {
  x: number
  y: number
  z: number
}

/** 床（y=0）上の点 */
export interface FloorPoint {
  x: number
  z: number
}

export interface FloorHit extends FloorPoint {
  /** 視線と床の交点までの水平距離（クランプ前） */
  distance: number
  /** 最大距離でクランプされたか */
  clamped: boolean
}

/** 視線がこれより水平に近い（下向き成分が小さい）場合は「床を向いていない」とみなす */
const MIN_DOWNWARD_COMPONENT = 1e-4

/**
 * カメラ位置から前方への視線と、床（y=0 の平面）との交点を求める。
 *
 * - 視線が水平または上向き、あるいはカメラが床より下にある場合は交点が無いので null。
 * - 交点までの水平距離が maxDistance を超える場合は、カメラの真下から
 *   同じ方位へ maxDistance だけ進んだ点にクランプする（clamped: true）。
 *
 * @param origin カメラのワールド位置
 * @param direction カメラ前方のワールド方向（正規化済みでなくてもよい）
 * @param maxDistance 水平距離の上限
 */
export function intersectFloor(origin: Vec3, direction: Vec3, maxDistance: number): FloorHit | null {
  const length = Math.hypot(direction.x, direction.y, direction.z)
  if (length === 0) return null

  const dy = direction.y / length
  if (dy >= -MIN_DOWNWARD_COMPONENT) return null
  if (origin.y <= 0) return null

  // origin.y + t * dy = 0 を解く
  const t = -origin.y / dy
  const hx = (direction.x / length) * t
  const hz = (direction.z / length) * t
  const distance = Math.hypot(hx, hz)

  if (distance > maxDistance) {
    // 水平方向が 0 でない（distance > maxDistance >= 0）ので方位は定まる
    const k = maxDistance / distance
    return { x: origin.x + hx * k, z: origin.z + hz * k, distance, clamped: true }
  }

  return { x: origin.x + hx, z: origin.z + hz, distance, clamped: false }
}

/**
 * 機体をカメラから見て「横腹を向け、機首が右を向く」向きに置くための Y 軸回転（ラジアン）。
 *
 * 前提: C-1 の GLB は機首が +X、機尾が -X（尾翼の位置から判断）、上が +Y。
 * Y 軸回りに θ 回すとモデルの +X は (cosθ, 0, -sinθ) を向く。
 * カメラから見た右方向は、カメラ→配置点の水平方向 d=(dx, dz) に対して (-dz, dx)。
 * 機首をこれに一致させると θ = atan2(-dx, -dz)。
 * カメラが -Z を向いている（d=(0,-1)）とき θ=0、つまりモデルのまま機首が右になる。
 * カメラと配置点がほぼ同じ位置のときは向きが定まらないので 0 を返す。
 */
export function sideViewYaw(camera: FloorPoint, target: FloorPoint): number {
  const dx = target.x - camera.x
  const dz = target.z - camera.z
  if (Math.hypot(dx, dz) < 1e-6) return 0
  return Math.atan2(-dx, -dz)
}

/** ラジアン → 度（A-Frame の rotation 属性用） */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

/**
 * 床面配置する C-1 輸送機の初期スケール。
 * モデル実寸は全長方向に約 28〜29 単位 → 0.1 倍で約 2.9 単位。
 * 8th Wall の単位は「カメラ初期高さ 2」に対する相対値で、実寸（m）ではないため、実機で要調整。
 */
export const FLOOR_C1_SCALE = 0.1

/**
 * ピンチ操作で拡大縮小できる範囲（初期スケールに対する倍率）。
 * xrextras-pinch-scale の min / max の既定は 0.33〜3 倍で窮屈なため、0.1〜10 倍に広げる。
 */
export const FLOOR_PINCH_MIN_SCALE = 0.1
export const FLOOR_PINCH_MAX_SCALE = 10

/**
 * モデルの原点を床に合わせるためのオフセット（モデルの局所単位。スケール前）。
 * GLB のノード変換（回転・スケール 0.01）適用後のバウンディングボックスは
 * X: -18.22〜10.18、Y: -2.28〜7.00、Z: ±15.30（Y 最小は脚の底）。
 * 底面を床に接地させ（Y +2.28）、機体の中心を回転軸に合わせる（X +4.02）。
 * 内側の entity の position に使うので、スケールや回転ジェスチャーでずれない。
 */
export const FLOOR_C1_MODEL_OFFSET: Vec3 = { x: 4.02, y: 2.28, z: 0 }
