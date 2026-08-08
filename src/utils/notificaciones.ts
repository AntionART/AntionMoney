import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CANAL_ANDROID = 'antion-default';

let handlerConfigurado = false;

function configurarHandler() {
  if (handlerConfigurado) return;
  handlerConfigurado = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function inicializarNotificaciones() {
  if (Platform.OS === 'web') return;
  configurarHandler();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
      name: 'Antion',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function pedirPermisosNotificaciones(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  const solicitado = await Notifications.requestPermissionsAsync();
  return solicitado.granted;
}

export async function programarNotificacionTentacionDisponible(
  descripcion: string,
  fechaDisponible: Date
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const concedido = await pedirPermisosNotificaciones();
  if (!concedido) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tu pausa de 24h terminó',
      body: `¿Todavía quieres "${descripcion}"? Decide ahora con la mente más clara.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fechaDisponible,
    },
  });
}

export async function cancelarNotificacion(notificationId: string | null) {
  if (Platform.OS === 'web' || !notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function programarRecordatorioDiario(hora: number): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const concedido = await pedirPermisosNotificaciones();
  if (!concedido) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Antion',
      body: '¿Registraste los gastos de hoy? Un minuto ahora te ahorra sorpresas después.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hora,
      minute: 0,
    },
  });
}

export async function cancelarRecordatorioDiario(notificationId: string | null) {
  if (Platform.OS === 'web' || !notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
