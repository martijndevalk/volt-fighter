import { defineConfig } from 'vite'

// De map "rivs" wordt als statische map geserveerd: /volt_fighter.riv
export default defineConfig({
  base: './',
  publicDir: 'rivs',
  server: { port: 5173, open: true },
})
