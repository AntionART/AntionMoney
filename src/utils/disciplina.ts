import type { AporteMeta, Deuda, Transaccion } from '../types';
import { diasEnMes, fechaISO } from './finance';

export type EstadoDisciplina = 'En control' | 'Estable' | 'Atención' | 'Zona de riesgo' | 'Crítico';

export type FactorDisciplina = {
  clave: 'registro' | 'presupuesto' | 'impulsos' | 'deudas' | 'racha' | 'ahorro';
  etiqueta: string;
  valor: number;
};

export type ResultadoDisciplina = {
  indice: number;
  estado: EstadoDisciplina;
  factores: FactorDisciplina[];
  rachaRegistro: number;
  rachaPresupuesto: number;
};

export function estadoDesdeIndice(indice: number): EstadoDisciplina {
  if (indice >= 80) return 'En control';
  if (indice >= 60) return 'Estable';
  if (indice >= 40) return 'Atención';
  if (indice >= 20) return 'Zona de riesgo';
  return 'Crítico';
}

function clamp(valor: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, valor));
}

function historialDisponibleDiario(
  transaccionesMes: Transaccion[],
  ingresoMensual: number,
  ahora: Date
): number[] {
  const totalDias = diasEnMes(ahora);
  const diaActual = ahora.getDate();
  const gastoPorDia = new Map<number, number>();
  for (const t of transaccionesMes) {
    const dia = Number(t.fecha.slice(8, 10));
    gastoPorDia.set(dia, (gastoPorDia.get(dia) ?? 0) + t.monto);
  }
  const disponiblePorDia: number[] = [];
  let acumulado = 0;
  for (let d = 1; d <= diaActual; d++) {
    acumulado += gastoPorDia.get(d) ?? 0;
    disponiblePorDia.push((ingresoMensual / totalDias) * d - acumulado);
  }
  return disponiblePorDia;
}

