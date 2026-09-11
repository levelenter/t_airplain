/** GLBに内蔵されたアニメーションを、ARシーンの描画ループで再生する。 */
interface AnimationClip {
  name: string
}

interface ModelObject {
  animations?: AnimationClip[]
  visible: boolean
  parent?: ModelObject | null
}

interface AnimationMixer {
  clipAction(clip: AnimationClip): { play(): void }
  update(seconds: number): void
  stopAllAction(): void
  uncacheRoot(model: ModelObject): void
}

interface AnimatedEntity extends HTMLElement {
  object3D: ModelObject
  getObject3D(name: string): ModelObject | undefined
}

interface GltfAnimationComponent {
  data: { enabled: boolean; clip: string }
  el: AnimatedEntity
  model?: ModelObject
  mixer?: AnimationMixer
  onModelLoaded: () => void
}

/** 8frame読み込み後、a-sceneを生成する前に登録する。 */
export function registerGltfAnimation(): void {
  const aframe = window.AFRAME as
    | (AFrameGlobal & {
        THREE: { AnimationMixer: new (model: ModelObject) => AnimationMixer }
      })
    | undefined
  if (!aframe || aframe.components['gltf-animation']) return

  function release(component: GltfAnimationComponent) {
    component.mixer?.stopAllAction()
    if (component.model) component.mixer?.uncacheRoot(component.model)
    component.mixer = undefined
    component.model = undefined
  }

  aframe.registerComponent('gltf-animation', {
    schema: {
      enabled: { type: 'boolean', default: true },
      clip: { type: 'string', default: 'Airflow_Loop_4s' },
    },

    init(this: GltfAnimationComponent) {
      this.onModelLoaded = () => {
        release(this)
        const model = this.el.getObject3D('mesh')
        const clip = model?.animations?.find((item) => item.name === this.data.clip)
        if (!model || !clip) return

        this.model = model
        this.mixer = new aframe.THREE.AnimationMixer(model)
        // AnimationActionの既定値はLoopRepeat（無限繰り返し）。
        this.mixer.clipAction(clip).play()
      }
      this.el.addEventListener('model-loaded', this.onModelLoaded)
      // キャッシュ等ですでにモデルが読み込まれている場合にも対応する。
      this.onModelLoaded()
    },

    tick(this: GltfAnimationComponent, _time: number, delta: number) {
      if (!this.data.enabled || !this.mixer || !Number.isFinite(delta) || delta <= 0) return
      // タップ前、マーカーロスト中など、祖先が非表示なら更新しない。
      for (let object: ModelObject | null | undefined = this.el.object3D; object; object = object.parent) {
        if (!object.visible) return
      }
      this.mixer.update(delta / 1000)
    },

    remove(this: GltfAnimationComponent) {
      this.el.removeEventListener('model-loaded', this.onModelLoaded)
      release(this)
    },
  })
}
