import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useDeudasStore } from '../store/useDeudasStore';
import { useGastosRecurrentesStore } from '../store/useGastosRecurrentesStore';
import { useCategoriasStore } from '../store/useCategoriasStore';
import { formatoMoneda } from '../utils/finance';
import type { RootStackParamList } from '../navigation/types';
import type { Deuda, GastoRecurrente } from '../types';

type Vista = 'deudas' | 'recurrentes';

export default function DeudasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const esOscuro = useColorScheme() === 'dark';
  const [vista, setVista] = useState<Vista>('deudas');

  const deudas = useDeudasStore((s) => s.deudas);
  const cargarDeudas = useDeudasStore((s) => s.cargar);

  const recurrentes = useGastosRecurrentesStore((s) => s.recurrentes);
  const pendientes = useGastosRecurrentesStore((s) => s.pendientes);
  const cargarRecurrentes = useGastosRecurrentesStore((s) => s.cargar);
  const cargarPendientes = useGastosRecurrentesStore((s) => s.cargarPendientes);
  const registrarEsteMes = useGastosRecurrentesStore((s) => s.registrarEsteMes);
  const eliminarRecurrente = useGastosRecurrentesStore((s) => s.eliminar);

  const categorias = useCategoriasStore((s) => s.categorias);
  const nombreCategoria = (id: number | null) =>
    categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría';

  useEffect(() => {
    cargarDeudas();
    cargarRecurrentes();
    cargarPendientes();
  }, []);

  const renderDeuda = ({ item }: { item: Deuda }) => {
    const progreso = item.monto_total > 0 ? 1 - item.saldo_pendiente / item.monto_total : 0;
    const pagada = item.estado === 'pagada';
    return (
      <Pressable
        onPress={() => navigation.navigate('DetalleDeuda', { deudaId: item.id })}
        className="mb-4 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {item.nombre}
          </Text>
          {pagada && <Feather name="check-circle" size={20} color="#3FA65C" />}
        </View>
        <View className="mt-3 h-2 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
          <View
            className={'h-2 rounded-full ' + (pagada ? 'bg-accent-success' : 'bg-text-primary-light dark:bg-text-primary-dark')}
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progreso)) * 100)}%` }}
          />
        </View>
        <Text className="mt-2 text-xs text-text-secondary">
          Pendiente {formatoMoneda(item.saldo_pendiente)} de {formatoMoneda(item.monto_total)}
          {item.fecha_proxima_cuota && !pagada ? ` · Próximo pago ${item.fecha_proxima_cuota}` : ''}
        </Text>
      </Pressable>
    );
  };

  const renderRecurrente = ({ item }: { item: GastoRecurrente }) => (
    <View className="mb-4 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
      <View className="flex-row items-center justify-between">
        <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
          {item.nombre}
        </Text>
        <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
          {formatoMoneda(item.monto)}
        </Text>
      </View>
      <Text className="mt-1 text-xs text-text-secondary">
        {nombreCategoria(item.categoria_id)} · Día {item.dia_del_mes} de cada mes
      </Text>
      <Pressable onPress={() => eliminarRecurrente(item.id)} className="mt-3 self-start">
        <Text className="text-xs text-accent-alert">Eliminar</Text>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 bg-bg-light px-6 pt-4 dark:bg-bg-dark">
      <View className="flex-row rounded-card border border-border-light bg-surface-light shadow-sm p-1 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        {(['deudas', 'recurrentes'] as Vista[]).map((v) => (
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
                vista === v
                  ? 'text-sm font-medium text-bg-light dark:text-bg-dark'
                  : 'text-sm text-text-secondary'
              }
            >
              {v === 'deudas' ? 'Deudas' : 'Gastos fijos'}
            </Text>
          </Pressable>
        ))}
      </View>

      {vista === 'deudas' ? (
        <FlatList
          data={deudas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderDeuda}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="items-center pt-16">
              <Text className="text-center text-base text-text-secondary">No tienes deudas registradas.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={recurrentes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRecurrente}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          ListHeaderComponent={
            pendientes.length > 0 ? (
              <View className="mb-4 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
                <Text className="mb-2 text-sm font-medium text-text-secondary">
                  PENDIENTES ESTE MES
                </Text>
                {pendientes.map((p) => (
                  <View key={p.id} className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      {p.nombre} · {formatoMoneda(p.monto)}
                    </Text>
                    <Pressable
                      onPress={() => registrarEsteMes(p.id)}
                      className="rounded-card bg-text-primary-light px-3 py-1.5 dark:bg-text-primary-dark"
                    >
                      <Text className="text-xs font-medium text-bg-light dark:text-bg-dark">
                        Registrar
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center pt-16">
              <Text className="text-center text-base text-text-secondary">
                No tienes gastos fijos configurados.
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={() =>
          navigation.navigate(vista === 'deudas' ? 'CrearDeuda' : 'CrearGastoRecurrente')
        }
        className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full bg-text-primary-light shadow-lg active:opacity-80 dark:bg-text-primary-dark"
      >
        <Feather name="plus" size={26} color={esOscuro ? '#0D0D0D' : '#FFFFFF'} />
      </Pressable>
    </View>
  );
}
