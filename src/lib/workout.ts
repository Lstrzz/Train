import { colorFor } from '@/constants/theme';

import type {
  Exercise,
  ExerciseResult,
  HistoryEntry,
  SetPlan,
  SetResult,
  Workout,
} from './types';

export type Step = {
  key: string;
  exerciseId: string;
  exerciseName: string;
  color: string;
  setNo: number;
  setsTotal: number;
  set: SetPlan;
  superset: boolean;
  restAfter: number;
};

export type PerformedSet = SetResult & { exerciseId: string };

/**
 * Разворачивает тренировку в последовательность подходов.
 * Суперсет чередует подходы своих упражнений: A1, B1, отдых, A2, B2, отдых.
 */
export function buildSteps(workout: Workout, exercises: Exercise[]): Step[] {
  const steps: Step[] = [];
  const items = workout.exercises;
  let start = 0;

  while (start < items.length) {
    let end = start;
    while (end < items.length - 1 && items[end].supersetWithNext) {
      end++;
    }
    const group = items.slice(start, end + 1);
    const rounds = Math.max(...group.map((g) => g.sets.length));

    for (let r = 0; r < rounds; r++) {
      const present = group.filter((g) => g.sets[r]);
      present.forEach((we, pi) => {
        const set = we.sets[r];
        const ex = exercises.find((e) => e.id === we.exerciseId);
        steps.push({
          key: set.id,
          exerciseId: we.exerciseId,
          exerciseName: ex?.name ?? 'Удалённое упражнение',
          color: colorFor(we.exerciseId),
          setNo: r + 1,
          setsTotal: we.sets.length,
          set,
          superset: group.length > 1,
          restAfter: pi === present.length - 1 ? set.restSec : 0,
        });
      });
    }

    start = end + 1;
  }

  return steps;
}

/** Результаты последней тренировки с этим упражнением (история хранится от новых к старым). */
export function lastSetsFor(history: HistoryEntry[], exerciseId: string): SetResult[] | null {
  for (const h of history) {
    const found = h.results?.find((r) => r.exerciseId === exerciseId);
    if (found) return found.sets;
  }
  return null;
}

export type ProgressPoint = { date: string; value: number };

/** Лучший подход за каждую тренировку: повторения, а если их нет, то секунды. */
export function progressSeries(history: HistoryEntry[], exerciseId: string): ProgressPoint[] {
  return [...history]
    .reverse()
    .flatMap((h) => {
      const found = h.results?.find((r) => r.exerciseId === exerciseId);
      if (!found || found.sets.length === 0) return [];
      const value = Math.max(
        ...found.sets.map((s) => (s.reps !== null ? s.reps : s.durationSec ?? 0))
      );
      return [{ date: h.date, value }];
    });
}

export function isTimeBased(set: SetPlan): boolean {
  return set.reps === null && set.durationSec !== null;
}

export function groupResults(performed: PerformedSet[]): ExerciseResult[] {
  const map = new Map<string, SetResult[]>();
  for (const p of performed) {
    const list = map.get(p.exerciseId) ?? [];
    list.push({ reps: p.reps, durationSec: p.durationSec });
    map.set(p.exerciseId, list);
  }
  return [...map.entries()].map(([exerciseId, sets]) => ({ exerciseId, sets }));
}
