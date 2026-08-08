import type { Deuda, Meta } from '../types';
import { fechaISO } from './finance';

export type ComponenteSalud = {
  clave: 'ahorro' | 'deudas' | 'disciplina' | 'estabilidad' | 'fondoEmergencia';
  etiqueta: string;
  valor: number;
};

export type ResultadoSaludFinanciera = {
  indice: number;
  componentes: ComponenteSalud[];
  recomendacion: { texto: string; componente: string | null; impactoEstimado: number | null };
};

function clamp(valor: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, valor));
}

type EntradaSalud = {
  indiceDisciplina: number;
  metas: Meta[];
  deudasActivas: Deuda[];
  deudaTotalPendiente: number;
  ingresoMensual: number;
  gastoMesActual: number;
  ahorroTotal: number;
  ahora?: Date;
};

export function calcularSaludFinanciera(input: EntradaSalud): ResultadoSaludFinanciera {
  const { indiceDisciplina, metas, deudasActivas, deudaTotalPendiente, ingresoMensual, gastoMesActual, ahorroTotal } =
    input;
  const ahora = input.ahora ?? new Date();
  const hoy = fechaISO(ahora);

  // Ahorro: progreso promedio de las metas
  const ahorro =
    metas.length === 0
      ? 50
      : clamp(
          metas.reduce((s, m) => s + clamp(m.monto_objetivo > 0 ? (m.monto_actual / m.monto_objetivo) * 100 : 0), 0) /
            metas.length
        );

  // Deudas: nivel relativo al ingreso + cumplimiento de pagos
  let deudas: number;
  if (deudaTotalPendiente === 0) {
    deudas = 100;
  } else {
    const nivelRelativo = ingresoMensual > 0 ? clamp(100 - (deudaTotalPendiente / (ingresoMensual * 6)) * 100) : 30;
    const alDia =
      deudasActivas.length === 0
        ? 100
        : clamp(
            (deudasActivas.filter((d) => !d.fecha_proxima_cuota || d.fecha_proxima_cuota >= hoy).length /
              deudasActivas.length) *
              100
          );
    deudas = Math.round((nivelRelativo + alDia) / 2);
  }

  // Disciplina: viene directo del motor de disciplina (4.11)
  const disciplina = clamp(indiceDisciplina);

  // Estabilidad: consistencia entre ingreso y gasto del mes
  const estabilidad =
    ingresoMensual === 0
      ? 20
      : clamp(100 - Math.max(0, ((gastoMesActual - ingresoMensual) / ingresoMensual) * 100));

  // Fondo de emergencia: meses de gasto cubiertos por el ahorro total (meta: 3 meses = 100%)
  const mesesCubiertos = gastoMesActual > 0 ? ahorroTotal / gastoMesActual : ahorroTotal > 0 ? 3 : 0;
  const fondoEmergencia = clamp((mesesCubiertos / 3) * 100);

  const componentes: ComponenteSalud[] = [
    { clave: 'ahorro', etiqueta: 'Ahorro', valor: Math.round(ahorro) },
    { clave: 'deudas', etiqueta: 'Deudas', valor: Math.round(deudas) },
    { clave: 'disciplina', etiqueta: 'Disciplina', valor: Math.round(disciplina) },
    { clave: 'estabilidad', etiqueta: 'Estabilidad', valor: Math.round(estabilidad) },
    { clave: 'fondoEmergencia', etiqueta: 'Fondo de emergencia', valor: Math.round(fondoEmergencia) },
  ];

  const indice = Math.round(componentes.reduce((s, c) => s + c.valor, 0) / componentes.length);

  const mejorable = componentes
    .filter((c) => c.valor < 100)
    .sort((a, b) => a.valor - b.valor)[0];

  let recomendacion: ResultadoSaludFinanciera['recomendacion'];
  if (!mejorable) {
    recomendacion = { texto: 'Todos tus componentes están al máximo. Sigue así.', componente: null, impactoEstimado: null };
  } else {
    const nuevoValor = Math.min(100, mejorable.valor + 20);
    const nuevosComponentes = componentes.map((c) => (c.clave === mejorable.clave ? { ...c, valor: nuevoValor } : c));
    const nuevoIndice = Math.round(nuevosComponentes.reduce((s, c) => s + c.valor, 0) / nuevosComponentes.length);
    recomendacion = {
      texto: `Mejorar ${mejorable.etiqueta.toLowerCase()} aumentaría tu salud financiera a ${nuevoIndice}%.`,
      componente: mejorable.clave,
      impactoEstimado: nuevoIndice - indice,
    };
  }

  return { indice, componentes, recomendacion };
}
