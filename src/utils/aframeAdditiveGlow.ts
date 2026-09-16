/**
 * A-Frame カスタムコンポーネント `additive-glow`。
 *
 * glTF には加算合成（Additive Blending）を表す仕様がないため、
 * 読み込み後に three.js のマテリアルを直接書き換えて「光の軌跡」らしい発光表現にする。
 * 重なった部分が明るくなり、透明レイヤーの描画順による欠けも depthWrite を切って避ける。
 */

interface GlowMaterial {
  blending: number
  transparent: boolean
  depthWrite: boolean
  needsUpdate: boolean
}

interface GlowMesh {
  isMesh?: boolean
  material?: GlowMaterial | GlowMaterial[]
}

interface GlowModel {
  traverse(callback: (object: GlowMesh) => void): void
}

interface GlowEntity extends HTMLElement {
  getObject3D(name: string): GlowModel | undefined
}

interface AdditiveGlowComponent {
  el: GlowEntity
  onModelLoaded: () => void
}

/** 8frame読み込み後、a-sceneを生成する前に登録する。 */
export function registerAdditiveGlow(): void {
  const aframe = window.AFRAME as
    | (AFrameGlobal & { THREE: { AdditiveBlending: number } })
    | undefined
  if (!aframe || aframe.components['additive-glow']) return

  aframe.registerComponent('additive-glow', {
    init(this: AdditiveGlowComponent) {
      this.onModelLoaded = () => {
        const model = this.el.getObject3D('mesh')
        model?.traverse((object) => {
          if (!object.isMesh || !object.material) return
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) {
            material.blending = aframe.THREE.AdditiveBlending
            material.transparent = true
            material.depthWrite = false
            material.needsUpdate = true
          }
        })
      }
      this.el.addEventListener('model-loaded', this.onModelLoaded)
      this.onModelLoaded()
    },

    remove(this: AdditiveGlowComponent) {
      this.el.removeEventListener('model-loaded', this.onModelLoaded)
    },
  })
}
