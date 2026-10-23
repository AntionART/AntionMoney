import { generarMensajeDelDia } from '../mensajesAntion';

describe('Funciones de mensajes (mensajesAntion.ts)', () => {
  describe('generarMensajeDelDia', () => {
    it('debe devolver un mensaje neutral si no hay ingreso configurado', () => {
      const ctx = {
        disponibleHoy: 100,
        ingresoConfigurado: false,
        pagosProximos: 0,
        tentacionesDisponibles: 0,
        gastosImpulsoHoy: 0,
      };
      const resultado = generarMensajeDelDia(ctx);
      expect(resultado.tono).toBe('neutral');
      expect(resultado.texto).toMatch(/Configura tu ingreso/);
    });

    it('debe devolver alerta si el disponible hoy es menor a cero', () => {
      const ctx = {
        disponibleHoy: -50,
        ingresoConfigurado: true,
        pagosProximos: 0,
        tentacionesDisponibles: 0,
        gastosImpulsoHoy: 0,
      };
      const resultado = generarMensajeDelDia(ctx);
      expect(resultado.tono).toBe('alerta');
      expect(resultado.texto).toMatch(/superaste tu disponible/);
    });

    it('debe devolver neutral informando de pausas disponibles', () => {
      const ctx = {
        disponibleHoy: 100,
        ingresoConfigurado: true,
        pagosProximos: 0,
        tentacionesDisponibles: 2,
        gastosImpulsoHoy: 0,
      };
      const resultado = generarMensajeDelDia(ctx);
      expect(resultado.tono).toBe('neutral');
      expect(resultado.texto).toMatch(/pausas/);
    });

    it('debe devolver logro si no hay pausas, ni pagos y no hay gastos por impulso hoy', () => {
      const ctx = {
        disponibleHoy: 100,
        ingresoConfigurado: true,
        pagosProximos: 0,
        tentacionesDisponibles: 0,
        gastosImpulsoHoy: 0,
      };
      const resultado = generarMensajeDelDia(ctx);
      expect(resultado.tono).toBe('logro');
      expect(resultado.texto).toMatch(/Vas bien/);
    });

    it('debe devolver neutral por defecto si hay gastos por impulso pero no se superan pausas ni disponibles negativos', () => {
      const ctx = {
        disponibleHoy: 100,
        ingresoConfigurado: true,
        pagosProximos: 0,
        tentacionesDisponibles: 0,
        gastosImpulsoHoy: 1,
      };
      const resultado = generarMensajeDelDia(ctx);
      expect(resultado.tono).toBe('neutral');
      expect(resultado.texto).toMatch(/Sigue registrando/);
    });
  });
});
