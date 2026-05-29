# Design Tokens Guide

Этот проект использует дизайн-токены как единый источник правды для отступов, типографики, цветов и базовых размеров layout.

## Где находятся токены

- Точка входа токенов: `src/shared/styles/tokens/index.css`
- Файлы токенов:
  - `src/shared/styles/tokens/space.css`
  - `src/shared/styles/tokens/font-sizes.css`
  - `src/shared/styles/tokens/layout.css`
  - `src/shared/styles/tokens/palette.css`
  - `src/shared/styles/tokens/colors.css`
- Подключение в приложение: `src/app/globals.css` через `@import "../shared/styles/tokens/index.css";`

## Слои токенов

- `--space-*` и `--font-size-*` - масштабные токены (spacing/type scale)
- `--layout-*`, `--radius-*`, `--border-width-*` - структурные токены интерфейса
- `--palette-*` - базовая палитра
- `--color-*` - семантические токены для компонентов (использовать в CSS-модулях)

## Контракт темы

- Тема управляется вручную через `html[data-theme='light' | 'dark']`.
- Источник темы хранится в `localStorage` по ключу `theme`.
- Начальное значение темы на сервере - `light`, затем после гидрации тема синхронизируется с `localStorage` через `ThemeProvider` / `useTheme`.
- Переключение темы реализовано через `useTheme` (`src/shared/theme/ThemeProvider.tsx`, реэкспорт в `src/hooks/index.ts`) и UI в `Header1`.

## Правила использования

- В компонентах использовать семантические цвета (`--color-text-default`, `--color-bg-default`, `--color-border-*`), а не `--palette-*`.
- Для размеров и отступов использовать `--space-*` и `--font-size-*` вместо фиксированных `px` в вёрстке; границы и фокус - `var(--border-width-hairline)` / `var(--border-width-strong)`, чтобы они тоже следовали глобальному масштабу через rem.
- Масштаб корня задаётся хуком `useGlobalFontSize`; кратко это описано в корневом [README.md](../../README.md).
- Если значение повторяется в нескольких местах, выносить его в токен.
- Новые состояния (`hover`, `active`, `disabled`) добавлять как отдельные семантические токены и сразу определять для `light` и `dark`.

## Быстрые примеры

```css
.panel {
  padding: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-default);
  background: var(--color-bg-default);
  border: var(--border-width-hairline) solid var(--color-border-interactive);
}
```

```css
html[data-theme='dark'] {
  --color-bg-default: #111827;
  --color-text-default: #e5e7eb;
}
```
