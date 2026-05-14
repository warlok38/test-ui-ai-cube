import { useEffect, useState } from 'react'

const BASE_SCREEN_WIDTH = 1920
const BASE_FONT_SIZE_PX = 16
const MIN_FONT_SIZE_PX = 8
const MAX_FONT_SIZE_PX = 24

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function useGlobalFontSize() {
  const [fontSize, setFontSize] = useState(BASE_FONT_SIZE_PX)

  useEffect(() => {
    const updateFontSize = () => {
      // outerWidth is more stable for browser zoom (Ctrl + wheel):
      // it reflects window size better and avoids "zoom compensation" side effects.
      const layoutWidth = window.outerWidth || window.screen.width || BASE_SCREEN_WIDTH
      const scaledFontSize = (layoutWidth * BASE_FONT_SIZE_PX) / BASE_SCREEN_WIDTH
      const nextFontSize = clamp(scaledFontSize, MIN_FONT_SIZE_PX, MAX_FONT_SIZE_PX)

      setFontSize((prevFontSize) =>
        Math.abs(prevFontSize - nextFontSize) > Number.EPSILON ? nextFontSize : prevFontSize
      )
    }

    updateFontSize()
    window.addEventListener('resize', updateFontSize)

    return () => {
      window.removeEventListener('resize', updateFontSize)
    }
  }, [])

  return fontSize
}
