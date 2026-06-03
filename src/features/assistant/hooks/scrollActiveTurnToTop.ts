import type { RefObject } from 'react'

export const QUESTION_TOP_ANCHOR_THRESHOLD = 24

export function scrollUserQuestionToTop(container: HTMLElement, userElement: HTMLElement): void {
  const style = getComputedStyle(container)
  const paddingTop = Number.parseFloat(style.paddingTop) || 0
  const targetTop = container.getBoundingClientRect().top + paddingTop
  const delta = userElement.getBoundingClientRect().top - targetTop

  container.scrollTop += delta
}

export function isQuestionAnchoredToTop(
  container: HTMLElement,
  userElement: HTMLElement,
  threshold = QUESTION_TOP_ANCHOR_THRESHOLD
): boolean {
  const style = getComputedStyle(container)
  const paddingTop = Number.parseFloat(style.paddingTop) || 0
  const targetTop = container.getBoundingClientRect().top + paddingTop
  const userTop = userElement.getBoundingClientRect().top

  return Math.abs(userTop - targetTop) <= threshold
}

export function scrollActiveTurnToTop(
  container: HTMLElement,
  userRefs: RefObject<Map<string, HTMLDivElement>>,
  turnUserId: string | undefined
): boolean {
  if (!turnUserId) return false

  const userElement = userRefs.current?.get(turnUserId)
  if (!userElement) return false

  scrollUserQuestionToTop(container, userElement)
  return true
}

export function scrollActiveTurnToTopWithRetry(
  container: HTMLElement,
  userRefs: RefObject<Map<string, HTMLDivElement>>,
  turnUserId: string | undefined,
  maxAttempts = 4
): void {
  let attempt = 0

  const tryScroll = () => {
    const scrolled = scrollActiveTurnToTop(container, userRefs, turnUserId)
    if (!scrolled && attempt < maxAttempts) {
      attempt += 1
      requestAnimationFrame(tryScroll)
    }
  }

  tryScroll()
}
