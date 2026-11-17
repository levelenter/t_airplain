<script setup lang="ts">
/**
 * ?debug=true のときだけ出る配置調整パネル。
 * カメラ映像を隠しすぎないよう、画面下部の細いパネルに収めて折りたためるようにする。
 */
import { computed, ref, shallowRef, watch } from 'vue'
import NumberField from '@/components/NumberField.vue'
import { useContentTransformStore } from '@/stores/contentTransform'
import type { ContentId } from '@/utils/contentTransform'
import {
  POSITION_RANGES,
  SCALE_RANGES,
  type PositionRange,
  type ScaleRange,
  pickPositionRange,
  pickScaleRange,
  positionStep,
  widenPositionRange,
  widenScaleRange,
} from '@/utils/transformRanges'

const props = defineProps<{
  /** 調整対象（認識中のマーカーに対応するコンテンツ） */
  contentId: ContentId
  /** 対象コンテンツの日本語名 */
  title: string
  /**
   * 置き場所。実機（bottom）は画面下部中央、開発用プレビュー（right）は右側に縦長で出して
   * 中央のモデルに被らないようにする
   */
  dock?: 'bottom' | 'right'
}>()

defineEmits<{ close: [] }>()

const store = useContentTransformStore()
const transform = computed(() => store.get(props.contentId))

const collapsed = ref(false)
const status = ref('')

const AXES = [
  { label: 'X', index: 0 },
  { label: 'Y', index: 1 },
  { label: 'Z', index: 2 },
] as const

/** 微調整ボタンの刻み。スライダーの範囲に関係なく細かく動かせるよう固定にしている */
const POSITION_NUDGE = 0.005
const ROTATION_NUDGE = 1
const SCALE_NUDGE = 1.02

/** スライダーの範囲。位置は 3 軸共通で 1 つ、倍率は指数の範囲 */
const positionRange = ref<PositionRange>(pickPositionRange(transform.value.position))
/** 定数オブジェクトとの同一性で選択状態を判定するため、深いリアクティブにしない */
const scaleRange = shallowRef<ScaleRange>(pickScaleRange(transform.value.scale))

/**
 * 数値欄や ± ボタンで値が範囲の外に出たら、その値を含む最小の範囲へ広げる（自動で狭めはしない）。
 * コンテンツが切り替わったときは、そのコンテンツの値を含む最小の範囲を選び直す。
 */
watch(
  () => props.contentId,
  () => {
    positionRange.value = pickPositionRange(transform.value.position)
    scaleRange.value = pickScaleRange(transform.value.scale)
  },
)
watch(
  () => transform.value.position,
  (position) => {
    positionRange.value = widenPositionRange(positionRange.value, position)
  },
)
watch(
  () => transform.value.scale,
  (scale) => {
    scaleRange.value = widenScaleRange(scaleRange.value, scale)
  },
)

/** scale は素材ごとに桁が違う（0.0008〜0.5）ため、スライダーは対数で扱う */
const scaleExponent = computed(() => Math.log10(transform.value.scale))

function readNumber(event: Event): number | null {
  const value = Number((event.target as HTMLInputElement).value)
  return Number.isFinite(value) ? value : null
}

function setAxis(key: 'position' | 'rotation', axis: 0 | 1 | 2, value: number) {
  store.updateAxis(props.contentId, key, axis, value)
}

function onAxis(key: 'position' | 'rotation', axis: 0 | 1 | 2, event: Event) {
  const value = readNumber(event)
  if (value !== null) setAxis(key, axis, value)
}

/** 軸の値を delta だけ動かす（浮動小数の誤差が表示に出ないよう丸める） */
function nudgeAxis(key: 'position' | 'rotation', axis: 0 | 1 | 2, delta: number) {
  const digits = key === 'position' ? 4 : 1
  const next = transform.value[key][axis] + delta
  setAxis(key, axis, Number(next.toFixed(digits)))
}

function setScale(value: number) {
  store.update(props.contentId, { scale: value })
}

function onScaleExponent(event: Event) {
  const exponent = readNumber(event)
  if (exponent !== null) setScale(10 ** exponent)
}

function nudgeScale(factor: number) {
  setScale(Number((transform.value.scale * factor).toPrecision(6)))
}

function onAutoRotate(event: Event) {
  store.update(props.contentId, { autoRotate: (event.target as HTMLInputElement).checked })
}

