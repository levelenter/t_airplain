/**
 * 効果音まわり。再生は howler.js に任せる。
 *
 * - タップ音・マーカー発見音: public/sound/ の音源を Howl で再生する
 *   （生成時にプリロードされるため、初回再生でも音が遅れない）
 * - 探索中のソナー音: 音源を持たないので Web Audio で合成する。
 *   howler が持つ AudioContext に相乗りさせ、音量管理を masterGain に揃える。
 *
 * iOS / Android の自動再生制限は howler の autoUnlock が処理するが、
 * 確実を期してカメラ画面へ入る前（スタートボタン）に unlockAudio() を呼ぶ。
 */

import { Howl, Howler } from 'howler'

/** ソナーの ping 間隔 */
const SONAR_INTERVAL_MS = 2600
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

let sonarTimer: ReturnType<typeof setInterval> | null = null
let sonarEcho: DelayNode | null = null
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

/** 水中の反響に見立てたディレイ。1 度だけ作って使い回す */
function getSonarEcho(ctx: AudioContext, destination: AudioNode): DelayNode {
  if (sonarEcho) return sonarEcho

  const delay = ctx.createDelay(1)
  delay.delayTime.value = 0.28

  const feedback = ctx.createGain()
  feedback.gain.value = 0.34

  // 反響のたびに高域を削ることで、遠ざかっていく響きになる
  const damping = ctx.createBiquadFilter()
  damping.type = 'lowpass'
  damping.frequency.value = 1600

  delay.connect(damping)
  damping.connect(feedback)
  feedback.connect(delay)
  delay.connect(destination)

  sonarEcho = delay
  return delay
}

function pingSonar(): void {
  const ctx = Howler.ctx
  // HTML5 Audio へフォールバックしている環境では合成音は鳴らせない
  if (!ctx) return

  const destination: AudioNode = Howler.masterGain ?? ctx.destination
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  // わずかに下降させると潜水艦のソナーらしい ping になる
  osc.frequency.setValueAtTime(1180, now)
  osc.frequency.exponentialRampToValueAtTime(920, now + 0.5)

  // 繰り返し鳴るので、耳に刺さらないよう控えめな音量で長めに減衰させる
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)

  osc.connect(gain)
  gain.connect(destination)
  gain.connect(getSonarEcho(ctx, destination))

  osc.start(now)
  osc.stop(now + 1)
}

/** マーカー探索中のソナー音を鳴らし始める（多重起動しない） */
export function startSonar(): void {
  if (sonarTimer !== null) return

  unlockAudio()
  pingSonar()
  sonarTimer = setInterval(pingSonar, SONAR_INTERVAL_MS)
}

/** ソナー音を止める（鳴っている残響は自然に減衰させる） */
export function stopSonar(): void {
  if (sonarTimer === null) return

  clearInterval(sonarTimer)
  sonarTimer = null
}
