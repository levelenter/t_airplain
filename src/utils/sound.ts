/**
 * 効果音まわり。再生は howler.js に任せる。
 *
 * Howl は生成時に音源をプリロードするため、初回再生でも音が遅れない。
 * iOS / Android の自動再生制限は howler の autoUnlock が処理するが、
 * 確実を期してカメラ画面へ入る前（スタートボタン）に unlockAudio() を呼ぶ。
 */

import { Howl, Howler } from 'howler'

/** トラッキングのちらつきで同じ音が連打されるのを防ぐ最小間隔 */
const REPLAY_GUARD_MS = 400

/** マーカーをタップしてコンテンツを表示したとき */
const tapSound = new Howl({
  src: [`${import.meta.env.BASE_URL}sound/tap.mp3`],
  volume: 0.9,
})

/** マーカーを認識したとき */
const foundSound = new Howl({
  src: [`${import.meta.env.BASE_URL}sound/found.mp3`],
  volume: 0.8,
})

const lastPlayedAt = new WeakMap<Howl, number>()

/**
 * AudioContext をユーザー操作の中で再開する。
 * これを踏まないと iOS Safari では以降どの音も鳴らないことがある。
 */
export function unlockAudio(): void {
  const ctx = Howler.ctx
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume()
  }
}

function play(sound: Howl): void {
  unlockAudio()

  const now = Date.now()
  if (now - (lastPlayedAt.get(sound) ?? 0) < REPLAY_GUARD_MS) return
  lastPlayedAt.set(sound, now)

  sound.play()
}

/** マーカーをタップしてコンテンツを表示したときの音 */
export function playTapSound(): void {
  play(tapSound)
}

/** マーカーを認識したときの音 */
export function playFoundSound(): void {
  play(foundSound)
}
