import { useCallback } from 'react';
import { View, Text, Pressable, FlatList, useColorScheme } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMetasStore } from '../store/useMetasStore';
import { formatoMoneda } from '../utils/finance';
import type { RootStackParamList } from '../navigation/types';
import type { Meta } from '../types';

export default function MetasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const metas = useMetasStore((s) => s.metas);
  const cargar = useMetasStore((s) => s.cargar);
  const moverPrioridad = useMetasStore((s) => s.moverPrioridad);
  const esOscuro = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  const activas = metas.filter((m) => m.estado === 'activa');

  const renderMeta = ({ item, index }: { item: Meta; index: number }) => {
    const progreso = Math.min(1, item.monto_objetivo > 0 ? item.monto_actual / item.monto_objetivo : 0);
    const cumplida = item.estado === 'cumplida';
    const indiceActiva = activas.findIndex((m) => m.id === item.id);
    return (
      <Pressable
        onPress={() => navigation.navigate('DetalleMeta', { metaId: item.id })}
        className="mb-4 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-2">
            {!cumplida && (
              <Text className="text-xs font-medium text-text-secondary">
                Prioridad {indiceActiva + 1}
              </Text>
            )}
          </View>
          {cumplida && <Feather name="check-circle" size={20} color="#3FA65C" />}
        </View>
        <Text className="mt-1 text-base text-text-primary-light dark:text-text-primary-dark">
          {item.nombre}
        </Text>
        <View className="mt-3 h-2 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
          <View
            className={'h-2 rounded-full ' + (cumplida ? 'bg-accent-success' : 'bg-text-primary-light dark:bg-text-primary-dark')}
            style={{ width: `${Math.round(progreso * 100)}%` }}
          />
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-text-secondary">
            {formatoMoneda(item.monto_actual)} de {formatoMoneda(item.monto_objetivo)} · {Math.round(progreso * 100)}%
          </Text>
          {!cumplida && activas.length > 1 && (
            <View className="flex-row gap-3">
              <Pressable
                hitSlop={8}
                disabled={indiceActiva === 0}
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.selectionAsync();
                  moverPrioridad(item.id, 'arriba');
                }}
              >
                <Feather name="chevron-up" size={16} color={indiceActiva === 0 ? '#E5E5E5' : '#6B6B6B'} />
              </Pressable>
              <Pressable
                hitSlop={8}
                disabled={indiceActiva === activas.length - 1}
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.selectionAsync();
                  moverPrioridad(item.id, 'abajo');
                }}
              >
                <Feather
                  name="chevron-down"
                  size={16}
                  color={indiceActiva === activas.length - 1 ? '#E5E5E5' : '#6B6B6B'}
                />
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <FlatList
        data={metas}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMeta}
        contentContainerStyle={{ padding: 24, paddingTop: insets.top + 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="items-center pt-16">
            <Text className="text-center text-base text-text-secondary">
              Aún no tienes metas de ahorro.
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => navigation.navigate('CrearMeta')}
        className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full bg-text-primary-light shadow-lg active:opacity-80 dark:bg-text-primary-dark"
      >
        <Feather name="plus" size={26} color={esOscuro ? '#0D0D0D' : '#FFFFFF'} />
      </Pressable>
    </View>
  );
}
