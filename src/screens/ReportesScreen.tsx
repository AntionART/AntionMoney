import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategoriasStore } from '../store/useCategoriasStore';
import { obtenerTransaccionesDelMes } from '../db/queries';
import {
  formatoMoneda,
  hace7Dias,
  mesAnteriorPrefijo,
  mesPrefijo,
  nombreMes,
} from '../utils/finance';
import { calcularEstadisticasAvanzadas, generarReporteNarrativo } from '../utils/estadisticas';
import type { Transaccion } from '../types';

type Periodo = 'semana' | 'mes';

export default function ReportesScreen() {
  const categorias = useCategoriasStore((s) => s.categorias);
  const cargarCategorias = useCategoriasStore((s) => s.cargar);

  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [transaccionesMesActual, setTransaccionesMesActual] = useState<Transaccion[]>([]);
  const [transaccionesMesAnterior, setTransaccionesMesAnterior] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (categorias.length === 0) cargarCategorias();

      (async () => {
        const [actual, anterior] = await Promise.all([
          obtenerTransaccionesDelMes(mesPrefijo()),
          obtenerTransaccionesDelMes(mesAnteriorPrefijo()),
        ]);
        setTransaccionesMesActual(actual);
        setTransaccionesMesAnterior(anterior);
        setCargando(false);
      })();
    }, [])
  );

  const transaccionesPeriodo = useMemo(() => {
    if (periodo === 'mes') return transaccionesMesActual;
    const desde = hace7Dias();
    const todas = [...transaccionesMesActual, ...transaccionesMesAnterior];
    return todas.filter((t) => new Date(t.fecha + 'T' + t.hora) >= desde);
  }, [periodo, transaccionesMesActual, transaccionesMesAnterior]);

  const nombreCategoria = (id: number | null) =>
    categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría';

  const porCategoria = useMemo(() => {
    const totales = new Map<string, number>();
    for (const t of transaccionesPeriodo) {
      const nombre = nombreCategoria(t.categoria_id);
      totales.set(nombre, (totales.get(nombre) ?? 0) + t.monto);
    }
    return Array.from(totales.entries())
      .map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto);
  }, [transaccionesPeriodo, categorias]);

  const maxCategoria = porCategoria[0]?.monto ?? 0;

  const totalMesActual = transaccionesMesActual.reduce((sum, t) => sum + t.monto, 0);
  const totalMesAnterior = transaccionesMesAnterior.reduce((sum, t) => sum + t.monto, 0);
  const variacionPct =
    totalMesAnterior > 0 ? Math.round(((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100) : null;

  const totalImpulso = transaccionesPeriodo
    .filter((t) => t.es_impulso)
    .reduce((sum, t) => sum + t.monto, 0);
  const totalPeriodo = transaccionesPeriodo.reduce((sum, t) => sum + t.monto, 0);
  const pctImpulso = totalPeriodo > 0 ? Math.round((totalImpulso / totalPeriodo) * 100) : 0;

  const agruparPorCategoria = (ts: Transaccion[]) => {
    const totales = new Map<string, number>();
    for (const t of ts) {
      const nombre = nombreCategoria(t.categoria_id);
      totales.set(nombre, (totales.get(nombre) ?? 0) + t.monto);
    }
    return Array.from(totales.entries()).map(([nombre, monto]) => ({ nombre, monto }));
  };

  const porCategoriaMesActual = useMemo(
    () => agruparPorCategoria(transaccionesMesActual),
    [transaccionesMesActual, categorias]
  );
  const porCategoriaAnterior = useMemo(
    () => agruparPorCategoria(transaccionesMesAnterior),
    [transaccionesMesAnterior, categorias]
  );

  const impulsoMesAnterior = transaccionesMesAnterior.filter((t) => t.es_impulso).reduce((s, t) => s + t.monto, 0);
  const pctImpulsoAnterior =
    totalMesAnterior > 0 ? Math.round((impulsoMesAnterior / totalMesAnterior) * 100) : null;
  const pctImpulsoMesActual = totalMesActual > 0 ? Math.round((transaccionesMesActual.filter((t) => t.es_impulso).reduce((s, t) => s + t.monto, 0) / totalMesActual) * 100) : 0;

  const narrativa = generarReporteNarrativo({
    totalActual: totalMesActual,
    totalAnterior: totalMesAnterior,
    porCategoriaActual: porCategoriaMesActual,
    porCategoriaAnterior,
    pctImpulsoActual: pctImpulsoMesActual,
    pctImpulsoAnterior,
  });

  const estadisticas = useMemo(
    () => calcularEstadisticasAvanzadas(transaccionesMesActual, new Date().getDate()),
    [transaccionesMesActual]
  );

  if (cargando) return null;

  return (
    <ScrollView
      className="flex-1 bg-bg-light px-6 dark:bg-bg-dark"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row rounded-card border border-border-light bg-surface-light shadow-sm p-1 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        {(['semana', 'mes'] as Periodo[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriodo(p)}
            className={
              'flex-1 items-center rounded-card py-2 ' +
              (periodo === p ? 'bg-text-primary-light dark:bg-text-primary-dark' : '')
            }
          >
            <Text
              className={
                periodo === p
                  ? 'text-sm font-medium text-bg-light dark:text-bg-dark'
                  : 'text-sm text-text-secondary'
              }
            >
              {p === 'semana' ? 'Últimos 7 días' : 'Este mes'}
            </Text>
          </Pressable>
        ))}
      </View>

      {narrativa && (
        <View className="mt-6 rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">{narrativa}</Text>
        </View>
      )}

      <Text className="mb-3 mt-8 text-sm font-medium text-text-secondary">GASTO POR CATEGORÍA</Text>
      {porCategoria.length === 0 && (
        <Text className="text-sm text-text-secondary">Sin gastos en este período.</Text>
      )}
      {porCategoria.map((c) => (
        <View key={c.nombre} className="mb-3">
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">{c.nombre}</Text>
            <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
              {formatoMoneda(c.monto)}
            </Text>
          </View>
          <View className="mt-1 h-2 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
            <View
              className="h-2 rounded-full bg-text-primary-light dark:bg-text-primary-dark"
              style={{ width: `${maxCategoria > 0 ? Math.round((c.monto / maxCategoria) * 100) : 0}%` }}
            />
          </View>
        </View>
      ))}

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">
        COMPARACIÓN CON EL MES ANTERIOR
      </Text>
      <View className="rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <View className="flex-row justify-between">
          <Text className="text-xs text-text-secondary">{nombreMes(mesAnteriorPrefijo())}</Text>
          <Text className="text-xs text-text-secondary">{nombreMes(mesPrefijo())}</Text>
        </View>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-lg text-text-primary-light dark:text-text-primary-dark">
            {formatoMoneda(totalMesAnterior)}
          </Text>
          <Text className="text-text-secondary">→</Text>
          <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            {formatoMoneda(totalMesActual)}
          </Text>
        </View>
        {variacionPct !== null && (
          <Text
            className={
              'mt-2 text-sm ' + (variacionPct <= 0 ? 'text-accent-success' : 'text-accent-alert')
            }
          >
            {variacionPct <= 0 ? '↓' : '↑'} {Math.abs(variacionPct)}% frente al mes anterior
          </Text>
        )}
      </View>

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">GASTO POR IMPULSO</Text>
      <View className="rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
          {formatoMoneda(totalImpulso)}
        </Text>
        <Text className="mt-1 text-sm text-text-secondary">
          {pctImpulso}% de tu gasto en este período fue marcado como impulso.
        </Text>
      </View>

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">ESTADÍSTICAS AVANZADAS</Text>
      <View className="mb-10 rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Promedio diario del mes</Text>
          <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
            {formatoMoneda(estadisticas.promedioDiario)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Mayor gasto por impulso</Text>
          <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
            {estadisticas.mayorGastoImpulso ? formatoMoneda(estadisticas.mayorGastoImpulso.monto) : 'Ninguno'}
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Mejor semana</Text>
          <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
            {estadisticas.mejorSemana ? `Semana ${estadisticas.mejorSemana.semana} · ${formatoMoneda(estadisticas.mejorSemana.monto)}` : 'Sin datos'}
          </Text>
        </View>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-sm text-text-secondary">Peor semana</Text>
          <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
            {estadisticas.peorSemana ? `Semana ${estadisticas.peorSemana.semana} · ${formatoMoneda(estadisticas.peorSemana.monto)}` : 'Sin datos'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
