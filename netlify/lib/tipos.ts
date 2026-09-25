import type { Calculo, MetodoEntrega, MetodoPago } from '../../src/lib/pedido';

export interface Pedido {
  id: string; // ej: CH-4K7Q2M
  fecha: string; // ISO
  cliente: { nombre: string; email: string; telefono: string };
  entrega: {
    metodo: MetodoEntrega;
    // Los datos que pide Correo Argentino para un envío a domicilio.
    direccion?: {
      dni: string;
      calle: string;
      numero: string;
      pisoDepto: string;
      ciudad: string;
      provincia: string;
      cp: string;
      referencias: string;
    };
  };
  comentario: string;
  pago: {
    metodo: MetodoPago;
    estado: 'pendiente' | 'aprobado';
    mpPagoId?: string;
  };
  calculo: Calculo;
}
