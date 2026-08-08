import { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSaludFinancieraStore } from '../store/useSaludFinancieraStore';

export default function SaludFinancieraScreen() {
  const resultado = useSaludFinancieraStore((s) => s.resultado);
  const calcular = useSaludFinancieraStore((s) => s.calcular);
  const historial = useSaludFinancieraStore((s) => s.historial);
  const cargarHistorial = useSaludFinancieraStore((s) => s.cargarHistorial);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await calcular();
        await cargarHistorial(14);
        setCargando(false);
      })();
    }, [])
  );

  if (cargando || !resultado) return null;

  const tendencia = historial.length >= 2 ? resultado.indice - historial[0].valor : null;
  const [colorTexto, colorBarra] =
    resultado.indice >= 60
      ? ['text-accent-success', 'bg-accent-success']
      : resultado.indice >= 40
        ? ['text-text-primary-light dark:text-text-primary-dark', 'bg-text-primary-light dark:bg-text-primary-dark']
        : ['text-accent-alert', 'bg-accent-alert'];

  return (
    <ScrollView className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="text-sm font-medium text-text-secondary">SALUD FINANCIERA</Text>
      <Text className={'mt-1 text-6xl font-semibold ' + colorTexto}>{resultado.indice}%</Text>

      <View className="mt-3 h-2 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
        <View className={'h-2 rounded-full ' + colorBarra} style={{ width: `${resultado.indice}%` }} />
      </View>

      {tendencia !== null && (
        <Text className="mt-2 text-sm text-text-secondary">
          {tendencia === 0
            ? 'Sin cambios frente a hace dos semanas.'
            : `${tendencia > 0 ? '↑' : '↓'} ${Math.abs(tendencia)} puntos frente a hace dos semanas.`}
        </Text>
      )}

      <View className="mt-8 rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        {resultado.componentes.map((c, i) => (
          <View
            key={c.clave}
            className={
              'px-4 py-3 ' +
              (i < resultado.componentes.length - 1 ? 'border-b border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none' : '')
            }
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">{c.etiqueta}</Text>
              <Text className="text-sm text-text-secondary">{c.valor}%</Text>
            </View>
            <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
              <View
                className="h-1.5 rounded-full bg-text-primary-light dark:bg-text-primary-dark"
                style={{ width: `${c.valor}%` }}
              />
            </View>
          </View>
        ))}
      </View>

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">RECOMENDACIÓN</Text>
      <View className="mb-10 rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
          {resultado.recomendacion.texto}
        </Text>
      </View>
    </ScrollView>
  );
}
