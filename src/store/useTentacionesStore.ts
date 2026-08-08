import { create } from 'zustand';
import { getDb } from '../db/client';
import { fechaISO, horaISO } from '../utils/finance';
import {
  cancelarNotificacion,
  programarNotificacionTentacionDisponible,
} from '../utils/notificaciones';
import type { TentacionPendiente } from '../types';

const HORAS_PAUSA = 24;

type TentacionesState = {
  tentaciones: TentacionPendiente[];
  cargar: () => Promise<void>;
  crear: (descripcion: string, montoEstimado: number) => Promise<void>;
  resolverComprar: (id: number, categoriaId: number | null) => Promise<void>;
  resolverDescartar: (id: number) => Promise<void>;
};

export const useTentacionesStore = create<TentacionesState>((set, get) => ({
  tentaciones: [],

  cargar: async () => {
    const db = await getDb();
    const tentaciones = await db.getAllAsync<TentacionPendiente>(
      'SELECT * FROM tentacion_pendiente WHERE resuelto = 0 ORDER BY fecha_disponible ASC'
    );
    set({ tentaciones });
  },

  crear: async (descripcion: string, montoEstimado: number) => {
    const db = await getDb();
    const ahora = new Date();
    const fechaDisponible = new Date(ahora.getTime() + HORAS_PAUSA * 60 * 60 * 1000);

    const notificationId = await programarNotificacionTentacionDisponible(descripcion, fechaDisponible);

    await db.runAsync(
      'INSERT INTO tentacion_pendiente (descripcion, monto_estimado, fecha_creacion, fecha_disponible, resuelto, notification_id) VALUES (?, ?, ?, ?, 0, ?)',
      [descripcion, montoEstimado, ahora.toISOString(), fechaDisponible.toISOString(), notificationId]
    );
    await get().cargar();
  },

  resolverComprar: async (id: number, categoriaId: number | null) => {
    const db = await getDb();
    const tentacion = await db.getFirstAsync<TentacionPendiente>(
      'SELECT * FROM tentacion_pendiente WHERE id = ?',
      [id]
    );
    if (!tentacion) return;

    const ahora = new Date();
    await db.runAsync(
      'INSERT INTO transaccion (cuenta_id, monto, moneda, categoria_id, nota, fecha, hora, es_impulso) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [null, tentacion.monto_estimado, 'COP', categoriaId, tentacion.descripcion, fechaISO(ahora), horaISO(ahora)]
    );
    await db.runAsync('UPDATE tentacion_pendiente SET resuelto = 1 WHERE id = ?', [id]);
    await cancelarNotificacion(tentacion.notification_id);
    await get().cargar();
  },

  resolverDescartar: async (id: number) => {
    const db = await getDb();
    const tentacion = await db.getFirstAsync<TentacionPendiente>(
      'SELECT * FROM tentacion_pendiente WHERE id = ?',
      [id]
    );
    await db.runAsync('UPDATE tentacion_pendiente SET resuelto = 1 WHERE id = ?', [id]);
    if (tentacion) {
      await cancelarNotificacion(tentacion.notification_id);
    }
    await get().cargar();
  },
}));
