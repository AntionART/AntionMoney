import { create } from 'zustand';
import { getDb } from '../db/client';
import { fechaISO, horaISO, mesPrefijo } from '../utils/finance';
import type { GastoRecurrente } from '../types';

type NuevoRecurrente = {
  nombre: string;
  monto: number;
  categoriaId: number | null;
  diaDelMes: number;
};

type GastosRecurrentesState = {
  recurrentes: GastoRecurrente[];
  pendientes: GastoRecurrente[];
  cargar: () => Promise<void>;
  cargarPendientes: () => Promise<void>;
  crear: (input: NuevoRecurrente) => Promise<void>;
  eliminar: (id: number) => Promise<void>;
  registrarEsteMes: (id: number) => Promise<void>;
};

export const useGastosRecurrentesStore = create<GastosRecurrentesState>((set, get) => ({
  recurrentes: [],
  pendientes: [],

  cargar: async () => {
    const db = await getDb();
    const recurrentes = await db.getAllAsync<GastoRecurrente>(
      'SELECT * FROM gasto_recurrente WHERE activo = 1 ORDER BY dia_del_mes ASC'
    );
    set({ recurrentes });
  },

  cargarPendientes: async () => {
    const db = await getDb();
    const ahora = new Date();
    const pendientes = await db.getAllAsync<GastoRecurrente>(
      `SELECT gr.* FROM gasto_recurrente gr
       WHERE gr.activo = 1 AND gr.dia_del_mes <= ?
       AND NOT EXISTS (
         SELECT 1 FROM transaccion t
         WHERE t.gasto_recurrente_id = gr.id AND t.fecha LIKE ?
       )
       ORDER BY gr.dia_del_mes ASC`,
      [ahora.getDate(), `${mesPrefijo(ahora)}%`]
    );
    set({ pendientes });
  },

  crear: async ({ nombre, monto, categoriaId, diaDelMes }) => {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO gasto_recurrente (nombre, monto, categoria_id, dia_del_mes, activo) VALUES (?, ?, ?, ?, 1)',
      [nombre, monto, categoriaId, diaDelMes]
    );
    await Promise.all([get().cargar(), get().cargarPendientes()]);
  },

  eliminar: async (id: number) => {
    const db = await getDb();
    await db.runAsync('UPDATE gasto_recurrente SET activo = 0 WHERE id = ?', [id]);
    await Promise.all([get().cargar(), get().cargarPendientes()]);
  },

  registrarEsteMes: async (id: number) => {
    const db = await getDb();
    const recurrente = await db.getFirstAsync<GastoRecurrente>(
      'SELECT * FROM gasto_recurrente WHERE id = ?',
      [id]
    );
    if (!recurrente) return;

    const ahora = new Date();
    await db.runAsync(
      'INSERT INTO transaccion (cuenta_id, monto, moneda, categoria_id, nota, fecha, hora, es_impulso, gasto_recurrente_id) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)',
      [null, recurrente.monto, 'COP', recurrente.categoria_id, recurrente.nombre, fechaISO(ahora), horaISO(ahora), id]
    );
    await get().cargarPendientes();
  },
}));
