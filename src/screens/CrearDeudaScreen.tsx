import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDeudasStore } from '../store/useDeudasStore';

export default function CrearDeudaScreen() {
  const navigation = useNavigation();
  const crear = useDeudasStore((s) => s.crear);

  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [contraparte, setContraparte] = useState('');
  const [cuotas, setCuotas] = useState('1');
  const [fechaProximaCuota, setFechaProximaCuota] = useState('');
  const [guardando, setGuardando] = useState(false);

  const montoNumerico = Number(monto.replace(/[^0-9]/g, ''));
  const cuotasNumerico = Math.max(1, Number(cuotas.replace(/[^0-9]/g, '')) || 1);
  const puedeGuardar = nombre.trim().length > 0 && montoNumerico > 0 && !guardando;

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    await crear({
      nombre: nombre.trim(),
      montoTotal: montoNumerico,
      contraparte: contraparte.trim(),
      tasaInteres: null,
      numeroCuotas: cuotasNumerico,
      fechaProximaCuota: fechaProximaCuota.trim() ? fechaProximaCuota.trim() : null,
    });
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="mb-2 text-sm font-medium text-text-secondary">NOMBRE DE LA DEUDA</Text>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Préstamo tarjeta"
        placeholderTextColor="#6B6B6B"
        autoFocus
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
      />

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">MONTO TOTAL</Text>
      <TextInput
        value={monto}
        onChangeText={setMonto}
        keyboardType="number-pad"
        placeholder="$0"
        placeholderTextColor="#6B6B6B"
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-2xl font-semibold text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
      />

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">CONTRAPARTE (OPCIONAL)</Text>
      <TextInput
        value={contraparte}
        onChangeText={setContraparte}
        placeholder="Ej. Banco, un amigo..."
        placeholderTextColor="#6B6B6B"
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
      />

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">NÚMERO DE CUOTAS</Text>
      <TextInput
        value={cuotas}
        onChangeText={setCuotas}
        keyboardType="number-pad"
        placeholder="1"
        placeholderTextColor="#6B6B6B"
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
      />

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">
        PRÓXIMA FECHA DE PAGO (OPCIONAL)
      </Text>
      <TextInput
        value={fechaProximaCuota}
        onChangeText={setFechaProximaCuota}
        placeholder="AAAA-MM-DD"
        placeholderTextColor="#6B6B6B"
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
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
          Crear deuda
        </Text>
      </Pressable>
    </View>
  );
}
