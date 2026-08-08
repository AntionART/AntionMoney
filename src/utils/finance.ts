export function diasEnMes(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
}

/**
 * Lo que queda del ingreso mensual (menos lo ya gastado) repartido entre
 * los días que faltan del mes, incluyendo hoy.
 */
export function calcularDisponibleHoy(
  ingresoMensual: number,
  gastoAcumuladoMes: number,
  fecha: Date = new Date()
): number {
  const totalDias = diasEnMes(fecha);
  const diaActual = fecha.getDate();
  const diasRestantes = totalDias - diaActual + 1;
  const presupuestoRestante = ingresoMensual - gastoAcumuladoMes;
  return presupuestoRestante / diasRestantes;
}

export function formatoMoneda(monto: number, moneda: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}

export function fechaISO(fecha: Date = new Date()): string {
  return fecha.toISOString().slice(0, 10);
}

export function horaISO(fecha: Date = new Date()): string {
  return fecha.toTimeString().slice(0, 8);
}

export function mesPrefijo(fecha: Date = new Date()): string {
  return fechaISO(fecha).slice(0, 7);
}

export function mesAnteriorPrefijo(fecha: Date = new Date()): string {
  return mesPrefijo(new Date(fecha.getFullYear(), fecha.getMonth() - 1, 1));
}

export function nombreMes(prefijoYYYYMM: string): string {
  const [anio, mes] = prefijoYYYYMM.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, 1);
  const nombre = fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export function hace7Dias(fecha: Date = new Date()): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() - 6);
  return resultado;
}

export function formatoCuentaRegresiva(fechaDisponible: Date, ahora: Date = new Date()): string {
  const ms = fechaDisponible.getTime() - ahora.getTime();
  if (ms <= 0) return 'Disponible';
  const horas = Math.floor(ms / (1000 * 60 * 60));
  const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (horas > 0) return `${horas}h ${minutos}m restantes`;
  return `${minutos}m restantes`;
}

export function sumarMesesISO(fechaISOStr: string, meses: number): string {
  const [anio, mes, dia] = fechaISOStr.split('-').map(Number);
  const fecha = new Date(anio, mes - 1 + meses, dia);
  return fechaISO(fecha);
}

export function diasHasta(fechaISOStr: string, ahora: Date = new Date()): number {
  const objetivo = new Date(fechaISOStr + 'T00:00:00');
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.round((objetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}
