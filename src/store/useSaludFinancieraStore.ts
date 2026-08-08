import { create } from 'zustand';
import { getDb } from '../db/client';
import {
  guardarSnapshotSalud,
  obtenerDeudasActivas,
  obtenerHistorialSalud,
  obtenerTodasLasMetas,
  obtenerTotalAhorroMetas,
  obtenerTotalDeudaPendiente,
  obtenerTransaccionesDelMes,
} from '../db/queries';
import { calcularSaludFinanciera, type ResultadoSaludFinanciera } from '../utils/saludFinanciera';
import { useDisciplinaStore } from './useDisciplinaStore';
import { fechaISO, mesPrefijo } from '../utils/finance';
import type { SaludFinancieraHistorial, Usuario } from '../types';

type SaludFinancieraState = {
  resultado: ResultadoSaludFinanciera | null;
  historial: SaludFinancieraHistorial[];
  calcular: () => Promise<void>;
  cargarHistorial: (dias?: number) => Promise<void>;
};

export const useSaludFinancieraStore = create<SaludFinancieraState>((set) => ({
  resultado: null,
  historial: [],

  calcular: async () => {
    const db = await getDb();
    const ahora = new Date();
    const usuario = await db.getFirstAsync<Usuario>('SELECT * FROM usuario WHERE id = 1');
    const ingresoMensual = usuario?.ingreso_mensual ?? 0;

    await useDisciplinaStore.getState().calcular();
    const indiceDisciplina = useDisciplinaStore.getState().resultado?.indice ?? 50;

    const [metas, deudasActivas, deudaTotalPendiente, ahorroTotal, transaccionesMes] = await Promise.all([
      obtenerTodasLasMetas(),
      obtenerDeudasActivas(),
      obtenerTotalDeudaPendiente(),
      obtenerTotalAhorroMetas(),
      obtenerTransaccionesDelMes(mesPrefijo(ahora)),
    ]);

    const gastoMesActual = transaccionesMes.reduce((s, t) => s + t.monto, 0);

    const resultado = calcularSaludFinanciera({
      indiceDisciplina,
      metas,
      deudasActivas,
      deudaTotalPendiente,
      ingresoMensual,
      gastoMesActual,
      ahorroTotal,
      ahora,
    });

    await guardarSnapshotSalud(fechaISO(ahora), resultado.indice, JSON.stringify(resultado.componentes));
    set({ resultado });
  },

  cargarHistorial: async (dias = 30) => {
    const historial = await obtenerHistorialSalud(dias);
    set({ historial });
  },
}));
