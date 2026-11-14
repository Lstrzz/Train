import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Card,
  EmptyState,
  Header,
  IconBox,
  Pill,
  RoundButton,
  Segmented,
  SectionTitle,
} from '@/components/ui';
import { colors, dayNames, dayNamesFull, todayIndex } from '@/constants/theme';
import { pluralize } from '@/lib/format';
import { useStore } from '@/lib/store';

const dayOptions = dayNames.map((label, i) => ({ key: i, label }));

export default function PlanScreen() {
  const { workouts, plan, addToDay, removeFromDay } = useStore();
  const [day, setDay] = useState(todayIndex());

  const dayItems = plan[day].flatMap((entry) => {
    const workout = workouts.find((w) => w.id === entry.workoutId);
    return workout ? [{ entry, workout }] : [];
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header
          title="План"
          subtitle="Расписание на неделю"
          right={
            <RoundButton icon="add" onPress={() => router.push('/workout/new')} />
          }
        />

        <Segmented options={dayOptions} value={day} onChange={setDay} />
        <Text style={styles.dayName}>{dayNamesFull[day]}</Text>

        <SectionTitle title="В этот день" />
        {dayItems.length === 0 ? (
          <EmptyState
            icon="event-busy"
            text="В этот день тренировок нет. Выберите тренировку ниже, чтобы добавить."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {dayItems.map(({ entry, workout }) => {
              return (
                <Card key={entry.id}>
                  <IconBox name="fitness-center" color={colors.accent} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={styles.name}>{workout.name}</Text>
                    <Pill
                      text={pluralize(workout.exercises.length, 'упражнение', 'упражнения', 'упражнений')}
                      color={colors.cyan}
                    />
                  </View>
                  <RoundButton
                    icon="play-arrow"
                    onPress={() =>
                      router.push({
                        pathname: '/workout/run/[id]',
                        params: { id: workout.id, entry: entry.id },
                      })
                    }
                  />
                  <RoundButton
                    icon="close"
                    color={colors.surface2}
                    iconColor={colors.muted}
                    onPress={() => removeFromDay(day, entry.id)}
                  />
                </Card>
              );
            })}
          </View>
        )}

        <SectionTitle
          title="Все тренировки"
          action="Создать"
          onAction={() => router.push('/workout/new')}
        />
        {workouts.length === 0 ? (
          <EmptyState
            icon="playlist-add"
            text="Тренировок пока нет. Создайте первую, добавив упражнения и подходы."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {workouts.map((w) => (
              <Card key={w.id} onPress={() => router.push(`/workout/${w.id}`)}>
                <IconBox name="list-alt" color={colors.cyan} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.name}>{w.name}</Text>
                  <Text style={styles.meta}>
                    {pluralize(w.exercises.length, 'упражнение', 'упражнения', 'упражнений')}
                  </Text>
                </View>
                <RoundButton icon="add" onPress={() => addToDay(day, w.id)} />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  dayName: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 12,
    textTransform: 'capitalize',
  },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 13 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
