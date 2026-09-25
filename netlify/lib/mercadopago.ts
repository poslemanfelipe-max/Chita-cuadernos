// Mercado Pago (Checkout Pro). Variable de entorno: MP_ACCESS_TOKEN (ver README).
import { tienda } from '../../src/data/tienda';
import { desmarcarAvisado, guardarPedido, leerPedido, marcarAvisado } from './almacen';
import { avisarNuevoPedido, confirmarAlCliente } from './mail';
import type { Pedido } from './tipos';

const API = 'https://api.mercadopago.com';

function token(): string {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error('Falta configurar MP_ACCESS_TOKEN.');
  return t;
}

/** Dirección pública del sitio. Netlify la pone sola en la variable URL. */
export function urlSitio(): string {
  return (process.env.URL || tienda.url).replace(/\/$/, '');
}

/** Crea el link de pago y devuelve la URL a la que hay que mandar al cliente. */
export async function crearPreferencia(p: Pedido): Promise<string> {
  const base = urlSitio();
  const items = p.calculo.lineas.map((l) => ({
    id: `${l.producto}-${l.variante}`,
    title: l.grabado ? `${l.titulo} (grabado)` : l.titulo,
    quantity: l.cantidad,
    unit_price: l.precioUnitario,
    currency_id: 'ARS',
  }));
  if (p.calculo.envio) {
    items.push({ id: 'envio', title: 'Envío por Correo Argentino', quantity: 1, unit_price: p.calculo.envio, currency_id: 'ARS' });
  }
  const volver = `${base}/pedido/listo?pedido=${encodeURIComponent(p.id)}`;
  const body = {
    items,
    payer: { name: p.cliente.nombre, email: p.cliente.email },
    external_reference: p.id,
    statement_descriptor: 'CHITA CUADERNOS',
    back_urls: { success: volver, pending: volver, failure: `${base}/checkout?error=pago` },
    auto_return: 'approved',
    notification_url: `${base}/api/mp-webhook`,
    // El link vence a las 48 h para que no se pague un pedido viejo con precios viejos.
    expires: true,
    expiration_date_to: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  };
  const r = await fetch(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': p.id },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Mercado Pago respondió ${r.status}: ${await r.text()}`);
  const data = (await r.json()) as { init_point: string };
  return data.init_point;
}

interface PagoMP {
  id: number;
  status: string; // approved, pending, rejected, ...
  external_reference: string | null;
  transaction_amount: number;
}

async function leerPago(id: string): Promise<PagoMP | null> {
  const r = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token()}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Mercado Pago respondió ${r.status} al consultar el pago ${id}`);
  return (await r.json()) as PagoMP;
}

/**
 * Consulta un pago en Mercado Pago (nunca confía en lo que dice quien llama) y,
 * si está aprobado, marca el pedido como pagado y manda los mails una sola vez.
 */
export async function procesarPago(pagoId: string, pedidoEsperado?: string): Promise<{ estado: string; pedido?: string }> {
  if (!/^\d{1,20}$/.test(pagoId)) return { estado: 'invalido' };
  const pago = await leerPago(pagoId);
  if (!pago || !pago.external_reference) return { estado: 'desconocido' };
  if (pedidoEsperado && pago.external_reference !== pedidoEsperado) return { estado: 'desconocido' };

  const pedido = await leerPedido(pago.external_reference);
  if (!pedido) {
    console.error(`[mp] Pago ${pagoId} aprobado para un pedido que no existe: ${pago.external_reference}`);
    return { estado: pago.status };
  }
  if (pago.status !== 'approved') return { estado: pago.status, pedido: pedido.id };

  if (pago.transaction_amount + 1 < pedido.calculo.total) {
    console.error(`[mp] Monto pagado (${pago.transaction_amount}) menor al total del pedido ${pedido.id} (${pedido.calculo.total}).`);
  }

  if (await marcarAvisado(pedido.id)) {
    const actualizado: Pedido = { ...pedido, pago: { ...pedido.pago, estado: 'aprobado', mpPagoId: String(pago.id) } };
    await guardarPedido(actualizado);
    try {
      await avisarNuevoPedido(actualizado);
    } catch (e) {
      await desmarcarAvisado(pedido.id);
      throw e;
    }
    // Si falla el mail al cliente no se reintenta: la dueña ya tiene el pedido.
    await confirmarAlCliente(actualizado).catch((e) => console.error('[mail] No se pudo confirmar al cliente:', e));
  }
  return { estado: 'approved', pedido: pedido.id };
}
