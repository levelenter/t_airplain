/**
 * A-Frame カスタムコンポーネント `orbit-camera`（PC プレビュー用）。
 *
 * 原点（マーカー中心）を注視点にして、マウスドラッグで周回・ホイールでズームする。
 * A-Frame 標準の look-controls は「その場で首を振る」操作で模型の確認に向かないため、
 * 注視点まわりを回るシンプルな軌道カメラを用意する。
 */

interface Vec3Like {
  set(x: number, y: number, z: number): void
}

interface EulerLike {
  set(x: number, y: number, z: number, order: string): void
}

interface OrbitCameraComponent {
  data: { distance: number; yaw: number; pitch: number; minDistance: number; maxDistance: number }
  el: {
    object3D: { position: Vec3Like; rotation: EulerLike }
    sceneEl: {
      canvas: HTMLCanvasElement | null
      addEventListener: HTMLElement['addEventListener']
      removeEventListener: HTMLElement['removeEventListener']
    }
  }
  yaw: number
  pitch: number
  distance: number
  dragging: boolean
  lastX: number
  lastY: number
  canvas: HTMLCanvasElement | null
  onPointerDown: (event: PointerEvent) => void
  onPointerMove: (event: PointerEvent) => void
  onPointerUp: () => void
  onWheel: (event: WheelEvent) => void
  bind: () => void
  apply: () => void
}

const DEG = Math.PI / 180
/** 真上・真下に来るとカメラの上方向が定まらなくなるので、少し手前で止める */
const PITCH_LIMIT = 89 * DEG

/** 8frame（A-Frame）読み込み後、a-scene 生成前に 1 度だけ呼ぶ */
export function registerOrbitCamera(): void {
  const aframe = window.AFRAME
  if (!aframe || aframe.components['orbit-camera']) return

  aframe.registerComponent('orbit-camera', {
    schema: {
      /** 注視点からの距離（メートル） */
      distance: { type: 'number', default: 2 },
      /** 初期の水平角（度） */
      yaw: { type: 'number', default: 0 },
      /** 初期の仰角（度）。正で見下ろす */
      pitch: { type: 'number', default: 15 },
      minDistance: { type: 'number', default: 0.3 },
      maxDistance: { type: 'number', default: 10 },
    },

    init(this: OrbitCameraComponent) {
      this.yaw = this.data.yaw * DEG
      this.pitch = this.data.pitch * DEG
      this.distance = this.data.distance
      this.dragging = false
      this.lastX = 0
      this.lastY = 0
      this.canvas = null

      this.onPointerDown = (event) => {
        if (event.button !== 0) return
        this.dragging = true
        this.lastX = event.clientX
        this.lastY = event.clientY
      }
      this.onPointerMove = (event) => {
        if (!this.dragging) return
        const dx = event.clientX - this.lastX
        const dy = event.clientY - this.lastY
        this.lastX = event.clientX
        this.lastY = event.clientY
        this.yaw -= dx * 0.005
        this.pitch = Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, this.pitch + dy * 0.005))
        this.apply()
      }
      this.onPointerUp = () => {
        this.dragging = false
      }
      this.onWheel = (event) => {
        event.preventDefault()
        // 距離に比例させると近距離でも遠距離でも操作感が揃う
        const next = this.distance * (1 + event.deltaY * 0.001)
        this.distance = Math.min(this.data.maxDistance, Math.max(this.data.minDistance, next))
        this.apply()
      }

      this.bind = () => {
        const canvas = this.el.sceneEl.canvas
        if (!canvas || this.canvas === canvas) return
        this.canvas = canvas
        canvas.addEventListener('pointerdown', this.onPointerDown)
        canvas.addEventListener('wheel', this.onWheel, { passive: false })
        window.addEventListener('pointermove', this.onPointerMove)
        window.addEventListener('pointerup', this.onPointerUp)
      }

      this.apply = () => {
        const r = this.distance
        const y = r * Math.sin(this.pitch)
        const horizontal = r * Math.cos(this.pitch)
        this.el.object3D.position.set(horizontal * Math.sin(this.yaw), y, horizontal * Math.cos(this.yaw))
        // Object3D.lookAt は +Z を目標に向けるため、-Z を向くカメラでは背を向けてしまう。
        // そこで軌道角からカメラの向きを直接組み立てる（Y で周回、X で見下ろし）。
        this.el.object3D.rotation.set(-this.pitch, this.yaw, 0, 'YXZ')
      }

      // canvas は a-scene の初期化後に生えるため、生成済みなら即、未生成なら loaded 後に紐付ける
      this.bind()
      this.el.sceneEl.addEventListener('loaded', this.bind)
      this.apply()
    },

    /** 属性が書き換えられたら初期視点に戻す（「視点リセット」ボタン用） */
    update(this: OrbitCameraComponent, oldData: Partial<OrbitCameraComponent['data']> | undefined) {
      if (!oldData || Object.keys(oldData).length === 0) return
      this.yaw = this.data.yaw * DEG
      this.pitch = this.data.pitch * DEG
      this.distance = this.data.distance
      this.apply()
    },

    remove(this: OrbitCameraComponent) {
      this.el.sceneEl.removeEventListener('loaded', this.bind)
      this.canvas?.removeEventListener('pointerdown', this.onPointerDown)
      this.canvas?.removeEventListener('wheel', this.onWheel)
      window.removeEventListener('pointermove', this.onPointerMove)
      window.removeEventListener('pointerup', this.onPointerUp)
    },
  })
}
