import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Transacciones: undefined;
  Metas: undefined;
  Reportes: undefined;
  Ajustes: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  RegistrarTransaccion: { transaccionId?: number } | undefined;
  CrearMeta: undefined;
  DetalleMeta: { metaId: number };
  Pausas: undefined;
  CrearTentacion: { montoSugerido?: number };
  DetalleTentacion: { tentacionId: number };
  Deudas: undefined;
  CrearDeuda: undefined;
  DetalleDeuda: { deudaId: number };
  CrearGastoRecurrente: undefined;
  ResumenGeneral: undefined;
  DashboardPsicologico: undefined;
  SaludFinanciera: undefined;
  RadarHabitos: undefined;
  Proposito: undefined;
  Timeline: undefined;
  Calendario: undefined;
  Diario: undefined;
};
