'use client'

import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { useRef } from 'react'

import { ThemeProvider } from '@/theme'

import { setupStore, type AppStore } from '@/store'

export function Providers({ children }: PropsWithChildren) {
  const storeRef = useRef<AppStore>()
  if (!storeRef.current) {
    storeRef.current = setupStore()
  }

  return (
    <Provider store={storeRef.current}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  )
}
