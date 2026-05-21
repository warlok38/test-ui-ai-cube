'use client'

import { useEffect, useLayoutEffect, useRef, useState, type Ref } from 'react'

import { getScrollContainerVisibleBounds } from '@/features/assistant/hooks/scrollContainerBounds'

export type UsePinnedUserQuestionOptions = {
  text: string
  pinDisabled: boolean
  innerRef?: Ref<HTMLDivElement>
}

export function usePinnedUserQuestion({
  text,
  pinDisabled,
  innerRef
}: UsePinnedUserQuestionOptions) {
  const measureRef = useRef<HTMLDivElement>(null)
  const flowRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const keepExpandedWhilePinnedRef = useRef(false)
  const [isAboveViewport, setIsAboveViewport] = useState(false)
  const [isMultiline, setIsMultiline] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const showOverlay = isAboveViewport && !pinDisabled

  useEffect(() => {
    const flow = flowRef.current
    if (!flow) return

    const root =
      scrollContainerRef.current ??
      (flow.closest('[data-chat-scroll-container]') as HTMLElement | null)
    if (!root) return

    scrollContainerRef.current = root

    const updateVisibility = () => {
      const bounds = getScrollContainerVisibleBounds(root)
      const flowRect = flow.getBoundingClientRect()
      setIsAboveViewport(flowRect.bottom <= bounds.top)
    }

    updateVisibility()

    root.addEventListener('scroll', updateVisibility, { passive: true })

    const resizeObserver = new ResizeObserver(updateVisibility)
    resizeObserver.observe(root)
    resizeObserver.observe(flow)

    return () => {
      root.removeEventListener('scroll', updateVisibility)
      resizeObserver.disconnect()
    }
  }, [text])

  useLayoutEffect(() => {
    const measureEl = measureRef.current
    const flowEl = flowRef.current
    if (!measureEl || !flowEl) return

    const measureFlow = () => {
      const width = flowEl.clientWidth
      measureEl.style.width = `${width}px`
      const lineHeight = Number.parseFloat(getComputedStyle(measureEl).lineHeight)
      const safeLineHeight = Number.isFinite(lineHeight) ? lineHeight : measureEl.clientHeight
      setIsMultiline(measureEl.scrollHeight > safeLineHeight * 1.5)
    }

    measureFlow()

    const resizeObserver = new ResizeObserver(measureFlow)
    resizeObserver.observe(flowEl)

    return () => resizeObserver.disconnect()
  }, [text])

  useEffect(() => {
    if (!showOverlay) {
      keepExpandedWhilePinnedRef.current = false
      setIsExpanded(true)
    }
  }, [showOverlay])

  useLayoutEffect(() => {
    if (!showOverlay || !isMultiline || keepExpandedWhilePinnedRef.current) return
    setIsExpanded(false)
  }, [showOverlay, isMultiline])

  const handleToggleExpanded = () => {
    if (!showOverlay || !isMultiline) return
    const nextExpanded = !isExpanded
    keepExpandedWhilePinnedRef.current = nextExpanded
    setIsExpanded(nextExpanded)
  }

  const setFlowRef = (node: HTMLDivElement | null) => {
    flowRef.current = node
    if (typeof innerRef === 'function') {
      innerRef(node)
    }
  }

  return {
    measureRef,
    setFlowRef,
    showOverlay,
    isMultiline,
    isExpanded,
    handleToggleExpanded
  }
}
