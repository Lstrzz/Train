import { MaterialIcons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GhostButton, IconBox, PrimaryButton, Pill, RoundButton } from '@/components/ui';
import { colors } from '@/constants/theme';
import { formatTime, pluralize } from '@/lib/format';
import { newId, useStore } from '@/lib/store';
import {
  buildSteps,
  groupResults,
  isTimeBased,
  lastSetsFor,
  type PerformedSet,
} from '@/lib/workout';

type Rest = { endsAt: number; total: number };

export default function RunWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready, workouts, exercises, history, addHistory, saveWorkout } = useStore();
  const workout = workouts.find((w) => w.id === id);

  const steps = useMemo(
    () => (workout ? buildSteps(workout, exercises) : []),
    [workout, exercises]
  );

  const [index, setIndex] = useState(0);
  const [adjust, setAdjust] = useState<number | null>(null);
  const [rest, setRest] = useState<Rest | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const savedRef = useRef(false);
  const performedRef = useRef<PerformedSet[]>([]);

  const player = useAudioPlayer(require('../../../../assets/sounds/rest-done.wav'));

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const finished = steps.length > 0 && index >= steps.length;

  useEffect(() => {
    if (!finished || savedRef.current || !workout) return;
    savedRef.current = true;
    addHistory({
      id: newId(),
      workoutId: workout.id,
      workoutName: workout.name,
      date: new Date().toISOString(),
      completedSets: steps.length,
      totalSets: steps.length,
      results: groupResults(performedRef.current),
    });
  }, [finished, workout, steps.length, addHistory]);

  useEffect(() => {
    if (!rest) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= rest.endsAt) {
        clearInterval(timer);
        setRest(null);
        player.seekTo(0);
        player.play();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [rest, player]);

  const current = steps[index];
  const next = steps[index + 1];

  const lastSets = useMemo(
    () => (current ? lastSetsFor(history, current.exerciseId) : null),
    [current, history]
  );
  const prev = lastSets ? lastSets[current.setNo - 1] ?? lastSets[lastSets.length - 1] : null;
  const prevText = prev
    ? prev.reps !== null
      ? `${prev.reps} повт.`
      : prev.durationSec !== null
        ? formatTime(prev.durationSec)
        : null
    : null;

  if (!ready) return null;

  if (!workout) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <RoundButton
            icon="close"
            color={colors.surface2}
            iconColor={colors.text}
            onPress={() => router.back()}
          />
        </View>
        <Text style={styles.emptyText}>Тренировка не найдена.</Text>
      </SafeAreaView>
    );
  }

  const remaining = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;
  const progress = steps.length ? index / steps.length : 0;
  const hasTarget = current ? current.set.reps !== null || current.set.durationSec !== null : false;
  const timeBased = current ? isTimeBased(current.set) : false;
  const planned = (timeBased ? current?.set.durationSec : current?.set.reps) ?? 0;
  const step = timeBased ? 5 : 1;
  const value = adjust ?? planned;

  const changeValue = (delta: number) => setAdjust(Math.max(timeBased ? 5 : 1, value + delta));

  const completeSet = () => {
    if (!current) return;
    performedRef.current = [
      ...performedRef.current,
      {
        exerciseId: current.exerciseId,
        reps: hasTarget && !timeBased ? value : null,
        durationSec: hasTarget && timeBased ? value : null,
      },
    ];
    if (hasTarget && value !== planned) {
      saveWorkout({
        ...workout,
        exercises: workout.exercises.map((we) => ({
          ...we,
          sets: we.sets.map((s) =>
            s.id !== current.key
              ? s
              : timeBased
                ? { ...s, durationSec: value }
                : { ...s, reps: value }
          ),
        })),
      });
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setAdjust(null);
    if (nextIndex < steps.length && current.restAfter > 0) {
      const start = Date.now();
      setNow(start);
      setRest({ endsAt: start + current.restAfter * 1000, total: current.restAfter });
    }
  };

  const addRest = (sec: number) =>
    setRest((r) => (r ? { endsAt: r.endsAt + sec * 1000, total: r.total + sec } : r));

  const skipRest = () => setRest(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <RoundButton
          icon="close"
          color={colors.surface2}
          iconColor={colors.text}
          onPress={() => router.back()}
        />
        <Text style={styles.workoutName} numberOfLines={1}>
          {workout.name}
        </Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {finished
          ? `Выполнено ${steps.length} из ${steps.length}`
          : `Подход ${index + 1} из ${steps.length}`}
      </Text>

      {finished ? (
        <View style={styles.finished}>
          <IconBox name="emoji-events" color={colors.gold} />
          <Text style={styles.finishedTitle}>Тренировка завершена</Text>
          <Text style={styles.finishedText}>
            {pluralize(steps.length, 'подход', 'подхода', 'подходов')} выполнено. Запись добавлена в историю.
          </Text>
          <PrimaryButton
            title="Готово"
            icon="check"
            onPress={() => router.back()}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      ) : current ? (
        <View style={styles.body}>
          <View style={styles.card}>
            <View style={[styles.cardAccent, { backgroundColor: current.color }]} />
            {current.superset ? <Pill text="Суперсет" color={colors.gold} /> : null}
            <Text style={[styles.exerciseName, { color: current.color }]}>
              {current.exerciseName}
            </Text>
            <Text style={styles.setInfo}>
              Подход {current.setNo} из {current.setsTotal}
            </Text>

            {hasTarget ? (
              <View style={styles.stepper}>
                <RoundButton
                  icon="remove"
                  color={colors.surface2}
                  iconColor={colors.text}
                  onPress={() => changeValue(-step)}
                />
                <Text style={styles.target}>
                  {timeBased ? formatTime(value) : value}
                </Text>
                <RoundButton
                  icon="add"
                  color={colors.surface2}
                  iconColor={colors.text}
                  onPress={() => changeValue(step)}
                />
              </View>
            ) : (
              <Text style={styles.target}>Без цели</Text>
            )}
            {hasTarget ? (
              <Text style={styles.stepperHint}>
                {timeBased
                  ? 'Фактическое время. Сохранится для следующего раза'
                  : 'Фактические повторения. Сохранятся для следующего раза'}
              </Text>
            ) : null}

            {prevText ? (
              <View style={styles.restHint}>
                <MaterialIcons name="history" size={16} color={colors.muted} />
                <Text style={styles.restHintText}>В прошлый раз: {prevText}</Text>
              </View>
            ) : null}

            {current.restAfter > 0 ? (
              <View style={styles.restHint}>
                <MaterialIcons name="timer" size={16} color={colors.muted} />
                <Text style={styles.restHintText}>
                  Отдых после {current.superset ? 'раунда' : 'подхода'}: {formatTime(current.restAfter)}
                </Text>
              </View>
            ) : null}
          </View>

          {next ? (
            <Text style={styles.nextText}>
              Далее: {next.exerciseName}, подход {next.setNo} из {next.setsTotal}
              {next.superset && next.exerciseId !== current.exerciseId ? ' (суперсет)' : ''}
            </Text>
          ) : (
            <Text style={styles.nextText}>Это последний подход</Text>
          )}

          <PrimaryButton
            title="Подход выполнен"
            icon="check"
            color={colors.accent}
            onPress={completeSet}
            style={{ alignSelf: 'stretch', paddingVertical: 18 }}
          />
        </View>
      ) : null}

      {rest ? (
        <View style={styles.restOverlay}>
          <Text style={styles.restLabel}>ОТДЫХ</Text>
          <Text style={styles.restTime}>{formatTime(remaining)}</Text>
          <View style={styles.restTrack}>
            <View
              style={[
                styles.restFill,
                { width: `${Math.min(100, (remaining / rest.total) * 100)}%` },
              ]}
            />
          </View>
          {next ? (
            <Text style={styles.restNext}>
              Дальше: {next.exerciseName}, подход {next.setNo} из {next.setsTotal}
            </Text>
          ) : null}
          <View style={styles.restButtons}>
            <GhostButton title="+30 сек" color={colors.cyan} onPress={() => addRest(30)} />
            <PrimaryButton title="Пропустить" color={colors.primary} onPress={skipRest} />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  workoutName: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  progressTrack: {
    height: 6,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: colors.accent, borderRadius: 3 },
  progressText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  body: { flex: 1, padding: 20, justifyContent: 'center', gap: 18 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  exerciseName: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  setInfo: { color: colors.muted, fontSize: 15 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10 },
  target: { color: colors.text, fontSize: 44, fontWeight: '800', minWidth: 110, textAlign: 'center' },
  stepperHint: { color: colors.dim, fontSize: 12 },
  restHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  restHintText: { color: colors.muted, fontSize: 13 },
  nextText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  finished: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  finishedTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
  finishedText: { color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 40 },
  restOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  restLabel: { color: colors.cyan, fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  restTime: { color: colors.text, fontSize: 84, fontWeight: '800', fontVariant: ['tabular-nums'] },
  restTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  restFill: { height: 8, backgroundColor: colors.cyan, borderRadius: 4 },
  restNext: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  restButtons: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'center' },
});
