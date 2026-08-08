import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { RootStackParamList, TabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import TransaccionesScreen from '../screens/TransaccionesScreen';
import MetasScreen from '../screens/MetasScreen';
import ReportesScreen from '../screens/ReportesScreen';
import AjustesScreen from '../screens/AjustesScreen';
import RegistrarTransaccionScreen from '../screens/RegistrarTransaccionScreen';
import CrearMetaScreen from '../screens/CrearMetaScreen';
import DetalleMetaScreen from '../screens/DetalleMetaScreen';
import PausasScreen from '../screens/PausasScreen';
import CrearTentacionScreen from '../screens/CrearTentacionScreen';
import DetalleTentacionScreen from '../screens/DetalleTentacionScreen';
import DeudasScreen from '../screens/DeudasScreen';
import CrearDeudaScreen from '../screens/CrearDeudaScreen';
import DetalleDeudaScreen from '../screens/DetalleDeudaScreen';
import CrearGastoRecurrenteScreen from '../screens/CrearGastoRecurrenteScreen';
import ResumenGeneralScreen from '../screens/ResumenGeneralScreen';
import DashboardPsicologicoScreen from '../screens/DashboardPsicologicoScreen';
import SaludFinancieraScreen from '../screens/SaludFinancieraScreen';
import RadarHabitosScreen from '../screens/RadarHabitosScreen';
import PropositoScreen from '../screens/PropositoScreen';
import TimelineScreen from '../screens/TimelineScreen';
import CalendarioScreen from '../screens/CalendarioScreen';
import DiarioScreen from '../screens/DiarioScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const ICONS: Record<keyof TabParamList, keyof typeof Feather.glyphMap> = {
  Home: 'home',
  Transacciones: 'list',
  Metas: 'flag',
  Reportes: 'bar-chart-2',
  Ajustes: 'settings',
};

function Tabs() {
  const esOscuro = useColorScheme() === 'dark';
  const tema = esOscuro ? colors.dark : colors.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tema.textPrimary,
        tabBarInactiveTintColor: tema.textSecondary,
        tabBarStyle: {
          backgroundColor: tema.bg,
          borderTopColor: tema.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Feather name={ICONS[route.name as keyof TabParamList]} size={size - 4} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Transacciones" component={TransaccionesScreen} options={{ title: 'Transacciones' }} />
      <Tab.Screen name="Metas" component={MetasScreen} options={{ title: 'Metas' }} />
      <Tab.Screen name="Reportes" component={ReportesScreen} options={{ title: 'Reportes' }} />
      <Tab.Screen name="Ajustes" component={AjustesScreen} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const esOscuro = useColorScheme() === 'dark';
  const tema = esOscuro ? colors.dark : colors.light;

  const navTheme = {
    ...(esOscuro ? DarkTheme : DefaultTheme),
    colors: {
      ...(esOscuro ? DarkTheme.colors : DefaultTheme.colors),
      background: tema.bg,
      card: tema.bg,
      border: tema.border,
      text: tema.textPrimary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen
          name="RegistrarTransaccion"
          component={RegistrarTransaccionScreen}
          options={({ route }) => ({
            presentation: 'modal',
            headerShown: true,
            title: route.params?.transaccionId !== undefined ? 'Editar gasto' : 'Registrar gasto',
          })}
        />
        <Stack.Screen
          name="CrearMeta"
          component={CrearMetaScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Nueva meta',
          }}
        />
        <Stack.Screen
          name="DetalleMeta"
          component={DetalleMetaScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Meta',
          }}
        />
        <Stack.Screen
          name="Pausas"
          component={PausasScreen}
          options={{
            headerShown: true,
            title: 'Pausa de 24h',
          }}
        />
        <Stack.Screen
          name="CrearTentacion"
          component={CrearTentacionScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Nueva pausa',
          }}
        />
        <Stack.Screen
          name="DetalleTentacion"
          component={DetalleTentacionScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Pausa de 24h',
          }}
        />
        <Stack.Screen
          name="Deudas"
          component={DeudasScreen}
          options={{
            headerShown: true,
            title: 'Deudas y gastos fijos',
          }}
        />
        <Stack.Screen
          name="CrearDeuda"
          component={CrearDeudaScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Nueva deuda',
          }}
        />
        <Stack.Screen
          name="DetalleDeuda"
          component={DetalleDeudaScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Deuda',
          }}
        />
        <Stack.Screen
          name="CrearGastoRecurrente"
          component={CrearGastoRecurrenteScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Nuevo gasto fijo',
          }}
        />
        <Stack.Screen
          name="ResumenGeneral"
          component={ResumenGeneralScreen}
          options={{
            headerShown: true,
            title: 'Resumen general',
          }}
        />
        <Stack.Screen
          name="DashboardPsicologico"
          component={DashboardPsicologicoScreen}
          options={{
            headerShown: true,
            title: 'Dashboard psicológico',
          }}
        />
        <Stack.Screen
          name="SaludFinanciera"
          component={SaludFinancieraScreen}
          options={{
            headerShown: true,
            title: 'Salud Financiera',
          }}
        />
        <Stack.Screen
          name="RadarHabitos"
          component={RadarHabitosScreen}
          options={{
            headerShown: true,
            title: 'Radar de Hábitos',
          }}
        />
        <Stack.Screen
          name="Proposito"
          component={PropositoScreen}
          options={{
            headerShown: true,
            title: '¿Por qué hago esto?',
          }}
        />
        <Stack.Screen
          name="Timeline"
          component={TimelineScreen}
          options={{
            headerShown: true,
            title: 'Timeline financiero',
          }}
        />
        <Stack.Screen
          name="Calendario"
          component={CalendarioScreen}
          options={{
            headerShown: true,
            title: 'Calendario financiero',
          }}
        />
        <Stack.Screen
          name="Diario"
          component={DiarioScreen}
          options={{
            headerShown: true,
            title: 'Diario financiero',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
