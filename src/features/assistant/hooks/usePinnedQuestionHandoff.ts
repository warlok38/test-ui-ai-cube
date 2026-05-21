'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

import { getScrollContainerVisibleBounds } from './scrollContainerBounds'

const HYSTERESIS_PX = 4

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

export function computeActivePinnedMessageId(
  turnUserIds: string[],
  userRefs: Map<string, HTMLDivElement>,
  pinStates: Map<string, PinState>,
  visibleBounds: { top: number; bottom: number },
  currentActiveId: string | null
): string | null {
  let activeId = currentActiveId

  if (activeId) {
    const currentEl = userRefs.get(activeId)
    const currentDisabled = pinStates.get(activeId)?.pinDisabled ?? false

    if (!currentEl || currentDisabled) {
      activeId = null
    } else {
      const currentRect = currentEl.getBoundingClientRect()
      if (currentRect.bottom > visibleBounds.top + HYSTERESIS_PX) {
        activeId = null
      }
    }
  }

  turnUserIds.forEach((id) => {
    if (pinStates.get(id)?.pinDisabled) return

    const el = userRefs.get(id)
    if (!el) return

    const rect = el.getBoundingClientRect()
    if (rect.bottom <= visibleBounds.top) {
      activeId = id
    }
  })

  return activeId
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
  const [activePinnedMessageId, setActivePinnedMessageId] = useState<string | null>(null)
  const activePinnedRef = useRef<string | null>(null)

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

    const userRefMap = userRefs.current ?? new Map()
    const nextActiveId = computeActivePinnedMessageId(
      turnUserIds,
      userRefMap,
      nextStates,
      visibleBounds,
      activePinnedRef.current
    )

    activePinnedRef.current = nextActiveId
    setActivePinnedMessageId((prev) => (prev === nextActiveId ? prev : nextActiveId))

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
    activePinnedRef.current = null
    setActivePinnedMessageId(null)
  }, [turnUserIds.join('|')])

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

  return { pinStates, activePinnedMessageId }
}
