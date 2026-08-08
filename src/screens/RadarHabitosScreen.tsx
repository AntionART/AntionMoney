import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCategoriasStore } from '../store/useCategoriasStore';
import { obtenerTransaccionesDelMes } from '../db/queries';
import { mesAnteriorPrefijo, mesPrefijo, formatoMoneda } from '../utils/finance';
import { categoriaDeMayorRiesgo, franjaDeMayorRiesgo } from '../utils/disciplina';
import {
  calcularCostoComodidad,
  calcularCostoDesorden,
  categoriasRecurrentes,
  diaSemanaDeMayorGasto,
  evolucionImpulsividad,
  generarInsightSemanal,
} from '../utils/radarHabitos';
import type { Transaccion } from '../types';

export default function RadarHabitosScreen() {
  const categorias = useCategoriasStore((s) => s.categorias);
  const cargarCategorias = useCategoriasStore((s) => s.cargar);
  const [mesActual, setMesActual] = useState<Transaccion[]>([]);
  const [mesAnterior, setMesAnterior] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);

  const nombreCategoria = (id: number | null) =>
    categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría';

  useFocusEffect(
    useCallback(() => {
      if (categorias.length === 0) cargarCategorias();
      (async () => {
        const [actual, anterior] = await Promise.all([
          obtenerTransaccionesDelMes(mesPrefijo()),
          obtenerTransaccionesDelMes(mesAnteriorPrefijo()),
        ]);
        setMesActual(actual);
        setMesAnterior(anterior);
        setCargando(false);
      })();
    }, [])
  );

  const impulsoMesActual = useMemo(() => mesActual.filter((t) => t.es_impulso), [mesActual]);

  const costoDesorden = useMemo(() => calcularCostoDesorden(mesActual), [mesActual]);
  const costoComodidad = useMemo(
    () => calcularCostoComodidad(impulsoMesActual, nombreCategoria),
    [impulsoMesActual, categorias]
  );
  const diaRiesgo = useMemo(() => diaSemanaDeMayorGasto(mesActual), [mesActual]);
  const recurrentes = useMemo(
    () => categoriasRecurrentes(mesActual, nombreCategoria, 3),
    [mesActual, categorias]
  );
  const evolucion = useMemo(() => evolucionImpulsividad(mesActual, mesAnterior), [mesActual, mesAnterior]);
  const categoriaRiesgo = useMemo(
    () => categoriaDeMayorRiesgo(impulsoMesActual, nombreCategoria),
    [impulsoMesActual, categorias]
  );
  const franjaRiesgo = useMemo(() => franjaDeMayorRiesgo(impulsoMesActual), [impulsoMesActual]);

  const insight = useMemo(
    () => generarInsightSemanal({ franjaRiesgo, diaMayorGasto: diaRiesgo, evolucion }),
    [franjaRiesgo, diaRiesgo, evolucion]
  );

  if (cargando) return null;

  return (
    <ScrollView className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="mb-2 text-sm font-medium text-text-secondary">COSTO DEL DESORDEN</Text>
      <View className="rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <Text className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
          {formatoMoneda(costoDesorden)}
        </Text>
        <Text className="mt-1 text-sm text-text-secondary">
          Perdiste esto este mes en decisiones marcadas como impulso.
          {categoriaRiesgo ? ` La mayor parte fue en ${categoriaRiesgo.nombre}.` : ''}
        </Text>
      </View>

      {costoComodidad.monto > 0 && (
        <>
          <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">COSTO DE LA COMODIDAD</Text>
          <View className="rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
            <Text className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
              {formatoMoneda(costoComodidad.monto)}
            </Text>
            <Text className="mt-1 text-sm text-text-secondary">
              A cambio, te ahorraste aproximadamente {Math.round(costoComodidad.minutosEstimados / 60)}h{' '}
              {costoComodidad.minutosEstimados % 60}min. Sin juicio — solo el dato para que decidas si el
              intercambio vale la pena.
            </Text>
            {costoComodidad.detalle.map((d) => (
              <View key={d.categoria} className="mt-2 flex-row items-center justify-between">
                <Text className="text-xs text-text-secondary">{d.categoria}</Text>
                <Text className="text-xs text-text-primary-light dark:text-text-primary-dark">
                  {formatoMoneda(d.monto)} · {d.minutos}min
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">RADAR DE HÁBITOS</Text>
      <View className="rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Día de mayor gasto</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {diaRiesgo ? diaRiesgo.dia : 'Sin datos'}
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Horario de riesgo</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {franjaRiesgo ? franjaRiesgo.franja : 'Sin datos'}
          </Text>
        </View>
        <View className="px-4 py-3">
          <Text className="text-sm text-text-secondary">Evolución de impulsividad</Text>
          <Text className="mt-1 text-base text-text-primary-light dark:text-text-primary-dark">
            {evolucion.pctActual}% de tu gasto este mes
            {evolucion.delta !== null
              ? ` (${evolucion.delta > 0 ? '+' : ''}${evolucion.delta} pts vs. mes anterior)`
              : ''}
          </Text>
        </View>
      </View>

      {recurrentes.length > 0 && (
        <>
          <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">CATEGORÍAS RECURRENTES</Text>
          <View className="rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
            {recurrentes.map((r, i) => (
              <View
                key={r.nombre}
                className={
                  'flex-row items-center justify-between px-4 py-3 ' +
                  (i < recurrentes.length - 1 ? 'border-b border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none' : '')
                }
              >
                <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">{r.nombre}</Text>
                <Text className="text-sm text-text-secondary">{r.conteo} compras</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {insight && (
        <>
          <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">ANTION INSIGHTS</Text>
          <View className="mb-10 rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
            <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">{insight}</Text>
          </View>
        </>
      )}

      <View className="mb-10" />
    </ScrollView>
  );
}
