'use client'

import { DownOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import classNames from 'classnames'
import { useCallback, useEffect, useState, type RefObject } from 'react'

import styles from './ScrollToBottom.module.css'

const DEFAULT_THRESHOLD = 150

type ScrollToBottomProps = {
  scrollContainerRef: RefObject<HTMLElement | null>
  threshold?: number
  className?: string
  'aria-label'?: string
}

function getIsAtBottom(container: HTMLElement, threshold: number) {
  return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
}

function getHasOverflow(container: HTMLElement) {
  return container.scrollHeight > container.clientHeight
}

export function ScrollToBottom({
  scrollContainerRef,
  threshold = DEFAULT_THRESHOLD,
  className,
  'aria-label': ariaLabel = 'Прокрутить вниз'
}: ScrollToBottomProps) {
  const [visible, setVisible] = useState(false)

  const updateVisibility = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) {
      setVisible(false)
      return
    }

    setVisible(!getIsAtBottom(container, threshold) && getHasOverflow(container))
  }, [scrollContainerRef, threshold])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateVisibility()

    container.addEventListener('scroll', updateVisibility, { passive: true })

    const resizeObserver = new ResizeObserver(updateVisibility)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', updateVisibility)
      resizeObserver.disconnect()
    }
  }, [scrollContainerRef, updateVisibility])

  const handleClick = () => {
    const container = scrollContainerRef.current
    if (!container) return

    container.scrollTop = container.scrollHeight
    updateVisibility()
  }

  return (
    <Button
      type="default"
      shape="circle"
      icon={<DownOutlined />}
      className={classNames(styles.button, visible && styles.buttonVisible, className)}
      onClick={handleClick}
      aria-label={ariaLabel}
      tabIndex={visible ? 0 : -1}
    />
  )
}
