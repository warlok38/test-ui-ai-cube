'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'

import { getScrollContainerVisibleBounds } from './scrollContainerBounds'

export type PinState = {
  pinDisabled: boolean
}

export function computePinDisabled(
  visibleBounds: { top: number; bottom: number },
  nextUserRect?: DOMRectReadOnly | null
): boolean {
  if (!nextUserRect) return false

  return nextUserRect.top < visibleBounds.bottom && nextUserRect.bottom > visibleBounds.top
}

type UsePinnedQuestionHandoffOptions = {
  scrollContainerRef: RefObject<HTMLElement | null>
  turnUserIds: string[]
  userRefs: RefObject<Map<string, HTMLDivElement>>
}

export function usePinnedQuestionHandoff({
  scrollContainerRef,
  turnUserIds,
  userRefs
}: UsePinnedQuestionHandoffOptions) {
  const [pinStates, setPinStates] = useState<Map<string, PinState>>(() => new Map())

  const updatePinStates = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const visibleBounds = getScrollContainerVisibleBounds(container)
    const nextStates = new Map<string, PinState>()

    turnUserIds.forEach((id, index) => {
      const nextId = turnUserIds[index + 1]
      if (!nextId) {
        nextStates.set(id, { pinDisabled: false })
        return
      }

      const nextUserEl = userRefs.current?.get(nextId)
      if (!nextUserEl) return

      nextStates.set(id, {
        pinDisabled: computePinDisabled(visibleBounds, nextUserEl.getBoundingClientRect())
      })
    })

    setPinStates((prev) => {
      if (prev.size === nextStates.size) {
        let same = true
        nextStates.forEach((value, key) => {
          if (!same) return
          const existing = prev.get(key)
          if (!existing || existing.pinDisabled !== value.pinDisabled) {
            same = false
          }
        })
        if (same) return prev
      }
      return nextStates
    })
  }, [scrollContainerRef, turnUserIds, userRefs])

  useEffect(() => {
    updatePinStates()
  }, [updatePinStates])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', updatePinStates, { passive: true })

    const resizeObserver = new ResizeObserver(updatePinStates)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', updatePinStates)
      resizeObserver.disconnect()
    }
  }, [scrollContainerRef, updatePinStates])

  return { pinStates }
}
