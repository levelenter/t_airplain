import type { InjectionKey } from 'vue'

/**
 * 開発用プレビュー中かどうかを ArContent に伝える provide/inject キー。
 * PreviewView が true を provide し、ArContent はマーカー追従要素を素の a-entity に置き換える。
 */
export const AR_PREVIEW_KEY: InjectionKey<boolean> = Symbol('arPreview')

/**
 * AR.js（pattern マーカー）画面かどうかを ArContent に伝える provide/inject キー。
 * MarkerArView が true を provide し、ArContent はマーカー追従要素を
 * `<a-marker type="pattern">`（src/utils/markerAr.ts の .patt を参照）に差し替える。
 */
export const AR_MARKER_AR_KEY: InjectionKey<boolean> = Symbol('arMarkerAr')

/** image-target-cli が生成する JSON のうち、プレビューで使う部分 */
export interface ImageTargetMeta {
  name: string
  properties: { width: number; height: number }
  resources: { croppedImage?: string }
}

/**
 * マーカー画像を置く板の寸法（シーン単位）。
 * 8th Wall の画像ターゲットは長辺が 1 単位になるよう正規化されるので、それに合わせる。
 */
export function markerPlaneSize(meta: ImageTargetMeta): { width: number; height: number } {
  const { width, height } = meta.properties
  const longest = Math.max(width, height) || 1
  return { width: width / longest, height: height / longest }
}

/** public/image-targets/<name>.json を読み込む。無ければ null */
export async function loadImageTargetMeta(name: string): Promise<ImageTargetMeta | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}image-targets/${name}.json`)
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
    return (await res.json()) as ImageTargetMeta
  } catch {
    return null
  }
}
