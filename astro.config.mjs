import { defineConfig } from 'astro/config';
import { tienda } from './src/data/tienda.ts';

export default defineConfig({
  site: tienda.url,
  build: { inlineStylesheets: 'always' },
  image: { responsiveStyles: false },
});
