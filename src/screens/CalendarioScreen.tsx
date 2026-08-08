import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import {
  obtenerDeudasActivas,
  obtenerGastosRecurrentesActivos,
  obtenerHitosMemoria,
  obtenerTodasLasMetas,
} from '../db/queries';
import { generarEventosCalendario, type EventoCalendario } from '../utils/calendario';
import { formatoMoneda, nombreMes } from '../utils/finance';

const ICONO_TIPO: Record<EventoCalendario['tipo'], keyof typeof Feather.glyphMap> = {
  pago_deuda: 'credit-card',
  gasto_recurrente: 'repeat',
  meta_fecha_limite: 'flag',
  cumpleanos_financiero: 'gift',
};

export default function CalendarioScreen() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const ahora = new Date();
        const [deudas, recurrentes, metas, hitos] = await Promise.all([
          obtenerDeudasActivas(),
          obtenerGastosRecurrentesActivos(),
          obtenerTodasLasMetas(),
          obtenerHitosMemoria(),
        ]);
        const metasActivas = metas.filter((m) => m.estado === 'activa');
        const hitosCumpleanos = hitos.filter((h) => h.es_cumpleanos_financiero === 1);
        setEventos(generarEventosCalendario(deudas, recurrentes, metasActivas, hitosCumpleanos, ahora, 60));
        setCargando(false);
      })();
    }, [])
  );

  const grupos = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>();
    for (const ev of eventos) {
      const lista = mapa.get(ev.fecha) ?? [];
      lista.push(ev);
      mapa.set(ev.fecha, lista);
    }
    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [eventos]);

  if (cargando) return null;

  return (
    <ScrollView className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark" contentContainerStyle={{ paddingBottom: 24 }}>
      {grupos.length === 0 ? (
        <Text className="pt-16 text-center text-sm text-text-secondary">
          No hay nada programado en los próximos 60 días.
        </Text>
      ) : (
        grupos.map(([fecha, items]) => (
          <View key={fecha} className="mb-6">
            <Text className="mb-2 text-xs font-medium text-text-secondary">
              {fecha} · {nombreMes(fecha.slice(0, 7))}
            </Text>
            <View className="rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
              {items.map((ev, i) => (
                <View
                  key={ev.id}
                  className={
                    'flex-row items-center justify-between px-4 py-3 ' +
                    (i < items.length - 1 ? 'border-b border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none' : '')
                  }
                >
                  <View className="flex-1 flex-row items-center gap-3">
                    <Feather name={ICONO_TIPO[ev.tipo]} size={18} color="#6B6B6B" />
                    <Text className="flex-1 text-sm text-text-primary-light dark:text-text-primary-dark">
                      {ev.titulo}
                    </Text>
                  </View>
                  {ev.monto !== null && (
                    <Text className="text-sm text-text-secondary">{formatoMoneda(ev.monto)}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
