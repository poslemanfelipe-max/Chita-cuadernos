// HTML de una línea del carrito (se usa en el panel del carrito y en el checkout).
import { formatoPrecio } from '../data/tienda';
import type { Linea } from '../lib/pedido';

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Si se pasa `indice`, la línea muestra los botones para cambiar la cantidad. */
export function lineaCarritoHTML(l: Linea, img: string, alt: string, indice?: number, cantidad?: number): string {
  const extras = [l.color && `Color: ${esc(l.color)}`, l.grabado && `Grabado: “${esc(l.grabado)}”`].filter(Boolean);
  const controles =
    indice === undefined
      ? `<span class="linea__cant">× ${l.cantidad}</span>`
      : `<div class="cantidad" role="group" aria-label="Cantidad">
          <button type="button" data-cant="-1" data-indice="${indice}" aria-label="${cantidad === 1 ? 'Quitar' : 'Uno menos'}">${cantidad === 1 ? '×' : '−'}</button>
          <output>${cantidad}</output>
          <button type="button" data-cant="1" data-indice="${indice}" aria-label="Uno más">+</button>
        </div>`;
  return `<div class="linea">
    ${img ? `<img src="${img}" alt="${esc(alt)}" width="64" height="80" loading="lazy">` : '<span class="linea__sinfoto"></span>'}
    <div class="linea__info">
      <strong>${esc(l.titulo)}</strong>
      ${extras.map((e) => `<small>${e}</small>`).join('')}
      ${controles}
    </div>
    <span class="linea__precio">${formatoPrecio(l.subtotal)}</span>
  </div>`;
}
