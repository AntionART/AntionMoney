import { create } from 'zustand';
import { getDb } from '../db/client';
import { cancelarRecordatorioDiario, programarRecordatorioDiario } from '../utils/notificaciones';
import type { Usuario } from '../types';

type UsuarioState = {
  usuario: Usuario | null;
  cargar: () => Promise<void>;
  actualizarIngreso: (ingresoMensual: number) => Promise<void>;
  actualizarRecordatorio: (activo: boolean, hora: number) => Promise<void>;
  actualizarProposito: (texto: string) => Promise<void>;
  completarOnboarding: (nombre: string, ingresoMensual: number) => Promise<void>;
};

export const useUsuarioStore = create<UsuarioState>((set, get) => ({
  usuario: null,

  cargar: async () => {
    const db = await getDb();
    const usuario = await db.getFirstAsync<Usuario>('SELECT * FROM usuario WHERE id = 1');
    set({ usuario });
  },

  actualizarIngreso: async (ingresoMensual: number) => {
    const db = await getDb();
    await db.runAsync('UPDATE usuario SET ingreso_mensual = ? WHERE id = 1', [ingresoMensual]);
    const usuario = get().usuario;
    if (usuario) {
      set({ usuario: { ...usuario, ingreso_mensual: ingresoMensual } });
    }
  },

  actualizarRecordatorio: async (activo: boolean, hora: number) => {
    const db = await getDb();
    const usuario = get().usuario;

    await cancelarRecordatorioDiario(usuario?.recordatorio_notification_id ?? null);
    const notificationId = activo ? await programarRecordatorioDiario(hora) : null;

    await db.runAsync(
      'UPDATE usuario SET recordatorio_diario_activo = ?, recordatorio_diario_hora = ?, recordatorio_notification_id = ? WHERE id = 1',
      [activo ? 1 : 0, hora, notificationId]
    );
    if (usuario) {
      set({
        usuario: {
          ...usuario,
          recordatorio_diario_activo: activo ? 1 : 0,
          recordatorio_diario_hora: hora,
          recordatorio_notification_id: notificationId,
        },
      });
    }
  },

  actualizarProposito: async (texto: string) => {
    const db = await getDb();
    await db.runAsync('UPDATE usuario SET proposito_principal = ? WHERE id = 1', [texto]);
    const usuario = get().usuario;
    if (usuario) {
      set({ usuario: { ...usuario, proposito_principal: texto } });
    }
  },

  completarOnboarding: async (nombre: string, ingresoMensual: number) => {
    const db = await getDb();
    await db.runAsync(
      'UPDATE usuario SET nombre = ?, ingreso_mensual = ?, onboarding_completado = 1 WHERE id = 1',
      [nombre, ingresoMensual]
    );
    const usuario = get().usuario;
    if (usuario) {
      set({
        usuario: { ...usuario, nombre, ingreso_mensual: ingresoMensual, onboarding_completado: 1 },
      });
    }
  },
}));
