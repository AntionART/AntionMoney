import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Keyboard } from 'react-native';
import { useUsuarioStore } from '../store/useUsuarioStore';

export default function PropositoScreen() {
  const usuario = useUsuarioStore((s) => s.usuario);
  const actualizarProposito = useUsuarioStore((s) => s.actualizarProposito);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (usuario) setTexto(usuario.proposito_principal);
  }, [usuario?.proposito_principal]);

  const guardar = async () => {
    await actualizarProposito(texto.trim());
    Keyboard.dismiss();
  };

  return (
    <View className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="text-sm text-text-secondary">
        En los momentos difíciles, Antion puede recordarte esto. Escríbelo con tus propias
        palabras.
      </Text>

      <TextInput
        value={texto}
        onChangeText={setTexto}
        onBlur={guardar}
        placeholder="Ej. Salir de deudas, comprar mi casa, dormir tranquilo..."
        placeholderTextColor="#6B6B6B"
        multiline
        numberOfLines={4}
        className="mt-6 min-h-[120px] rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
        textAlignVertical="top"
      />

      <Pressable
        onPress={guardar}
        className="mt-6 items-center rounded-card bg-text-primary-light py-3 dark:bg-text-primary-dark"
      >
        <Text className="text-base font-medium text-bg-light dark:text-bg-dark">Guardar</Text>
      </Pressable>
    </View>
  );
}
