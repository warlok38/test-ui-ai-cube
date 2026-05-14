import type { ThemeConfig } from 'antd'

import { PALETTE_PRIMARY, PALETTE_PRIMARY_DARK } from '@/constants/theme'

/** Светлая тема — только то, что раньше задавали через `providers` без полного набора seed-токенов. */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: PALETTE_PRIMARY,
    colorLink: PALETTE_PRIMARY,
    borderRadius: 8,
    colorBgLayout: '#f3f4f6'
  }
}

/** Тёмная тема — согласована с блоком `html[data-theme='dark']` в palette.css */
export const darkThemeConfig: ThemeConfig = {
  token: {
    colorPrimary: PALETTE_PRIMARY_DARK,
    colorLink: PALETTE_PRIMARY_DARK,
    borderRadius: 8,
    colorBgLayout: '#101722',
    colorBgContainer: '#151c2b',
    colorBgElevated: '#1a2436',
    colorText: '#dce3ee',
    colorTextHeading: '#f4f7fb',
    colorTextSecondary: '#8b96a8',
    colorBorder: 'rgba(220, 227, 238, 0.13)',
    colorSplit: 'rgba(220, 227, 238, 0.08)',
    colorBgSpotlight: 'rgba(0, 0, 0, 0.45)',
    controlItemBgActive: 'rgba(240, 178, 74, 0.18)',
    colorSuccess: '#49aa19'
  }
}
