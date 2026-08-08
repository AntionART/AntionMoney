import type { AporteMeta, Meta } from '../types';

export type ImpactoMeta = {
  metaId: number;
  nombre: string;
  prioridad: number;
  diasRetraso: number | null;
};

/**
 * Intervención Inteligente (4.15): estima cuántos días retrasaría cada meta
 * priorizada si este monto se gastara en vez de aportarse. La velocidad de
 * ahorro se calcula sobre los aportes reales de los últimos 30 días — una
 * heurística, no una promesa exacta.
 */
export function calcularImpactoEnMetas(
  monto: number,
  metasActivasOrdenadas: Meta[],
  aportesUltimos30Dias: AporteMeta[],
  maxMetas = 3
): ImpactoMeta[] {
  return metasActivasOrdenadas.slice(0, maxMetas).map((meta, i) => {
    const aportado30d = aportesUltimos30Dias
      .filter((a) => a.meta_id === meta.id)
      .reduce((s, a) => s + a.monto, 0);
    const velocidadDiaria = aportado30d / 30;
    const diasRetraso = velocidadDiaria > 0 && monto > 0 ? Math.ceil(monto / velocidadDiaria) : null;
    return { metaId: meta.id, nombre: meta.nombre, prioridad: i + 1, diasRetraso };
  });
}
