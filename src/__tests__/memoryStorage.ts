/** テスト環境の localStorage が使えない場合に備え、メモリ上の Storage に差し替える */
export function installMemoryLocalStorage(): void {
  const data = new Map<string, string>()
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size
    },
  }
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
}
