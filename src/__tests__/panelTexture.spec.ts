import { describe, expect, it } from 'vitest'
import { wrapText, createExplanationPanelDataUrl, measurePanelSize } from '../utils/panelTexture'

/** measureText の幅をテスト用に単純化した擬似 CanvasRenderingContext2D */
function fakeCtx(charWidth: number): CanvasRenderingContext2D {
  return {
    measureText: (text: string) => ({ width: text.length * charWidth }) as TextMetrics,
  } as unknown as CanvasRenderingContext2D
}

describe('wrapText', () => {
  it('wraps Japanese text (no spaces) to fit the given width', () => {
    const ctx = fakeCtx(10)
    const lines = wrapText(ctx, 'あいうえおかきくけこ', 55)
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(5)
    }
    expect(lines.join('')).toBe('あいうえおかきくけこ')
  })

  it('respects explicit newlines as paragraph breaks', () => {
    const ctx = fakeCtx(10)
    const lines = wrapText(ctx, 'ひとつめ\nふたつめ', 1000)
    expect(lines).toEqual(['ひとつめ', 'ふたつめ'])
  })
})

describe('createExplanationPanelDataUrl', () => {
  it('does not throw when no 2D context is available (jsdom)', () => {
    expect(() =>
      createExplanationPanelDataUrl({
        title: 'title',
        subtitle: 'subtitle',
        body: 'body text',
      }),
    ).not.toThrow()
  })
})

describe('measurePanelSize', () => {
  it('does not throw when no 2D context is available (jsdom)', () => {
    expect(() =>
      measurePanelSize({
        title: 'title',
        subtitle: 'subtitle',
        body: 'body text',
      }),
    ).not.toThrow()
  })
})
