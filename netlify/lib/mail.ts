// Mails de pedidos. Se mandan desde una cuenta de Gmail con "contraseña de aplicación".
// Variables de entorno (se cargan en Netlify, ver README):
//   GMAIL_USER          cuenta que envía, ej: chita.cuadernos@gmail.com
//   GMAIL_APP_PASSWORD  contraseña de aplicación de esa cuenta
//   PEDIDOS_EMAIL       adónde llegan los pedidos (si falta, a GMAIL_USER)
import nodemailer from 'nodemailer';
import { formatoPrecio, tienda } from '../../src/data/tienda';
import type { Pedido } from './tipos';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function enviar(para: string, asunto: string, html: string, texto: string, responderA?: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn(`[mail] Falta GMAIL_USER/GMAIL_APP_PASSWORD. Mail no enviado a ${para}: ${asunto}\n${texto}`);
    return;
  }
  const t = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await t.sendMail({
    from: `"${tienda.nombreCompleto}" <${user}>`,
    to: para,
    replyTo: responderA,
    subject: asunto,
    html,
    text: texto,
  });
}

function tablaProductos(p: Pedido): { html: string; texto: string } {
  const filas = p.calculo.lineas.map((l) => {
    const extras = [l.color && `Color: ${l.color}`, l.grabado && `Grabado: “${l.grabado}”`].filter(Boolean) as string[];
    return { l, extras };
  });
  const envio = p.entrega.metodo === 'retiro' ? 'Retiro (sin cargo)' : p.calculo.envio === null ? 'A coordinar' : formatoPrecio(p.calculo.envio);

  const html = `
<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:560px;font:15px/1.4 Arial,sans-serif;color:#2b211b">
  ${filas
    .map(
      ({ l, extras }) => `<tr style="border-bottom:1px solid #e6ddd0">
    <td><strong>${l.cantidad} × ${esc(l.titulo)}</strong>${extras.map((e) => `<br><span style="color:#7a6a5c">${esc(e)}</span>`).join('')}</td>
    <td align="right" style="white-space:nowrap">${formatoPrecio(l.subtotal)}</td></tr>`,
    )
    .join('')}
  <tr><td>Envío</td><td align="right">${envio}</td></tr>
  <tr><td><strong>Total</strong></td><td align="right"><strong>${formatoPrecio(p.calculo.total)}</strong></td></tr>
</table>`;

  const texto = [
    ...filas.map(({ l, extras }) => `${l.cantidad} x ${l.titulo} — ${formatoPrecio(l.subtotal)}${extras.map((e) => `\n    ${e}`).join('')}`),
    `Envío: ${envio}`,
    `TOTAL: ${formatoPrecio(p.calculo.total)}`,
  ].join('\n');
  return { html, texto };
}

function datosEntrega(p: Pedido): string[] {
  if (p.entrega.metodo === 'retiro') return [`Entrega: ${tienda.entrega.retiro.titulo}`];
  const d = p.entrega.direccion!;
  return [
    `Entrega: ${tienda.entrega.envio.titulo}`,
    '— Datos para Correo Argentino —',
    `Destinatario: ${p.cliente.nombre}`,
    `DNI: ${d.dni}`,
    `Calle y número: ${d.calle} ${d.numero}`,
    ...(d.pisoDepto ? [`Piso / depto: ${d.pisoDepto}`] : []),
    `Localidad: ${d.ciudad}`,
    `Provincia: ${d.provincia}`,
    `Código postal: ${d.cp}`,
    ...(d.referencias ? [`Referencias: ${d.referencias}`] : []),
  ];
}

const direccionCorta = (p: Pedido) => {
  const d = p.entrega.direccion!;
  return `${d.calle} ${d.numero}${d.pisoDepto ? ` ${d.pisoDepto}` : ''}, ${d.ciudad}, ${d.provincia} (CP ${d.cp})`;
};

const estadoPago = (p: Pedido) =>
  p.pago.metodo === 'mercadopago'
    ? `PAGADO con Mercado Pago${p.pago.mpPagoId ? ` (operación ${p.pago.mpPagoId})` : ''}`
    : 'Transferencia — PENDIENTE: esperar el comprobante antes de armar';

