import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMetasStore } from '../store/useMetasStore';
import { formatoMoneda } from '../utils/finance';
import type { RootStackParamList } from '../navigation/types';
import type { AporteMeta } from '../types';

const SIN_APORTES: AporteMeta[] = [];

export default function DetalleMetaScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'DetalleMeta'>>();
  const { metaId } = route.params;
  const insets = useSafeAreaInsets();

  const meta = useMetasStore((s) => s.metas.find((m) => m.id === metaId));
  const aportes = useMetasStore((s) => s.aportesPorMeta[metaId] ?? SIN_APORTES);
  const cargarAportes = useMetasStore((s) => s.cargarAportes);
  const aportar = useMetasStore((s) => s.aportar);
  const eliminar = useMetasStore((s) => s.eliminar);

  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarAportes(metaId);
  }, [metaId]);

  if (!meta) return null;

  const progreso = Math.min(1, meta.monto_objetivo > 0 ? meta.monto_actual / meta.monto_objetivo : 0);
  const montoNumerico = Number(monto.replace(/[^0-9]/g, ''));

  const agregarAporte = async () => {
    if (montoNumerico <= 0 || guardando) return;
    setGuardando(true);
    await aportar(metaId, montoNumerico);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMonto('');
    setGuardando(false);
  };

  const confirmarEliminar = () => {
    Alert.alert('Eliminar meta', `¿Eliminar "${meta.nombre}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminar(metaId);
          navigation.goBack();
        },
      },
    ]);
  };

  const renderAporte = ({ item }: { item: AporteMeta }) => (
    <View className="flex-row items-center justify-between border-b border-border-light py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
      <Text className="text-sm text-text-secondary">{item.fecha}</Text>
      <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
        {formatoMoneda(item.monto)}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
        {meta.nombre}
      </Text>

      {meta.estado === 'cumplida' && (
        <Text className="mt-1 text-sm font-medium text-accent-success">Meta cumplida</Text>
      )}

      <View className="mt-4 h-2 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
        <View
          className={'h-2 rounded-full ' + (meta.estado === 'cumplida' ? 'bg-accent-success' : 'bg-text-primary-light dark:bg-text-primary-dark')}
          style={{ width: `${Math.round(progreso * 100)}%` }}
        />
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-sm text-text-secondary">
          {formatoMoneda(meta.monto_actual)} de {formatoMoneda(meta.monto_objetivo)}
        </Text>
        <Text className="text-sm text-text-secondary">{Math.round(progreso * 100)}%</Text>
      </View>

      {meta.estado === 'activa' && (
        <View className="mt-6 flex-row gap-2">
          <TextInput
            value={monto}
            onChangeText={setMonto}
            keyboardType="number-pad"
            placeholder="Aportar $0"
            placeholderTextColor="#6B6B6B"
            className="flex-1 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
          />
          <Pressable
            onPress={agregarAporte}
            disabled={montoNumerico <= 0 || guardando}
            className={
              'items-center justify-center rounded-card px-5 ' +
              (montoNumerico > 0 && !guardando
                ? 'bg-text-primary-light dark:bg-text-primary-dark'
                : 'bg-border-light dark:bg-border-dark')
            }
          >
            <Text className="text-base font-medium text-bg-light dark:text-bg-dark">Aportar</Text>
          </Pressable>
        </View>
      )}

      <Text className="mb-1 mt-8 text-sm font-medium text-text-secondary">APORTES</Text>
      <FlatList
        data={aportes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderAporte}
        ListEmptyComponent={
          <Text className="pt-4 text-sm text-text-secondary">Aún no hay aportes.</Text>
        }
      />

      <Pressable
        onPress={confirmarEliminar}
        style={{ marginBottom: insets.bottom + 16 }}
        className="mt-4 items-center py-3"
      >
        <Text className="text-sm text-accent-alert">Eliminar meta</Text>
      </Pressable>
    </View>
  );
}
