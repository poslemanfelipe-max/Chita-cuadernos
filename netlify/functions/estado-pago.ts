// La página de "pedido listo" consulta acá el resultado del pago al volver de Mercado Pago.
// También sirve de respaldo: si el aviso de Mercado Pago se demoró, el pedido se confirma igual.
import type { Config } from '@netlify/functions';
import { procesarPago } from '../lib/mercadopago';

export default async (req: Request) => {
  const url = new URL(req.url);
  const pedido = url.searchParams.get('pedido') ?? '';
  const pago = url.searchParams.get('pago') ?? '';
  let estado = 'desconocido';
  try {
    if (pedido && pago) estado = (await procesarPago(pago, pedido)).estado;
  } catch (e) {
    console.error('[estado-pago]', pedido, pago, e);
  }
  return new Response(JSON.stringify({ estado }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};

export const config: Config = { path: '/api/estado-pago' };
