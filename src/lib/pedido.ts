// Cálculo del pedido. Lo usan el carrito (en el navegador) y el servidor,
// que vuelve a calcular todo con los precios de tienda.ts para que nadie
// pueda cambiar un precio desde el navegador.
import { productoPorId, tienda } from '../data/tienda';

export type MetodoEntrega = 'envio' | 'retiro';
export type MetodoPago = 'mercadopago' | 'transferencia';

/** Lo que guarda el carrito por cada línea. */
export interface ItemCarrito {
  producto: string;
  variante: string;
  color?: string;
  grabado?: string;
  cantidad: number;
}

export interface Linea {
  producto: string;
  variante: string;
  titulo: string; // "Chita Origen · 120 hojas"
  color?: string;
  grabado?: string;
  cantidad: number;
  precioUnitario: number; // incluye el grabado si tiene costo
  subtotal: number;
}

export interface Calculo {
  lineas: Linea[];
  subtotal: number;
  envio: number | null; // null = a coordinar
  total: number;
}

export const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
  'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

export const MAX_POR_LINEA = 10;
export const MAX_LINEAS = 20;

export function limpiarTexto(s: unknown, max: number): string {
  return typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

/** Valida y calcula. Tira un Error con un mensaje para el cliente si algo no cierra. */
export function calcular(items: unknown, entrega: MetodoEntrega): Calculo {
  if (!Array.isArray(items) || items.length === 0) throw new Error('El carrito está vacío.');
  if (items.length > MAX_LINEAS) throw new Error('El pedido tiene demasiados productos.');

  const lineas: Linea[] = items.map((raw) => {
    const it = (raw ?? {}) as Record<string, unknown>;
    const producto = productoPorId(String(it.producto));
    if (!producto) throw new Error('Uno de los productos ya no está disponible. Revisá el carrito.');
    const variante = producto.variantes.find((v) => v.id === String(it.variante));
    if (!variante) throw new Error(`La opción elegida de ${producto.nombre} ya no está disponible.`);

    const cantidad = Number(it.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_POR_LINEA) {
      throw new Error(`Cantidad inválida para ${producto.nombre}.`);
    }

    let color: string | undefined;
    if (producto.colores.length > 0) {
      color = producto.colores.find((c) => c === it.color);
      if (!color) throw new Error(`Elegí un color para ${producto.nombre}.`);
    }

    const grabado = producto.grabado ? limpiarTexto(it.grabado, tienda.grabado.maxCaracteres) : '';
    const precioUnitario = variante.precio + (grabado ? tienda.grabado.precio : 0);

    return {
      producto: producto.id,
      variante: variante.id,
      titulo: producto.variantes.length > 1 ? `${producto.nombre} · ${variante.nombre}` : producto.nombre,
      color,
      grabado: grabado || undefined,
      cantidad,
      precioUnitario,
      subtotal: precioUnitario * cantidad,
    };
  });

  const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
  const envio = entrega === 'envio' ? tienda.entrega.envio.costo : 0;
  return { lineas, subtotal, envio, total: subtotal + (envio ?? 0) };
}
