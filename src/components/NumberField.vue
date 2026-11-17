<script setup lang="ts">
/**
 * 調整パネル用の数値入力欄。
 *
 * type="number" の欄を `:value` で毎回描き直すと、「-」や「1.」といった入力の途中状態で
 * 値が 0 や空に戻され、負の数や小数を打てなくなる。そのため欄の文字列（下書き）は
 * 欄そのものに持たせ、フォーカス中は外からの値で上書きしない。
 * 「完結した有限の数」になったときだけ値を通知し、blur / Enter で現在の値の表示に整える。
 */
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    step?: number | string
    /** 指定すると、この値より大きい数だけを受け付ける（倍率の「0 より大きい」用） */
    min?: number
    /** 表示する小数の桁数（有効数字を使わない場合） */
    digits?: number
    /** 指定すると小数桁ではなく有効数字でこの桁数に丸めて表示する（倍率用） */
    significant?: number
  }>(),
  { step: 'any', min: undefined, digits: 4, significant: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const input = ref<HTMLInputElement | null>(null)
const focused = ref(false)
/** 欄に入っている文字列（下書き）。フォーカス中は外からの値で書き換えない */
const draft = ref('')

/** 末尾が「.」や「e」で終わる途中状態、「-」だけ、空などを除いた完結した数の表記 */
const COMPLETE_NUMBER = /^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i

function format(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (props.significant !== undefined) return String(Number(value.toPrecision(props.significant)))
  return String(Number(value.toFixed(props.digits)))
}

/** 下書きが完結した有限の数で、制約も満たすときだけ数を返す */
function parseDraft(text: string): number | null {
  const trimmed = text.trim()
  if (!COMPLETE_NUMBER.test(trimmed)) return null
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return null
  if (props.min !== undefined && !(value > props.min)) return null
  return value
}

function show(text: string) {
  draft.value = text
  if (input.value) input.value.value = text
}

function onInput(event: Event) {
  const text = (event.target as HTMLInputElement).value
  draft.value = text
  const value = parseDraft(text)
  if (value !== null) emit('update:modelValue', value)
}

/** blur / Enter: 下書きを現在の値の表示に整える（不正な下書きは元の値に戻る） */
function commit() {
  focused.value = false
  show(format(props.modelValue))
}

onMounted(() => show(format(props.modelValue)))

watch(
  () => props.modelValue,
  (value) => {
    // 入力中は書き換えない。ただし欄の内容がすでに同じ値なら何もしない
    if (focused.value) return
    if (parseDraft(draft.value) === value) return
    show(format(value))
  },
)
</script>

<template>
  <input
    ref="input"
    class="number-field"
    type="number"
    :step="step"
    @focus="focused = true"
    @input="onInput"
    @blur="commit"
    @keydown.enter="($event.target as HTMLInputElement).blur()"
  >
</template>

<style scoped>
.number-field {
  box-sizing: border-box;
  min-width: 0;
  padding: 3px 2px;
  color: #fff;
  font-size: 0.72rem;
  text-align: right;
  background: rgb(255 255 255 / 10%);
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 5px;
  appearance: textfield;
  -moz-appearance: textfield;
}

/* 幅を節約するため、増減の矢印は出さない（微調整は ± ボタンで行う） */
.number-field::-webkit-inner-spin-button,
.number-field::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}
</style>
