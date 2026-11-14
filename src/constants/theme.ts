export const colors = {
  bg: '#080C16',
  surface: '#121A2B',
  surface2: '#1A2438',
  border: '#243149',
  primary: '#7C5CFF',
  accent: '#3DE1B0',
  cyan: '#4CC9F0',
  gold: '#FFC466',
  orange: '#FF9F5A',
  pink: '#FF6B9D',
  danger: '#FF6B81',
  text: '#EEF2FF',
  muted: '#8B97B5',
  dim: '#5D6A85',
};

export const exerciseColors = [
  colors.orange,
  colors.cyan,
  colors.accent,
  colors.pink,
  colors.gold,
  '#B39DDB',
  '#FF8A65',
  colors.primary,
];

export function colorFor(id: string): string {
  let hash = 0;
  for (const ch of id) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return exerciseColors[hash % exerciseColors.length];
}

export const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const dayNamesFull = [
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
  'воскресенье',
];

export function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}
