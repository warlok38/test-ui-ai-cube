export type ScrollContainerVisibleBounds = {
  top: number
  bottom: number
}

export function getScrollContainerVisibleBounds(
  container: HTMLElement
): ScrollContainerVisibleBounds {
  const rect = container.getBoundingClientRect()
  const style = getComputedStyle(container)
  const paddingTop = Number.parseFloat(style.paddingTop) || 0
  const paddingBottom = Number.parseFloat(style.paddingBottom) || 0

  return {
    top: rect.top + paddingTop,
    bottom: rect.bottom - paddingBottom
  }
}
