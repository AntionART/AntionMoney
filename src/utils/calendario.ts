import type { Deuda, GastoRecurrente, HitoMemoriaFinanciera, Meta } from '../types';
import { fechaISO, diasEnMes } from './finance';

export type EventoCalendario = {
  id: string;
  fecha: string;
  titulo: string;
  tipo: 'pago_deuda' | 'gasto_recurrente' | 'meta_fecha_limite' | 'cumpleanos_financiero';
  monto: number | null;
};

function fechaDiaDelMes(anio: number, mes: number, dia: number): string {
  const diaClamp = Math.min(dia, diasEnMes(new Date(anio, mes, 1)));
  return fechaISO(new Date(anio, mes, diaClamp));
}

export function generarEventosCalendario(
  deudasActivas: Deuda[],
  recurrentesActivos: GastoRecurrente[],
  metasActivas: Meta[],
  hitosCumpleanos: HitoMemoriaFinanciera[],
  ahora: Date,
  diasAdelante = 60
): EventoCalendario[] {
  const hoy = fechaISO(ahora);
  const limite = fechaISO(new Date(ahora.getTime() + diasAdelante * 24 * 60 * 60 * 1000));
  const eventos: EventoCalendario[] = [];

  for (const d of deudasActivas) {
    if (d.fecha_proxima_cuota && d.fecha_proxima_cuota >= hoy && d.fecha_proxima_cuota <= limite) {
      eventos.push({
        id: `deuda-${d.id}`,
        fecha: d.fecha_proxima_cuota,
        titulo: `Pago: ${d.nombre}`,
        tipo: 'pago_deuda',
        monto: Math.round(d.monto_total / d.numero_cuotas),
      });
    }
  }

  for (const r of recurrentesActivos) {
    for (let offset = 0; offset <= 2; offset++) {
      const mesObjetivo = new Date(ahora.getFullYear(), ahora.getMonth() + offset, 1);
      const fecha = fechaDiaDelMes(mesObjetivo.getFullYear(), mesObjetivo.getMonth(), r.dia_del_mes);
      if (fecha >= hoy && fecha <= limite) {
        eventos.push({
          id: `recurrente-${r.id}-${fecha}`,
          fecha,
          titulo: r.nombre,
          tipo: 'gasto_recurrente',
          monto: r.monto,
        });
      }
    }
  }

  for (const m of metasActivas) {
    if (m.fecha_limite && m.fecha_limite >= hoy && m.fecha_limite <= limite) {
      eventos.push({
        id: `meta-${m.id}`,
        fecha: m.fecha_limite,
        titulo: `Fecha límite: ${m.nombre}`,
        tipo: 'meta_fecha_limite',
        monto: m.monto_objetivo - m.monto_actual,
      });
    }
  }

  for (const h of hitosCumpleanos) {
    const [, mes, dia] = h.fecha.split('-').map(Number);
    for (const anio of [ahora.getFullYear(), ahora.getFullYear() + 1]) {
      const fecha = fechaDiaDelMes(anio, mes - 1, dia);
      if (fecha >= hoy && fecha <= limite && fecha !== h.fecha) {
        eventos.push({
          id: `cumpleanos-${h.id}-${anio}`,
          fecha,
          titulo: `Aniversario: ${h.titulo}`,
          tipo: 'cumpleanos_financiero',
          monto: null,
        });
      }
    }
  }

  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
