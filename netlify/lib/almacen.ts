// Guarda los pedidos en Netlify Blobs (incluido gratis en Netlify).
// Fuera de Netlify (pruebas locales) usa la memoria.
import { getStore } from '@netlify/blobs';
import type { Pedido } from './tipos';

interface Almacen {
  get(key: string): Promise<unknown>;
  setJSON(key: string, data: unknown, opts?: { onlyIfNew?: boolean }): Promise<{ modified: boolean }>;
  delete(key: string): Promise<void>;
}

function memoria(): Almacen {
  const m = new Map<string, unknown>();
  return {
    async get(key) {
      return m.get(key) ?? null;
    },
    async setJSON(key, data, opts) {
      if (opts?.onlyIfNew && m.has(key)) return { modified: false };
      m.set(key, data);
      return { modified: true };
    },
    async delete(key) {
      m.delete(key);
    },
  };
}

let store: Almacen | undefined;
function almacen(): Almacen {
  if (!store) {
    try {
      const s = getStore({ name: 'pedidos', consistency: 'strong' });
      store = {
        get: (key) => s.get(key, { type: 'json' }),
        setJSON: (key, data, opts) => s.setJSON(key, data, opts?.onlyIfNew ? { onlyIfNew: true } : {}),
        delete: (key) => s.delete(key),
      };
    } catch {
      console.warn('[almacen] Netlify Blobs no disponible: uso memoria (solo para pruebas).');
      store = memoria();
    }
  }
  return store;
}

export async function guardarPedido(p: Pedido): Promise<void> {
  await almacen().setJSON(`pedido/${p.id}`, p);
}

export async function leerPedido(id: string): Promise<Pedido | null> {
  return (await almacen().get(`pedido/${id}`)) as Pedido | null;
}

/**
 * Marca que ya se avisó el pago de un pedido. Devuelve true solo la primera vez,
 * así Mercado Pago puede notificar varias veces sin que lleguen mails repetidos.
 */
export async function marcarAvisado(id: string): Promise<boolean> {
  const r = await almacen().setJSON(`avisado/${id}`, { fecha: new Date().toISOString() }, { onlyIfNew: true });
  return r.modified;
}

/** Deshace marcarAvisado si los mails fallaron, para que el próximo aviso de Mercado Pago lo reintente. */
export async function desmarcarAvisado(id: string): Promise<void> {
  await almacen().delete(`avisado/${id}`);
}
