import type { Calculo, MetodoEntrega, MetodoPago } from '../../src/lib/pedido';

export interface Pedido {
  id: string; // ej: CH-4K7Q2M
  fecha: string; // ISO
  cliente: { nombre: string; email: string; telefono: string };
  entrega: {
    metodo: MetodoEntrega;
    direccion?: { calle: string; ciudad: string; provincia: string; cp: string };
  };
  comentario: string;
  pago: {
    metodo: MetodoPago;
    estado: 'pendiente' | 'aprobado';
    mpPagoId?: string;
  };
  calculo: Calculo;
}
