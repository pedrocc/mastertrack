# Tailwind CSS

## Propósito
Framework CSS utility-first para estilização rápida e consistente direto no HTML/JSX.

## Instalação
```bash
bun add -d tailwindcss postcss autoprefixer
bunx tailwindcss init -p
```

## Configuração

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "selector", // ou "media"
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#3b82f6",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      spacing: {
        "128": "32rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Classes Utilitárias

### Layout
```html
<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">

<!-- Grid -->
<div class="grid grid-cols-3 gap-4">

<!-- Container -->
<div class="container mx-auto px-4">
```

### Espaçamento
```html
<!-- Padding -->
<div class="p-4 px-6 py-2 pt-4 pb-8">

<!-- Margin -->
<div class="m-4 mx-auto my-2 mt-4 mb-8">

<!-- Gap (flex/grid) -->
<div class="gap-4 gap-x-2 gap-y-6">
```

### Sizing
```html
<!-- Width/Height -->
<div class="w-full h-screen w-1/2 h-64 min-h-screen max-w-lg">

<!-- Aspect Ratio -->
<div class="aspect-video aspect-square">
```

### Typography
```html
<p class="text-lg font-bold text-gray-900 leading-relaxed tracking-wide">
<p class="text-sm text-gray-500 uppercase truncate">
<p class="line-clamp-3">
```

### Cores
```html
<!-- Text -->
<p class="text-blue-500 text-gray-900 dark:text-white">

<!-- Background -->
<div class="bg-white bg-gray-100 dark:bg-gray-900">

<!-- Border -->
<div class="border border-gray-200 border-b-2 border-blue-500">
```

### Borders e Shadows
```html
<div class="rounded-lg border shadow-md">
<div class="rounded-full ring-2 ring-blue-500 ring-offset-2">
```

## Responsividade

```html
<!-- Mobile-first: sm, md, lg, xl, 2xl -->
<div class="
  w-full          <!-- mobile -->
  sm:w-1/2        <!-- >= 640px -->
  md:w-1/3        <!-- >= 768px -->
  lg:w-1/4        <!-- >= 1024px -->
  xl:w-1/5        <!-- >= 1280px -->
">
```

## Dark Mode

```typescript
// tailwind.config.ts
export default {
  darkMode: "selector", // class-based
  // ...
}
```

```html
<html class="dark">
  <body>
    <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      Conteúdo
    </div>
  </body>
</html>
```

```typescript
// Toggle dark mode
function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
}
```

## States e Pseudo-classes

```html
<!-- Hover, Focus, Active -->
<button class="
  bg-blue-500
  hover:bg-blue-600
  focus:ring-2 focus:ring-blue-500 focus:outline-none
  active:bg-blue-700
  disabled:opacity-50 disabled:cursor-not-allowed
">

<!-- Group hover -->
<div class="group">
  <span class="group-hover:text-blue-500">Hover no parent</span>
</div>

<!-- First, Last, Odd, Even -->
<li class="first:pt-0 last:pb-0 odd:bg-gray-50 even:bg-white">
```

## Animações

```html
<!-- Built-in -->
<div class="animate-spin">
<div class="animate-pulse">
<div class="animate-bounce">

<!-- Transições -->
<button class="transition-colors duration-200 ease-in-out">
<div class="transition-all duration-300">
```

## Custom Classes com @apply

```css
/* src/index.css */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }

  .btn-primary {
    @apply bg-blue-500 text-white hover:bg-blue-600;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6 dark:bg-gray-800;
  }
}
```

## Componente Exemplo

```tsx
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="
      rounded-lg border border-gray-200 bg-white p-6 shadow-sm
      dark:border-gray-700 dark:bg-gray-800
    ">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <div className="text-gray-600 dark:text-gray-300">
        {children}
      </div>
    </div>
  );
}
```

## Integração com a Stack

- **Vite**: PostCSS plugin integrado
- **React**: Classes no className
- **shadcn/ui**: Componentes baseados em Tailwind
- **Dark Mode**: Suporte nativo
