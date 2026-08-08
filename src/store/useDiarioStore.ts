import { create } from 'zustand';
import { guardarEntradaDiario, obtenerEntradaDiario, obtenerEntradasDiario } from '../db/queries';
import { fechaISO } from '../utils/finance';
import type { DiarioFinancieroEntrada } from '../types';

type DiarioState = {
  hoy: DiarioFinancieroEntrada | null;
  historial: DiarioFinancieroEntrada[];
  cargarHoy: () => Promise<void>;
  cargarHistorial: (dias?: number) => Promise<void>;
  guardar: (
    comoEstuvo: DiarioFinancieroEntrada['como_estuvo'],
    motivo: string,
    motivoTextoLibre: string
  ) => Promise<void>;
};

export const useDiarioStore = create<DiarioState>((set) => ({
  hoy: null,
  historial: [],

  cargarHoy: async () => {
    const hoy = await obtenerEntradaDiario(fechaISO());
    set({ hoy });
  },

  cargarHistorial: async (dias = 14) => {
    const historial = await obtenerEntradasDiario(dias);
    set({ historial });
  },

  guardar: async (comoEstuvo, motivo, motivoTextoLibre) => {
    const fecha = fechaISO();
    await guardarEntradaDiario(fecha, comoEstuvo, motivo, motivoTextoLibre);
    const hoy = await obtenerEntradaDiario(fecha);
    set({ hoy });
  },
}));
