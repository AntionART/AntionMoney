import { useState } from 'react';
import { View, Text, TextInput, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useUsuarioStore } from '../store/useUsuarioStore';

const PASOS = 3;

export default function OnboardingScreen() {
  const completarOnboarding = useUsuarioStore((s) => s.completarOnboarding);
  const actualizarProposito = useUsuarioStore((s) => s.actualizarProposito);

  const insets = useSafeAreaInsets();
  const [paso, setPaso] = useState(0);
  const [nombre, setNombre] = useState('');
  const [ingreso, setIngreso] = useState('');
  const [proposito, setProposito] = useState('');
  const [guardando, setGuardando] = useState(false);

  const ingresoNumerico = Number(ingreso.replace(/[^0-9]/g, ''));

  const puedeAvanzar = paso === 1 ? ingresoNumerico >= 0 : true;

  const siguiente = async () => {
    if (paso < PASOS - 1) {
      setPaso(paso + 1);
      return;
    }
    setGuardando(true);
    await completarOnboarding(nombre.trim(), ingresoNumerico);
    if (proposito.trim()) {
      await actualizarProposito(proposito.trim());
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View className="flex-1 bg-bg-light px-6 dark:bg-bg-dark" style={{ paddingTop: insets.top + 48 }}>
      <View className="mb-10 flex-row gap-1.5">
        {Array.from({ length: PASOS }).map((_, i) => (
          <View
            key={i}
            className={
              'h-1 flex-1 rounded-full ' +
              (i <= paso ? 'bg-text-primary-light dark:bg-text-primary-dark' : 'bg-border-light dark:bg-border-dark')
            }
          />
        ))}
      </View>

      {paso === 0 && (
        <View>
          <Image
            source={require('../../assets/splash-icon.png')}
            style={{ width: 88, height: 88 }}
            resizeMode="contain"
          />
          <Text className="mt-4 text-3xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            Antion
          </Text>
          <Text className="mt-4 text-base text-text-secondary">
            Antion no es una app para registrar gastos. Es un sistema que te ayuda a construir
            disciplina financiera con pequeños cambios diarios.
          </Text>
          <Text className="mt-4 text-base text-text-secondary">
            El dinero es consecuencia — los hábitos son la causa. Vamos a trabajar sobre tus
            decisiones, no solo sobre los resultados.
          </Text>
        </View>
      )}

      {paso === 1 && (
        <View>
          <Text className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            Cuéntame un poco de ti
          </Text>
          <Text className="mb-2 mt-8 text-sm font-medium text-text-secondary">TU NOMBRE (OPCIONAL)</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="¿Cómo te llamas?"
            placeholderTextColor="#6B6B6B"
            className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
          />

          <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">INGRESO MENSUAL</Text>
          <TextInput
            value={ingreso}
            onChangeText={setIngreso}
            keyboardType="number-pad"
            placeholder="$0"
            placeholderTextColor="#6B6B6B"
            className="rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-2xl font-semibold text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
          />
          <Text className="mt-2 text-xs text-text-secondary">
            Lo uso para calcular tu disponible para hoy. Puedes cambiarlo cuando quieras en
            Ajustes.
          </Text>
        </View>
      )}

      {paso === 2 && (
        <View>
          <Text className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            ¿Por qué haces esto?
          </Text>
          <Text className="mt-2 text-sm text-text-secondary">
            Opcional, pero útil: en los momentos difíciles, te lo recordamos.
          </Text>
          <TextInput
            value={proposito}
            onChangeText={setProposito}
            placeholder="Ej. Salir de deudas, tranquilidad financiera..."
            placeholderTextColor="#6B6B6B"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="mt-6 min-h-[100px] rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
          />
        </View>
      )}

      <View className="flex-1" />

      <Pressable
        onPress={siguiente}
        disabled={!puedeAvanzar || guardando}
        className={
          'mb-10 items-center rounded-card py-4 ' +
          (puedeAvanzar && !guardando
            ? 'bg-text-primary-light dark:bg-text-primary-dark'
            : 'bg-border-light dark:bg-border-dark')
        }
      >
        <Text className="text-base font-medium text-bg-light dark:text-bg-dark">
          {paso < PASOS - 1 ? 'Continuar' : 'Empezar'}
        </Text>
      </Pressable>
    </View>
  );
}
