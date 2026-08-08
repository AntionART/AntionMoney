import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTimelineStore } from '../store/useTimelineStore';
import { formatoMoneda } from '../utils/finance';

type Vista = 'timeline' | 'progreso';

export default function TimelineScreen() {
  const hitos = useTimelineStore((s) => s.hitos);
  const progreso = useTimelineStore((s) => s.progreso);
  const cargar = useTimelineStore((s) => s.cargar);
  const evaluarHitos = useTimelineStore((s) => s.evaluarHitos);
  const cargarProgreso = useTimelineStore((s) => s.cargarProgreso);
  const [vista, setVista] = useState<Vista>('timeline');
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await evaluarHitos();
        await cargarProgreso();
        setCargando(false);
      })();
    }, [])
  );

  const variacion = (antes: number, hoy: number) => {
    if (antes === 0) return null;
    return Math.round(((hoy - antes) / antes) * 100);
  };

  if (cargando) return null;

  return (
    <View className="flex-1 bg-bg-light px-6 pt-4 dark:bg-bg-dark">
      <View className="flex-row rounded-card border border-border-light bg-surface-light shadow-sm p-1 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        {(['timeline', 'progreso'] as Vista[]).map((v) => (
          <Pressable
            key={v}
            onPress={() => setVista(v)}
            className={
              'flex-1 items-center rounded-card py-2 ' +
              (vista === v ? 'bg-text-primary-light dark:bg-text-primary-dark' : '')
            }
          >
            <Text
              className={
                vista === v ? 'text-sm font-medium text-bg-light dark:text-bg-dark' : 'text-sm text-text-secondary'
              }
            >
              {v === 'timeline' ? 'Timeline' : 'Centro de Progreso'}
            </Text>
          </Pressable>
        ))}
      </View>

      {vista === 'timeline' ? (
        <ScrollView className="mt-6" contentContainerStyle={{ paddingBottom: 24 }}>
          {hitos.length === 0 ? (
            <Text className="pt-16 text-center text-sm text-text-secondary">
              Tu historia financiera empieza aquí. Los hitos importantes aparecerán a medida que
              avances.
            </Text>
          ) : (
            hitos.map((h) => (
              <View
                key={h.id}
                className="mb-4 rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
              >
                <Text className="text-xs text-text-secondary">{h.fecha}</Text>
                <Text className="mt-1 text-base font-medium text-text-primary-light dark:text-text-primary-dark">
                  {h.titulo}
                </Text>
                {h.descripcion ? (
                  <Text className="mt-1 text-sm text-text-secondary">{h.descripcion}</Text>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView className="mt-6" contentContainerStyle={{ paddingBottom: 24 }}>
          {progreso && (
            <>
              <View className="mb-4 rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
                <Text className="text-xs text-text-secondary">Hace 6 meses → Hoy</Text>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-sm text-text-secondary">Deudas</Text>
                </View>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-lg text-text-primary-light dark:text-text-primary-dark">
                    {formatoMoneda(progreso.deudaAntes)}
                  </Text>
                  <Text className="text-text-secondary">→</Text>
                  <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {formatoMoneda(progreso.deudaHoy)}
                  </Text>
                </View>
                {variacion(progreso.deudaAntes, progreso.deudaHoy) !== null && (
                  <Text
                    className={
                      'mt-1 text-sm ' +
                      ((variacion(progreso.deudaAntes, progreso.deudaHoy) as number) <= 0
                        ? 'text-accent-success'
                        : 'text-accent-alert')
                    }
                  >
                    {(variacion(progreso.deudaAntes, progreso.deudaHoy) as number) <= 0 ? '↓' : '↑'}{' '}
                    {Math.abs(variacion(progreso.deudaAntes, progreso.deudaHoy) as number)}%
                  </Text>
                )}
              </View>

              <View className="rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
                <Text className="text-xs text-text-secondary">Hace 6 meses → Hoy</Text>
                <View className="mt-2">
                  <Text className="text-sm text-text-secondary">Ahorro</Text>
                </View>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-lg text-text-primary-light dark:text-text-primary-dark">
                    {formatoMoneda(progreso.ahorroAntes)}
                  </Text>
                  <Text className="text-text-secondary">→</Text>
                  <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {formatoMoneda(progreso.ahorroHoy)}
                  </Text>
                </View>
                {progreso.ahorroHoy !== progreso.ahorroAntes && (
                  <Text className="mt-1 text-sm text-accent-success">
                    {progreso.ahorroHoy >= progreso.ahorroAntes ? '↑' : '↓'}{' '}
                    {formatoMoneda(Math.abs(progreso.ahorroHoy - progreso.ahorroAntes))}
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
