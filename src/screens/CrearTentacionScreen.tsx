import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTentacionesStore } from '../store/useTentacionesStore';
import type { RootStackParamList } from '../navigation/types';

export default function CrearTentacionScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CrearTentacion'>>();
  const crear = useTentacionesStore((s) => s.crear);

  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState(
    route.params?.montoSugerido ? String(route.params.montoSugerido) : ''
  );
  const [guardando, setGuardando] = useState(false);

  const montoNumerico = Number(monto.replace(/[^0-9]/g, ''));
  const puedeGuardar = descripcion.trim().length > 0 && montoNumerico > 0 && !guardando;

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    await crear(descripcion.trim(), montoNumerico);
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="text-sm text-text-secondary">
        En 24 horas te preguntamos si todavía lo quieres. Si para entonces ya no te importa, no
        gastaste nada.
      </Text>

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">¿QUÉ QUIERES COMPRAR?</Text>
      <TextInput
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej. Tenis nuevos"
        placeholderTextColor="#6B6B6B"
        autoFocus
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
      />

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">MONTO ESTIMADO</Text>
      <TextInput
        value={monto}
        onChangeText={setMonto}
        keyboardType="number-pad"
        placeholder="$0"
        placeholderTextColor="#6B6B6B"
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-2xl font-semibold text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
      />

      <Pressable
        onPress={guardar}
        disabled={!puedeGuardar}
        className={
          'mt-8 items-center rounded-card py-4 ' +
          (puedeGuardar
            ? 'bg-text-primary-light dark:bg-text-primary-dark'
            : 'bg-border-light dark:bg-border-dark')
        }
      >
        <Text className="text-base font-medium text-bg-light dark:text-bg-dark">
          Guardar como pausa de 24h
        </Text>
      </Pressable>
    </View>
  );
}
