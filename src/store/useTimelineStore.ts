import { create } from 'zustand';
import {
  crearHito,
  existeHito,
  obtenerAportesDesde,
  obtenerHitosMemoria,
  obtenerPagosDeudaDesde,
  obtenerTodasLasDeudas,
  obtenerTodasLasMetas,
  obtenerTotalAhorroMetas,
  obtenerTotalDeudaPendiente,
  obtenerTransaccionesUltimosDias,
} from '../db/queries';
import { detectarHitosCandidatos } from '../utils/hitos';
import { calcularRachaSinImpulso } from '../utils/disciplina';
import { useDisciplinaStore } from './useDisciplinaStore';
import { fechaISO, sumarMesesISO } from '../utils/finance';
import type { HitoMemoriaFinanciera } from '../types';

type ProgresoComparativo = {
  deudaAntes: number;
  deudaHoy: number;
  ahorroAntes: number;
  ahorroHoy: number;
};

type TimelineState = {
  hitos: HitoMemoriaFinanciera[];
  progreso: ProgresoComparativo | null;
  cargar: () => Promise<void>;
  evaluarHitos: () => Promise<void>;
  cargarProgreso: () => Promise<void>;
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
  hitos: [],
  progreso: null,

  cargar: async () => {
    const hitos = await obtenerHitosMemoria();
    set({ hitos });
  },

  evaluarHitos: async () => {
    const ahora = new Date();
    const [metas, deudas, ahorroTotal, transaccionesRecientes] = await Promise.all([
      obtenerTodasLasMetas(),
      obtenerTodasLasDeudas(),
      obtenerTotalAhorroMetas(),
      obtenerTransaccionesUltimosDias(365, ahora),
    ]);

    const rachaRegistro = useDisciplinaStore.getState().resultado?.rachaRegistro ?? 0;
    const rachaPresupuesto = useDisciplinaStore.getState().resultado?.rachaPresupuesto ?? 0;
    const fechasConImpulso = new Set(transaccionesRecientes.filter((t) => t.es_impulso).map((t) => t.fecha));
    const rachaSinImpulso = calcularRachaSinImpulso(fechasConImpulso, ahora);

    const candidatos = detectarHitosCandidatos({
      metas,
      deudas,
      ahorroTotal,
      rachaRegistro,
      rachaSinImpulso,
      rachaPresupuesto,
    });

    for (const candidato of candidatos) {
      const yaExiste = await existeHito(candidato.titulo);
      if (!yaExiste) {
        await crearHito(
          candidato.titulo,
          candidato.descripcion,
          candidato.monto,
          fechaISO(ahora),
          candidato.esCumpleanosFinanciero
        );
      }
    }

    await get().cargar();
  },

  cargarProgreso: async () => {
    const ahora = new Date();
    const hace6Meses = sumarMesesISO(fechaISO(ahora), -6);

    const [deudaHoy, ahorroHoy, pagosDesde, aportesDesde] = await Promise.all([
      obtenerTotalDeudaPendiente(),
      obtenerTotalAhorroMetas(),
      obtenerPagosDeudaDesde(hace6Meses),
      obtenerAportesDesde(hace6Meses),
    ]);

    set({
      progreso: {
        deudaAntes: deudaHoy + pagosDesde,
        deudaHoy,
        ahorroAntes: Math.max(0, ahorroHoy - aportesDesde),
        ahorroHoy,
      },
    });
  },
}));
