# orders-demo

Orders dashboard for the internal storefront. TypeScript + React, no backend of its own.

## Layout

```text
src/
  api.ts      fetch wrapper with retry/backoff
  client.ts   order helpers built on top of api.ts
```

## Scripts

```bash
npm test        # vitest
npm run build   # tsc --noEmit && vite build
```
