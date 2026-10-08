import { estadoDesdeIndice } from '../disciplina';

describe('Funciones de disciplina (disciplina.ts)', () => {
  describe('estadoDesdeIndice', () => {
    it('debe devolver "En control" para índices >= 80', () => {
      expect(estadoDesdeIndice(80)).toBe('En control');
      expect(estadoDesdeIndice(100)).toBe('En control');
    });

    it('debe devolver "Estable" para índices entre 60 y 79', () => {
      expect(estadoDesdeIndice(60)).toBe('Estable');
      expect(estadoDesdeIndice(79)).toBe('Estable');
    });

    it('debe devolver "Atención" para índices entre 40 y 59', () => {
      expect(estadoDesdeIndice(40)).toBe('Atención');
      expect(estadoDesdeIndice(59)).toBe('Atención');
    });

    it('debe devolver "Zona de riesgo" para índices entre 20 y 39', () => {
      expect(estadoDesdeIndice(20)).toBe('Zona de riesgo');
      expect(estadoDesdeIndice(39)).toBe('Zona de riesgo');
    });

    it('debe devolver "Crítico" para índices < 20', () => {
      expect(estadoDesdeIndice(19)).toBe('Crítico');
      expect(estadoDesdeIndice(0)).toBe('Crítico');
      expect(estadoDesdeIndice(-10)).toBe('Crítico');
    });
  });
});
