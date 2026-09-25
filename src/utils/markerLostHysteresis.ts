/**
 * AR.js の markerFound/markerLost は 1〜2 フレームだけ認識が途切れると
 * すぐさま markerLost を発火するため、そのまま onImageLost に繋ぐと
 * 「タップ待ち」表示や解説パネルが点滅してしまう（モデル自体は a-marker の
 * smooth オプション、UI のちらつきはこのヒステリシスで別々に抑える）。
 *
 * markerLost が来てもすぐには確定させず、猶予時間内に同じ名前の markerFound が
 * 来なければロスト確定として onLost を呼ぶ。found はガード無しで即時に伝搬してよい
 * （見つかった瞬間に反応が遅れると「タップして表示」が遅れて見えるため）。
 */
export interface MarkerLostHysteresis {
  /** markerFound イベントを受け取ったら呼ぶ。保留中の lost タイマーを解除する */
  found(name: string): void
  /** markerLost イベントを受け取ったら呼ぶ。猶予時間後に onLost(name) が呼ばれる */
  lost(name: string): void
  /** アンマウント時に保留中のタイマーを全て破棄する */
  dispose(): void
}

export function createMarkerLostHysteresis(
  onLost: (name: string) => void,
  delayMs = 400,
): MarkerLostHysteresis {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function found(name: string) {
    const timer = timers.get(name)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.delete(name)
    }
  }

  function lost(name: string) {
    // 既存の保留タイマーがあれば張り直す（連続で lost が来ても二重発火しない）
    found(name)
    const timer = setTimeout(() => {
      timers.delete(name)
      onLost(name)
    }, delayMs)
    timers.set(name, timer)
  }

  function dispose() {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  }

  return { found, lost, dispose }
}
