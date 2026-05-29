'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { useAppDispatch } from '@/store/hooks'

export function useStartNewChat() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()

  return useCallback(() => {
    dispatch(assistantActions.startNewChat())
    if (pathname.startsWith('/chat/') || pathname !== '/') {
      router.replace('/')
    }
  }, [dispatch, pathname, router])
}
