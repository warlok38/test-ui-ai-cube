'use client'

import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'

export function useLeftBar() {
  const [isOpen, setIsOpen] = useState(false)

  const openLeftBar = () => {
    setIsOpen(true)
  }

  const closeLeftBar = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLeftBar()
      }
    }

    document.addEventListener('keydown', handleEscClose)

    return () => {
      document.removeEventListener('keydown', handleEscClose)
    }
  }, [isOpen])

  const handleCollapsedMenuKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (isOpen) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openLeftBar()
    }
  }

  const asideInteractionProps = !isOpen
    ? {
        onClick: openLeftBar,
        role: 'button' as const,
        tabIndex: 0
      }
    : {
        onClick: undefined,
        role: undefined,
        tabIndex: -1
      }

  return {
    isOpen,
    closeLeftBar,
    handleCollapsedMenuKeyDown,
    asideInteractionProps
  }
}
