import type { RefObject } from 'react'

export const QUESTION_TOP_ANCHOR_THRESHOLD = 24

function resolveScrollBehavior(behavior: ScrollBehavior): ScrollBehavior {
  if (behavior === 'auto') return 'auto'
  if (typeof window === 'undefined') return 'auto'
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'auto'

  return behavior
}

export function scrollUserQuestionToTop(
  container: HTMLElement,
  userElement: HTMLElement,
  behavior: ScrollBehavior = 'auto'
): void {
  const style = getComputedStyle(container)
  const paddingTop = Number.parseFloat(style.paddingTop) || 0
  const targetTop = container.getBoundingClientRect().top + paddingTop
  const delta = userElement.getBoundingClientRect().top - targetTop

  container.scrollTo({
    top: container.scrollTop + delta,
    behavior: resolveScrollBehavior(behavior)
  })
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
  turnUserId: string | undefined,
  behavior: ScrollBehavior = 'auto'
): boolean {
  if (!turnUserId) return false

  const userElement = userRefs.current?.get(turnUserId)
  if (!userElement) return false

  scrollUserQuestionToTop(container, userElement, behavior)
  return true
}

export function scrollActiveTurnToTopWithRetry(
  container: HTMLElement,
  userRefs: RefObject<Map<string, HTMLDivElement>>,
  turnUserId: string | undefined,
  maxAttempts = 4,
  behavior: ScrollBehavior = 'auto'
): void {
  let attempt = 0

  const tryScroll = () => {
    const scrolled = scrollActiveTurnToTop(container, userRefs, turnUserId, behavior)
    if (!scrolled && attempt < maxAttempts) {
      attempt += 1
      requestAnimationFrame(tryScroll)
    }
  }

  tryScroll()
}
