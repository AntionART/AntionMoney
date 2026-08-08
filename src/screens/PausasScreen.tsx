import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useTentacionesStore } from '../store/useTentacionesStore';
import { formatoCuentaRegresiva, formatoMoneda } from '../utils/finance';
import type { RootStackParamList } from '../navigation/types';
import type { TentacionPendiente } from '../types';

export default function PausasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tentaciones = useTentacionesStore((s) => s.tentaciones);
  const cargar = useTentacionesStore((s) => s.cargar);
  const esOscuro = useColorScheme() === 'dark';
  const [ahora, setAhora] = useState(new Date());

  useEffect(() => {
    cargar();
    const id = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const renderItem = ({ item }: { item: TentacionPendiente }) => {
    const fechaDisponible = new Date(item.fecha_disponible);
    const disponible = fechaDisponible.getTime() <= ahora.getTime();
    return (
      <Pressable
        onPress={() => navigation.navigate('DetalleTentacion', { tentacionId: item.id })}
        className="mb-4 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {item.descripcion}
          </Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {formatoMoneda(item.monto_estimado)}
          </Text>
        </View>
        <Text className={'mt-1 text-xs ' + (disponible ? 'text-accent-success' : 'text-text-secondary')}>
          {formatoCuentaRegresiva(fechaDisponible, ahora)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <FlatList
        data={tentaciones}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="items-center pt-16">
            <Text className="text-center text-base text-text-secondary">
              No tienes tentaciones en pausa.{'\n'}Cuando dudes de una compra, guárdala aquí.
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => navigation.navigate('CrearTentacion', {})}
        className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full bg-text-primary-light shadow-lg active:opacity-80 dark:bg-text-primary-dark"
      >
        <Feather name="plus" size={26} color={esOscuro ? '#0D0D0D' : '#FFFFFF'} />
      </Pressable>
    </View>
  );
}
