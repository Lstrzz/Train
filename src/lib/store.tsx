import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { AppData, Exercise, HistoryEntry, PlanEntry, Workout } from './types';

const STORAGE_KEY = 'train:v1';

const emptyData: AppData = {
  exercises: [],
  workouts: [],
  plan: [[], [], [], [], [], [], []],
  history: [],
};

type Store = AppData & {
  ready: boolean;
  saveExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => void;
  saveWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  addToDay: (day: number, workoutId: string) => void;
  removeFromDay: (day: number, entryId: string) => void;
  addHistory: (entry: HistoryEntry) => void;
  importData: (data: AppData) => void;
  resetAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function parseBackup(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Файл не похож на сохранение Train');
  }
  const obj = raw as Record<string, unknown>;
  const isArray = (v: unknown) => Array.isArray(v);
  if (!isArray(obj.exercises) || !isArray(obj.workouts) || !isArray(obj.history) || !isArray(obj.plan)) {
    throw new Error('Файл не похож на сохранение Train');
  }
  return normalize(obj as Partial<AppData> & { plan?: unknown[][] });
}

function normalize(raw: Partial<AppData> & { plan?: unknown[][] }): AppData {
  const plan = Array.from({ length: 7 }, (_, i) => {
    const day = raw.plan?.[i] ?? [];
    return day.map((item) =>
      typeof item === 'string'
        ? { id: newId(), workoutId: item }
        : { id: (item as PlanEntry).id, workoutId: (item as PlanEntry).workoutId }
    );
  });
  return {
    exercises: raw.exercises ?? [],
    workouts: raw.workouts ?? [],
    plan,
    history: raw.history ?? [],
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          setData(normalize(JSON.parse(raw)));
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }
  }, [data, ready]);

  const saveExercise = useCallback((exercise: Exercise) => {
    setData((d) => {
      const exists = d.exercises.some((e) => e.id === exercise.id);
      return {
        ...d,
        exercises: exists
          ? d.exercises.map((e) => (e.id === exercise.id ? exercise : e))
          : [...d.exercises, exercise],
      };
    });
  }, []);

  const deleteExercise = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      exercises: d.exercises.filter((e) => e.id !== id),
    }));
  }, []);

  const saveWorkout = useCallback((workout: Workout) => {
    setData((d) => {
      const exists = d.workouts.some((w) => w.id === workout.id);
      return {
        ...d,
        workouts: exists
          ? d.workouts.map((w) => (w.id === workout.id ? workout : w))
          : [...d.workouts, workout],
      };
    });
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      workouts: d.workouts.filter((w) => w.id !== id),
      plan: d.plan.map((day) => day.filter((entry) => entry.workoutId !== id)),
    }));
  }, []);

  const addToDay = useCallback((day: number, workoutId: string) => {
    setData((d) => ({
      ...d,
      plan: d.plan.map((entries, i) =>
        i === day ? [...entries, { id: newId(), workoutId }] : entries
      ),
    }));
  }, []);

  const removeFromDay = useCallback((day: number, entryId: string) => {
    setData((d) => ({
      ...d,
      plan: d.plan.map((entries, i) =>
        i === day ? entries.filter((e) => e.id !== entryId) : entries
      ),
    }));
  }, []);

  const addHistory = useCallback((entry: HistoryEntry) => {
    setData((d) => ({ ...d, history: [entry, ...d.history] }));
  }, []);

  const importData = useCallback((next: AppData) => {
    setData(next);
  }, []);

  const resetAll = useCallback(() => {
    setData(emptyData);
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...data,
      ready,
      saveExercise,
      deleteExercise,
      saveWorkout,
      deleteWorkout,
      addToDay,
      removeFromDay,
      addHistory,
      importData,
      resetAll,
    }),
    [
      data,
      ready,
      saveExercise,
      deleteExercise,
      saveWorkout,
      deleteWorkout,
      addToDay,
      removeFromDay,
      addHistory,
      importData,
      resetAll,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return store;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