function downloadJson(json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'content-transforms.json'
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * JSON をファイルとして共有する。
 * スマホの共有シートからメールアプリを選べば、そのまま添付して送信できる
 * （mailto: は添付を扱えないため Web Share API を使う）。
 */
async function shareJson() {
  const json = store.json
  const file = new File([json], 'content-transforms.json', { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'AR コンテンツ配置設定',
        text: 'content-transforms.json を src/config/ に配置してください。',
      })
      status.value = '共有シートを開きました'
      return
    } catch (error) {
      // 共有シートで閉じられただけの場合は何もしない
      if (error instanceof Error && error.name === 'AbortError') return
    }
  }

  downloadJson(json)
  status.value = 'ファイルとして保存しました'
}
</script>

<template>
  <section class="panel" :class="{ 'panel--collapsed': collapsed, 'panel--right': dock === 'right' }">
    <header class="panel__head">
      <span class="panel__title">調整: {{ title }}</span>
      <button class="panel__icon" type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▲' : '▼' }}
      </button>
      <button class="panel__icon" type="button" aria-label="閉じる" @click="$emit('close')">
        ×
      </button>
    </header>

    <div v-show="!collapsed" class="panel__body">
      <div class="panel__group">
        <div class="panel__legend-row">
          <span class="panel__legend">位置</span>
          <div class="panel__chips" role="group" aria-label="位置スライダーの範囲">
            <button
              v-for="range in POSITION_RANGES"
              :key="range"
              type="button"
              class="panel__chip"
              :class="{ 'panel__chip--on': positionRange === range }"
              :aria-pressed="positionRange === range"
              @click="positionRange = range"
            >
              ±{{ range }}
            </button>
          </div>
        </div>
        <div v-for="axis in AXES" :key="`p${axis.index}`" class="panel__row">
          <span class="panel__axis">{{ axis.label }}</span>
          <input
            type="range"
            :aria-label="`位置 ${axis.label}`"
            :min="-positionRange"
            :max="positionRange"
            :step="positionStep(positionRange)"
            :value="transform.position[axis.index]"
            @input="onAxis('position', axis.index, $event)"
          >
          <button
            type="button"
            class="panel__nudge"
            :aria-label="`${axis.label} を減らす`"
            @click="nudgeAxis('position', axis.index, -POSITION_NUDGE)"
          >
            −
          </button>
          <NumberField
            class="panel__number"
            :model-value="transform.position[axis.index]"
            :step="POSITION_NUDGE"
            :digits="4"
            :aria-label="`位置 ${axis.label} の値`"
            @update:model-value="setAxis('position', axis.index, $event)"
          />
          <button
            type="button"
            class="panel__nudge"
            :aria-label="`${axis.label} を増やす`"
            @click="nudgeAxis('position', axis.index, POSITION_NUDGE)"
          >
            ＋
          </button>
        </div>
      </div>

      <div class="panel__group">
        <div class="panel__legend-row">
          <span class="panel__legend">回転</span>
        </div>
        <div v-for="axis in AXES" :key="`r${axis.index}`" class="panel__row">
          <span class="panel__axis">{{ axis.label }}</span>
          <input
            type="range"
            :aria-label="`回転 ${axis.label}`"
            min="-180"
            max="180"
            step="1"
            :value="transform.rotation[axis.index]"
            @input="onAxis('rotation', axis.index, $event)"
          >
          <button
            type="button"
            class="panel__nudge"
            :aria-label="`回転 ${axis.label} を減らす`"
            @click="nudgeAxis('rotation', axis.index, -ROTATION_NUDGE)"
          >
            −
          </button>
          <NumberField
            class="panel__number"
            :model-value="transform.rotation[axis.index]"
            :step="1"
            :digits="1"
            :aria-label="`回転 ${axis.label} の値`"
            @update:model-value="setAxis('rotation', axis.index, $event)"
          />
          <button
            type="button"
            class="panel__nudge"
            :aria-label="`回転 ${axis.label} を増やす`"
            @click="nudgeAxis('rotation', axis.index, ROTATION_NUDGE)"
          >
            ＋
          </button>
        </div>
      </div>

      <div class="panel__group">
        <div class="panel__legend-row">
          <span class="panel__legend">大きさ</span>
          <div class="panel__chips" role="group" aria-label="倍率スライダーの範囲">
            <button
              v-for="range in SCALE_RANGES"
              :key="range.min"
              type="button"
              class="panel__chip"
              :class="{ 'panel__chip--on': scaleRange === range }"
              :aria-pressed="scaleRange === range"
              @click="scaleRange = range"
            >
              {{ 10 ** range.min }}〜{{ 10 ** range.max }}
            </button>
          </div>
        </div>
        <div class="panel__row">
          <span class="panel__axis">倍率</span>
          <input
            type="range"
            aria-label="倍率"
            :min="scaleRange.min"
            :max="scaleRange.max"
            step="0.01"
            :value="scaleExponent"
            @input="onScaleExponent"
          >
          <button
            type="button"
            class="panel__nudge"
            aria-label="倍率を減らす"
            @click="nudgeScale(1 / SCALE_NUDGE)"
          >
            −
          </button>
          <NumberField
            class="panel__number"
            :model-value="transform.scale"
            :min="0"
            :significant="4"
            aria-label="倍率の値"
            @update:model-value="setScale"
          />
          <button
            type="button"
            class="panel__nudge"
            aria-label="倍率を増やす"
            @click="nudgeScale(SCALE_NUDGE)"
          >
            ＋
          </button>
        </div>
      </div>

      <label class="panel__toggle">
        <input type="checkbox" :checked="transform.autoRotate" @change="onAutoRotate">
        自動回転
      </label>

      <div class="panel__actions">
        <button class="panel__button" type="button" @click="store.reset(props.contentId)">
          このコンテンツを初期値に
        </button>
        <button class="panel__button panel__button--primary" type="button" @click="shareJson">
          JSON を送信
        </button>
      </div>

      <p v-if="status" class="panel__status">{{ status }}</p>
    </div>
  </section>
