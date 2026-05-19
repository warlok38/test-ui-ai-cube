'use client'

import { useEffect, useState } from 'react'

export function useSideBar() {
  const [isOpen, setIsOpen] = useState(true)

  const openSideBar = () => {
    setIsOpen(true)
  }

  const closeSideBar = () => {
    setIsOpen(false)
  }

  const toggleSideBar = () => {
    setIsOpen((prev) => !prev)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSideBar()
      }
    }

    document.addEventListener('keydown', handleEscClose)

    return () => {
      document.removeEventListener('keydown', handleEscClose)
    }
  }, [isOpen])

  return {
    isOpen,
    openSideBar,
    closeSideBar,
    toggleSideBar
  }
}
