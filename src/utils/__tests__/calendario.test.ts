import { generarEventosCalendario } from '../calendario';
import type { Deuda, GastoRecurrente, HitoMemoriaFinanciera, Meta } from '../../types';

describe('Funciones de calendario (calendario.ts)', () => {
  describe('generarEventosCalendario', () => {
    it('debe generar eventos para deudas, recurrentes, metas y cumpleaños dentro del límite', () => {
      const deudas: Deuda[] = [
        { id: 1, nombre: 'Hipoteca', monto_total: 1000, numero_cuotas: 10, fecha_proxima_cuota: '2024-10-20' } as Deuda,
      ];
      const recurrentes: GastoRecurrente[] = [
        { id: 1, nombre: 'Netflix', monto: 30, dia_del_mes: 25 } as GastoRecurrente,
      ];
      const metas: Meta[] = [
        { id: 1, nombre: 'Viaje', monto_objetivo: 2000, monto_actual: 500, fecha_limite: '2024-11-05' } as Meta,
      ];
      const hitos: HitoMemoriaFinanciera[] = [
        { id: 1, titulo: 'Primer millón', fecha: '2023-11-01' } as HitoMemoriaFinanciera,
      ];

      const ahora = new Date('2024-10-15T12:00:00Z');
      const eventos = generarEventosCalendario(deudas, recurrentes, metas, hitos, ahora, 60);

      expect(eventos.some(e => e.tipo === 'pago_deuda')).toBe(true);
      expect(eventos.some(e => e.tipo === 'gasto_recurrente')).toBe(true);
      expect(eventos.some(e => e.tipo === 'meta_fecha_limite')).toBe(true);
      expect(eventos.some(e => e.tipo === 'cumpleanos_financiero')).toBe(true);

      // Debe estar ordenado
      for (let i = 0; i < eventos.length - 1; i++) {
        expect(eventos[i].fecha <= eventos[i+1].fecha).toBe(true);
      }
    });
  });
});
