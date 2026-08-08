import type { Transaccion } from '../types';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Minutos estimados que ahorra cada compra de "comodidad" (heurística ilustrativa, no medida real)
const MINUTOS_COMODIDAD: Record<string, number> = {
  Comida: 35,
  Transporte: 20,
  Ocio: 15,
};

export function calcularCostoDesorden(transaccionesMes: Transaccion[]): number {
  return transaccionesMes.filter((t) => t.es_impulso).reduce((s, t) => s + t.monto, 0);
}

export function calcularCostoComodidad(
  transaccionesImpulsoMes: Transaccion[],
  nombreCategoria: (id: number | null) => string
): { monto: number; minutosEstimados: number; detalle: { categoria: string; monto: number; minutos: number }[] } {
  const categorias = new Map<string, { monto: number; minutos: number }>();
  for (const t of transaccionesImpulsoMes) {
    const nombre = nombreCategoria(t.categoria_id);
    const minutosPorCompra = MINUTOS_COMODIDAD[nombre];
    if (!minutosPorCompra) continue;
    const actual = categorias.get(nombre) ?? { monto: 0, minutos: 0 };
    categorias.set(nombre, { monto: actual.monto + t.monto, minutos: actual.minutos + minutosPorCompra });
  }
  const detalle = Array.from(categorias.entries())
    .map(([categoria, v]) => ({ categoria, monto: v.monto, minutos: v.minutos }))
    .sort((a, b) => b.monto - a.monto);
  return {
    monto: detalle.reduce((s, d) => s + d.monto, 0),
    minutosEstimados: detalle.reduce((s, d) => s + d.minutos, 0),
    detalle,
  };
}

export function diaSemanaDeMayorGasto(transacciones: Transaccion[]): { dia: string; monto: number } | null {
  if (transacciones.length === 0) return null;
  const totales = new Map<number, number>();
  for (const t of transacciones) {
    const dia = new Date(t.fecha + 'T00:00:00').getDay();
    totales.set(dia, (totales.get(dia) ?? 0) + t.monto);
  }
  const [dia, monto] = Array.from(totales.entries()).sort((a, b) => b[1] - a[1])[0];
  return { dia: DIAS_SEMANA[dia], monto };
}

export function categoriasRecurrentes(
  transacciones: Transaccion[],
  nombreCategoria: (id: number | null) => string,
  minRepeticiones = 3
): { nombre: string; conteo: number }[] {
  const conteos = new Map<string, number>();
  for (const t of transacciones) {
    const nombre = nombreCategoria(t.categoria_id);
    conteos.set(nombre, (conteos.get(nombre) ?? 0) + 1);
  }
  return Array.from(conteos.entries())
    .filter(([, conteo]) => conteo >= minRepeticiones)
    .map(([nombre, conteo]) => ({ nombre, conteo }))
    .sort((a, b) => b.conteo - a.conteo);
}

export function evolucionImpulsividad(
  transaccionesMesActual: Transaccion[],
  transaccionesMesAnterior: Transaccion[]
): { pctActual: number; pctAnterior: number; delta: number | null } {
  const pct = (ts: Transaccion[]) => {
    const total = ts.reduce((s, t) => s + t.monto, 0);
    if (total === 0) return 0;
    const impulso = ts.filter((t) => t.es_impulso).reduce((s, t) => s + t.monto, 0);
    return Math.round((impulso / total) * 100);
  };
  const pctActual = pct(transaccionesMesActual);
  const pctAnterior = pct(transaccionesMesAnterior);
  const huboMesAnterior = transaccionesMesAnterior.length > 0;
  return { pctActual, pctAnterior, delta: huboMesAnterior ? pctActual - pctAnterior : null };
}

type EntradaInsight = {
  franjaRiesgo: { franja: string; conteo: number } | null;
  diaMayorGasto: { dia: string; monto: number } | null;
  evolucion: { pctActual: number; pctAnterior: number; delta: number | null };
};

/**
 * Antion Insights (4.18): aprendizaje 100% local basado en reglas sobre los
 * propios datos del usuario — no hay modelo de IA externo en el MVP.
 */
export function generarInsightSemanal(input: EntradaInsight): string | null {
  const { franjaRiesgo, diaMayorGasto, evolucion } = input;
  const frases: string[] = [];

  if (franjaRiesgo && franjaRiesgo.conteo >= 2) {
    frases.push(`La mayoría de tus gastos impulsivos ocurrieron en la franja de ${franjaRiesgo.franja.split(' (')[0].toLowerCase()}.`);
  }

  if (diaMayorGasto) {
    frases.push(`${diaMayorGasto.dia} fue tu día de mayor gasto este mes.`);
  }

  if (evolucion.delta !== null && evolucion.delta !== 0) {
    frases.push(
      `Tu proporción de gasto por impulso ${evolucion.delta > 0 ? 'subió' : 'bajó'} ${Math.abs(evolucion.delta)} puntos frente al mes anterior.`
    );
  }

  if (frases.length === 0) return null;
  return frases.join(' ');
}
