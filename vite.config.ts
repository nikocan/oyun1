import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// "artifact" modu: tarayıcıda paylaşılabilir tek dosyalık sürüm üretir.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'artifact' ? [viteSingleFile()] : [],
  build: { outDir: mode === 'artifact' ? 'dist-artifact' : 'dist' },
}));
