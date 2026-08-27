/**
 * 8th Wall Engine (XR8) のロード待ちと初期設定ユーティリティ。
 * xr.js は index.html で async 読み込みされるため、利用前に必ず waitForXR8() を待つこと。
 */

export function waitForXR8(): Promise<XR8Global> {
  return new Promise((resolve) => {
    if (window.XR8) {
      resolve(window.XR8)
      return
    }
    window.addEventListener('xrloaded', () => resolve(window.XR8!), { once: true })
  })
}

/**
 * public/image-targets/<name>.json（image-target-cli が生成したメタデータ）を読み込み、
 * XR8.XrController に画像ターゲットとして登録する。
 * 存在しない・不正なファイルはスキップする（開発中にマーカーが未生成でも起動できるように）。
 */
export async function configureImageTargets(names: string[]): Promise<string[]> {
  const xr8 = await waitForXR8()

  const results = await Promise.all(
    names.map(async (name) => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}image-targets/${name}.json`)
        if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
        return (await res.json()) as object
      } catch {
        return null
      }
    }),
  )

  const imageTargetData = results.filter((data): data is object => data !== null)
  xr8.XrController.configure({ imageTargetData })

  return names.filter((_, i) => results[i] !== null)
}

/** カメラビューを離れるときにエンジンを停止する */
export function stopXR8(): void {
  window.XR8?.stop()
}
