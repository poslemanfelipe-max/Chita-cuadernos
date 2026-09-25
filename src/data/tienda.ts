// ─────────────────────────────────────────────────────────────────────────────
//  DATOS DE LA TIENDA
//  Este es el único archivo que hace falta tocar para cambiar productos,
//  precios, textos, formas de entrega y datos de pago.
//  Los precios van en pesos, sin puntos: 38000 (no "38.000").
// ─────────────────────────────────────────────────────────────────────────────

export interface Variante {
  id: string; // no cambiar una vez publicada (identifica la opción en los pedidos)
  nombre: string; // lo que ve el cliente, ej: "120 hojas"
  precio: number;
}

export interface Producto {
  id: string; // también es la dirección de la página: /cuadernos/<id>
  nombre: string;
  bajada: string; // una línea corta que aparece en la tarjeta
  descripcion: string[]; // párrafos
  detalles: string[]; // lista de características
  carpetaFotos: string; // carpeta dentro de fotos/productos/
  variantes: Variante[]; // si hay una sola, no se muestra el selector
  colores: string[]; // colores de cuero para elegir. Vacío = no se muestra
  grabado: boolean; // ¿se puede personalizar con grabado?
}

export const productos: Producto[] = [
  {
    id: 'origen',
    nombre: 'Chita Origen',
    bajada: 'El punto de partida. Simple, cálido, hecho a mano.',
    descripcion: [
      'El modelo Chita Origen es el punto de partida de todo. Un cuaderno simple, hecho a mano: sus materiales y formas buscan ser cálidos y agradables, dejando que el trabajo artesanal se vea en cada detalle.',
      'El sistema de cierre con hilo y botón acompaña de manera sutil, aportando practicidad y autenticidad.',
    ],
    detalles: ['Hecho a mano', 'Cierre con hilo y botón', 'Dos tamaños: 80 o 120 hojas', 'Cinco colores para elegir'],
    carpetaFotos: 'origen',
    variantes: [
      { id: '80', nombre: '80 hojas', precio: 30000 },
      { id: '120', nombre: '120 hojas', precio: 38000 },
    ],
    colores: ['Rosa', 'Suela', 'Arena', 'Verde', 'Topo'],
    grabado: true,
  },
  {
    id: 'reversionado',
    nombre: 'Chita Reversionado',
    bajada: 'La evolución del clásico, con tapas blandas y costura a la vista.',
    descripcion: [
      'El modelo Chita Reversionado nace como una evolución del clásico Chita Origen. Mantiene su esencia artesanal, pero se reinventa a través de nuevos materiales y un estilo renovado.',
      'Sus tapas blandas le aportan flexibilidad y calidez, mientras que la costura a la vista cobra protagonismo.',
    ],
    detalles: ['Tapas blandas', 'Costura a la vista', '120 hojas'],
    carpetaFotos: 'reversionado',
    variantes: [{ id: '120', nombre: '120 hojas', precio: 45000 }],
    colores: [],
    grabado: true,
  },
  {
    id: 'nomade',
    nombre: 'Chita Nómade',
    bajada: 'Para acompañar el movimiento. Reutilizable, de cuero vacuno.',
    descripcion: [
      'El modelo Chita Nómade está pensado para acompañar el movimiento: un cuaderno práctico y versátil, que se adapta al día a día. Su cuero vacuno le aporta durabilidad y resistencia.',
      'Su sistema de cierre elástico y porta lápiz integrado lo vuelven funcional sin perder la simpleza. Además es reutilizable: los elásticos interiores permiten cambiar los cuadernillos una vez que se terminan.',
    ],
    detalles: [
      'Cuero vacuno',
      'Incluye dos cuadernillos de 60 hojas',
      'Cierre elástico y porta lápiz',
      'Cuadernillos intercambiables',
    ],
    carpetaFotos: 'nomade',
    variantes: [{ id: '2x60', nombre: '2 cuadernillos de 60 hojas', precio: 55000 }],
    colores: [],
    grabado: true,
  },
];

// Tono aproximado de cada color, para la muestrita al lado del nombre.
export const tonos: Record<string, string> = {
  Rosa: '#c98f8c',
  Suela: '#8b5330',
  Arena: '#cbb9a6',
  Verde: '#4d5039',
  Topo: '#b3a18f',
};

export const tienda = {
  marca: 'Chita',
  nombreCompleto: 'Chita Cuadernos',
  // Cuando haya dominio propio, cambiarlo acá (sin barra al final).
  url: 'https://fluffy-chimera-d3c662.netlify.app',

  seo: {
    titulo: 'Chita Cuadernos — cuadernos de cuero hechos a mano',
    descripcion:
      'Cuadernos artesanales de cuero hechos a mano en Don Torcuato. Envíos a todo el país por Correo Argentino.',
  },

  portada: {
    titulo: 'Cuadernos de cuero,\nhechos a mano.',
    texto: 'Cada Chita se corta, se cose y se arma a mano. Elegí el tuyo y lo preparamos para vos.',
  },

  // Grabado personalizado (nombre, iniciales, una fecha...).
  grabado: {
    precio: 15000, // costo extra por cuaderno. 0 = sin cargo
    maxCaracteres: 20,
    ayuda: 'Nombre, iniciales o una palabra corta.',
  },

  entrega: {
    envio: {
      titulo: 'Envío por Correo Argentino',
      // Costo fijo del envío. null = no se cobra en la web y se coordina aparte.
      costo: 10000 as number | null,
      texto: 'Enviamos a todo el país por Correo Argentino, a domicilio.',
      textoSinCosto: 'El costo del envío se coordina después de la compra, según el destino.',
    },
    retiro: {
      titulo: 'Retiro en Don Torcuato',
      texto: 'Barrio Lagos del Norte, Don Torcuato. Coordinamos día y horario por mensaje.',
    },
  },

  pago: {
    mercadoPago: {
      activo: true,
      titulo: 'Mercado Pago',
      texto: 'Tarjeta de crédito, débito o dinero en cuenta.',
    },
    transferencia: {
      activo: true,
      titulo: 'Transferencia bancaria',
      texto: 'Te mostramos los datos al confirmar el pedido.',
      // ⚠️ Completar con los datos reales antes de publicar.
      alias: 'Chita.cuadernos',
      cvu: '0000003100099598748463', // CBU o CVU. Vacío = no se muestra
      titular: 'Paz Coulter',
      // Cuántas horas tiene el cliente para transferir antes de que el pedido se libere.
      plazoHoras: 48,
    },
  },

  contacto: {
    instagram: 'chita.cuadernos',
    // Número con código de país, sin + ni espacios: 5491122334455. Vacío = no se muestra.
    whatsapp: '',
    email: '', // mail público de contacto (opcional)
  },

  // Preguntas frecuentes que aparecen al final de la página de inicio.
  preguntas: [
    {
      p: '¿Cómo funciona el grabado?',
      r: 'Al agregar el cuaderno al carrito podés escribir el texto que querés grabar en la tapa (tiene un costo extra por cuaderno). Si lo dejás vacío, va sin grabado.',
    },
    {
      p: '¿Puedo cambiar los cuadernillos del Nómade?',
      r: 'Sí. Los elásticos interiores permiten sacar los cuadernillos terminados y poner nuevos.',
    },
  ],
};

export function productoPorId(id: string): Producto | undefined {
  return productos.find((p) => p.id === id);
}

export function formatoPrecio(n: number): string {
  return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}
