import { calcularSaludFinanciera } from '../saludFinanciera';
import type { Deuda, Meta } from '../../types';

describe('Funciones de salud financiera (saludFinanciera.ts)', () => {
  describe('calcularSaludFinanciera', () => {
    it('debe devolver un 100% perfecto si todo está perfecto', () => {
      const input = {
        indiceDisciplina: 100,
        metas: [],
        deudasActivas: [],
        deudaTotalPendiente: 0,
        ingresoMensual: 5000,
        gastoMesActual: 1000,
        ahorroTotal: 5000,
        ahora: new Date('2024-10-15T12:00:00Z'),
      };
      const resultado = calcularSaludFinanciera(input);
      expect(resultado.indice).toBeGreaterThanOrEqual(90); // (50 ahorro + 100 deudas + 100 disciplina + 100 estab + 100 fondo) / 5 = 90
    });

    it('debe calcular valores muy bajos si hay mucha deuda, no hay disciplina, y se ha sobregastado', () => {
      const input = {
        indiceDisciplina: 10,
        metas: [
          { id: 1, monto_objetivo: 1000, monto_actual: 0 } as Meta
        ],
        deudasActivas: [
          { id: 1, saldo_pendiente: 10000, fecha_proxima_cuota: '2020-01-01' } as Deuda
        ],
        deudaTotalPendiente: 10000,
        ingresoMensual: 1000,
        gastoMesActual: 2000,
        ahorroTotal: 0,
        ahora: new Date('2024-10-15T12:00:00Z'),
      };

      const resultado = calcularSaludFinanciera(input);
      // Disciplina: 10
      // Ahorro: 0
      // Estabilidad: 0 (gastó 2000 teniendo 1000)
      // Deuda: clamp(100 - (10000 / 6000) * 100) = 0. alDia: 0. Total = 0
      // Fondo: 0
      // Promedio = 10 / 5 = 2.
      expect(resultado.indice).toBe(2);
      expect(resultado.recomendacion.componente).toBe('ahorro'); // es el primero con menor score (0)
    });
  });
});
