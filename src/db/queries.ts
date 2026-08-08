import { getDb } from './client';
import { fechaISO } from '../utils/finance';
import type {
  AporteMeta,
  Deuda,
  DiarioFinancieroEntrada,
  GastoRecurrente,
  HitoMemoriaFinanciera,
  IndiceDisciplinaHistorial,
  Meta,
  ModoCicloVida,
  SaludFinancieraHistorial,
  Transaccion,
} from '../types';

export async function obtenerTransaccionesDelMes(prefijoYYYYMM: string): Promise<Transaccion[]> {
  const db = await getDb();
  return db.getAllAsync<Transaccion>(
    'SELECT * FROM transaccion WHERE fecha LIKE ? ORDER BY fecha DESC, hora DESC',
    [`${prefijoYYYYMM}%`]
  );
}

async function sumar(sql: string, params: unknown[]): Promise<number> {
  const db = await getDb();
  const fila = await db.getFirstAsync<{ total: number | null }>(sql, params as never[]);
  return fila?.total ?? 0;
}

export function obtenerTotalAhorroMetas(): Promise<number> {
  return sumar('SELECT SUM(monto_actual) as total FROM meta', []);
}

export function obtenerTotalDeudaPendiente(): Promise<number> {
  return sumar("SELECT SUM(saldo_pendiente) as total FROM deuda WHERE estado = 'activa'", []);
}

export function obtenerAportesDelMes(prefijoYYYYMM: string): Promise<number> {
  return sumar('SELECT SUM(monto) as total FROM aporte_meta WHERE fecha LIKE ?', [`${prefijoYYYYMM}%`]);
}

export function obtenerPagosDeudaDelMes(prefijoYYYYMM: string): Promise<number> {
  return sumar('SELECT SUM(monto) as total FROM pago_deuda WHERE fecha LIKE ?', [`${prefijoYYYYMM}%`]);
}

export function obtenerPagosDeudaDesde(fechaDesde: string): Promise<number> {
  return sumar('SELECT SUM(monto) as total FROM pago_deuda WHERE fecha >= ?', [fechaDesde]);
}

export function obtenerAportesDesde(fechaDesde: string): Promise<number> {
  return sumar('SELECT SUM(monto) as total FROM aporte_meta WHERE fecha >= ?', [fechaDesde]);
}

function fechaHaceDias(dias: number, ahora: Date = new Date()): string {
  const fecha = new Date(ahora);
  fecha.setDate(fecha.getDate() - dias);
  return fechaISO(fecha);
}

export async function obtenerTransaccionesUltimosDias(dias: number, ahora?: Date): Promise<Transaccion[]> {
  const db = await getDb();
  return db.getAllAsync<Transaccion>(
    'SELECT * FROM transaccion WHERE fecha >= ? ORDER BY fecha ASC, hora ASC',
    [fechaHaceDias(dias, ahora)]
  );
}

export async function obtenerAportesUltimosDias(dias: number, ahora?: Date): Promise<AporteMeta[]> {
  const db = await getDb();
  return db.getAllAsync<AporteMeta>('SELECT * FROM aporte_meta WHERE fecha >= ? ORDER BY fecha ASC', [
    fechaHaceDias(dias, ahora),
  ]);
}

export async function obtenerDeudasActivas(): Promise<Deuda[]> {
  const db = await getDb();
  return db.getAllAsync<Deuda>("SELECT * FROM deuda WHERE estado = 'activa'");
}

export async function obtenerTodasLasDeudas(): Promise<Deuda[]> {
  const db = await getDb();
  return db.getAllAsync<Deuda>('SELECT * FROM deuda');
}

export async function obtenerGastosRecurrentesActivos(): Promise<GastoRecurrente[]> {
  const db = await getDb();
  return db.getAllAsync<GastoRecurrente>('SELECT * FROM gasto_recurrente WHERE activo = 1');
}

export async function obtenerTieneMetas(): Promise<boolean> {
  const db = await getDb();
  const fila = await db.getFirstAsync('SELECT id FROM meta LIMIT 1');
  return fila !== null;
}

export async function obtenerUltimoGastoImpulso(): Promise<Transaccion | null> {
  const db = await getDb();
  const fila = await db.getFirstAsync<Transaccion>(
    'SELECT * FROM transaccion WHERE es_impulso = 1 ORDER BY fecha DESC, hora DESC LIMIT 1'
  );
  return fila ?? null;
}

export async function guardarSnapshotDisciplina(fecha: string, valor: number, desgloseJson: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO indice_disciplina_historial (fecha, valor, desglose_json) VALUES (?, ?, ?) ON CONFLICT(fecha) DO UPDATE SET valor = excluded.valor, desglose_json = excluded.desglose_json',
    [fecha, valor, desgloseJson]
  );
}

