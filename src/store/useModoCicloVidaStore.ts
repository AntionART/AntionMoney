import { create } from 'zustand';
import {
  obtenerDeudasActivas,
  obtenerModoCicloVidaActivo,
  obtenerTotalDeudaPendiente,
  registrarCambioModoCicloVida,
} from '../db/queries';
import { getDb } from '../db/client';
import { determinarModoCicloVida } from '../utils/modoCicloVida';
import { useSaludFinancieraStore } from './useSaludFinancieraStore';
import { fechaISO } from '../utils/finance';
import type { ModoCicloVida, Usuario } from '../types';

type ModoCicloVidaState = {
  activo: ModoCicloVida | null;
  evaluar: () => Promise<void>;
};

export const useModoCicloVidaStore = create<ModoCicloVidaState>((set) => ({
  activo: null,

  evaluar: async () => {
    const db = await getDb();
    const ahora = new Date();
    const usuario = await db.getFirstAsync<Usuario>('SELECT * FROM usuario WHERE id = 1');

    const saludIndice = useSaludFinancieraStore.getState().resultado?.indice ?? 50;
    const [deudasActivas, deudaTotalPendiente] = await Promise.all([
      obtenerDeudasActivas(),
      obtenerTotalDeudaPendiente(),
    ]);
    const hoy = fechaISO(ahora);
    const deudasEnMora = deudasActivas.filter((d) => d.fecha_proxima_cuota && d.fecha_proxima_cuota < hoy).length;

    const resultado = determinarModoCicloVida({
      saludIndice,
      deudaTotalPendiente,
      ingresoMensual: usuario?.ingreso_mensual ?? 0,
      deudasEnMora,
    });

    await registrarCambioModoCicloVida(resultado.modo, resultado.causa, hoy);
    const activo = await obtenerModoCicloVidaActivo();
    set({ activo });
  },
}));
