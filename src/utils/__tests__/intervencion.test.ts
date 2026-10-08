import { calcularImpactoEnMetas } from '../intervencion';
import type { AporteMeta, Meta } from '../../types';

describe('Funciones de intervención (intervencion.ts)', () => {
  describe('calcularImpactoEnMetas', () => {
    it('debe calcular los días de retraso correctamente', () => {
      const metas = [
        { id: 1, nombre: 'Meta 1' } as Meta
      ];
      // Aportes de 300 en los últimos 30 días = 10 por día de velocidad de ahorro.
      const aportes = [
        { meta_id: 1, monto: 300 } as AporteMeta
      ];
      // Si el gasto es 50, retrasaría (50 / 10) = 5 días.
      const resultado = calcularImpactoEnMetas(50, metas, aportes);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].diasRetraso).toBe(5);
    });

    it('debe devolver null de retraso si no hay velocidad de ahorro', () => {
      const metas = [
        { id: 1, nombre: 'Meta 1' } as Meta
      ];
      // Cero aportes = Cero velocidad.
      const aportes: AporteMeta[] = [];
      const resultado = calcularImpactoEnMetas(50, metas, aportes);

      expect(resultado[0].diasRetraso).toBeNull();
    });
  });
});
