import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, EmptyState, Header, IconBox, Pill } from '@/components/ui';
import { colors } from '@/constants/theme';
import { formatDateTime, pluralize } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { HistoryEntry } from '@/lib/types';

export default function HistoryScreen() {
  const { history } = useStore();
  const totalSets = history.reduce((sum, h) => sum + h.completedSets, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="История" subtitle="Что вы уже выполнили" />
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryValue}>{history.length}</Text>
            <Text style={styles.summaryLabel}>
              {pluralize(history.length, 'тренировка', 'тренировки', 'тренировок')}
            </Text>
            <View style={styles.summaryDot} />
            <Text style={styles.summaryValue}>{totalSets}</Text>
            <Text style={styles.summaryLabel}>
              {pluralize(totalSets, 'подход', 'подхода', 'подходов')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="history"
            text="Здесь появятся тренировки, которые вы завершили."
          />
        }
        renderItem={({ item }) => <HistoryCard entry={item} />}
      />
    </SafeAreaView>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const complete = entry.completedSets >= entry.totalSets;
  const color = complete ? colors.accent : colors.gold;
  return (
    <Card>
      <IconBox name={complete ? 'check-circle' : 'history'} color={color} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.name}>{entry.workoutName}</Text>
        <Text style={styles.date}>{formatDateTime(entry.date)}</Text>
        <Pill
          text={`${entry.completedSets} из ${entry.totalSets} подходов`}
          color={color}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  summaryValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: colors.muted, fontSize: 14 },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.dim,
    marginHorizontal: 6,
  },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  date: { color: colors.muted, fontSize: 13 },
});
