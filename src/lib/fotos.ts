import type { ImageMetadata } from 'astro';

// Lee automáticamente todas las fotos de la carpeta /fotos.
const archivos = import.meta.glob<{ default: ImageMetadata }>(
  '/fotos/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true },
);

const todas = Object.entries(archivos)
  .map(([path, mod]) => ({ ruta: path.replace(/^\/fotos\//, ''), src: mod.default }))
  .sort((a, b) => a.ruta.localeCompare(b.ruta, 'es', { numeric: true }));

/** Fotos de un producto (carpeta fotos/productos/<carpeta>), en orden alfabético. */
export function fotosDeProducto(carpeta: string): ImageMetadata[] {
  const prefijo = `productos/${carpeta}/`;
  return todas.filter((f) => f.ruta.startsWith(prefijo)).map((f) => f.src);
}

/** Una foto puntual, ej: foto('sitio/portada.jpg'). */
export function foto(ruta: string): ImageMetadata | undefined {
  return todas.find((f) => f.ruta === ruta)?.src;
}
