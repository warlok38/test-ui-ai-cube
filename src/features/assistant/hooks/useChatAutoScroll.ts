'use client'

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

import type { ChatMessage } from '@/features/assistant/model/assistantSlice'

export const NEAR_BOTTOM_THRESHOLD = 150

export function isNearBottom(container: HTMLElement, threshold = NEAR_BOTTOM_THRESHOLD): boolean {
  return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
}

export function scrollToBottomInstant(container: HTMLElement): void {
  container.scrollTop = container.scrollHeight
}

type UseChatAutoScrollOptions = {
  scrollContainerRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
  messages: ChatMessage[]
  chatId?: string | null
  isRunning: boolean
}

function isAssistantReply(prevLast: ChatMessage | undefined, currLast: ChatMessage): boolean {
  if (!prevLast || prevLast.id !== currLast.id) return false

  const hadInterpretation = Boolean(prevLast.interpretation)
  const hasInterpretation = Boolean(currLast.interpretation)

  return !hadInterpretation && hasInterpretation
}

export function useChatAutoScroll({
  scrollContainerRef,
  contentRef,
  messages,
  chatId,
  isRunning
}: UseChatAutoScrollOptions) {
  const stickToBottomRef = useRef(true)
  const isProgrammaticScrollRef = useRef(false)
  const prevMessagesRef = useRef<ChatMessage[]>([])
  const prevChatIdRef = useRef<string | null | undefined>(undefined)

  const scrollInstant = (container: HTMLElement) => {
    isProgrammaticScrollRef.current = true
    scrollToBottomInstant(container)
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false
    })
  }

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container || messages.length === 0) {
      prevMessagesRef.current = messages
      prevChatIdRef.current = chatId
      return
    }

    const chatChanged = prevChatIdRef.current !== undefined && chatId !== prevChatIdRef.current
    const prevLast = prevMessagesRef.current.at(-1)
    const currLast = messages.at(-1)
    const messagesReplaced =
      !chatChanged &&
      prevMessagesRef.current.length > 0 &&
      messages.length > 0 &&
      prevMessagesRef.current[0]?.id !== messages[0]?.id

    if (chatChanged || messagesReplaced) {
      stickToBottomRef.current = true
      scrollInstant(container)
    } else if (currLast && prevChatIdRef.current === undefined) {
      stickToBottomRef.current = true
      scrollInstant(container)
    } else if (currLast && currLast.id !== prevLast?.id && !currLast.interpretation) {
      if (stickToBottomRef.current) {
        scrollInstant(container)
      }
    } else if (currLast && isAssistantReply(prevLast, currLast)) {
      if (stickToBottomRef.current) {
        scrollInstant(container)
      }
    }

    prevMessagesRef.current = messages
    prevChatIdRef.current = chatId
  }, [messages, chatId, scrollContainerRef])

  useLayoutEffect(() => {
    if (!isRunning || !stickToBottomRef.current) return

    const container = scrollContainerRef.current
    if (!container) return

    scrollInstant(container)
  }, [isRunning, scrollContainerRef])

  useEffect(() => {
    const container = scrollContainerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const handleResize = () => {
      if (!stickToBottomRef.current) return
      scrollInstant(container)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(content)

    return () => {
      resizeObserver.disconnect()
    }
  }, [scrollContainerRef, contentRef])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return
      stickToBottomRef.current = isNearBottom(container)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [scrollContainerRef])
}