function rachaDesdeConjuntoFechas(fechasConRegistro: Set<string>, ahora: Date): number {
  let racha = 0;
  const cursor = new Date(ahora);
  while (racha < 365 && fechasConRegistro.has(fechaISO(cursor))) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

export function calcularRachaSinImpulso(fechasConImpulso: Set<string>, ahora: Date, maxDias = 365): number {
  let racha = 0;
  const cursor = new Date(ahora);
  while (racha < maxDias && !fechasConImpulso.has(fechaISO(cursor))) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

type EntradaCalculoDisciplina = {
  transaccionesUltimos30Dias: Transaccion[];
  transaccionesMes: Transaccion[];
  ingresoMensual: number;
  deudasActivas: Deuda[];
  aportesUltimos28Dias: AporteMeta[];
  tieneMetas: boolean;
  ahora: Date;
};

export function calcularIndiceDisciplina(input: EntradaCalculoDisciplina): ResultadoDisciplina {
  const {
    transaccionesUltimos30Dias,
    transaccionesMes,
    ingresoMensual,
    deudasActivas,
    aportesUltimos28Dias,
    tieneMetas,
    ahora,
  } = input;

  // Factor 1 — registrar consistentemente
  const fechasConRegistro = new Set(transaccionesUltimos30Dias.map((t) => t.fecha));
  const factorRegistro = clamp((fechasConRegistro.size / 30) * 100);

  // Factor 2 — respetar presupuesto
  const disponibleDiario = historialDisponibleDiario(transaccionesMes, ingresoMensual, ahora);
  const diasDentroPresupuesto = disponibleDiario.filter((d) => d >= 0).length;
  const factorPresupuesto = clamp((diasDentroPresupuesto / disponibleDiario.length) * 100);

  // Factor 3 — evitar impulsos
  const gastoTotal30d = transaccionesUltimos30Dias.reduce((s, t) => s + t.monto, 0);
  const gastoImpulso30d = transaccionesUltimos30Dias.filter((t) => t.es_impulso).reduce((s, t) => s + t.monto, 0);
  const factorImpulsos = gastoTotal30d === 0 ? 100 : clamp(100 - (gastoImpulso30d / gastoTotal30d) * 100);

  // Factor 4 — pagar deudas a tiempo
  const hoy = fechaISO(ahora);
  const factorDeudas =
    deudasActivas.length === 0
      ? 100
      : clamp(
          (deudasActivas.filter((d) => !d.fecha_proxima_cuota || d.fecha_proxima_cuota >= hoy).length /
            deudasActivas.length) *
            100
        );

  // Factor 5 — mantener rachas (racha de registro diario)
  const rachaRegistro = rachaDesdeConjuntoFechas(fechasConRegistro, ahora);
  const factorRacha = clamp((rachaRegistro / 10) * 100);

  // Factor 6 — ahorrar constantemente (aportes en las últimas 4 semanas)
  let factorAhorro: number;
  if (!tieneMetas) {
    factorAhorro = 50;
  } else {
    const semanasConAporte = new Set<number>();
    for (const a of aportesUltimos28Dias) {
      const dias = Math.floor((ahora.getTime() - new Date(a.fecha).getTime()) / (1000 * 60 * 60 * 24));
      semanasConAporte.add(Math.floor(dias / 7));
    }
    factorAhorro = clamp((semanasConAporte.size / 4) * 100);
  }

  const factores: FactorDisciplina[] = [
    { clave: 'registro', etiqueta: 'Registro consistente', valor: Math.round(factorRegistro) },
    { clave: 'presupuesto', etiqueta: 'Respeto al presupuesto', valor: Math.round(factorPresupuesto) },
    { clave: 'impulsos', etiqueta: 'Control de impulsos', valor: Math.round(factorImpulsos) },
    { clave: 'deudas', etiqueta: 'Pagos de deuda al día', valor: Math.round(factorDeudas) },
    { clave: 'racha', etiqueta: 'Constancia diaria', valor: Math.round(factorRacha) },
    { clave: 'ahorro', etiqueta: 'Ahorro constante', valor: Math.round(factorAhorro) },
  ];

  const indice = Math.round(factores.reduce((s, f) => s + f.valor, 0) / factores.length);

  // Racha de días consecutivos sin romper presupuesto (dentro del mes actual)
  let rachaPresupuesto = 0;
  for (let i = disponibleDiario.length - 1; i >= 0; i--) {
    if (disponibleDiario[i] >= 0) rachaPresupuesto++;
    else break;
  }

  return {
    indice,
    estado: estadoDesdeIndice(indice),
    factores,
    rachaRegistro,
    rachaPresupuesto,
  };
}

const FRANJAS = [
  { nombre: 'Madrugada (00:00–05:59)', desde: 0, hasta: 5 },
  { nombre: 'Mañana (06:00–11:59)', desde: 6, hasta: 11 },
  { nombre: 'Tarde (12:00–17:59)', desde: 12, hasta: 17 },
  { nombre: 'Noche (18:00–23:59)', desde: 18, hasta: 23 },
];

export function franjaHoraria(hora: string): string {
  const h = Number(hora.slice(0, 2));
  return FRANJAS.find((f) => h >= f.desde && h <= f.hasta)?.nombre ?? 'Sin datos';
}

export function categoriaDeMayorRiesgo(
  transaccionesImpulso: Transaccion[],
  nombreCategoria: (id: number | null) => string
): { nombre: string; monto: number } | null {
  if (transaccionesImpulso.length === 0) return null;
  const totales = new Map<string, number>();
  for (const t of transaccionesImpulso) {
    const nombre = nombreCategoria(t.categoria_id);
    totales.set(nombre, (totales.get(nombre) ?? 0) + t.monto);
  }
  const [nombre, monto] = Array.from(totales.entries()).sort((a, b) => b[1] - a[1])[0];
  return { nombre, monto };
}

export function franjaDeMayorRiesgo(transaccionesImpulso: Transaccion[]): { franja: string; conteo: number } | null {
  if (transaccionesImpulso.length === 0) return null;
  const conteos = new Map<string, number>();
  for (const t of transaccionesImpulso) {
    const franja = franjaHoraria(t.hora);
    conteos.set(franja, (conteos.get(franja) ?? 0) + 1);
  }
  const [franja, conteo] = Array.from(conteos.entries()).sort((a, b) => b[1] - a[1])[0];
  return { franja, conteo };
}
