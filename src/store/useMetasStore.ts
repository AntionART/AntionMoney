import { create } from 'zustand';
import { getDb } from '../db/client';
import { fechaISO } from '../utils/finance';
import type { AporteMeta, Meta } from '../types';

type NuevaMeta = {
  nombre: string;
  montoObjetivo: number;
  fechaLimite: string | null;
};

type MetasState = {
  metas: Meta[];
  aportesPorMeta: Record<number, AporteMeta[]>;
  cargar: () => Promise<void>;
  crear: (input: NuevaMeta) => Promise<void>;
  aportar: (metaId: number, monto: number) => Promise<void>;
  eliminar: (metaId: number) => Promise<void>;
  cargarAportes: (metaId: number) => Promise<void>;
  moverPrioridad: (metaId: number, direccion: 'arriba' | 'abajo') => Promise<void>;
};

export const useMetasStore = create<MetasState>((set, get) => ({
  metas: [],
  aportesPorMeta: {},

  cargar: async () => {
    const db = await getDb();
    const metas = await db.getAllAsync<Meta>(
      'SELECT * FROM meta ORDER BY estado ASC, prioridad ASC, created_at ASC'
    );
    set({ metas });
  },

  crear: async ({ nombre, montoObjetivo, fechaLimite }) => {
    const db = await getDb();
    const maxPrioridad = await db.getFirstAsync<{ max: number | null }>(
      'SELECT MAX(prioridad) as max FROM meta'
    );
    const prioridad = (maxPrioridad?.max ?? 0) + 1;
    await db.runAsync(
      'INSERT INTO meta (nombre, monto_objetivo, monto_actual, fecha_limite, estado, prioridad) VALUES (?, ?, 0, ?, ?, ?)',
      [nombre, montoObjetivo, fechaLimite, 'activa', prioridad]
    );
    await get().cargar();
  },

  aportar: async (metaId: number, monto: number) => {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO aporte_meta (meta_id, monto, fecha) VALUES (?, ?, ?)',
      [metaId, monto, fechaISO()]
    );
    const meta = await db.getFirstAsync<Meta>('SELECT * FROM meta WHERE id = ?', [metaId]);
    if (meta) {
      const nuevoMonto = meta.monto_actual + monto;
      const nuevoEstado = nuevoMonto >= meta.monto_objetivo ? 'cumplida' : 'activa';
      await db.runAsync('UPDATE meta SET monto_actual = ?, estado = ? WHERE id = ?', [
        nuevoMonto,
        nuevoEstado,
        metaId,
      ]);
    }
    await Promise.all([get().cargar(), get().cargarAportes(metaId)]);
  },

  eliminar: async (metaId: number) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM aporte_meta WHERE meta_id = ?', [metaId]);
    await db.runAsync('DELETE FROM meta WHERE id = ?', [metaId]);
    await get().cargar();
  },

  moverPrioridad: async (metaId: number, direccion: 'arriba' | 'abajo') => {
    const db = await getDb();
    const activas = get().metas.filter((m) => m.estado === 'activa');
    const indice = activas.findIndex((m) => m.id === metaId);
    const indiceVecino = direccion === 'arriba' ? indice - 1 : indice + 1;
    if (indice === -1 || indiceVecino < 0 || indiceVecino >= activas.length) return;

    const actual = activas[indice];
    const vecino = activas[indiceVecino];
    await db.runAsync('UPDATE meta SET prioridad = ? WHERE id = ?', [vecino.prioridad, actual.id]);
    await db.runAsync('UPDATE meta SET prioridad = ? WHERE id = ?', [actual.prioridad, vecino.id]);
    await get().cargar();
  },

  cargarAportes: async (metaId: number) => {
    const db = await getDb();
    const aportes = await db.getAllAsync<AporteMeta>(
      'SELECT * FROM aporte_meta WHERE meta_id = ? ORDER BY fecha DESC, id DESC',
      [metaId]
    );
    set((state) => ({ aportesPorMeta: { ...state.aportesPorMeta, [metaId]: aportes } }));
  },
}));
