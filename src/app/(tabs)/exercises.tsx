import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Card,
  EmptyState,
  Header,
  IconBox,
  RoundButton,
} from '@/components/ui';
import { colorFor, colors } from '@/constants/theme';
import { useStore } from '@/lib/store';
import type { Exercise } from '@/lib/types';

export default function ExercisesScreen() {
  const { exercises } = useStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Упражнения"
        subtitle="Базовые движения, из которых складываются тренировки"
        right={
          <RoundButton icon="add" onPress={() => router.push('/exercise/new')} />
        }
      />
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="fitness-center"
            text="Упражнений пока нет. Нажмите «+», чтобы добавить первое."
          />
        }
        renderItem={({ item }) => <ExerciseCard exercise={item} />}
      />
    </SafeAreaView>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const color = colorFor(exercise.id);
  return (
    <Card onPress={() => router.push(`/exercise/${exercise.id}`)}>
      <IconBox name="fitness-center" color={color} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.name}>{exercise.name}</Text>
        {exercise.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {exercise.description}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
