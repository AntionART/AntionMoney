import type { Transaccion } from '../types';

export type EstadisticasAvanzadas = {
  promedioDiario: number;
  mayorGastoImpulso: Transaccion | null;
  mejorSemana: { semana: number; monto: number } | null;
  peorSemana: { semana: number; monto: number } | null;
};

export function calcularEstadisticasAvanzadas(transaccionesMes: Transaccion[], diasTranscurridos: number): EstadisticasAvanzadas {
  const total = transaccionesMes.reduce((s, t) => s + t.monto, 0);
  const promedioDiario = diasTranscurridos > 0 ? total / diasTranscurridos : 0;

  const mayorGastoImpulso =
    transaccionesMes
      .filter((t) => t.es_impulso)
      .sort((a, b) => b.monto - a.monto)[0] ?? null;

  const porSemana = new Map<number, number>();
  for (const t of transaccionesMes) {
    const dia = Number(t.fecha.slice(8, 10));
    const semana = Math.ceil(dia / 7);
    porSemana.set(semana, (porSemana.get(semana) ?? 0) + t.monto);
  }
  const entradas = Array.from(porSemana.entries()).map(([semana, monto]) => ({ semana, monto }));
  const mejorSemana = entradas.length > 0 ? entradas.reduce((min, e) => (e.monto < min.monto ? e : min)) : null;
  const peorSemana = entradas.length > 0 ? entradas.reduce((max, e) => (e.monto > max.monto ? e : max)) : null;

  return { promedioDiario, mayorGastoImpulso, mejorSemana, peorSemana };
}

type CategoriaTotales = { nombre: string; monto: number };

/**
 * Reportes narrativos (4.20) + Comparación Inteligente (4.25): siempre
 * consigo mismo en el tiempo, nunca contra otras personas.
 */
export function generarReporteNarrativo(input: {
  totalActual: number;
  totalAnterior: number;
  porCategoriaActual: CategoriaTotales[];
  porCategoriaAnterior: CategoriaTotales[];
  pctImpulsoActual: number;
  pctImpulsoAnterior: number | null;
}): string | null {
  const { totalActual, totalAnterior, porCategoriaActual, porCategoriaAnterior, pctImpulsoActual, pctImpulsoAnterior } =
    input;

  if (totalAnterior === 0) return null;

  const frases: string[] = [];
  const variacionTotal = Math.round(((totalActual - totalAnterior) / totalAnterior) * 100);

  frases.push(
    variacionTotal <= 0
      ? `Este mes mejoraste respecto al anterior: gastaste ${Math.abs(variacionTotal)}% menos.`
      : `Este mes gastaste ${variacionTotal}% más que el anterior.`
  );

  let mayorCambio: { nombre: string; pct: number } | null = null;
  for (const cat of porCategoriaActual) {
    const anterior = porCategoriaAnterior.find((c) => c.nombre === cat.nombre);
    if (!anterior || anterior.monto === 0) continue;
    const pct = Math.round(((cat.monto - anterior.monto) / anterior.monto) * 100);
    if (!mayorCambio || Math.abs(pct) > Math.abs(mayorCambio.pct)) {
      mayorCambio = { nombre: cat.nombre, pct };
    }
  }
  if (mayorCambio && mayorCambio.pct !== 0) {
    frases.push(
      `${mayorCambio.pct <= 0 ? 'Disminuiste' : 'Aumentaste'} los gastos en ${mayorCambio.nombre.toLowerCase()} un ${Math.abs(mayorCambio.pct)}%.`
    );
  }

  if (pctImpulsoAnterior !== null && pctImpulsoActual !== pctImpulsoAnterior) {
    frases.push(
      `${pctImpulsoActual > pctImpulsoAnterior ? 'Sin embargo, aumentaron' : 'Además, disminuyeron'} los gastos por impulso frente al mes anterior.`
    );
  }

  return frases.join(' ');
}
