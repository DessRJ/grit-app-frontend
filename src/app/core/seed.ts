import { CHALLENGES } from './challenges.data';
import { MAX_LEVEL } from './levels';
import { FinalEvaluation, MoodEntry, MoodKey, PersonalPlan, UserState } from './models';
import { addDays, dayStr } from './util';

export const DEMO_PASSWORD = 'Grit2026!';

export const DEMO_ACCOUNTS = [
  { id: 'u-nuevo', email: 'nuevo@gritai.app', displayName: 'Sofía', profileLabel: 'Usuario nuevo · Nivel 1', kind: 'new' as const },
  { id: 'u-maestria', email: 'maestria@gritai.app', displayName: 'Ana', profileLabel: 'Avanzado · Nivel 8 Maestría Grit', kind: 'master' as const },
];

const emptyPlan = (): PersonalPlan => ({ goal: '', reason: '', nextStep: '', obstacle: '', strategy: '', support: '', reviewDate: '' });

const emptyEval = (): FinalEvaluation => ({
  participantName: '', age: '', institution: '', program: '', enrollment: '', semester: '', startDate: '',
  answers: Array(10).fill(0), consent: false, submitted: false,
});

export function baseState(userId: string, name: string): UserState {
  return {
    userId,
    name,
    xp: 0,
    completed: {},
    activityDays: [],
    challengeDays: [],
    pending: {},
    focusSessions: 0,
    focusMinutes: 0,
    educationSectionsRead: [],
    reflexionAnswers: ['', '', '', '', ''],
    personalPlan: emptyPlan(),
    learningNote: '',
    savedVideos: [],
    evaluation: emptyEval(),
    levelUpShown: 1,
    createdAt: Date.now(),
    settings: { demoSpeed: false, sound: true },
    strengths: [],
  };
}

export function newUserState(userId: string, name: string): UserState {
  return baseState(userId, name);
}

/** PRNG determinista para que el perfil avanzado se vea natural pero reproducible */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Perfil avanzado: Niveles 1–7 completos (5,250 XP) + 2 retos del nivel 8.
 * Racha de 35 días de actividad -> el reto "Racha legendaria (30 días)" ya es reclamable,
 * y la Evaluación Final está desbloqueada (Nivel 8).
 */
export function masterUserState(userId: string, name: string): UserState {
  const st = baseState(userId, name);
  const rand = rng(2026);
  const now = Date.now();
  const todayS = dayStr();

  const streakLen = 35;
  const challengeDays = Array.from({ length: streakLen }, (_, i) => addDays(todayS, -i)).reverse();
  const earlier = Array.from({ length: 28 }, (_, i) => addDays(todayS, -(streakLen + 2 + i))).filter(() => rand() > 0.35);
  st.challengeDays = [...earlier, ...challengeDays].sort();
  st.activityDays = [...st.challengeDays];

  // Completar niveles 1-7 y dos retos del 8, repartidos entre hace ~75 días y hoy
  const done = CHALLENGES.filter((c) => c.level < MAX_LEVEL || c.n <= 2);
  const spanDays = 74;
  done.forEach((c, i) => {
    const frac = i / (done.length - 1);
    const daysAgo = Math.round((1 - frac) * spanDays);
    const t = now - daysAgo * 86400000 - Math.floor(rand() * 8 * 3600000);
    st.completed[c.id] = { at: Math.min(t, now - 60000), xp: c.xp, data: { seed: true } };
    st.xp += c.xp;
  });
  // el último completado debe ser "reciente"
  st.focusSessions = 48;
  st.focusMinutes = 48 * 25;
  st.educationSectionsRead = ['intro', 'componentes', 'actividades', 'videos'];
  st.reflexionAnswers = [
    'Hago una pausa corta, reviso qué parte me bloquea y la divido en pasos más chicos.',
    'Pruebo otra técnica: mapa mental, explicar en voz alta o resolver ejercicios anteriores.',
    'Lo anoto, entiendo qué falló y me pregunto qué cambiaría la próxima vez.',
    'Recordar por qué empecé y ver mi racha avanzando.',
    'Cuando llevo mucho tiempo bloqueada o cansada: descanso o pido ayuda a un compañero.',
  ];
  st.personalPlan = {
    goal: 'Terminar mi carrera con promedio sobresaliente y un proyecto de titulación sólido.',
    reason: 'Quiero apoyar a mi familia y aportar en proyectos de educación.',
    nextStep: 'Entregar el avance del capítulo 2 antes del viernes.',
    obstacle: 'Distraerme con el celular en las tardes.',
    strategy: 'Bloques Pomodoro de 25 min con el celular fuera de vista.',
    support: 'Mi asesora y mi grupo de estudio.',
    reviewDate: addDays(todayS, 14),
  };
  st.learningNote = 'La constancia pesa más que la motivación: lo que importa es empezar los 5 primeros minutos.';
  st.savedVideos = ['v1'];
  st.levelUpShown = MAX_LEVEL;
  st.createdAt = now - 80 * 86400000;
  st.strengths = ['Constancia', 'Organización'];
  return st;
}

const MOOD_NOTES: Record<MoodKey, string[]> = {
  happy: ['Terminé mi bloque de enfoque sin distraerme.', 'Me salió bien la exposición.', 'Cerré varios pendientes y me siento ligera.'],
  normal: ['Día tranquilo, cumplí lo básico.', 'Sin novedades, pero avancé en mi tarea.'],
  sad: ['Me sentí un poco sola hoy.', 'Me costó empezar, pero al final hice algo.'],
  overwhelmed: ['Muchas entregas juntas.', 'Examen cerca y siento presión.'],
};

export function masterMoods(userId: string): MoodEntry[] {
  const rand = rng(77);
  const keys: MoodKey[] = ['happy', 'happy', 'normal', 'normal', 'sad', 'overwhelmed', 'happy', 'normal'];
  const out: MoodEntry[] = [];
  for (let i = 27; i >= 0; i -= 1) {
    if (rand() < 0.28) continue;
    const mood = keys[Math.floor(rand() * keys.length)];
    const notes = MOOD_NOTES[mood];
    const t = Date.now() - i * 86400000 - Math.floor(rand() * 6 * 3600000);
    out.push({ userId, mood, note: notes[Math.floor(rand() * notes.length)], t, day: dayStr(t) });
  }
  return out;
}