/** Mail para la dueña: todo lo necesario para armar el pedido. */
export async function avisarNuevoPedido(p: Pedido) {
  const para = process.env.PEDIDOS_EMAIL || process.env.GMAIL_USER || '';
  const t = tablaProductos(p);
  const wa = p.cliente.telefono.replace(/\D/g, '');
  const lineas = [
    `Pedido ${p.id}`,
    `Pago: ${estadoPago(p)}`,
    '',
    `Cliente: ${p.cliente.nombre}`,
    `Mail: ${p.cliente.email}`,
    `Teléfono: ${p.cliente.telefono}`,
    ...datosEntrega(p),
    ...(p.comentario ? [`Comentario: ${p.comentario}`] : []),
  ];
  const html = `<div style="font:15px/1.5 Arial,sans-serif;color:#2b211b">
<h2 style="margin:0 0 4px">Nuevo pedido ${esc(p.id)}</h2>
<p style="margin:0 0 16px;padding:8px 12px;background:${p.pago.estado === 'aprobado' ? '#e3efdc' : '#fbecd3'};display:inline-block;border-radius:6px"><strong>${esc(estadoPago(p))}</strong></p>
${t.html}
<p>${lineas.slice(3).map(esc).join('<br>')}</p>
<p><a href="https://wa.me/${wa}">Escribirle por WhatsApp</a> · <a href="mailto:${esc(p.cliente.email)}">Responder por mail</a></p>
</div>`;
  const asunto = `${p.pago.estado === 'aprobado' ? '✅ Pedido pagado' : '🕓 Pedido nuevo (transferencia)'} ${p.id} — ${p.cliente.nombre} — ${formatoPrecio(p.calculo.total)}`;
  await enviar(para, asunto, html, `${lineas.join('\n')}\n\n${t.texto}`, p.cliente.email);
}

/** Mail para el cliente confirmando lo que compró. */
export async function confirmarAlCliente(p: Pedido) {
  const t = tablaProductos(p);
  const tr = tienda.pago.transferencia;
  const pendiente = p.pago.metodo === 'transferencia';
  const intro = pendiente
    ? `¡Gracias por tu pedido! Para confirmarlo, transferí ${formatoPrecio(p.calculo.total)} dentro de las próximas ${tr.plazoHoras} horas y respondé este mail con el comprobante.`
    : '¡Gracias por tu compra! Recibimos tu pago y ya empezamos a preparar tu pedido.';
  const datosTr = [`Alias: ${tr.alias}`, ...(tr.cvu ? [`CVU: ${tr.cvu}`] : []), `Titular: ${tr.titular}`, `Monto: ${formatoPrecio(p.calculo.total)}`];
  const entrega =
    p.entrega.metodo === 'retiro'
      ? `Retiro: ${tienda.entrega.retiro.texto}`
      : `Envío por Correo Argentino a: ${direccionCorta(p)}.${p.calculo.envio === null ? ' ' + tienda.entrega.envio.textoSinCosto : ''}`;

  const html = `<div style="font:15px/1.5 Arial,sans-serif;color:#2b211b;max-width:560px">
<h2 style="margin:0 0 8px">Hola ${esc(p.cliente.nombre.split(' ')[0])}</h2>
<p>${esc(intro)}</p>
${pendiente ? `<p style="padding:12px 16px;background:#f4efe7;border-radius:8px">${datosTr.map(esc).join('<br>')}</p>` : ''}
<p style="color:#7a6a5c">Pedido <strong>${esc(p.id)}</strong></p>
${t.html}
<p>${esc(entrega)}</p>
<p>Cualquier duda, respondé este mail.<br>— ${esc(tienda.nombreCompleto)}</p>
</div>`;
  const texto = [`Hola ${p.cliente.nombre}`, '', intro, ...(pendiente ? ['', ...datosTr] : []), '', `Pedido ${p.id}`, t.texto, '', entrega].join('\n');
  const responderA = process.env.PEDIDOS_EMAIL || undefined;
  await enviar(p.cliente.email, `Tu pedido ${p.id} en ${tienda.nombreCompleto}`, html, texto, responderA);
}