</template>

<style scoped>
.panel {
  position: fixed;
  z-index: 20;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
  left: 50%;
  width: min(92vw, 340px);
  transform: translateX(-50%);
  color: #fff;
  font-size: 0.78rem;
  background: rgb(10 14 20 / 72%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 28px rgb(0 0 0 / 45%);
}

.panel__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
}

.panel__title {
  flex: 1;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel__icon {
  width: 26px;
  height: 26px;
  padding: 0;
  color: #fff;
  font-size: 0.8rem;
  background: rgb(255 255 255 / 12%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 開発用プレビュー用: 右端に寄せて縦に伸ばす */
.panel--right {
  top: 72px;
  right: 16px;
  bottom: auto;
  left: auto;
  transform: none;
}

.panel--right .panel__body {
  max-height: calc(100vh - 160px);
}

/* 折りたたみ中はヘッダーだけにして視界を空ける */
.panel__body {
  /* 縦に伸びすぎないよう上限を決め、超えたらパネル内でスクロールさせる */
  max-height: min(46vh, 340px);
  overflow-y: auto;
  padding: 0 10px 10px;
}

.panel__group {
  margin-bottom: 8px;
}

.panel__legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 20px;
  margin-bottom: 2px;
}

.panel__legend {
  font-size: 0.7rem;
  opacity: 0.65;
}

.panel__chips {
  display: flex;
  gap: 4px;
}

.panel__chip {
  padding: 2px 7px;
  color: #fff;
  font-size: 0.66rem;
  background: rgb(255 255 255 / 10%);
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 999px;
  cursor: pointer;
}

.panel__chip--on {
  color: #0b1e3f;
  font-weight: bold;
  background: #ffd54f;
  border-color: transparent;
}

.panel__row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 3px;
}

.panel__axis {
  flex: none;
  width: 24px;
  font-size: 0.72rem;
  opacity: 0.8;
}

.panel__row input[type='range'] {
  flex: 1;
  min-width: 0;
  /* つまみを指で掴みやすいよう、タッチ対象の高さを 28px 確保する */
  height: 28px;
  margin: 0;
  accent-color: #ffd54f;
}

.panel__nudge {
  flex: none;
  width: 22px;
  height: 28px;
  padding: 0;
  color: #fff;
  font-size: 0.9rem;
  line-height: 1;
  background: rgb(255 255 255 / 12%);
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 5px;
  cursor: pointer;
}

.panel__number {
  flex: none;
  width: 58px;
  height: 28px;
}

.panel__toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
  accent-color: #ffd54f;
}

.panel__actions {
  display: flex;
  gap: 6px;
}

.panel__button {
  flex: 1;
  padding: 8px 6px;
  color: #fff;
  font-size: 0.72rem;
  background: rgb(255 255 255 / 12%);
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 8px;
  cursor: pointer;
}

.panel__button--primary {
  color: #0b1e3f;
  font-weight: bold;
  background: #ffd54f;
  border-color: transparent;
}

.panel__status {
  margin: 6px 0 0;
  font-size: 0.7rem;
  text-align: center;
  opacity: 0.75;
}

/* 横向きモード: 画面高に収め、左側に寄せて中央の照準を覆わないようにする */
html[data-layout='landscape'] .panel:not(.panel--right) {
  top: calc(env(safe-area-inset-top, 0px) + 52px);
  bottom: auto;
  left: calc(env(safe-area-inset-left, 0px) + 12px);
  max-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 60px);
  max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 60px);
  display: flex;
  flex-direction: column;
  width: clamp(280px, 38vw, 330px);
  transform: none;
}

html[data-layout='landscape'] .panel:not(.panel--right) .panel__body {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
}
</style>
