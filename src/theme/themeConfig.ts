import type { ThemeConfig } from 'antd'

import { PALETTE_PRIMARY, PALETTE_PRIMARY_DARK } from '@/constants/theme'

/** Светлая тема — только то, что раньше задавали через `providers` без полного набора seed-токенов. */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: PALETTE_PRIMARY,
    colorLink: PALETTE_PRIMARY,
    colorInfo: PALETTE_PRIMARY,
    colorText: '#2f2f2f',
    colorTextHeading: '#1c1c1c',
    colorTextSecondary: '#575757',
    colorBorder: '#29292938',
    colorSplit: '#2929291f',
    borderRadius: 3,
    colorBgLayout: '#f2f1ee',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    controlItemBgActive: '#fab52929'
  }
}

/** Тёмная тема — согласована с блоком `html[data-theme='dark']` в palette.css */
export const darkThemeConfig: ThemeConfig = {
  token: {
    colorPrimary: PALETTE_PRIMARY_DARK,
    colorLink: PALETTE_PRIMARY_DARK,
    colorInfo: PALETTE_PRIMARY_DARK,
    borderRadius: 8,
    colorBgLayout: '#1b1b1b',
    colorBgContainer: '#171717',
    colorBgElevated: '#222222',
    colorText: '#e9e3d8',
    colorTextHeading: '#fcf8ef',
    colorTextSecondary: '#b7ada0',
    colorBorder: '#e9e3d833',
    colorSplit: '#e9e3d81f',
    colorBgSpotlight: 'rgba(0, 0, 0, 0.45)',
    controlItemBgActive: '#f0b24a2e',
    colorSuccess: '#49aa19'
  }
}
