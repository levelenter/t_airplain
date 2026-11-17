/**
 * A-Frame カスタムコンポーネント `floor-placement-marker`。
 *
 * 画面中央の視線（カメラ位置からカメラ前方へのレイ）と床（y=0）の交点に、
 * 付けた entity を毎フレーム追従させる。レイキャスターは使わず数式で求める。
 * 交点が無い（カメラが水平より上を向いている等）ときは entity を非表示にする。
 * 最新の交点は `target` に保持し、タップ時に Vue 側から読む。
 */
import { intersectFloor, type FloorHit, type Vec3 } from '@/utils/floorPlacement'

/** 配置マーカーを追従させる最大の水平距離（8th Wall の単位。カメラ初期高さ 2 に対する相対値で、実機で要調整） */
export const FLOOR_MARKER_MAX_DISTANCE = 8

export const FLOOR_MARKER_COMPONENT = 'floor-placement-marker'

/** 配置マーカーの最新状態。交点が無ければ target は null */
export interface FloorPlacementMarkerState {
  target: (FloorHit & { camera: Vec3 }) | null
}

interface ThreeCameraLike {
  matrixWorld: { elements: ArrayLike<number> }
}

interface FloorMarkerInstance extends FloorPlacementMarkerState {
  data: { maxDistance: number }
  el: {
    sceneEl: { camera?: ThreeCameraLike }
    object3D: { visible: boolean; position: { set(x: number, y: number, z: number): void } }
  }
}

/** 8frame（A-Frame）読み込み後に 1 度だけ呼ぶ */
export function registerFloorPlacementMarker(): void {
  const aframe = window.AFRAME
  if (!aframe || aframe.components[FLOOR_MARKER_COMPONENT]) return

  aframe.registerComponent(FLOOR_MARKER_COMPONENT, {
    schema: {
      maxDistance: { type: 'number', default: FLOOR_MARKER_MAX_DISTANCE },
    },

    init(this: FloorMarkerInstance) {
      this.target = null
    },

    tick(this: FloorMarkerInstance) {
      const camera = this.el.sceneEl.camera
      if (!camera) return

      // ワールド行列から位置と前方（-Z 列）を取り出す。three の型に依存しないための手計算
      const m = camera.matrixWorld.elements
      const origin: Vec3 = { x: m[12]!, y: m[13]!, z: m[14]! }
      const forward: Vec3 = { x: -m[8]!, y: -m[9]!, z: -m[10]! }

      const hit = intersectFloor(origin, forward, this.data.maxDistance)
      if (!hit) {
        this.target = null
        this.el.object3D.visible = false
        return
      }

      this.target = { ...hit, camera: origin }
      this.el.object3D.visible = true
      // リングが床でちらつかないよう、わずかに浮かせる
      this.el.object3D.position.set(hit.x, 0.01, hit.z)
    },
  })
}
