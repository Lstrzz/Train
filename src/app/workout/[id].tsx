import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ValueSheet } from '@/components/ValueSheet';
import {
  Card,
  EmptyState,
  Field,
  GhostButton,
  IconBox,
  Pill,
  PrimaryButton,
  RoundButton,
  SectionTitle,
} from '@/components/ui';
import { colorFor, colors } from '@/constants/theme';
import { formatTime } from '@/lib/format';
import { newId, useStore } from '@/lib/store';
import type { SetPlan, Workout, WorkoutExercise } from '@/lib/types';

type SetDraft = { id: string; reps: number | null; durationSec: number | null; restSec: number };
type ExerciseDraft = {
  id: string;
  exerciseId: string;
  sets: SetDraft[];
  supersetWithNext: boolean;
};

type NumField = 'reps' | 'durationSec' | 'restSec';
type Editing = { itemId: string; setId: string; field: NumField } | null;

const FIELD_CONFIG: Record<
  NumField,
  { min: number; max: number; step: number; def: number; unit: string; title: string; presets: number[]; format: (v: number) => string }
> = {
  reps: {
    min: 1,
    max: 100,
    step: 1,
    def: 10,
    unit: 'повторений',
    title: 'Повторения',
    presets: [5, 8, 10, 12, 15, 20],
    format: (v) => String(v),
  },
  durationSec: {
    min: 5,
    max: 600,
    step: 5,
    def: 30,
    unit: 'длительность',
    title: 'Длительность',
    presets: [20, 30, 45, 60, 90],
    format: (v) => formatTime(v),
  },
  restSec: {
    min: 0,
    max: 600,
    step: 15,
    def: 60,
    unit: 'отдых',
    title: 'Отдых после подхода',
    presets: [30, 60, 90, 120, 180],
    format: (v) => formatTime(v),
  },
};

const emptySet = (): SetDraft => ({
  id: newId(),
  reps: 10,
  durationSec: null,
  restSec: 60,
});

function toDraft(w: WorkoutExercise): ExerciseDraft {
  return {
    id: w.id,
    exerciseId: w.exerciseId,
    supersetWithNext: w.supersetWithNext ?? false,
    sets: w.sets.map((s) => ({
      id: s.id,
      reps: s.reps,
      durationSec: s.durationSec,
      restSec: s.restSec,
    })),
  };
}

export default function WorkoutEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { ready, workouts } = useStore();
  const existing = isNew ? undefined : workouts.find((w) => w.id === id);

  if (!ready || (!isNew && !existing)) {
    return null;
  }

  return <WorkoutForm key={id} isNew={isNew} routeId={id} existing={existing} />;
}

