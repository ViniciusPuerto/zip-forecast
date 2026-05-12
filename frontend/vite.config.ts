import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Tailwind must run before other transforms so `@import "tailwindcss"` is handled;
  // otherwise PostCSS tries to open a literal file named `tailwindcss` (ENOENT).
  plugins: [tailwindcss(), react()],
})
