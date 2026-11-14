export type Exercise = {
  id: string;
  name: string;
  description: string;
};

export type SetPlan = {
  id: string;
  reps: number | null;
  durationSec: number | null;
  restSec: number;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: SetPlan[];
  /** Выполнять следующее упражнение в суперсете без отдыха между ними */
  supersetWithNext?: boolean;
};

export type Workout = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
};

export type SetResult = {
  reps: number | null;
  durationSec: number | null;
};

export type ExerciseResult = {
  exerciseId: string;
  sets: SetResult[];
};

export type HistoryEntry = {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  completedSets: number;
  totalSets: number;
  results?: ExerciseResult[];
};

/** Тренировка, поставленная на конкретный день */
export type PlanEntry = {
  id: string;
  workoutId: string;
};

export type AppData = {
  exercises: Exercise[];
  workouts: Workout[];
  /** 7 списков записей плана, индекс 0 = понедельник */
  plan: PlanEntry[][];
  history: HistoryEntry[];
};
