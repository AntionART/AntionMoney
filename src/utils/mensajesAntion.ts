type ContextoMensaje = {
  disponibleHoy: number;
  ingresoConfigurado: boolean;
  pagosProximos: number;
  tentacionesDisponibles: number;
  gastosImpulsoHoy: number;
};

export function generarMensajeDelDia(ctx: ContextoMensaje): { texto: string; tono: 'alerta' | 'logro' | 'neutral' } {
  if (!ctx.ingresoConfigurado) {
    return {
      texto: 'Configura tu ingreso mensual para que pueda calcular tu disponible con precisión.',
      tono: 'neutral',
    };
  }

  if (ctx.disponibleHoy < 0) {
    return {
      texto: 'Hoy superaste tu disponible. Revisa qué lo causó antes de que se repita.',
      tono: 'alerta',
    };
  }

  if (ctx.tentacionesDisponibles > 0) {
    return {
      texto: `Tienes ${ctx.tentacionesDisponibles} pausa${ctx.tentacionesDisponibles === 1 ? '' : 's'} de 24h lista${ctx.tentacionesDisponibles === 1 ? '' : 's'} para decidir.`,
      tono: 'neutral',
    };
  }

  if (ctx.pagosProximos > 0) {
    return {
      texto: `Tienes ${ctx.pagosProximos} pago${ctx.pagosProximos === 1 ? '' : 's'} próximo${ctx.pagosProximos === 1 ? '' : 's'} esta semana. Revísalo en Deudas.`,
      tono: 'neutral',
    };
  }

  if (ctx.gastosImpulsoHoy === 0) {
    return {
      texto: 'Vas bien. Ningún gasto por impulso hoy.',
      tono: 'logro',
    };
  }

  return {
    texto: 'Sigue registrando cada gasto para mantener una foto clara de tus finanzas.',
    tono: 'neutral',
  };
}
