import { detectarHitosCandidatos } from '../hitos';
import type { Deuda, Meta } from '../../types';

describe('Funciones de hitos (hitos.ts)', () => {
  describe('detectarHitosCandidatos', () => {
    it('debe detectar metas cumplidas', () => {
      const input = {
        metas: [{ nombre: 'Laptop', estado: 'cumplida', monto_objetivo: 5000 } as Meta],
        deudas: [],
        ahorroTotal: 0,
        rachaRegistro: 0,
        rachaSinImpulso: 0,
        rachaPresupuesto: 0,
      };
      const hitos = detectarHitosCandidatos(input);
      expect(hitos.some(h => h.titulo.includes('Meta cumplida'))).toBe(true);
    });

    it('debe detectar el primer millón ahorrado', () => {
      const input = {
        metas: [],
        deudas: [],
        ahorroTotal: 1_000_000,
        rachaRegistro: 0,
        rachaSinImpulso: 0,
        rachaPresupuesto: 0,
      };
      const hitos = detectarHitosCandidatos(input);
      expect(hitos.some(h => h.titulo === 'Primer millón ahorrado')).toBe(true);
    });

    it('debe detectar la racha de 100 días sin impulsos', () => {
      const input = {
        metas: [],
        deudas: [],
        ahorroTotal: 0,
        rachaRegistro: 0,
        rachaSinImpulso: 100,
        rachaPresupuesto: 0,
      };
      const hitos = detectarHitosCandidatos(input);
      expect(hitos.some(h => h.titulo.includes('100 días sin compras impulsivas'))).toBe(true);
    });
  });
});
