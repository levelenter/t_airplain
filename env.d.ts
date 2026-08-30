/// <reference types="vite/client" />

// 8th Wall Engine (Distributed Engine Binary) が window に公開するグローバル。
// index.html の <script> で読み込まれるため、型はここで宣言する。
declare global {
  interface XR8XrController {
    configure(options: { imageTargetData?: object[]; [key: string]: unknown }): void
  }

  interface XR8Global {
    XrController: XR8XrController
    stop(): void
    isPaused(): boolean
    [key: string]: unknown
  }

  /** A-Frame（8frame）が公開するグローバル。登録済みコンポーネントのスキーマ参照に使う */
  interface AFrameComponentDefinition {
    schema?: Record<string, { default?: unknown }>
  }

  interface AFrameGlobal {
    components: Record<string, AFrameComponentDefinition | undefined>
  }

  interface Window {
    XR8?: XR8Global
    XRExtras?: Record<string, unknown>
    AFRAME?: AFrameGlobal
  }
}

export {}
