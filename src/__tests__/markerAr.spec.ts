import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CONTENT_IDS } from '../utils/contentTransform'
import { MARKER_AR_MARKERS, markerArPatternUrl } from '../utils/markerAr'
import { AR_MARKERS } from '../utils/markers'

const asset = (path: string) => resolve(process.cwd(), 'public', path)

describe('AR.js pattern markers (01〜06)', () => {
  it('defines 6 markers named marker_01..marker_06 mapped to contentId 1..6', () => {
    expect(MARKER_AR_MARKERS.map((m) => m.name)).toEqual([
      'marker_01',
      'marker_02',
      'marker_03',
      'marker_04',
      'marker_05',
      'marker_06',
    ])
    expect(MARKER_AR_MARKERS.map((m) => m.contentId)).toEqual([1, 2, 3, 4, 5, 6])
    for (const marker of MARKER_AR_MARKERS) {
      expect(CONTENT_IDS).toContain(marker.contentId)
    }
  })

  it('does not collide with the 8th Wall photo marker names (marker_1..marker_7)', () => {
    const arjsNames = new Set(MARKER_AR_MARKERS.map((m) => m.name))
    for (const marker of AR_MARKERS) {
      expect(arjsNames.has(marker.name)).toBe(false)
    }
  })

  it('resolves each marker to a numbered marker image and a .patt pattern file that exist on disk', () => {
    for (const marker of MARKER_AR_MARKERS) {
      const num = marker.name.replace('marker_', '')
      expect(existsSync(asset(`marker/${num}.png`))).toBe(true)

      const patternUrl = markerArPatternUrl(marker.name)
      expect(patternUrl).toBe(`/ar-patterns/${marker.name}.patt`)
      expect(existsSync(asset(`ar-patterns/${marker.name}.patt`))).toBe(true)
    }
  })

  it('ships well-formed .patt files (4 orientations x 3 channels x 16x16 byte values)', () => {
    for (const marker of MARKER_AR_MARKERS) {
      const patt = readFileSync(asset(`ar-patterns/${marker.name}.patt`), 'utf8')
      const numbers = patt.trim().split(/\s+/)
      expect(numbers).toHaveLength(4 * 3 * 16 * 16)
      for (const n of numbers) {
        const value = Number(n)
        expect(Number.isInteger(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(255)
      }
    }
  })

  it('gives every marker a distinct pattern (no two numbered markers share the same .patt content)', () => {
    const contents = MARKER_AR_MARKERS.map((m) => readFileSync(asset(`ar-patterns/${m.name}.patt`), 'utf8'))
    expect(new Set(contents).size).toBe(contents.length)
  })
})
