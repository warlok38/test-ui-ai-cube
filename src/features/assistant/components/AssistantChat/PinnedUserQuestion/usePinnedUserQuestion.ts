'use client'

import { useEffect, useLayoutEffect, useRef, useState, type Ref } from 'react'

export type UsePinnedUserQuestionOptions = {
  text: string
  isActivePin: boolean
  innerRef?: Ref<HTMLDivElement>
}

export function usePinnedUserQuestion({
  text,
  isActivePin,
  innerRef
}: UsePinnedUserQuestionOptions) {
  const measureRef = useRef<HTMLDivElement>(null)
  const flowRef = useRef<HTMLDivElement | null>(null)
  const keepExpandedWhilePinnedRef = useRef(false)
  const handoffFrameRef = useRef<number | null>(null)
  const [isMultiline, setIsMultiline] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [showFlowBubble, setShowFlowBubble] = useState(true)

  const showOverlay = isActivePin
  const hideFlowBubble = showOverlay || !showFlowBubble

  useEffect(() => {
    setShowFlowBubble(true)
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
    if (showOverlay) {
      if (handoffFrameRef.current !== null) {
        cancelAnimationFrame(handoffFrameRef.current)
        handoffFrameRef.current = null
      }
      setShowFlowBubble(false)
      return
    }

    handoffFrameRef.current = requestAnimationFrame(() => {
      handoffFrameRef.current = null
      setShowFlowBubble(true)
    })

    return () => {
      if (handoffFrameRef.current !== null) {
        cancelAnimationFrame(handoffFrameRef.current)
        handoffFrameRef.current = null
      }
    }
  }, [showOverlay])

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
    hideFlowBubble,
    isMultiline,
    isExpanded,
    handleToggleExpanded
  }
}
