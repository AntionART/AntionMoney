import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, useColorScheme } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useUsuarioStore } from '../store/useUsuarioStore';
import { useTransaccionesStore } from '../store/useTransaccionesStore';
import { useCategoriasStore } from '../store/useCategoriasStore';
import { useTentacionesStore } from '../store/useTentacionesStore';
import { useDeudasStore } from '../store/useDeudasStore';
import { useGastosRecurrentesStore } from '../store/useGastosRecurrentesStore';
import { useDisciplinaStore } from '../store/useDisciplinaStore';
import { useSaludFinancieraStore } from '../store/useSaludFinancieraStore';
import { useModoCicloVidaStore } from '../store/useModoCicloVidaStore';
import { calcularDisponibleHoy, diasHasta, fechaISO, formatoMoneda } from '../utils/finance';
import { generarMensajeDelDia } from '../utils/mensajesAntion';
import { ETIQUETA_MODO, SUGERENCIA_MODO } from '../utils/modoCicloVida';
import { useCountUp } from '../utils/useCountUp';
import type { RootStackParamList } from '../navigation/types';
import type { Transaccion } from '../types';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const usuario = useUsuarioStore((s) => s.usuario);
  const cargarUsuario = useUsuarioStore((s) => s.cargar);
  const transacciones = useTransaccionesStore((s) => s.transacciones);
  const cargarMes = useTransaccionesStore((s) => s.cargarMes);
  const gastoAcumuladoMes = useTransaccionesStore((s) => s.gastoAcumuladoMes);
  const categorias = useCategoriasStore((s) => s.categorias);
  const tentaciones = useTentacionesStore((s) => s.tentaciones);
  const cargarTentaciones = useTentacionesStore((s) => s.cargar);
  const deudas = useDeudasStore((s) => s.deudas);
  const cargarDeudas = useDeudasStore((s) => s.cargar);
  const pendientesRecurrentes = useGastosRecurrentesStore((s) => s.pendientes);
  const cargarPendientesRecurrentes = useGastosRecurrentesStore((s) => s.cargarPendientes);
  const disciplina = useDisciplinaStore((s) => s.resultado);
  const salud = useSaludFinancieraStore((s) => s.resultado);
  const calcularSalud = useSaludFinancieraStore((s) => s.calcular);
  const modoActivo = useModoCicloVidaStore((s) => s.activo);
  const evaluarModo = useModoCicloVidaStore((s) => s.evaluar);
  const esOscuro = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [ahora] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      cargarUsuario();
      cargarMes();
      cargarTentaciones();
      cargarDeudas();
      cargarPendientesRecurrentes();
      (async () => {
        await calcularSalud();
        await evaluarModo();
      })();
    }, [])
  );

  const ingresoMensual = usuario?.ingreso_mensual ?? 0;
  const disponibleHoy = calcularDisponibleHoy(ingresoMensual, gastoAcumuladoMes());
  const disponibleAnimado = useCountUp(Math.round(disponibleHoy));
  const saludAnimada = useCountUp(salud?.indice ?? 0);
  const sobregasto = disponibleHoy < 0;

  const nombreCategoria = (id: number | null) =>
    categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría';

  const ultimas = transacciones.slice(0, 5);

  const proximosPagos = useMemo(() => {
    const deudasProximas = deudas
      .filter((d) => d.estado === 'activa' && d.fecha_proxima_cuota)
      .filter((d) => diasHasta(d.fecha_proxima_cuota as string, ahora) <= 7)
      .map((d) => ({
        id: `deuda-${d.id}`,
        nombre: d.nombre,
        monto: Math.round(d.monto_total / d.numero_cuotas),
        subtitulo: d.fecha_proxima_cuota as string,
      }));
    const recurrentesPendientes = pendientesRecurrentes.map((r) => ({
      id: `recurrente-${r.id}`,
      nombre: r.nombre,
      monto: r.monto,
      subtitulo: 'Pendiente este mes',
    }));
    return [...deudasProximas, ...recurrentesPendientes].slice(0, 3);
  }, [deudas, pendientesRecurrentes, ahora]);

  const tentacionesDisponibles = tentaciones.filter(
    (t) => new Date(t.fecha_disponible).getTime() <= ahora.getTime()
  ).length;

  const gastosImpulsoHoy = transacciones.filter(
    (t) => t.fecha === fechaISO(ahora) && t.es_impulso
  ).length;

  const mensaje = generarMensajeDelDia({
    disponibleHoy,
    ingresoConfigurado: ingresoMensual > 0,
    pagosProximos: proximosPagos.length,
    tentacionesDisponibles,
    gastosImpulsoHoy,
  });

  const renderItem = ({ item }: { item: Transaccion }) => (
    <Pressable
      onPress={() => navigation.navigate('RegistrarTransaccion', { transaccionId: item.id })}
      className="flex-row items-center justify-between py-3 active:opacity-60"
    >
      <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
        {nombreCategoria(item.categoria_id)}
      </Text>
      <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
        {formatoMoneda(item.monto)}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 16 }}>
        {salud && (
          <Pressable onPress={() => navigation.navigate('SaludFinanciera')} className="mb-6 active:opacity-70">
            <Text className="text-sm font-medium text-text-secondary">SALUD FINANCIERA</Text>
            <Text className="mt-1 text-4xl font-semibold text-text-primary-light dark:text-text-primary-dark">
              {saludAnimada}%
            </Text>
            <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
              <View
                className={
                  'h-1.5 rounded-full ' +
                  (salud.indice >= 60
                    ? 'bg-accent-success'
                    : salud.indice >= 40
                      ? 'bg-text-primary-light dark:bg-text-primary-dark'
                      : 'bg-accent-alert')
                }
                style={{ width: `${salud.indice}%` }}
              />
            </View>
          </Pressable>
        )}

        {modoActivo && modoActivo.modo !== 'normal' && (
          <View className="mb-6 rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
            <Text className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              {ETIQUETA_MODO[modoActivo.modo]}
            </Text>
            <Text className="mt-1 text-xs text-text-secondary">{modoActivo.causa}</Text>
            {SUGERENCIA_MODO[modoActivo.modo] ? (
              <Text className="mt-1 text-xs text-text-secondary">{SUGERENCIA_MODO[modoActivo.modo]}</Text>
            ) : null}
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-text-secondary">DISPONIBLE PARA HOY</Text>
          {disciplina && (
            <Pressable
              onPress={() => navigation.navigate('DashboardPsicologico')}
              className="flex-row items-center gap-1.5 rounded-card border border-border-light bg-surface-light shadow-sm px-2.5 py-1 active:opacity-70 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
            >
              <View
                className={
                  'h-2 w-2 rounded-full ' +
                  (disciplina.indice >= 60
                    ? 'bg-accent-success'
                    : disciplina.indice >= 40
                      ? 'bg-text-secondary'
                      : 'bg-accent-alert')
                }
              />
              <Text className="text-xs text-text-secondary">{disciplina.estado}</Text>
            </Pressable>
          )}
        </View>

        <Text
          className={
            'mt-2 text-5xl font-semibold ' +
            (sobregasto ? 'text-accent-alert' : 'text-text-primary-light dark:text-text-primary-dark')
          }
        >
          {formatoMoneda(disponibleAnimado)}
        </Text>

        <Text
          className={
            'mt-3 text-sm ' +
            (mensaje.tono === 'alerta'
              ? 'text-accent-alert'
              : mensaje.tono === 'logro'
                ? 'text-accent-success'
                : 'text-text-secondary')
          }
        >
          {mensaje.texto}
        </Text>

        {ingresoMensual === 0 && (
          <Pressable
            onPress={() => navigation.navigate('Tabs', { screen: 'Ajustes' })}
            className="mt-3 self-start rounded-card border border-border-light bg-surface-light shadow-sm px-3 py-1.5 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
          >
            <Text className="text-xs text-text-secondary">
              Configura tu ingreso mensual en Ajustes →
            </Text>
          </Pressable>
        )}

        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={() => navigation.navigate('Pausas')}
            className="flex-1 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 active:opacity-70 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
          >
            <Feather name="pause-circle" size={18} color="#6B6B6B" />
            <Text className="mt-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              Pausa de 24h
            </Text>
            <Text className="mt-0.5 text-xs text-text-secondary">
              {tentaciones.length > 0 ? `${tentaciones.length} pendiente${tentaciones.length === 1 ? '' : 's'}` : 'Ver'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ResumenGeneral')}
            className="flex-1 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 active:opacity-70 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
          >
            <Feather name="pie-chart" size={18} color="#6B6B6B" />
            <Text className="mt-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              Resumen general
            </Text>
            <Text className="mt-0.5 text-xs text-text-secondary">Ver</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Deudas')}
          className="mt-3 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 active:opacity-70 dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Feather name="calendar" size={16} color="#6B6B6B" />
              <Text className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Próximos pagos
              </Text>
            </View>
            <Text className="text-sm text-text-secondary">Ver todos →</Text>
          </View>
          {proximosPagos.length === 0 ? (
            <Text className="mt-1 text-xs text-text-secondary">Nada pendiente esta semana.</Text>
          ) : (
            proximosPagos.map((p) => (
              <View key={p.id} className="mt-2 flex-row items-center justify-between">
                <Text className="text-xs text-text-secondary">
                  {p.nombre} · {p.subtitulo}
                </Text>
                <Text className="text-xs text-text-primary-light dark:text-text-primary-dark">
                  {formatoMoneda(p.monto)}
                </Text>
              </View>
            ))
          )}
        </Pressable>

        <View className="mt-6 flex-1">
          <Text className="mb-1 text-sm font-medium text-text-secondary">
            ÚLTIMOS GASTOS
          </Text>
          <FlatList
            data={ultimas}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text className="pt-6 text-sm text-text-secondary">
                Aún no has registrado gastos hoy.
              </Text>
            }
          />
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate('RegistrarTransaccion')}
        className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full bg-text-primary-light shadow-lg active:opacity-80 dark:bg-text-primary-dark"
      >
        <Feather name="plus" size={26} color={esOscuro ? '#0D0D0D' : '#FFFFFF'} />
      </Pressable>
    </View>
  );
}
