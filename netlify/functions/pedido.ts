// Recibe el pedido del checkout: lo valida, lo guarda y
//  - si paga con Mercado Pago, devuelve el link de pago (los mails salen cuando se acredita);
//  - si paga por transferencia, avisa por mail a la tienda y al cliente.
import type { Config } from '@netlify/functions';
import { randomInt } from 'node:crypto';
import { tienda } from '../../src/data/tienda';
import { calcular, limpiarTexto, PROVINCIAS, type MetodoEntrega, type MetodoPago } from '../../src/lib/pedido';
import { guardarPedido } from '../lib/almacen';
import { avisarNuevoPedido, confirmarAlCliente } from '../lib/mail';
import { crearPreferencia } from '../lib/mercadopago';
import type { Pedido } from '../lib/tipos';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const LETRAS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const nuevoId = () => 'CH-' + Array.from({ length: 6 }, () => LETRAS[randomInt(LETRAS.length)]).join('');

function leer(body: Record<string, any>): Omit<Pedido, 'id' | 'fecha' | 'calculo'> & { items: unknown } {
  const c = body.cliente ?? {};
  const cliente = {
    nombre: limpiarTexto(c.nombre, 80),
    email: limpiarTexto(c.email, 120).toLowerCase(),
    telefono: limpiarTexto(c.telefono, 30),
  };
  if (cliente.nombre.length < 2) throw new Error('Completá tu nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cliente.email)) throw new Error('Revisá tu mail.');
  if (cliente.telefono.replace(/\D/g, '').length < 8) throw new Error('Revisá tu teléfono.');

  const metodoEntrega: MetodoEntrega = body.entrega?.metodo === 'retiro' ? 'retiro' : 'envio';
  let direccion: Pedido['entrega']['direccion'];
  if (metodoEntrega === 'envio') {
    const d = body.entrega?.direccion ?? {};
    direccion = {
      dni: limpiarTexto(d.dni, 12).replace(/\D/g, ''),
      calle: limpiarTexto(d.calle, 100),
      numero: limpiarTexto(d.numero, 10),
      pisoDepto: limpiarTexto(d.pisoDepto, 20),
      ciudad: limpiarTexto(d.ciudad, 80),
      provincia: limpiarTexto(d.provincia, 40),
      cp: limpiarTexto(d.cp, 10).toUpperCase(),
      referencias: limpiarTexto(d.referencias, 150),
    };
    if (!direccion.calle || !direccion.numero || !direccion.ciudad || !direccion.cp) {
      throw new Error('Completá la dirección de envío.');
    }
    if (!PROVINCIAS.includes(direccion.provincia)) throw new Error('Elegí la provincia.');
    if (direccion.dni.length < 7 || direccion.dni.length > 8) throw new Error('Revisá el DNI.');
  }

  const metodoPago = body.pago as MetodoPago;
  const activos = { mercadopago: tienda.pago.mercadoPago.activo, transferencia: tienda.pago.transferencia.activo };
  if (!Object.hasOwn(activos, metodoPago) || !activos[metodoPago]) throw new Error('Elegí una forma de pago.');

  return {
    cliente,
    entrega: { metodo: metodoEntrega, direccion },
    comentario: limpiarTexto(body.comentario, 500),
    pago: { metodo: metodoPago, estado: 'pendiente' },
    items: body.items,
  };
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Pedido inválido.' }, 400);
  }
  // Campo trampa: los humanos no lo ven, los bots de spam lo completan.
  if (body.web) return json({ error: 'Pedido inválido.' }, 400);

  let pedido: Pedido;
  try {
    const { items, ...datos } = leer(body);
    pedido = { id: nuevoId(), fecha: new Date().toISOString(), ...datos, calculo: calcular(items, datos.entrega.metodo) };
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }

  try {
    await guardarPedido(pedido);

    if (pedido.pago.metodo === 'mercadopago') {
      const url = await crearPreferencia(pedido);
      return json({ id: pedido.id, redirigir: url });
    }

    await avisarNuevoPedido(pedido);
    await confirmarAlCliente(pedido).catch((e) => console.error('[mail] No se pudo confirmar al cliente:', e));
    return json({ id: pedido.id, total: pedido.calculo.total });
  } catch (e) {
    console.error('[pedido]', pedido.id, e);
    return json({ error: 'No pudimos registrar el pedido. Probá de nuevo en unos minutos o escribinos.' }, 500);
  }
};

export const config: Config = { path: '/api/pedido' };
