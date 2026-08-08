import { create } from 'zustand';
import { getDb } from '../db/client';
import { fechaISO, sumarMesesISO } from '../utils/finance';
import type { Deuda, PagoDeuda } from '../types';

type NuevaDeuda = {
  nombre: string;
  montoTotal: number;
  contraparte: string;
  tasaInteres: number | null;
  numeroCuotas: number;
  fechaProximaCuota: string | null;
};

type DeudasState = {
  deudas: Deuda[];
  pagosPorDeuda: Record<number, PagoDeuda[]>;
  cargar: () => Promise<void>;
  crear: (input: NuevaDeuda) => Promise<void>;
  registrarPago: (deudaId: number, monto: number) => Promise<void>;
  eliminar: (deudaId: number) => Promise<void>;
  cargarPagos: (deudaId: number) => Promise<void>;
};

export const useDeudasStore = create<DeudasState>((set, get) => ({
  deudas: [],
  pagosPorDeuda: {},

  cargar: async () => {
    const db = await getDb();
    const deudas = await db.getAllAsync<Deuda>(
      'SELECT * FROM deuda ORDER BY estado ASC, fecha_proxima_cuota ASC'
    );
    set({ deudas });
  },

  crear: async ({ nombre, montoTotal, contraparte, tasaInteres, numeroCuotas, fechaProximaCuota }) => {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO deuda (nombre, monto_total, saldo_pendiente, contraparte, tasa_interes, numero_cuotas, fecha_proxima_cuota, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, montoTotal, montoTotal, contraparte, tasaInteres, numeroCuotas, fechaProximaCuota, 'activa']
    );
    await get().cargar();
  },

  registrarPago: async (deudaId: number, monto: number) => {
    const db = await getDb();
    await db.runAsync('INSERT INTO pago_deuda (deuda_id, monto, fecha) VALUES (?, ?, ?)', [
      deudaId,
      monto,
      fechaISO(),
    ]);

    const deuda = await db.getFirstAsync<Deuda>('SELECT * FROM deuda WHERE id = ?', [deudaId]);
    if (deuda) {
      const nuevoSaldo = Math.max(0, deuda.saldo_pendiente - monto);
      const nuevoEstado = nuevoSaldo <= 0 ? 'pagada' : 'activa';
      const nuevaFecha =
        nuevoEstado === 'activa' && deuda.fecha_proxima_cuota
          ? sumarMesesISO(deuda.fecha_proxima_cuota, 1)
          : deuda.fecha_proxima_cuota;

      await db.runAsync('UPDATE deuda SET saldo_pendiente = ?, estado = ?, fecha_proxima_cuota = ? WHERE id = ?', [
        nuevoSaldo,
        nuevoEstado,
        nuevaFecha,
        deudaId,
      ]);
    }

    await Promise.all([get().cargar(), get().cargarPagos(deudaId)]);
  },

  eliminar: async (deudaId: number) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM pago_deuda WHERE deuda_id = ?', [deudaId]);
    await db.runAsync('DELETE FROM deuda WHERE id = ?', [deudaId]);
    await get().cargar();
  },

  cargarPagos: async (deudaId: number) => {
    const db = await getDb();
    const pagos = await db.getAllAsync<PagoDeuda>(
      'SELECT * FROM pago_deuda WHERE deuda_id = ? ORDER BY fecha DESC, id DESC',
      [deudaId]
    );
    set((state) => ({ pagosPorDeuda: { ...state.pagosPorDeuda, [deudaId]: pagos } }));
  },
}));
