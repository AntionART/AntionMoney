import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDiarioStore } from '../store/useDiarioStore';
import type { DiarioFinancieroEntrada } from '../types';

const OPCIONES_ESTADO: { valor: DiarioFinancieroEntrada['como_estuvo']; etiqueta: string }[] = [
  { valor: 'excelente', etiqueta: 'Excelente' },
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'dificil', etiqueta: 'Difícil' },
];

const OPCIONES_MOTIVO = ['Trabajo', 'Universidad', 'Ansiedad', 'Cansancio', 'Hambre', 'Pereza', 'Otro'];

export default function DiarioScreen() {
  const hoy = useDiarioStore((s) => s.hoy);
  const cargarHoy = useDiarioStore((s) => s.cargarHoy);
  const historial = useDiarioStore((s) => s.historial);
  const cargarHistorial = useDiarioStore((s) => s.cargarHistorial);
  const guardar = useDiarioStore((s) => s.guardar);

  const [comoEstuvo, setComoEstuvo] = useState<DiarioFinancieroEntrada['como_estuvo'] | null>(null);
  const [motivo, setMotivo] = useState('');
  const [motivoLibre, setMotivoLibre] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarHoy();
      cargarHistorial(14);
    }, [])
  );

  useEffect(() => {
    if (hoy) {
      setComoEstuvo(hoy.como_estuvo);
      setMotivo(hoy.motivo);
      setMotivoLibre(hoy.motivo_texto_libre);
    }
  }, [hoy?.fecha]);

  const puedeGuardar = comoEstuvo !== null && (motivo !== 'Otro' || motivoLibre.trim().length > 0);

  const guardarEntrada = async () => {
    if (!comoEstuvo) return;
    await guardar(comoEstuvo, motivo, motivo === 'Otro' ? motivoLibre.trim() : '');
    cargarHistorial(14);
  };

  return (
    <ScrollView className="flex-1 bg-bg-light px-6 pt-6 dark:bg-bg-dark">
      <Text className="mb-2 text-sm font-medium text-text-secondary">¿CÓMO ESTUVO HOY?</Text>
      <View className="flex-row gap-2">
        {OPCIONES_ESTADO.map((op) => {
          const seleccionado = comoEstuvo === op.valor;
          return (
            <Pressable
              key={op.valor}
              onPress={() => setComoEstuvo(op.valor)}
              className={
                'flex-1 items-center rounded-card border px-3 py-3 ' +
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
                {op.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mb-2 mt-6 text-sm font-medium text-text-secondary">¿POR QUÉ?</Text>
      <View className="flex-row flex-wrap gap-2">
        {OPCIONES_MOTIVO.map((op) => {
          const seleccionado = motivo === op;
          return (
            <Pressable
              key={op}
              onPress={() => setMotivo(op)}
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

      {motivo === 'Otro' && (
        <TextInput
          value={motivoLibre}
          onChangeText={setMotivoLibre}
          placeholder="Cuéntame un poco más..."
          placeholderTextColor="#6B6B6B"
          className="mt-3 rounded-card border border-border-light bg-surface-light shadow-sm px-4 py-3 text-base text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none dark:text-text-primary-dark"
        />
      )}

      <Pressable
        onPress={guardarEntrada}
        disabled={!puedeGuardar}
        className={
          'mt-6 items-center rounded-card py-4 ' +
          (puedeGuardar
            ? 'bg-text-primary-light dark:bg-text-primary-dark'
            : 'bg-border-light dark:bg-border-dark')
        }
      >
        <Text className="text-base font-medium text-bg-light dark:text-bg-dark">
          {hoy ? 'Actualizar' : 'Guardar'}
        </Text>
      </Pressable>

      {historial.length > 0 && (
        <>
          <Text className="mb-2 mt-10 text-sm font-medium text-text-secondary">HISTORIAL</Text>
          <View className="mb-10 rounded-card border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark dark:shadow-none">
            {historial.map((h, i) => (
              <View
                key={h.id}
                className={
                  'flex-row items-center justify-between px-4 py-3 ' +
                  (i < historial.length - 1 ? 'border-b border-border-light dark:border-border-dark dark:bg-surface-dark dark:shadow-none' : '')
                }
              >
                <Text className="text-sm text-text-secondary">{h.fecha}</Text>
                <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
                  {OPCIONES_ESTADO.find((o) => o.valor === h.como_estuvo)?.etiqueta} · {h.motivo}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
