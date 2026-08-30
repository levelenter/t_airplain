/**
 * A-Frame カスタムコンポーネント `auto-spin`。
 *
 * A-Frame 標準の animation コンポーネントで rotation を回すと、
 * 調整パネルで指定した向き（rotation）を上書きしてしまい両立できない。
 * そこで自動回転だけを入れ子の entity に担わせ、object3D を直接回して分離する。
 */

interface AutoSpinComponent {
  data: { enabled: boolean; speed: number }
  el: { object3D: { rotation: { y: number } } }
}

/** 8frame（A-Frame）読み込み後に 1 度だけ呼ぶ */
export function registerAutoSpin(): void {
  const aframe = window.AFRAME
  if (!aframe || aframe.components['auto-spin']) return

  aframe.registerComponent('auto-spin', {
    schema: {
      enabled: { type: 'boolean', default: true },
      /** 1 秒あたりの回転角（度） */
      speed: { type: 'number', default: 30 },
    },

    tick(this: AutoSpinComponent, _time: number, delta: number) {
      if (!this.data.enabled || !delta) return
      this.el.object3D.rotation.y += ((this.data.speed * delta) / 1000) * (Math.PI / 180)
    },
  })
}
