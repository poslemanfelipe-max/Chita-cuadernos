// Mercado Pago avisa acá cada vez que cambia un pago.
// No confiamos en el contenido del aviso: consultamos el pago directo a Mercado Pago.
import type { Config } from '@netlify/functions';
import { procesarPago } from '../lib/mercadopago';

export default async (req: Request) => {
  const url = new URL(req.url);
  let tipo = url.searchParams.get('type') ?? url.searchParams.get('topic');
  let id = url.searchParams.get('data.id') ?? url.searchParams.get('id');

  if (req.method === 'POST') {
    try {
      const body = (await req.json()) as { type?: string; data?: { id?: string | number } };
      tipo = body.type ?? tipo;
      id = body.data?.id != null ? String(body.data.id) : id;
    } catch {
      // sin cuerpo: nos quedamos con lo que vino en la URL
    }
  }

  if (tipo !== 'payment' || !id) return new Response('ok');

  try {
    await procesarPago(id);
    return new Response('ok');
  } catch (e) {
    console.error('[mp-webhook]', id, e);
    // Un error hace que Mercado Pago vuelva a intentar más tarde.
    return new Response('error', { status: 500 });
  }
};

export const config: Config = { path: '/api/mp-webhook' };
