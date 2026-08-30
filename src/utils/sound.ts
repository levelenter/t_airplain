/**
 * UI 効果音。音源ファイルを持たずに済むよう Web Audio API で合成する。
 *
 * AudioContext はユーザー操作（タップ）のハンドラ内で生成・再開する必要がある。
 * iOS Safari は初回操作まで suspended のままなので、再生のたびに resume を試みる。
 */

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext
    if (!AudioContextCtor) return null
    audioContext = new AudioContextCtor()
  }

  return audioContext
}

/** マーカーをタップしてコンテンツを出したときの確認音（短い「コッ」） */
export function playTapSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    void ctx.resume()
  }

  const now = ctx.currentTime

  // 立ち上がりを一瞬にして短く減衰させる（クリック音にならないよう 0 は避ける）
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26)
  gain.connect(ctx.destination)

  // 高音（アタック）と低音（芯）を重ねて硬すぎない確認音にする
  for (const frequency of [1320, 880]) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, now)
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, now + 0.22)
    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.28)
  }
}
