import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTentacionesStore } from '../store/useTentacionesStore';
import { useCategoriasStore } from '../store/useCategoriasStore';
import { formatoCuentaRegresiva, formatoMoneda } from '../utils/finance';
import type { RootStackParamList } from '../navigation/types';

export default function DetalleTentacionScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'DetalleTentacion'>>();
  const { tentacionId } = route.params;

  const tentacion = useTentacionesStore((s) => s.tentaciones.find((t) => t.id === tentacionId));
  const resolverComprar = useTentacionesStore((s) => s.resolverComprar);
  const resolverDescartar = useTentacionesStore((s) => s.resolverDescartar);
  const categorias = useCategoriasStore((s) => s.categorias);

  const [ahora, setAhora] = useState(new Date());
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (categorias.length > 0 && categoriaId === null) {
      setCategoriaId(categorias[0].id);
    }
  }, [categorias]);

  if (!tentacion) return null;

  const fechaDisponible = new Date(tentacion.fecha_disponible);
  const disponible = fechaDisponible.getTime() <= ahora.getTime();

  const comprar = async () => {
    setProcesando(true);
    await resolverComprar(tentacionId, categoriaId);
    navigation.goBack();
  };

  const descartar = async () => {
    setProcesando(true);
    await resolverDescartar(tentacionId);
    navigation.goBack();
  };

  return (
    <ScrollView className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
        {tentacion.descripcion}
      </Text>
      <Text className="mt-1 text-lg text-text-secondary">
        {formatoMoneda(tentacion.monto_estimado)}
      </Text>

      <View className="mt-6 rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <Text className="text-sm text-text-secondary">
          {disponible ? 'Tu pausa de 24h terminó' : 'Disponible en'}
        </Text>
        <Text className="mt-1 text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
          {formatoCuentaRegresiva(fechaDisponible, ahora)}
        </Text>
      </View>

      {disponible ? (
        <>
          <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">
            SI LO COMPRASTE, ELIGE LA CATEGORÍA
          </Text>
          <View className="flex-row flex-wrap gap-2">
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

          <Pressable
            onPress={comprar}
            disabled={procesando}
            className="mt-8 items-center rounded-card bg-text-primary-light py-4 dark:bg-text-primary-dark"
          >
            <Text className="text-base font-medium text-bg-light dark:text-bg-dark">
              Sí, lo compré
            </Text>
          </Pressable>
          <Pressable
            onPress={descartar}
            disabled={procesando}
            className="mb-6 mt-3 items-center rounded-card border border-border-light bg-surface-light shadow-sm py-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
          >
            <Text className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">
              Ya no lo quiero
            </Text>
          </Pressable>
        </>
      ) : (
        <Text className="mt-6 text-sm text-text-secondary">
          Vuelve cuando termine la cuenta regresiva para decidir con calma.
        </Text>
      )}
    </ScrollView>
  );
}