function WorkoutForm({
  isNew,
  routeId,
  existing,
}: {
  isNew: boolean;
  routeId: string;
  existing: Workout | undefined;
}) {
  const { exercises, saveWorkout, deleteWorkout } = useStore();
  const [workoutId] = useState(() => (isNew ? newId() : routeId));
  const [name, setName] = useState(existing?.name ?? '');
  const [items, setItems] = useState<ExerciseDraft[]>(() =>
    existing ? existing.exercises.map(toDraft) : []
  );
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);

  const exerciseName = (exerciseId: string) =>
    exercises.find((e) => e.id === exerciseId)?.name ?? 'Удалённое упражнение';

  const updateItem = (itemId: string, fn: (item: ExerciseDraft) => ExerciseDraft) =>
    setItems((list) => list.map((it) => (it.id === itemId ? fn(it) : it)));

  const addExercise = (exerciseId: string) => {
    setItems((list) => [
      ...list,
      { id: newId(), exerciseId, sets: [emptySet()], supersetWithNext: false },
    ]);
    setPicking(false);
  };

  const removeItem = (itemId: string) =>
    setItems((list) => list.filter((it) => it.id !== itemId));

  const updateSet = (itemId: string, setId: string, patch: Partial<SetDraft>) =>
    updateItem(itemId, (it) => ({
      ...it,
      sets: it.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    }));

  const canSave = name.trim().length > 0 && items.length > 0;
  const missing = !name.trim()
    ? 'Введите название тренировки'
    : items.length === 0
      ? 'Добавьте хотя бы одно упражнение'
      : null;

  const save = () => {
    if (!canSave) return;
    const workout: Workout = {
      id: workoutId,
      name: name.trim(),
      exercises: items.map((it) => ({
        id: it.id,
        exerciseId: it.exerciseId,
        supersetWithNext: it.supersetWithNext,
        sets: it.sets.map(
          (s): SetPlan => ({
            id: s.id,
            reps: s.reps,
            durationSec: s.durationSec,
            restSec: s.restSec,
          })
        ),
      })),
    };
    saveWorkout(workout);
    router.back();
  };

  const remove = () => {
    deleteWorkout(workoutId);
    router.back();
  };

  const editingSet =
    editing && items.find((it) => it.id === editing.itemId)?.sets.find((s) => s.id === editing.setId);
  const cfg = editing ? FIELD_CONFIG[editing.field] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: isNew ? 'Новая тренировка' : 'Тренировка' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Field
          label="Название"
          placeholder="Например: Грудь и трицепс"
          value={name}
          onChangeText={setName}
          maxLength={60}
        />

        <SectionTitle
          title="Упражнения"
          action={picking ? 'Отмена' : 'Добавить'}
          onAction={() => setPicking((v) => !v)}
        />

        {picking ? (
          exercises.length === 0 ? (
            <EmptyState
              icon="fitness-center"
              text="Сначала создайте упражнения на вкладке «Упражнения»."
            />
          ) : (
            <View style={{ gap: 10, marginBottom: 14 }}>
              {exercises.map((e) => (
                <Card key={e.id} onPress={() => addExercise(e.id)}>
                  <IconBox name="fitness-center" color={colorFor(e.id)} size={40} />
                  <Text style={styles.name}>{e.name}</Text>
                  <MaterialIcons name="add-circle" size={26} color={colors.accent} />
                </Card>
              ))}
            </View>
          )
        ) : null}

        {items.length === 0 && !picking ? (
          <EmptyState
            icon="playlist-add"
            text="Добавьте упражнения и задайте для каждого подходы, повторения и отдых."
          />
        ) : null}

        <View style={{ gap: 14 }}>
          {items.map((it, index) => {
            const color = colorFor(it.exerciseId);
            return (
              <View key={it.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={[styles.indexBadge, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.indexText, { color }]}>{index + 1}</Text>
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {exerciseName(it.exerciseId)}
                  </Text>
                  <RoundButton
                    icon="delete-outline"
                    color={colors.surface2}
                    iconColor={colors.danger}
                    onPress={() => removeItem(it.id)}
                  />
                </View>

                {index < items.length - 1 ? (
                  <Pressable
                    onPress={() =>
                      updateItem(it.id, (x) => ({
                        ...x,
                        supersetWithNext: !x.supersetWithNext,
                      }))
                    }
                    style={[
                      styles.superset,
                      it.supersetWithNext ? { borderColor: colors.gold, backgroundColor: colors.gold + '14' } : null,
                    ]}>
                    <MaterialIcons
                      name="link"
                      size={18}
                      color={it.supersetWithNext ? colors.gold : colors.muted}
                    />
                    <Text
                      style={[
                        styles.supersetText,
                        { color: it.supersetWithNext ? colors.gold : colors.muted },
                      ]}>
                      {it.supersetWithNext ? 'Суперсет со следующим' : 'Сделать суперсетом со следующим'}
                    </Text>
                  </Pressable>
                ) : null}

                {it.sets.map((s, si) => (
                  <View key={s.id} style={styles.setCard}>
                    <View style={styles.setTop}>
                      <Text style={styles.setNum}>Подход {si + 1}</Text>
                      {it.sets.length > 1 ? (
                        <Pressable
                          hitSlop={8}
                          onPress={() =>
                            updateItem(it.id, (x) => ({
                              ...x,
                              sets: x.sets.filter((y) => y.id !== s.id),
                            }))
                          }>
                          <MaterialIcons name="close" size={18} color={colors.dim} />
                        </Pressable>
                      ) : null}
                    </View>
                    <View style={styles.setValues}>
                      {s.reps !== null || s.durationSec === null ? (
                        <ValueCell
                          label="Повторения"
                          value={s.reps !== null ? String(s.reps) : '—'}
                          onPress={() => setEditing({ itemId: it.id, setId: s.id, field: 'reps' })}
                        />
                      ) : (
                        <ValueCell
                          label="Время"
                          value={formatTime(s.durationSec)}
                          onPress={() => setEditing({ itemId: it.id, setId: s.id, field: 'durationSec' })}
                        />
                      )}
                      <ValueCell
                        label="Отдых"
                        value={formatTime(s.restSec)}
                        onPress={() => setEditing({ itemId: it.id, setId: s.id, field: 'restSec' })}
                      />
                    </View>
                    <View style={styles.modeRow}>
                      <Pill
                        text={s.reps !== null ? 'По повторениям' : 'По времени'}
                        color={color}
                      />
                      <Pressable
                        onPress={() =>
                          updateSet(it.id, s.id,
                            s.reps !== null
                              ? { reps: null, durationSec: 30 }
                              : { reps: 10, durationSec: null })
                        }
                        hitSlop={6}>
                        <Text style={styles.switchMode}>Переключить</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                <GhostButton
                  title="+ Добавить подход"
                  color={color}
                  onPress={() =>
                    updateItem(it.id, (x) => ({ ...x, sets: [...x.sets, emptySet()] }))
                  }
                />
              </View>
            );
          })}
        </View>

        <PrimaryButton
          title="Сохранить тренировку"
          icon="check"
          color={canSave ? colors.accent : colors.muted}
          onPress={save}
          style={[{ marginTop: 22 }, canSave ? null : { opacity: 0.45 }]}
        />
        {missing ? <Text style={styles.missing}>{missing}</Text> : null}

        {!isNew ? (
          <GhostButton title="Удалить тренировку" color={colors.danger} onPress={remove} />
        ) : null}
      </ScrollView>

      {editing && editingSet && cfg ? (
        <ValueSheet
          key={`${editing.setId}-${editing.field}`}
          title={cfg.title}
          value={editingSet[editing.field] ?? cfg.def}
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          unit={cfg.unit}
          presets={cfg.presets}
          format={cfg.format}
          onClose={() => setEditing(null)}
          onConfirm={(v) => {
            updateSet(editing.itemId, editing.setId, { [editing.field]: v });
            setEditing(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function ValueCell({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.valueCell, { opacity: pressed ? 0.8 : 1 }]}>
      <Text style={styles.valueLabel}>{label}</Text>
      <Text style={styles.valueText}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  name: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700' },
  itemCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 14,
    gap: 12,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  indexBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { fontSize: 15, fontWeight: '800' },
  itemName: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '700' },
  superset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  supersetText: { fontSize: 13, fontWeight: '700' },
  setCard: {
    backgroundColor: colors.surface2,
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  setTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  setNum: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  setValues: { flexDirection: 'row', gap: 10 },
  valueCell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  valueLabel: { color: colors.dim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  valueText: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchMode: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  missing: { color: colors.gold, fontSize: 13, textAlign: 'center', marginTop: 10 },
});
