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

/** Переход между двумя уже известными чатами (не присвоение id новому чату после отправки с /). */
export function isNavigatingBetweenChats(
  prevChatId: string | null | undefined,
  nextChatId: string | null | undefined
): boolean {
  const prev = prevChatId ?? null
  const next = nextChatId ?? null

  return prev !== null && next !== null && prev !== next
}

/** Подгрузка истории другого чата, а не замена stub → result в текущем ходе. */
export function isHistoryMessagesReload(
  prevMessages: ChatMessage[],
  nextMessages: ChatMessage[]
): boolean {
  if (prevMessages.length === 0 || nextMessages.length === 0) return false
  if (prevMessages[0]?.id === nextMessages[0]?.id) return false

  return prevMessages[0]?.query_text !== nextMessages[0]?.query_text
}

export function isInitialHistoryLoad(
  prevMessages: ChatMessage[],
  nextMessages: ChatMessage[],
  chatId: string | null | undefined
): boolean {
  return prevMessages.length === 0 && nextMessages.length > 0 && Boolean(chatId)
}

function shouldScrollToHistoryBottom(
  prevMessages: ChatMessage[],
  nextMessages: ChatMessage[],
  prevChatId: string | null | undefined,
  nextChatId: string | null | undefined
): boolean {
  return (
    isNavigatingBetweenChats(prevChatId, nextChatId) ||
    isInitialHistoryLoad(prevMessages, nextMessages, nextChatId) ||
    isHistoryMessagesReload(prevMessages, nextMessages)
  )
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
  const smoothAnchorActiveRef = useRef(false)
  /** Синхронизируем с props при монтировании: после / → /chat/:id хук перемонтируется, иначе [] даёт ложный isInitialHistoryLoad. */
  const prevMessagesRef = useRef(messages)
  const prevChatIdRef = useRef(chatId)
  const prevIsRunningRef = useRef(isRunning)

  const userRefsRef = useRef(userRefs)
  userRefsRef.current = userRefs

  const activeTurnUserIdRef = useRef(activeTurnUserId)
  activeTurnUserIdRef.current = activeTurnUserId

  const isRunningRef = useRef(isRunning)
  isRunningRef.current = isRunning

  const runProgrammaticScroll = useCallback(
    (scroll: () => void, options?: { smooth?: boolean; onComplete?: () => void }) => {
      isProgrammaticScrollRef.current = true
      scroll()

      const complete = () => {
        isProgrammaticScrollRef.current = false
        options?.onComplete?.()
      }

      if (!options?.smooth) {
        requestAnimationFrame(complete)
        return
      }

      const container = scrollContainerRef.current
      if (!container) {
        requestAnimationFrame(complete)
        return
      }

      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        window.clearTimeout(timeoutId)
        container.removeEventListener('scrollend', finish)
        complete()
      }

      container.addEventListener('scrollend', finish)
      const timeoutId = window.setTimeout(finish, 800)
    },
    [scrollContainerRef]
  )

  const anchorActiveTurnToTop = useCallback(
    (container: HTMLElement, options?: { smooth?: boolean }) => {
      if (options?.smooth) {
        smoothAnchorActiveRef.current = true
      }

      runProgrammaticScroll(
        () => {
          scrollActiveTurnToTopWithRetry(
            container,
            userRefsRef.current,
            activeTurnUserIdRef.current,
            4,
            options?.smooth ? 'smooth' : 'auto'
          )
        },
        {
          smooth: options?.smooth,
          onComplete: () => {
            smoothAnchorActiveRef.current = false
          }
        }
      )
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

    const prevLast = prevMessagesRef.current.at(-1)
    const currLast = messages.at(-1)

    if (
      shouldScrollToHistoryBottom(prevMessagesRef.current, messages, prevChatIdRef.current, chatId)
    ) {
      autoFollowActiveTurnRef.current = false
      scrollToBottom(container)
    } else if (isNewUserQuestion(prevLast, currLast)) {
      autoFollowActiveTurnRef.current = true
      anchorActiveTurnToTop(container, { smooth: true })
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

    if (!isRunning || !autoFollowActiveTurnRef.current || smoothAnchorActiveRef.current) return

    const container = scrollContainerRef.current
    if (!container) return

    anchorActiveTurnToTop(container)
  }, [isRunning, anchorActiveTurnToTop, scrollContainerRef])

  useEffect(() => {
    const container = scrollContainerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const handleResize = () => {
      if (
        !isRunningRef.current ||
        !autoFollowActiveTurnRef.current ||
        smoothAnchorActiveRef.current
      ) {
        return
      }
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
