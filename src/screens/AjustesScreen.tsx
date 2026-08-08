import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Keyboard, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useUsuarioStore } from '../store/useUsuarioStore';
import type { RootStackParamList } from '../navigation/types';

const ACCESOS_SECUNDARIOS: Array<{ screen: keyof RootStackParamList; label: string; icono: keyof typeof Feather.glyphMap }> = [
  { screen: 'DashboardPsicologico', label: 'Dashboard psicológico', icono: 'activity' },
  { screen: 'RadarHabitos', label: 'Radar de hábitos', icono: 'radio' },
  { screen: 'Timeline', label: 'Timeline financiero', icono: 'clock' },
  { screen: 'Calendario', label: 'Calendario financiero', icono: 'calendar' },
  { screen: 'Diario', label: 'Diario financiero', icono: 'book-open' },
  { screen: 'Proposito', label: '¿Por qué hago esto?', icono: 'compass' },
];

export default function AjustesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const usuario = useUsuarioStore((s) => s.usuario);
  const actualizarIngreso = useUsuarioStore((s) => s.actualizarIngreso);
  const actualizarRecordatorio = useUsuarioStore((s) => s.actualizarRecordatorio);
  const [valor, setValor] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (usuario) {
      setValor(usuario.ingreso_mensual ? String(usuario.ingreso_mensual) : '');
    }
  }, [usuario?.ingreso_mensual]);

  const guardar = async () => {
    const monto = Number(valor.replace(/[^0-9]/g, ''));
    await actualizarIngreso(Number.isFinite(monto) ? monto : 0);
    Keyboard.dismiss();
  };

  if (!usuario) return null;

  const recordatorioActivo = usuario.recordatorio_diario_activo === 1;
  const hora = usuario.recordatorio_diario_hora;

  const cambiarHora = (delta: number) => {
    const nuevaHora = ((hora + delta) % 24 + 24) % 24;
    actualizarRecordatorio(recordatorioActivo, nuevaHora);
  };

  return (
    <ScrollView
      className="flex-1 bg-bg-light px-6 dark:bg-bg-dark"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}
    >
      <Text className="mb-2 text-sm font-medium text-text-secondary">
        INGRESO MENSUAL
      </Text>
      <View className="flex-row items-center rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <TextInput
          value={valor}
          onChangeText={setValor}
          onBlur={guardar}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#6B6B6B"
          className="flex-1 text-lg text-text-primary-light dark:text-text-primary-dark"
        />
        <Text className="text-base text-text-secondary">COP</Text>
      </View>
      <Text className="mt-2 text-xs text-text-secondary">
        Este valor se usa para calcular tu disponible para hoy.
      </Text>

      <Pressable
        onPress={guardar}
        className="mt-6 items-center rounded-card bg-text-primary-light py-3 dark:bg-text-primary-dark"
      >
        <Text className="text-base font-medium text-bg-light dark:text-bg-dark">
          Guardar
        </Text>
      </Pressable>

      <Text className="mb-2 mt-10 text-sm font-medium text-text-secondary">
        RECORDATORIO DIARIO
      </Text>
      <Pressable
        onPress={() => actualizarRecordatorio(!recordatorioActivo, hora)}
        className="flex-row items-center justify-between rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
      >
        <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
          Recordarme registrar mis gastos
        </Text>
        <View
          className={
            'h-6 w-6 items-center justify-center rounded-full border ' +
            (recordatorioActivo
              ? 'border-text-primary-light bg-text-primary-light dark:border-text-primary-dark dark:bg-text-primary-dark'
              : 'border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none')
          }
        >
          {recordatorioActivo && <Text className="text-xs text-bg-light dark:text-bg-dark">✓</Text>}
        </View>
      </Pressable>

      {recordatorioActivo && (
        <View className="mt-3 flex-row items-center justify-between rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Hora del recordatorio</Text>
          <View className="flex-row items-center gap-4">
            <Pressable onPress={() => cambiarHora(-1)}>
              <Text className="text-lg text-text-primary-light dark:text-text-primary-dark">−</Text>
            </Pressable>
            <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
              {String(hora).padStart(2, '0')}:00
            </Text>
            <Pressable onPress={() => cambiarHora(1)}>
              <Text className="text-lg text-text-primary-light dark:text-text-primary-dark">+</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text className="mb-2 mt-10 text-sm font-medium text-text-secondary">MÁS</Text>
      <View className="mb-10 rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        {ACCESOS_SECUNDARIOS.map((acceso, i) => (
          <Pressable
            key={acceso.screen}
            onPress={() => navigation.navigate(acceso.screen as never)}
            className={
              'flex-row items-center justify-between px-4 py-3 ' +
              (i < ACCESOS_SECUNDARIOS.length - 1 ? 'border-b border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none' : '')
            }
          >
            <View className="flex-row items-center gap-3">
              <Feather name={acceso.icono} size={18} color="#6B6B6B" />
              <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
                {acceso.label}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color="#6B6B6B" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
