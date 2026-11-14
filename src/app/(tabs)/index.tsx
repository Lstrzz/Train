import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, EmptyState, Header, IconBox, Pill, RoundButton, SectionTitle } from '@/components/ui';
import { colors, dayNamesFull, todayIndex } from '@/constants/theme';
import { formatLongDate, pluralize } from '@/lib/format';
import { useStore } from '@/lib/store';

export default function TodayScreen() {
  const { workouts, plan, history } = useStore();
  const today = new Date();
  const dayIdx = todayIndex();
  const todayItems = plan[dayIdx].flatMap((entry) => {
    const workout = workouts.find((w) => w.id === entry.workoutId);
    return workout ? [{ entry, workout }] : [];
  });

  const totalSets = history.reduce((sum, h) => sum + h.completedSets, 0);
  const doneToday = history.filter(
    (h) => new Date(h.date).toDateString() === today.toDateString()
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header
          title="Сегодня"
          subtitle={formatLongDate(today, dayNamesFull[dayIdx])}
          right={
            <RoundButton
              icon="settings"
              color={colors.surface2}
              iconColor={colors.text}
              onPress={() => router.push('/settings')}
            />
          }
        />

        <LinearGradient
          colors={[colors.primary, '#4B3AA8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>План на день</Text>
            <MaterialIcons name="bolt" size={22} color={colors.text} />
          </View>
          <View style={styles.heroRow}>
            <Text style={styles.heroNumber}>{todayItems.length}</Text>
            <Text style={styles.heroText}>
              {pluralize(todayItems.length, 'тренировка', 'тренировки', 'тренировок')}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Stat value={String(history.length)} label="выполнено" />
            <View style={styles.statDivider} />
            <Stat value={String(totalSets)} label="подходов" />
            <View style={styles.statDivider} />
            <Stat value={String(doneToday)} label="сегодня" />
          </View>
        </LinearGradient>

        <SectionTitle
          title="Тренировки"
          action="Открыть план"
          onAction={() => router.navigate('/plan')}
        />

        {todayItems.length === 0 ? (
          <EmptyState
            icon="event-available"
            text="На сегодня ничего не запланировано. Добавьте тренировку в план на этот день."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {todayItems.map(({ entry, workout }) => (
              <Card
                key={entry.id}
                onPress={() =>
                  router.push({
                    pathname: '/workout/run/[id]',
                    params: { id: workout.id, entry: entry.id },
                  })
                }>
                <IconBox name="fitness-center" color={colors.accent} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={styles.cardTitle}>{workout.name}</Text>
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
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32, paddingHorizontal: 20 },
  hero: { borderRadius: 26, padding: 22, gap: 6 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: colors.text + 'CC', fontSize: 14, fontWeight: '700' },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 },
  heroNumber: { color: colors.text, fontSize: 52, fontWeight: '800', letterSpacing: -1 },
  heroText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.text + '26',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, backgroundColor: colors.text + '26' },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.text + 'BF', fontSize: 12 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
});
