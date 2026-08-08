import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCategoriasStore } from '../store/useCategoriasStore';
import { useGastosRecurrentesStore } from '../store/useGastosRecurrentesStore';

export default function CrearGastoRecurrenteScreen() {
  const navigation = useNavigation();
  const categorias = useCategoriasStore((s) => s.categorias);
  const cargarCategorias = useCategoriasStore((s) => s.cargar);
  const crear = useGastosRecurrentesStore((s) => s.crear);

  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [diaDelMes, setDiaDelMes] = useState('1');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (categorias.length === 0) cargarCategorias();
  }, []);

  useEffect(() => {
    if (categorias.length > 0 && categoriaId === null) {
      setCategoriaId(categorias[0].id);
    }
  }, [categorias]);

  const montoNumerico = Number(monto.replace(/[^0-9]/g, ''));
  const diaNumerico = Math.min(28, Math.max(1, Number(diaDelMes.replace(/[^0-9]/g, '')) || 1));
  const puedeGuardar = nombre.trim().length > 0 && montoNumerico > 0 && !guardando;

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    await crear({ nombre: nombre.trim(), monto: montoNumerico, categoriaId, diaDelMes: diaNumerico });
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="mb-2 text-sm font-medium text-text-secondary">NOMBRE</Text>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Arriendo, Netflix..."
        placeholderTextColor="#6B6B6B"
        autoFocus
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
      />

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">MONTO</Text>
      <TextInput
        value={monto}
        onChangeText={setMonto}
        keyboardType="number-pad"
        placeholder="$0"
        placeholderTextColor="#6B6B6B"
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-2xl font-semibold text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
      />

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">CATEGORÍA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {categorias.map((cat) => {
            const seleccionada = cat.id === categoriaId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoriaId(cat.id)}
                className={
                  'rounded-card border px-4 py-2 ' +
                  (seleccionada
                    ? 'border-text-primary-light bg-text-primary-light dark:border-text-primary-dark dark:bg-text-primary-dark'
                    : 'border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none')
                }
              >
                <Text
                  className={
                    seleccionada
                      ? 'text-bg-light dark:text-bg-dark'
                      : 'text-text-primary-light dark:text-text-primary-dark'
                  }
                >
                  {cat.nombre}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">DÍA DEL MES (1-28)</Text>
      <TextInput
        value={diaDelMes}
        onChangeText={setDiaDelMes}
        keyboardType="number-pad"
        placeholder="1"
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
          Crear gasto recurrente
        </Text>
      </Pressable>
    </View>
  );
}
