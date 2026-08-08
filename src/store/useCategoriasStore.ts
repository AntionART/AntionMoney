import { create } from 'zustand';
import { getDb } from '../db/client';
import type { Categoria } from '../types';

type CategoriasState = {
  categorias: Categoria[];
  cargar: () => Promise<void>;
};

export const useCategoriasStore = create<CategoriasState>((set) => ({
  categorias: [],

  cargar: async () => {
    const db = await getDb();
    const categorias = await db.getAllAsync<Categoria>('SELECT * FROM categoria ORDER BY id');
    set({ categorias });
  },
}));
