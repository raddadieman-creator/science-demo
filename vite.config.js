import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// وضع demo يبني ملفًا واحدًا للمعاينة دون قاعدة بيانات
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'demo' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'demo' ? { outDir: 'dist-demo', emptyOutDir: true } : { outDir: 'dist' },
  define: mode === 'demo' ? { 'import.meta.env.VITE_SUPABASE_URL': '""', 'import.meta.env.VITE_SUPABASE_ANON_KEY': '""' } : {},
}))
