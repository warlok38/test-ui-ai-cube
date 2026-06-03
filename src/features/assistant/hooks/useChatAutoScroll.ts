'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

import type { ChatMessage } from '@/features/assistant/model/assistantSlice'
import {
  isQuestionAnchoredToTop,
  scrollActiveTurnToTopWithRetry
} from '@/features/assistant/hooks/scrollActiveTurnToTop'

export const NEAR_BOTTOM_THRESHOLD = 150

export function isNearBottom(container: HTMLElement, threshold = NEAR_BOTTOM_THRESHOLD): boolean {
  return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
}

export function scrollToBottomInstant(container: HTMLElement): void {
  container.scrollTop = container.scrollHeight
}

export function isTurnCompleted(prev: ChatMessage | undefined, curr: ChatMessage): boolean {
  if (!prev || !curr) return false

  const interpretationAppeared = !prev.interpretation && Boolean(curr.interpretation)
  const replacedWithResult = prev.id !== curr.id && Boolean(curr.interpretation)

  return interpretationAppeared || replacedWithResult
}

function isNewUserQuestion(
  prevLast: ChatMessage | undefined,
  currLast: ChatMessage | undefined
): currLast is ChatMessage {
  return Boolean(currLast && currLast.id !== prevLast?.id && !currLast.interpretation)
}

type UseChatAutoScrollOptions = {
  scrollContainerRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
  userRefs: RefObject<Map<string, HTMLDivElement>>
  activeTurnUserId: string | undefined
  messages: ChatMessage[]
  chatId?: string | null
  isRunning: boolean
}

export function useChatAutoScroll({
  scrollContainerRef,
  contentRef,
  userRefs,
  activeTurnUserId,
  messages,
  chatId,
  isRunning
}: UseChatAutoScrollOptions) {
  const autoFollowActiveTurnRef = useRef(false)
  const isProgrammaticScrollRef = useRef(false)
  const prevMessagesRef = useRef<ChatMessage[]>([])
  const prevChatIdRef = useRef<string | null | undefined>(undefined)
  const prevIsRunningRef = useRef(isRunning)

  const userRefsRef = useRef(userRefs)
  userRefsRef.current = userRefs

  const activeTurnUserIdRef = useRef(activeTurnUserId)
  activeTurnUserIdRef.current = activeTurnUserId

  const isRunningRef = useRef(isRunning)
  isRunningRef.current = isRunning

  const runProgrammaticScroll = useCallback((scroll: () => void) => {
    isProgrammaticScrollRef.current = true
    scroll()
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false
    })
  }, [])

  const anchorActiveTurnToTop = useCallback(
    (container: HTMLElement) => {
      runProgrammaticScroll(() => {
        scrollActiveTurnToTopWithRetry(container, userRefsRef.current, activeTurnUserIdRef.current)
      })
    },
    [runProgrammaticScroll]
  )

  const scrollToBottom = useCallback(
    (container: HTMLElement) => {
      runProgrammaticScroll(() => {
        scrollToBottomInstant(container)
      })
    },
    [runProgrammaticScroll]
  )

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
      autoFollowActiveTurnRef.current = false
      scrollToBottom(container)
    } else if (isNewUserQuestion(prevLast, currLast)) {
      autoFollowActiveTurnRef.current = true
      anchorActiveTurnToTop(container)
    } else if (currLast && isTurnCompleted(prevLast, currLast)) {
      autoFollowActiveTurnRef.current = false
    }

    prevMessagesRef.current = messages
    prevChatIdRef.current = chatId
  }, [messages, chatId, anchorActiveTurnToTop, scrollToBottom, scrollContainerRef])

  useLayoutEffect(() => {
    const wasRunning = prevIsRunningRef.current
    prevIsRunningRef.current = isRunning

    if (wasRunning && !isRunning) {
      autoFollowActiveTurnRef.current = false
    }

    if (!isRunning || !autoFollowActiveTurnRef.current) return

    const container = scrollContainerRef.current
    if (!container) return

    anchorActiveTurnToTop(container)
  }, [isRunning, anchorActiveTurnToTop, scrollContainerRef])

  useEffect(() => {
    const container = scrollContainerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const handleResize = () => {
      if (!isRunningRef.current || !autoFollowActiveTurnRef.current) return
      anchorActiveTurnToTop(container)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(content)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isRunning, anchorActiveTurnToTop, contentRef, scrollContainerRef])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return

      if (!isRunningRef.current || !autoFollowActiveTurnRef.current) return

      const turnUserId = activeTurnUserIdRef.current
      if (!turnUserId) return

      const userElement = userRefsRef.current.current?.get(turnUserId)
      if (!userElement) return

      autoFollowActiveTurnRef.current = isQuestionAnchoredToTop(container, userElement)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [scrollContainerRef])
}
