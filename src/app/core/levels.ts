import { Level } from './models';

export const LEVELS: Level[] = [
  { level: 1, name: 'Semilla de constancia', xpRequired: 0 },
  { level: 2, name: 'Explorador', xpRequired: 300 },
  { level: 3, name: 'Constante', xpRequired: 750 },
  { level: 4, name: 'Enfocado', xpRequired: 1350 },
  { level: 5, name: 'Disciplinado', xpRequired: 2100 },
  { level: 6, name: 'Resiliente', xpRequired: 3000 },
  { level: 7, name: 'Imparable', xpRequired: 4050 },
  { level: 8, name: 'Maestría Grit', xpRequired: 5250 },
];

export const MAX_LEVEL = LEVELS.length;
export const FINAL_EVAL_XP = 5250;

export function levelFromXP(xp: number): Level {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xpRequired) cur = l;
  return cur;
}

export function nextLevelOf(level: number): Level | null {
  return LEVELS.find((l) => l.level === level + 1) ?? null;
}

export function difficultyOfLevel(level: number): string {
  if (level <= 2) return 'Fácil';
  if (level <= 4) return 'Intermedio';
  if (level <= 6) return 'Difícil';
  return 'Épico';
}
