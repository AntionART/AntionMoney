export type Categoria = {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  tipo: 'gasto' | 'ahorro';
};

export type Transaccion = {
  id: number;
  cuenta_id: number | null;
  monto: number;
  moneda: string;
  categoria_id: number | null;
  nota: string;
  fecha: string;
  hora: string;
  es_impulso: number;
  created_at: string;
  gasto_recurrente_id: number | null;
  contexto_emocional: string | null;
};

export type Usuario = {
  id: number;
  nombre: string;
  ingreso_mensual: number;
  moneda_principal: string;
  modo_tema: 'claro' | 'oscuro';
  proposito_principal: string;
  recordatorio_diario_activo: number;
  recordatorio_diario_hora: number;
  recordatorio_notification_id: string | null;
  onboarding_completado: number;
};

export type Meta = {
  id: number;
  nombre: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_limite: string | null;
  estado: 'activa' | 'cumplida';
  prioridad: number;
  created_at: string;
};

export type AporteMeta = {
  id: number;
  meta_id: number;
  monto: number;
  fecha: string;
};

export type TentacionPendiente = {
  id: number;
  descripcion: string;
  monto_estimado: number;
  fecha_creacion: string;
  fecha_disponible: string;
  resuelto: number;
  notification_id: string | null;
};

export type Deuda = {
  id: number;
  nombre: string;
  monto_total: number;
  saldo_pendiente: number;
  contraparte: string;
  tasa_interes: number | null;
  numero_cuotas: number;
  fecha_proxima_cuota: string | null;
  en_mora: number;
  afecta_disponible: number;
  estado: 'activa' | 'pagada';
  created_at: string;
};

export type PagoDeuda = {
  id: number;
  deuda_id: number;
  monto: number;
  fecha: string;
};

export type GastoRecurrente = {
  id: number;
  nombre: string;
  monto: number;
  categoria_id: number | null;
  dia_del_mes: number;
  activo: number;
  afecta_disponible: number;
  created_at: string;
};

export type IndiceDisciplinaHistorial = {
  id: number;
  fecha: string;
  valor: number;
  desglose_json: string;
};

export type SaludFinancieraHistorial = {
  id: number;
  fecha: string;
  valor: number;
  desglose_json: string;
};

export type ModoCicloVida = {
  id: number;
  modo: 'supervivencia' | 'recuperacion' | 'construccion' | 'normal';
  causa: string;
  fecha_activacion: string;
  fecha_desactivacion: string | null;
};

export type HitoMemoriaFinanciera = {
  id: number;
  titulo: string;
  descripcion: string;
  monto: number | null;
  fecha: string;
  generado_automaticamente: number;
  es_cumpleanos_financiero: number;
};

export type DiarioFinancieroEntrada = {
  id: number;
  fecha: string;
  como_estuvo: 'excelente' | 'normal' | 'dificil';
  motivo: string;
  motivo_texto_libre: string;
};
