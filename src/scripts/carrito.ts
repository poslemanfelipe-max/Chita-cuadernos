// Carrito guardado en el navegador del cliente (localStorage).
import { calcular, MAX_POR_LINEA, type Calculo, type ItemCarrito, type MetodoEntrega } from '../lib/pedido';

const CLAVE = 'chita-carrito-v1';
const EVENTO = 'carrito:cambio';

const clave = (i: ItemCarrito) => [i.producto, i.variante, i.color ?? '', i.grabado ?? ''].join('|');

function valido(i: ItemCarrito): boolean {
  try {
    calcular([i], 'retiro');
    return true;
  } catch {
    return false;
  }
}

export function leer(): ItemCarrito[] {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    // Descarta lo que ya no existe (un producto o una opción que se sacó de la tienda).
    return Array.isArray(datos) ? datos.filter(valido) : [];
  } catch {
    return [];
  }
}

function guardar(items: ItemCarrito[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // modo privado o almacenamiento lleno: el carrito dura mientras la página esté abierta
  }
  document.dispatchEvent(new CustomEvent(EVENTO));
}

export function agregar(item: ItemCarrito) {
  const items = leer();
  const existente = items.find((i) => clave(i) === clave(item));
  if (existente) existente.cantidad = Math.min(MAX_POR_LINEA, existente.cantidad + item.cantidad);
  else items.push(item);
  guardar(items);
}

export function cambiarCantidad(indice: number, cantidad: number) {
  const items = leer();
  if (!items[indice]) return;
  if (cantidad <= 0) items.splice(indice, 1);
  else items[indice].cantidad = Math.min(MAX_POR_LINEA, cantidad);
  guardar(items);
}

export function vaciar() {
  guardar([]);
}

export function cantidadTotal(): number {
  return leer().reduce((s, i) => s + i.cantidad, 0);
}

export function resumen(entrega: MetodoEntrega = 'retiro'): Calculo | null {
  const items = leer();
  return items.length ? calcular(items, entrega) : null;
}

export function alCambiar(fn: () => void) {
  document.addEventListener(EVENTO, fn);
  // Si el cliente tiene la tienda abierta en otra pestaña.
  window.addEventListener('storage', (e) => e.key === CLAVE && fn());
}

export function miniatura(producto: string): string {
  try {
    return JSON.parse(document.getElementById('miniaturas')?.textContent ?? '{}')[producto] ?? '';
  } catch {
    return '';
  }
}