export async function obtenerHistorialDisciplina(dias: number, ahora?: Date): Promise<IndiceDisciplinaHistorial[]> {
  const db = await getDb();
  return db.getAllAsync<IndiceDisciplinaHistorial>(
    'SELECT * FROM indice_disciplina_historial WHERE fecha >= ? ORDER BY fecha ASC',
    [fechaHaceDias(dias, ahora)]
  );
}

export async function guardarSnapshotSalud(fecha: string, valor: number, desgloseJson: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO salud_financiera_historial (fecha, valor, desglose_json) VALUES (?, ?, ?) ON CONFLICT(fecha) DO UPDATE SET valor = excluded.valor, desglose_json = excluded.desglose_json',
    [fecha, valor, desgloseJson]
  );
}

export async function obtenerHistorialSalud(dias: number, ahora?: Date): Promise<SaludFinancieraHistorial[]> {
  const db = await getDb();
  return db.getAllAsync<SaludFinancieraHistorial>(
    'SELECT * FROM salud_financiera_historial WHERE fecha >= ? ORDER BY fecha ASC',
    [fechaHaceDias(dias, ahora)]
  );
}

export async function obtenerTodasLasMetas(): Promise<Meta[]> {
  const db = await getDb();
  return db.getAllAsync<Meta>('SELECT * FROM meta');
}

export async function obtenerAportesRecientesTodasMetas(dias: number, ahora?: Date): Promise<AporteMeta[]> {
  const db = await getDb();
  return db.getAllAsync<AporteMeta>('SELECT * FROM aporte_meta WHERE fecha >= ?', [fechaHaceDias(dias, ahora)]);
}

export async function obtenerModoCicloVidaActivo(): Promise<ModoCicloVida | null> {
  const db = await getDb();
  const fila = await db.getFirstAsync<ModoCicloVida>(
    'SELECT * FROM modo_ciclo_vida WHERE fecha_desactivacion IS NULL ORDER BY fecha_activacion DESC LIMIT 1'
  );
  return fila ?? null;
}

export async function registrarCambioModoCicloVida(
  modo: ModoCicloVida['modo'],
  causa: string,
  fecha: string
): Promise<void> {
  const db = await getDb();
  const activo = await obtenerModoCicloVidaActivo();
  if (activo && activo.modo === modo) return;
  if (activo) {
    await db.runAsync('UPDATE modo_ciclo_vida SET fecha_desactivacion = ? WHERE id = ?', [fecha, activo.id]);
  }
  await db.runAsync(
    'INSERT INTO modo_ciclo_vida (modo, causa, fecha_activacion) VALUES (?, ?, ?)',
    [modo, causa, fecha]
  );
}

export async function obtenerHitosMemoria(): Promise<HitoMemoriaFinanciera[]> {
  const db = await getDb();
  return db.getAllAsync<HitoMemoriaFinanciera>('SELECT * FROM hito_memoria_financiera ORDER BY fecha DESC');
}

export async function existeHito(titulo: string): Promise<boolean> {
  const db = await getDb();
  const fila = await db.getFirstAsync('SELECT id FROM hito_memoria_financiera WHERE titulo = ?', [titulo]);
  return fila !== null;
}

export async function crearHito(
  titulo: string,
  descripcion: string,
  monto: number | null,
  fecha: string,
  esCumpleanosFinanciero = false
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO hito_memoria_financiera (titulo, descripcion, monto, fecha, generado_automaticamente, es_cumpleanos_financiero) VALUES (?, ?, ?, ?, 1, ?)',
    [titulo, descripcion, monto, fecha, esCumpleanosFinanciero ? 1 : 0]
  );
}

export async function obtenerEntradaDiario(fecha: string): Promise<DiarioFinancieroEntrada | null> {
  const db = await getDb();
  const fila = await db.getFirstAsync<DiarioFinancieroEntrada>(
    'SELECT * FROM diario_financiero_entrada WHERE fecha = ?',
    [fecha]
  );
  return fila ?? null;
}

export async function obtenerEntradasDiario(dias: number, ahora?: Date): Promise<DiarioFinancieroEntrada[]> {
  const db = await getDb();
  return db.getAllAsync<DiarioFinancieroEntrada>(
    'SELECT * FROM diario_financiero_entrada WHERE fecha >= ? ORDER BY fecha DESC',
    [fechaHaceDias(dias, ahora)]
  );
}

export async function guardarEntradaDiario(
  fecha: string,
  comoEstuvo: DiarioFinancieroEntrada['como_estuvo'],
  motivo: string,
  motivoTextoLibre: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO diario_financiero_entrada (fecha, como_estuvo, motivo, motivo_texto_libre) VALUES (?, ?, ?, ?) ON CONFLICT(fecha) DO UPDATE SET como_estuvo = excluded.como_estuvo, motivo = excluded.motivo, motivo_texto_libre = excluded.motivo_texto_libre',
    [fecha, comoEstuvo, motivo, motivoTextoLibre]
  );
}
