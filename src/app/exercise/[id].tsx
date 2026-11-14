import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressChart } from '@/components/ProgressChart';
import {
  Field,
  GhostButton,
  IconBox,
  PrimaryButton,
  SectionTitle,
} from '@/components/ui';
import { colorFor, colors } from '@/constants/theme';
import { newId, useStore } from '@/lib/store';
import type { Exercise } from '@/lib/types';
import { progressSeries } from '@/lib/workout';

export default function ExerciseEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { ready, exercises } = useStore();
  const existing = isNew ? undefined : exercises.find((e) => e.id === id);

  if (!ready || (!isNew && !existing)) {
    return null;
  }

  return <ExerciseForm key={id} isNew={isNew} routeId={id} existing={existing} />;
}

function ExerciseForm({
  isNew,
  routeId,
  existing,
}: {
  isNew: boolean;
  routeId: string;
  existing: Exercise | undefined;
}) {
  const { workouts, saveExercise, deleteExercise, saveWorkout, history } = useStore();
  const [exerciseId] = useState(() => (isNew ? newId() : routeId));
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');

  const color = colorFor(exerciseId);
  const canSave = name.trim().length > 0;
  const timeBased = history
    .flatMap((h) => h.results ?? [])
    .filter((r) => r.exerciseId === exerciseId)
    .some((r) => r.sets.length > 0 && r.sets.every((s) => s.reps === null));

  const save = () => {
    if (!canSave) return;
    saveExercise({
      id: exerciseId,
      name: name.trim(),
      description: description.trim(),
    });
    router.back();
  };

  const remove = () => {
    workouts
      .filter((w) => w.exercises.some((we) => we.exerciseId === exerciseId))
      .forEach((w) =>
        saveWorkout({
          ...w,
          exercises: w.exercises.filter((we) => we.exerciseId !== exerciseId),
        })
      );
    deleteExercise(exerciseId);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: isNew ? 'Новое упражнение' : 'Упражнение' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.preview}>
          <IconBox name="fitness-center" color={color} />
          <Text style={styles.previewText}>{name.trim() || 'Название упражнения'}</Text>
        </View>

        <Field
          label="Название"
          placeholder="Например: Приседания"
          value={name}
          onChangeText={setName}
          maxLength={60}
        />
        <Field
          label="Описание"
          placeholder="Как выполнять, на что обратить внимание"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={300}
        />

        <PrimaryButton
          title="Сохранить"
          icon="check"
          color={canSave ? colors.accent : colors.surface2}
          onPress={save}
          style={{ marginTop: 8 }}
        />

        {!isNew ? (
          <>
            <SectionTitle title="Прогресс" />
            <ProgressChart
              points={progressSeries(history, exerciseId)}
              color={color}
              timeBased={timeBased}
            />
          </>
        ) : null}

        {!isNew ? (
          <GhostButton title="Удалить упражнение" color={colors.danger} onPress={remove} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 4,
  },
  previewText: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '700' },
});
