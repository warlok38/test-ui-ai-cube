This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Масштаб интерфейса (`rem`)

Единица **rem** считается от вычисленного `font-size` элемента `<html>`. Отступы и типографика заданы в rem через CSS‑переменные (`--space-*`, `--font-size-*` и др.), поэтому при изменении корневого размера шрифта весь интерфейс масштабируется согласованно.

Хук **`useGlobalFontSize`** ([`src/hooks/useGlobalFontSize.ts`](src/hooks/useGlobalFontSize.ts)) подписан на событие `resize`, берёт [`window.outerWidth`](https://developer.mozilla.org/en-US/docs/Web/API/Window/outerWidth) (удобнее при масштабировании страницы) и считает размер шрифта по пропорции к базовой ширине **1920** и базовому значению **16** пикселей, ограничивая результат диапазоном **8…24**. Возвращённое число пробрасывается в **`style={{ fontSize }}`** на `<html>` в [`src/app/layout.tsx`](src/app/layout.tsx).

Подробнее про слои токенов и соглашения по верстке: [`src/styles/README.md`](src/styles/README.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
