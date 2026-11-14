import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { formatTime } from '@/lib/format';
import type { ProgressPoint } from '@/lib/workout';

import { EmptyState } from './ui';

const BAR_AREA = 110;
const MAX_POINTS = 12;

export function ProgressChart({
  points,
  color,
  timeBased,
}: {
  points: ProgressPoint[];
  color: string;
  timeBased: boolean;
}) {
  if (points.length === 0) {
    return (
      <EmptyState
        icon="show-chart"
        text="Пока нет выполненных тренировок с этим упражнением."
      />
    );
  }

  const shown = points.slice(-MAX_POINTS);
  const max = Math.max(...shown.map((p) => p.value), 1);
  const format = (v: number) => (timeBased ? formatTime(v) : `${v}`);
  const best = Math.max(...points.map((p) => p.value));

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Text style={styles.best}>Рекорд: {timeBased ? formatTime(best) : `${best} повт.`}</Text>
        <Text style={styles.caption}>последние {shown.length}</Text>
      </View>
      <View style={styles.bars}>
        {shown.map((p, i) => (
          <View key={`${p.date}-${i}`} style={styles.column}>
            <Text style={styles.value}>{format(p.value)}</Text>
            <View style={styles.area}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(6, (p.value / max) * BAR_AREA),
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={styles.day}>{new Date(p.date).getDate()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  best: { color: colors.text, fontSize: 15, fontWeight: '700' },
  caption: { color: colors.muted, fontSize: 12 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  column: { flex: 1, alignItems: 'center', gap: 4 },
  value: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  area: { height: BAR_AREA, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', borderRadius: 6 },
  day: { color: colors.dim, fontSize: 10 },
});
