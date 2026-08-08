import { create } from 'zustand';
import { getDb } from '../db/client';
import type { Transaccion } from '../types';
import { fechaISO, horaISO } from '../utils/finance';

export type NuevaTransaccion = {
  monto: number;
  categoriaId: number | null;
  nota: string;
  esImpulso: boolean;
  contextoEmocional?: string | null;
};

type TransaccionesState = {
  transacciones: Transaccion[];
  cargarMes: (fecha?: Date) => Promise<void>;
  agregar: (input: NuevaTransaccion) => Promise<void>;
  actualizar: (id: number, input: NuevaTransaccion) => Promise<void>;
  eliminar: (id: number) => Promise<void>;
  gastoAcumuladoMes: () => number;
};

export const useTransaccionesStore = create<TransaccionesState>((set, get) => ({
  transacciones: [],

  cargarMes: async (fecha = new Date()) => {
    const db = await getDb();
    const prefijo = fechaISO(fecha).slice(0, 7); // YYYY-MM
    const transacciones = await db.getAllAsync<Transaccion>(
      "SELECT * FROM transaccion WHERE fecha LIKE ? ORDER BY fecha DESC, hora DESC",
      [`${prefijo}%`]
    );
    set({ transacciones });
  },

  agregar: async (input: NuevaTransaccion) => {
    const db = await getDb();
    const ahora = new Date();
    await db.runAsync(
      'INSERT INTO transaccion (cuenta_id, monto, moneda, categoria_id, nota, fecha, hora, es_impulso, contexto_emocional) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        null,
        input.monto,
        'COP',
        input.categoriaId,
        input.nota,
        fechaISO(ahora),
        horaISO(ahora),
        input.esImpulso ? 1 : 0,
        input.contextoEmocional ?? null,
      ]
    );
    await get().cargarMes(ahora);
  },

  actualizar: async (id: number, input: NuevaTransaccion) => {
    const db = await getDb();
    await db.runAsync(
      'UPDATE transaccion SET monto = ?, categoria_id = ?, nota = ?, es_impulso = ?, contexto_emocional = ? WHERE id = ?',
      [input.monto, input.categoriaId, input.nota, input.esImpulso ? 1 : 0, input.contextoEmocional ?? null, id]
    );
    await get().cargarMes();
  },

  eliminar: async (id: number) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM transaccion WHERE id = ?', [id]);
    await get().cargarMes();
  },

  gastoAcumuladoMes: () => {
    return get().transacciones.reduce((total, t) => total + t.monto, 0);
  },
}));
