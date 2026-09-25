# Chita Cuadernos — tienda online

Tienda web de cuadernos de cuero hechos a mano. El cliente elige, paga (Mercado Pago o
transferencia) y **a la tienda le llega un mail con el pedido completo** para armarlo.

Esta guía está pensada para quien no programa.

| Qué querés cambiar                              | Dónde                       |
| ----------------------------------------------- | --------------------------- |
| Productos, precios, textos, alias, envío        | `src/data/tienda.ts`        |
| Fotos de cada cuaderno                          | `fotos/productos/<modelo>/` |
| Foto de portada                                 | `fotos/sitio/portada.jpg`   |

---

## Cómo funciona una compra

1. El cliente elige el cuaderno, el tamaño y (si quiere) el texto del grabado, y lo suma al carrito.
2. En **Finalizar compra** completa sus datos, elige **envío por Correo Argentino** o **retiro en
   Don Torcuato**, y cómo pagar:
   - **Mercado Pago:** lo manda a pagar. Cuando el pago se acredita, llega el mail
     **“✅ Pedido pagado”** a la tienda y un mail de confirmación al cliente.
   - **Transferencia:** la web le muestra el alias y el total. Llega el mail
     **“🕓 Pedido nuevo (transferencia)”** a la tienda. El cliente recibe los datos por mail y
     responde con el comprobante. **Hay que esperar el comprobante antes de armar.**
3. El mail de la tienda trae todo: productos, grabados, datos del cliente, dirección y un botón
   para escribirle por WhatsApp. Si respondés ese mail, le llega al cliente.

---

## Cambiar productos y precios

Todo está en `src/data/tienda.ts`. Los precios van **sin puntos**: `38000`, no `38.000`.

- **Precio:** cambiá el número en `precio`.
- **Nuevo tamaño u opción:** agregá una línea en `variantes`. El `id` es un nombre corto que no
  se repite, por ejemplo `{ id: '160', nombre: '160 hojas', precio: 48000 }`.
- **Colores:** si querés que el cliente elija el color del cuero, completá `colores`, por ejemplo
  `colores: ['Bordó', 'Suela', 'Verde']`. Si queda vacío (`[]`), no aparece el selector.
- **Grabado:** en `tienda.grabado`, `precio` es lo que se cobra de más (0 = sin cargo).
- **Envío:** en `tienda.entrega.envio.costo` va un monto fijo (ej. `8500`). Si queda `null`, no
  se cobra en la web y se coordina después con el cliente.
- **Sacar un producto:** borrá su bloque `{ ... }` completo.

## Fotos

Cada modelo tiene su carpeta en `fotos/productos/` (`origen`, `reversionado`, `nomade`).

- La **primera foto en orden alfabético** es la de la tarjeta. Para ordenarlas, ponele números
  adelante al nombre: `01-bordo.jpg`, `02-detalle.jpg`…
- Podés subir las fotos originales en JPG: el sitio las achica solo.

---

## Publicar (Netlify, gratis) — se hace una sola vez

1. Entrá a [netlify.com](https://www.netlify.com) con la cuenta de GitHub.
2. **Add new site → Import an existing project → GitHub** y elegí `Chita-cuadernos`.
   Netlify detecta todo solo: tocá **Deploy**.
3. En **Site configuration → Environment variables** cargá estas variables:

| Variable             | Qué es                                                                       |
| -------------------- | ---------------------------------------------------------------------------- |
| `MP_ACCESS_TOKEN`    | El *Access Token* de producción de Mercado Pago (ver abajo)                  |
| `GMAIL_USER`         | La cuenta de Gmail que manda los mails, ej. `chita.cuadernos@gmail.com`      |
| `GMAIL_APP_PASSWORD` | Una *contraseña de aplicación* de esa cuenta (ver abajo)                     |
| `PEDIDOS_EMAIL`      | Adónde llegan los pedidos. Si no se carga, llegan a `GMAIL_USER`             |

4. Volvé a publicar: **Deploys → Trigger deploy**.
5. Si cambiás el nombre del sitio en Netlify, actualizá `url` en `src/data/tienda.ts`.

### Access Token de Mercado Pago

1. Entrá a [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel)
   con la cuenta de Mercado Pago donde tiene que entrar la plata.
2. **Crear aplicación** → tipo *Pagos online* → *Checkout Pro*.
3. En **Credenciales de producción**, copiá el **Access Token** (empieza con `APP_USR-`).

### Contraseña de aplicación de Gmail

1. En la cuenta de Google, activá la **Verificación en dos pasos**.
2. Entrá a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), creá una
   con el nombre “Chita web” y copiá las 16 letras (sin espacios).

### Probar antes de anunciar

Hacé un pedido por transferencia con tu propio mail y fijate que lleguen los dos mails. Para probar
Mercado Pago sin cobrar de verdad, usá el Access Token de **prueba** y las
[tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards).
Después volvé a poner el de producción.

---

## Para quien programa

- [Astro](https://astro.build) (sitio estático) + Netlify Functions en `netlify/functions/`:
  - `POST /api/pedido`: valida y recalcula el pedido con los precios del servidor
    (`src/lib/pedido.ts`), lo guarda en Netlify Blobs y crea la preferencia de Mercado Pago o
    manda los mails de transferencia.
  - `/api/mp-webhook`: notificaciones de Mercado Pago. Siempre consulta el pago a la API, nunca
    confía en el contenido del aviso. Los mails salen una sola vez por pedido.
  - `/api/estado-pago`: lo usa `/pedido/listo` al volver de Mercado Pago. También confirma el
    pedido si el webhook se demora.
- `npm run dev` levanta el sitio (sin funciones). `npm run build` compila. `npm run check` hace el
  chequeo de tipos.
