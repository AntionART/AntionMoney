import './global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from './src/db/client';
import { migrateDbIfNeeded } from './src/db/migrations';
import { useUsuarioStore } from './src/store/useUsuarioStore';
import { useCategoriasStore } from './src/store/useCategoriasStore';
import { inicializarNotificaciones } from './src/utils/notificaciones';
import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';

export default function App() {
  const [listo, setListo] = useState(false);
  const usuario = useUsuarioStore((s) => s.usuario);
  const cargarUsuario = useUsuarioStore((s) => s.cargar);
  const cargarCategorias = useCategoriasStore((s) => s.cargar);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      await migrateDbIfNeeded(db);
      await Promise.all([cargarUsuario(), cargarCategorias(), inicializarNotificaciones()]);
      setListo(true);
    })();
  }, []);

  if (!listo) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-light dark:bg-bg-dark">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {usuario?.onboarding_completado === 0 ? <OnboardingScreen /> : <RootNavigator />}
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
