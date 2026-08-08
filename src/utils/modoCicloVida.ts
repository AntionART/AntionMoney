export type ModoCicloVidaTipo = 'supervivencia' | 'recuperacion' | 'construccion' | 'normal';

export type ResultadoModoCicloVida = {
  modo: ModoCicloVidaTipo;
  causa: string;
};

type EntradaModo = {
  saludIndice: number;
  deudaTotalPendiente: number;
  ingresoMensual: number;
  deudasEnMora: number;
};

/**
 * Modos de ciclo de vida (4.17): reglas objetivas sobre señales que ya
 * calculamos (Salud Financiera, deuda relativa al ingreso, mora). Es una
 * aproximación heurística — no un diagnóstico financiero profesional.
 */
export function determinarModoCicloVida(input: EntradaModo): ResultadoModoCicloVida {
  const { saludIndice, deudaTotalPendiente, ingresoMensual, deudasEnMora } = input;

  if (deudasEnMora > 0) {
    return { modo: 'supervivencia', causa: `Tienes ${deudasEnMora} deuda${deudasEnMora === 1 ? '' : 's'} con el pago atrasado.` };
  }

  if (ingresoMensual > 0 && deudaTotalPendiente > ingresoMensual * 3) {
    return { modo: 'supervivencia', causa: 'Tu deuda supera 3 meses de tu ingreso.' };
  }

  if (saludIndice < 20) {
    return { modo: 'supervivencia', causa: 'Tu Salud Financiera está en rango crítico.' };
  }

  if (saludIndice >= 80 && deudaTotalPendiente === 0) {
    return { modo: 'construccion', causa: 'Estabilidad probada: sin deudas y Salud Financiera alta.' };
  }

  if (deudaTotalPendiente > 0 && ingresoMensual > 0 && deudaTotalPendiente <= ingresoMensual && saludIndice >= 40) {
    return { modo: 'recuperacion', causa: 'Tu deuda ya es manejable frente a tu ingreso.' };
  }

  return { modo: 'normal', causa: '' };
}

export const ETIQUETA_MODO: Record<ModoCicloVidaTipo, string> = {
  supervivencia: 'Modo Supervivencia',
  recuperacion: 'Modo Recuperación',
  construccion: 'Modo Construcción',
  normal: 'Normal',
};

export const SUGERENCIA_MODO: Record<ModoCicloVidaTipo, string> = {
  supervivencia: 'Se desactiva cuando pongas al día tus deudas y tu Salud Financiera salga del rango crítico.',
  recuperacion: 'Pasarás a Construcción cuando termines de pagar tu deuda y sostengas una Salud Financiera alta.',
  construccion: 'Se mantiene mientras sigas sin deudas y con una Salud Financiera alta y sostenida.',
  normal: '',
};
