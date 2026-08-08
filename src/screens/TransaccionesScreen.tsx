import { useCallback } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useTransaccionesStore } from '../store/useTransaccionesStore';
import { useCategoriasStore } from '../store/useCategoriasStore';
import { formatoMoneda } from '../utils/finance';
import type { RootStackParamList } from '../navigation/types';
import type { Transaccion } from '../types';

export default function TransaccionesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const transacciones = useTransaccionesStore((s) => s.transacciones);
  const cargarMes = useTransaccionesStore((s) => s.cargarMes);
  const categorias = useCategoriasStore((s) => s.categorias);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      cargarMes();
    }, [])
  );

  const nombreCategoria = (id: number | null) =>
    categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría';

  const renderItem = ({ item }: { item: Transaccion }) => (
    <Pressable
      onPress={() => navigation.navigate('RegistrarTransaccion', { transaccionId: item.id })}
      className="flex-row items-center justify-between border-b border-border-light px-6 py-4 active:opacity-60 dark:border-border-dark"
    >
      <View className="flex-1">
        <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
          {nombreCategoria(item.categoria_id)}
        </Text>
        <Text className="mt-0.5 text-xs text-text-secondary">
          {item.fecha} · {item.hora.slice(0, 5)}
          {item.es_impulso ? ' · Impulso' : ''}
        </Text>
      </View>
      <Text className="mr-2 text-base font-medium text-text-primary-light dark:text-text-primary-dark">
        {formatoMoneda(item.monto)}
      </Text>
      <Feather name="chevron-right" size={16} color="#6B6B6B" />
    </Pressable>
  );

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark" style={{ paddingTop: insets.top + 16 }}>
      <FlatList
        data={transacciones}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center px-8 pt-16">
            <Text className="text-center text-base text-text-secondary">
              Aún no registras gastos este mes.
            </Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
}
