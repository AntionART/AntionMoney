import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useDeudasStore } from '../store/useDeudasStore';
import { formatoMoneda } from '../utils/finance';
import type { RootStackParamList } from '../navigation/types';
import type { PagoDeuda } from '../types';

const SIN_PAGOS: PagoDeuda[] = [];

export default function DetalleDeudaScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'DetalleDeuda'>>();
  const { deudaId } = route.params;
  const insets = useSafeAreaInsets();

  const deuda = useDeudasStore((s) => s.deudas.find((d) => d.id === deudaId));
  const pagos = useDeudasStore((s) => s.pagosPorDeuda[deudaId] ?? SIN_PAGOS);
  const cargarPagos = useDeudasStore((s) => s.cargarPagos);
  const registrarPago = useDeudasStore((s) => s.registrarPago);
  const eliminar = useDeudasStore((s) => s.eliminar);

  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarPagos(deudaId);
  }, [deudaId]);

  if (!deuda) return null;

  const cuotaSugerida = Math.round(deuda.monto_total / deuda.numero_cuotas);
  const progreso = deuda.monto_total > 0 ? 1 - deuda.saldo_pendiente / deuda.monto_total : 0;
  const montoNumerico = Number(monto.replace(/[^0-9]/g, ''));

  const pagar = async () => {
    const valor = montoNumerico > 0 ? montoNumerico : cuotaSugerida;
    setGuardando(true);
    await registrarPago(deudaId, valor);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMonto('');
    setGuardando(false);
  };

  const confirmarEliminar = () => {
    Alert.alert('Eliminar deuda', `¿Eliminar "${deuda.nombre}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminar(deudaId);
          navigation.goBack();
        },
      },
    ]);
  };

  const renderPago = ({ item }: { item: PagoDeuda }) => (
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
        {deuda.nombre}
      </Text>
      {deuda.contraparte ? (
        <Text className="mt-1 text-sm text-text-secondary">{deuda.contraparte}</Text>
      ) : null}

      {deuda.estado === 'pagada' && (
        <Text className="mt-1 text-sm font-medium text-accent-success">Deuda pagada</Text>
      )}

      <View className="mt-4 h-2 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
        <View
          className={'h-2 rounded-full ' + (deuda.estado === 'pagada' ? 'bg-accent-success' : 'bg-text-primary-light dark:bg-text-primary-dark')}
          style={{ width: `${Math.round(Math.min(1, Math.max(0, progreso)) * 100)}%` }}
        />
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-sm text-text-secondary">
          Pendiente {formatoMoneda(deuda.saldo_pendiente)} de {formatoMoneda(deuda.monto_total)}
        </Text>
        <Text className="text-sm text-text-secondary">{Math.round(progreso * 100)}%</Text>
      </View>

      {deuda.fecha_proxima_cuota && deuda.estado === 'activa' && (
        <Text className="mt-2 text-sm text-text-secondary">
          Próximo pago: {deuda.fecha_proxima_cuota}
        </Text>
      )}

      {deuda.estado === 'activa' && (
        <View className="mt-6 flex-row gap-2">
          <TextInput
            value={monto}
            onChangeText={setMonto}
            keyboardType="number-pad"
            placeholder={`Pagar ${formatoMoneda(cuotaSugerida)}`}
            placeholderTextColor="#6B6B6B"
            className="flex-1 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
          />
          <Pressable
            onPress={pagar}
            disabled={guardando}
            className="items-center justify-center rounded-card bg-text-primary-light px-5 dark:bg-text-primary-dark"
          >
            <Text className="text-base font-medium text-bg-light dark:text-bg-dark">Pagar</Text>
          </Pressable>
        </View>
      )}

      <Text className="mb-1 mt-8 text-sm font-medium text-text-secondary">PAGOS</Text>
      <FlatList
        data={pagos}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPago}
        ListEmptyComponent={
          <Text className="pt-4 text-sm text-text-secondary">Aún no hay pagos registrados.</Text>
        }
      />

      <Pressable
        onPress={confirmarEliminar}
        style={{ marginBottom: insets.bottom + 16 }}
        className="mt-4 items-center py-3"
      >
        <Text className="text-sm text-accent-alert">Eliminar deuda</Text>
      </Pressable>
    </View>
  );
}
