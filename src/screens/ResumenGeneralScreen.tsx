import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useUsuarioStore } from '../store/useUsuarioStore';
import {
  obtenerAportesDelMes,
  obtenerPagosDeudaDelMes,
  obtenerTotalAhorroMetas,
  obtenerTotalDeudaPendiente,
  obtenerTransaccionesDelMes,
} from '../db/queries';
import { formatoMoneda, mesPrefijo, nombreMes } from '../utils/finance';

export default function ResumenGeneralScreen() {
  const usuario = useUsuarioStore((s) => s.usuario);
  const [ahorroTotal, setAhorroTotal] = useState(0);
  const [deudaTotal, setDeudaTotal] = useState(0);
  const [gastoMes, setGastoMes] = useState(0);
  const [ahorroMes, setAhorroMes] = useState(0);
  const [pagosDeudaMes, setPagosDeudaMes] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const prefijo = mesPrefijo();
      const [ahorro, deuda, transacciones, aportes, pagos] = await Promise.all([
        obtenerTotalAhorroMetas(),
        obtenerTotalDeudaPendiente(),
        obtenerTransaccionesDelMes(prefijo),
        obtenerAportesDelMes(prefijo),
        obtenerPagosDeudaDelMes(prefijo),
      ]);
      setAhorroTotal(ahorro);
      setDeudaTotal(deuda);
      setGastoMes(transacciones.reduce((sum, t) => sum + t.monto, 0));
      setAhorroMes(aportes);
      setPagosDeudaMes(pagos);
      setCargando(false);
    })();
  }, []);

  if (cargando) return null;

  const balanceNeto = ahorroTotal - deudaTotal;
  const ingresoMensual = usuario?.ingreso_mensual ?? 0;

  return (
    <ScrollView className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="text-sm font-medium text-text-secondary">AHORRO TOTAL</Text>
      <Text className="mt-1 text-4xl font-semibold text-accent-success">
        {formatoMoneda(ahorroTotal)}
      </Text>

      <Text className="mb-1 mt-6 text-sm font-medium text-text-secondary">DEUDA TOTAL</Text>
      <Text className="text-4xl font-semibold text-accent-alert">{formatoMoneda(deudaTotal)}</Text>

      <View className="mt-6 rounded-card border border-border-light bg-surface-light shadow-sm p-4 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <Text className="text-sm text-text-secondary">Balance neto</Text>
        <Text className="mt-1 text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
          {formatoMoneda(balanceNeto)}
        </Text>
        <Text className="mt-1 text-xs text-text-secondary">Ahorro total menos deuda total.</Text>
      </View>

      <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">
        {nombreMes(mesPrefijo()).toUpperCase()}
      </Text>
      <View className="rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Ingreso mensual</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {formatoMoneda(ingresoMensual)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Gasto del mes</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {formatoMoneda(gastoMes)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
          <Text className="text-sm text-text-secondary">Aportes a metas</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {formatoMoneda(ahorroMes)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-sm text-text-secondary">Pagos de deuda</Text>
          <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
            {formatoMoneda(pagosDeudaMes)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
