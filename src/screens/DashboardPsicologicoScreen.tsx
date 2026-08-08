import { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDisciplinaStore } from '../store/useDisciplinaStore';
import { useCategoriasStore } from '../store/useCategoriasStore';
import { obtenerTransaccionesUltimosDias, obtenerUltimoGastoImpulso } from '../db/queries';
import { categoriaDeMayorRiesgo, franjaDeMayorRiesgo } from '../utils/disciplina';
import { formatoMoneda } from '../utils/finance';
import type { Transaccion } from '../types';

export default function DashboardPsicologicoScreen() {
  const resultado = useDisciplinaStore((s) => s.resultado);
  const calcular = useDisciplinaStore((s) => s.calcular);
  const historial = useDisciplinaStore((s) => s.historial);
  const cargarHistorial = useDisciplinaStore((s) => s.cargarHistorial);
  const categorias = useCategoriasStore((s) => s.categorias);
  const cargarCategorias = useCategoriasStore((s) => s.cargar);

  const [ultimoImpulso, setUltimoImpulso] = useState<Transaccion | null>(null);
  const [impulsos30d, setImpulsos30d] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);

  const nombreCategoria = (id: number | null) =>
    categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría';

  useFocusEffect(
    useCallback(() => {
      if (categorias.length === 0) cargarCategorias();
      (async () => {
        const [transacciones30d, ultimo] = await Promise.all([
          obtenerTransaccionesUltimosDias(30),
          obtenerUltimoGastoImpulso(),
        ]);
        setImpulsos30d(transacciones30d.filter((t) => t.es_impulso));
        setUltimoImpulso(ultimo);
        await calcular();
        await cargarHistorial(14);
        setCargando(false);
      })();
    }, [])
  );

  if (cargando || !resultado) return null;

  const categoriaRiesgo = categoriaDeMayorRiesgo(impulsos30d, nombreCategoria);
  const franjaRiesgo = franjaDeMayorRiesgo(impulsos30d);

  const tendencia =
    historial.length >= 2 ? resultado.indice - historial[0].valor : null;

  const colorEstado =
    resultado.indice >= 60 ? 'text-accent-success' : resultado.indice >= 40 ? 'text-text-primary-light dark:text-text-primary-dark' : 'text-accent-alert';

  return (
    <ScrollView className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="text-sm font-medium text-text-secondary">ÍNDICE DE DISCIPLINA</Text>
      <Text className={'mt-1 text-5xl font-semibold ' + colorEstado}>{resultado.indice}</Text>
      <Text className={'mt-1 text-base font-medium ' + colorEstado}>{resultado.estado}</Text>

      {tendencia !== null && (
        <Text className="mt-2 text-sm text-text-secondary">
          {tendencia === 0
            ? 'Sin cambios frente a hace dos semanas.'
            : `${tendencia > 0 ? '↑' : '↓'} ${Math.abs(tendencia)} puntos frente a hace dos semanas.`}
        </Text>
      )}

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">DESGLOSE</Text>
      <View className="rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        {resultado.factores.map((f, i) => (
          <View
            key={f.clave}
            className={
              'flex-row items-center justify-between px-4 py-3 ' +
              (i < resultado.factores.length - 1 ? 'border-b border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none' : '')
            }
          >
            <Text className="text-sm text-text-secondary">{f.etiqueta}</Text>
            <Text className="text-base text-text-primary-light dark:text-text-primary-dark">{f.valor}</Text>
          </View>
        ))}
      </View>

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">COMPORTAMIENTO</Text>
      <View className="rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Días sin romper presupuesto</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {resultado.rachaPresupuesto}
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Último gasto impulsivo</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {ultimoImpulso
              ? `${formatoMoneda(ultimoImpulso.monto)} · ${ultimoImpulso.fecha}`
              : 'Ninguno registrado'}
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Categoría de mayor riesgo</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {categoriaRiesgo ? categoriaRiesgo.nombre : 'Sin datos'}
          </Text>
        </View>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-sm text-text-secondary">Franja de mayor riesgo</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {franjaRiesgo ? franjaRiesgo.franja : 'Sin datos'}
          </Text>
        </View>
      </View>

      <View className="mb-10" />
    </ScrollView>
  );
}
