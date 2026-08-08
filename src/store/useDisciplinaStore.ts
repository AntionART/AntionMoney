import { create } from 'zustand';
import { getDb } from '../db/client';
import {
  guardarSnapshotDisciplina,
  obtenerAportesUltimosDias,
  obtenerDeudasActivas,
  obtenerHistorialDisciplina,
  obtenerTieneMetas,
  obtenerTransaccionesDelMes,
  obtenerTransaccionesUltimosDias,
} from '../db/queries';
import { calcularIndiceDisciplina, type ResultadoDisciplina } from '../utils/disciplina';
import { fechaISO, mesPrefijo } from '../utils/finance';
import type { IndiceDisciplinaHistorial, Usuario } from '../types';

type DisciplinaState = {
  resultado: ResultadoDisciplina | null;
  historial: IndiceDisciplinaHistorial[];
  calcular: () => Promise<void>;
  cargarHistorial: (dias?: number) => Promise<void>;
};

export const useDisciplinaStore = create<DisciplinaState>((set) => ({
  resultado: null,
  historial: [],

  calcular: async () => {
    const db = await getDb();
    const ahora = new Date();
    const usuario = await db.getFirstAsync<Usuario>('SELECT * FROM usuario WHERE id = 1');

    const [transaccionesUltimos30Dias, transaccionesMes, deudasActivas, aportesUltimos28Dias, tieneMetas] =
      await Promise.all([
        obtenerTransaccionesUltimosDias(30, ahora),
        obtenerTransaccionesDelMes(mesPrefijo(ahora)),
        obtenerDeudasActivas(),
        obtenerAportesUltimosDias(28, ahora),
        obtenerTieneMetas(),
      ]);

    const resultado = calcularIndiceDisciplina({
      transaccionesUltimos30Dias,
      transaccionesMes,
      ingresoMensual: usuario?.ingreso_mensual ?? 0,
      deudasActivas,
      aportesUltimos28Dias,
      tieneMetas,
      ahora,
    });

    await guardarSnapshotDisciplina(fechaISO(ahora), resultado.indice, JSON.stringify(resultado.factores));
    set({ resultado });
  },

  cargarHistorial: async (dias = 30) => {
    const historial = await obtenerHistorialDisciplina(dias);
    set({ historial });
  },
}));
