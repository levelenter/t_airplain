<script setup lang="ts">
/**
 * ?debug=true のときだけ出る配置調整パネル。
 * カメラ映像を隠しすぎないよう、画面下部の細いパネルに収めて折りたためるようにする。
 */
import { computed, ref } from 'vue'
import { useContentTransformStore } from '@/stores/contentTransform'
import type { ContentId } from '@/utils/contentTransform'

const props = defineProps<{
  /** 調整対象（認識中のマーカーに対応するコンテンツ） */
  contentId: ContentId
  /** 対象コンテンツの日本語名 */
  title: string
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

/** scale は素材ごとに桁が違う（0.0008〜0.5）ため、スライダーは対数で扱う */
const scaleExponent = computed(() => Math.log10(transform.value.scale))

function readNumber(event: Event): number | null {
  const value = Number((event.target as HTMLInputElement).value)
  return Number.isFinite(value) ? value : null
}

function onAxis(key: 'position' | 'rotation', axis: 0 | 1 | 2, event: Event) {
  const value = readNumber(event)
  if (value !== null) store.updateAxis(props.contentId, key, axis, value)
}

function onScaleExponent(event: Event) {
  const exponent = readNumber(event)
  if (exponent !== null) store.update(props.contentId, { scale: 10 ** exponent })
}

function onScaleValue(event: Event) {
  const value = readNumber(event)
  if (value !== null && value > 0) store.update(props.contentId, { scale: value })
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
  <section class="panel" :class="{ 'panel--collapsed': collapsed }">
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
        <span class="panel__legend">位置</span>
        <label v-for="axis in AXES" :key="`p${axis.index}`" class="panel__row">
          <span class="panel__axis">{{ axis.label }}</span>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.005"
            :value="transform.position[axis.index]"
            @input="onAxis('position', axis.index, $event)"
          >
          <input
            type="number"
            step="0.005"
            :value="transform.position[axis.index]"
            @input="onAxis('position', axis.index, $event)"
          >
        </label>
      </div>

      <div class="panel__group">
        <span class="panel__legend">回転</span>
        <label v-for="axis in AXES" :key="`r${axis.index}`" class="panel__row">
          <span class="panel__axis">{{ axis.label }}</span>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            :value="transform.rotation[axis.index]"
            @input="onAxis('rotation', axis.index, $event)"
          >
          <input
            type="number"
            step="1"
            :value="transform.rotation[axis.index]"
            @input="onAxis('rotation', axis.index, $event)"
          >
        </label>
      </div>

      <div class="panel__group">
        <span class="panel__legend">大きさ</span>
        <label class="panel__row">
          <span class="panel__axis">倍率</span>
          <input
            type="range"
            min="-4"
            max="1"
            step="0.01"
            :value="scaleExponent"
            @input="onScaleExponent"
          >
          <input type="number" step="any" :value="transform.scale" @input="onScaleValue">
        </label>
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

.panel__legend {
  display: block;
  margin-bottom: 2px;
  font-size: 0.7rem;
  opacity: 0.65;
}

.panel__row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.panel__axis {
  width: 26px;
  font-size: 0.72rem;
  opacity: 0.8;
}

.panel__row input[type='range'] {
  flex: 1;
  min-width: 0;
  accent-color: #ffd54f;
}

.panel__row input[type='number'] {
  width: 68px;
  padding: 3px 4px;
  color: #fff;
  font-size: 0.72rem;
  background: rgb(255 255 255 / 10%);
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 5px;
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
</style>
