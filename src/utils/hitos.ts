import type { Deuda, Meta } from '../types';
import { formatoMoneda } from './finance';

export type HitoCandidato = {
  titulo: string;
  descripcion: string;
  monto: number | null;
  esCumpleanosFinanciero: boolean;
};

type EntradaHitos = {
  metas: Meta[];
  deudas: Deuda[];
  ahorroTotal: number;
  rachaRegistro: number;
  rachaSinImpulso: number;
  rachaPresupuesto: number;
};

/**
 * Detecta hitos dignos de recordar (4.22) a partir del estado actual.
 * El llamador es responsable de filtrar los que ya existen (existeHito)
 * antes de insertarlos, así esta función puede volver a evaluarse siempre
 * sin generar duplicados.
 */
export function detectarHitosCandidatos(input: EntradaHitos): HitoCandidato[] {
  const { metas, deudas, ahorroTotal, rachaRegistro, rachaSinImpulso, rachaPresupuesto } = input;
  const candidatos: HitoCandidato[] = [];

  for (const meta of metas) {
    if (meta.estado === 'cumplida') {
      candidatos.push({
        titulo: `Meta cumplida: ${meta.nombre}`,
        descripcion: `Alcanzaste tu meta de ${formatoMoneda(meta.monto_objetivo)}.`,
        monto: meta.monto_objetivo,
        esCumpleanosFinanciero: true,
      });
    }
  }

  for (const deuda of deudas) {
    if (deuda.estado === 'pagada') {
      candidatos.push({
        titulo: `Deuda pagada: ${deuda.nombre}`,
        descripcion: `Terminaste de pagar ${formatoMoneda(deuda.monto_total)}.`,
        monto: deuda.monto_total,
        esCumpleanosFinanciero: true,
      });
    }
  }

  if (ahorroTotal >= 1_000_000) {
    candidatos.push({
      titulo: 'Primer millón ahorrado',
      descripcion: 'Tu ahorro total superó $1.000.000 por primera vez.',
      monto: ahorroTotal,
      esCumpleanosFinanciero: true,
    });
  }

  if (rachaRegistro >= 30) {
    candidatos.push({
      titulo: '30 días registrando gastos',
      descripcion: 'Llevas 30 días seguidos registrando tus gastos.',
      monto: null,
      esCumpleanosFinanciero: false,
    });
  }

  if (rachaSinImpulso >= 100) {
    candidatos.push({
      titulo: '100 días sin compras impulsivas',
      descripcion: 'Llevas 100 días sin marcar un gasto como impulso.',
      monto: null,
      esCumpleanosFinanciero: false,
    });
  }

  if (rachaPresupuesto >= 7) {
    candidatos.push({
      titulo: '7 días sin exceder el disponible',
      descripcion: 'Llevas 7 días seguidos dentro de tu presupuesto.',
      monto: null,
      esCumpleanosFinanciero: false,
    });
  }

  return candidatos;
}
