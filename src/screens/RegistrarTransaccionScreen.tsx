import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCategoriasStore } from '../store/useCategoriasStore';
import { useTransaccionesStore } from '../store/useTransaccionesStore';
import { useUsuarioStore } from '../store/useUsuarioStore';
import { obtenerAportesRecientesTodasMetas, obtenerTodasLasMetas } from '../db/queries';
import { calcularImpactoEnMetas, type ImpactoMeta } from '../utils/intervencion';
import { calcularDisponibleHoy, formatoMoneda } from '../utils/finance';
import type { RootStackParamList } from '../navigation/types';
import type { Meta } from '../types';

const CONTEXTOS_EMOCIONALES = ['Cansado', 'Estresado', 'Con hambre', 'Tranquilo'];

export default function RegistrarTransaccionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'RegistrarTransaccion'>>();
  const transaccionId = route.params?.transaccionId;
  const editando = transaccionId !== undefined;
  const insets = useSafeAreaInsets();

  const categorias = useCategoriasStore((s) => s.categorias);
  const cargarCategorias = useCategoriasStore((s) => s.cargar);
  const transaccionExistente = useTransaccionesStore((s) =>
    editando ? s.transacciones.find((t) => t.id === transaccionId) : undefined
  );
  const agregar = useTransaccionesStore((s) => s.agregar);
  const actualizar = useTransaccionesStore((s) => s.actualizar);
  const eliminar = useTransaccionesStore((s) => s.eliminar);
  const gastoAcumuladoMes = useTransaccionesStore((s) => s.gastoAcumuladoMes);
  const ingresoMensual = useUsuarioStore((s) => s.usuario?.ingreso_mensual ?? 0);

  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [nota, setNota] = useState('');
  const [esImpulso, setEsImpulso] = useState(false);
  const [contextoEmocional, setContextoEmocional] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [metasActivas, setMetasActivas] = useState<Meta[]>([]);
  const [aportes30d, setAportes30d] = useState<Awaited<ReturnType<typeof obtenerAportesRecientesTodasMetas>>>([]);

  useEffect(() => {
    if (categorias.length === 0) {
      cargarCategorias();
    }
    (async () => {
      const [metas, aportes] = await Promise.all([
        obtenerTodasLasMetas(),
        obtenerAportesRecientesTodasMetas(30),
      ]);
      setMetasActivas(metas.filter((m) => m.estado === 'activa').sort((a, b) => a.prioridad - b.prioridad));
      setAportes30d(aportes);
    })();
  }, []);

  useEffect(() => {
    if (transaccionExistente) {
      setMonto(String(transaccionExistente.monto));
      setCategoriaId(transaccionExistente.categoria_id);
      setNota(transaccionExistente.nota);
      setEsImpulso(transaccionExistente.es_impulso === 1);
      setContextoEmocional(transaccionExistente.contexto_emocional);
    }
  }, [transaccionExistente?.id]);

  useEffect(() => {
    if (!editando && categorias.length > 0 && categoriaId === null) {
      setCategoriaId(categorias[0].id);
    }
  }, [categorias]);

  const montoNumerico = Number(monto.replace(/[^0-9]/g, ''));
  const puedeGuardar = montoNumerico > 0 && categoriaId !== null && !guardando;

  const disponibleHoy = calcularDisponibleHoy(ingresoMensual, gastoAcumuladoMes());
  const disponibleDespues = disponibleHoy - montoNumerico;
  const impactoMetas: ImpactoMeta[] = calcularImpactoEnMetas(montoNumerico, metasActivas, aportes30d);

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    if (editando) {
      await actualizar(transaccionId, { monto: montoNumerico, categoriaId, nota, esImpulso, contextoEmocional });
    } else {
      await agregar({ monto: montoNumerico, categoriaId, nota, esImpulso, contextoEmocional });
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const confirmarEliminar = () => {
    if (!editando) return;
    Alert.alert('Eliminar gasto', '¿Eliminar este gasto? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminar(transaccionId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <TextInput
        value={monto}
        onChangeText={setMonto}
        keyboardType="number-pad"
        placeholder="$0"
        placeholderTextColor="#6B6B6B"
        autoFocus
        className="text-5xl font-semibold text-text-primary-light dark:text-text-primary-dark"
      />

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">CATEGORÍA</Text>
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

      {montoNumerico > 0 && (
        <View className="mt-6 rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="mb-2 text-xs font-medium text-text-secondary">IMPACTO DE ESTE GASTO</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-text-secondary">Disponible después</Text>
            <Text
              className={
                'text-sm font-medium ' +
                (disponibleDespues < 0
                  ? 'text-accent-alert'
                  : 'text-text-primary-light dark:text-text-primary-dark')
              }
            >
              {formatoMoneda(disponibleDespues)}
            </Text>
          </View>
          {impactoMetas.map((im) => (
            <View key={im.metaId} className="mt-1.5 flex-row items-center justify-between">
              <Text className="text-sm text-text-secondary">
                Prioridad {im.prioridad} · {im.nombre}
              </Text>
              <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
                {im.diasRetraso !== null ? `+${im.diasRetraso}d` : 'Sin datos'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">NOTA (OPCIONAL)</Text>
      <TextInput
        value={nota}
        onChangeText={setNota}
        placeholder="Ej. Almuerzo con amigos"
        placeholderTextColor="#6B6B6B"
        className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
      />

      <Pressable
        onPress={() => setEsImpulso((v) => !v)}
        className="mt-6 flex-row items-center justify-between rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
      >
        <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
          Fue una compra por impulso
        </Text>
        <View
          className={
            'h-6 w-6 items-center justify-center rounded-full border ' +
            (esImpulso
              ? 'border-accent-alert bg-accent-alert'
              : 'border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none')
          }
        >
          {esImpulso && <Text className="text-xs text-white">✓</Text>}
        </View>
      </Pressable>

      {esImpulso && (
        <>
          <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">
            ¿CÓMO TE SIENTES AHORA? (OPCIONAL)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CONTEXTOS_EMOCIONALES.map((op) => {
              const seleccionado = contextoEmocional === op;
              return (
                <Pressable
                  key={op}
                  onPress={() => setContextoEmocional(seleccionado ? null : op)}
                  className={
                    'rounded-card border px-4 py-2 ' +
                    (seleccionado
                      ? 'border-text-primary-light bg-text-primary-light dark:border-text-primary-dark dark:bg-text-primary-dark'
                      : 'border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none')
                  }
                >
                  <Text
                    className={
                      seleccionado
                        ? 'text-sm text-bg-light dark:text-bg-dark'
                        : 'text-sm text-text-primary-light dark:text-text-primary-dark'
                    }
                  >
                    {op}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {esImpulso && (
        <Pressable
          onPress={() =>
            navigation.replace('CrearTentacion', {
              montoSugerido: montoNumerico > 0 ? montoNumerico : undefined,
            })
          }
          className="mt-4 items-center py-2"
        >
          <Text className="text-sm text-text-secondary">
            ¿No estás seguro? Prueba la pausa de 24h
          </Text>
        </Pressable>
      )}

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
          {editando ? 'Guardar cambios' : 'Guardar gasto'}
        </Text>
      </Pressable>

      {editando && (
        <Pressable onPress={confirmarEliminar} className="mt-4 items-center py-2">
          <Text className="text-sm text-accent-alert">Eliminar gasto</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
