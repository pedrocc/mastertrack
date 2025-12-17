# Vite

## Propósito
Build tool e dev server ultrarrápido com HMR instantâneo para aplicações frontend modernas.

## Instalação
```bash
bun create vite my-app --template react-ts
cd my-app
bun install
```

## Configuração Básica

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@lib": path.resolve(__dirname, "./src/lib"),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "esnext",
  },
});
```

## Scripts

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "biome check src/"
  }
}
```

## Variáveis de Ambiente

```bash
# .env
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=My App

# .env.development
VITE_API_URL=http://localhost:8080

# .env.production
VITE_API_URL=https://api.myapp.com
```

```typescript
// Acessar no código (prefixo VITE_ obrigatório)
const apiUrl = import.meta.env.VITE_API_URL;
const mode = import.meta.env.MODE; // "development" | "production"
const isDev = import.meta.env.DEV; // boolean
const isProd = import.meta.env.PROD; // boolean
```

## Path Aliases com TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

## CSS

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    modules: {
      localsConvention: "camelCase",
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
});
```

## Proxy para API

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      // String shorthand
      "/api": "http://localhost:8080",

      // Com opções
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },

      // WebSocket
      "/ws": {
        target: "ws://localhost:8080",
        ws: true,
      },
    },
  },
});
```

## Build Otimizado

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          query: ["@tanstack/react-query"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

## Configuração Condicional

```typescript
// vite.config.ts
export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve";
  const isProd = mode === "production";

  return {
    plugins: [react()],
    define: {
      __DEV__: isDev,
    },
    build: isProd
      ? {
          minify: "terser",
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        }
      : {},
  };
});
```

## Importação de Assets

```typescript
// Importar como URL
import logoUrl from "./assets/logo.png";

// Importar como string (raw)
import shaderCode from "./shader.glsl?raw";

// Importar como Worker
import Worker from "./worker.js?worker";

// JSON
import data from "./data.json";
```

## Hot Module Replacement

```typescript
// Aceitar HMR manualmente (raro, React faz automaticamente)
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // Handle update
  });
}
```

## Integração com a Stack

- **React 19**: Plugin oficial @vitejs/plugin-react
- **Tailwind**: PostCSS plugin
- **TypeScript**: Suporte nativo
- **Bun**: Compatível como runtime (bun run vite)
