export type MoodKey = 'happy' | 'normal' | 'sad' | 'overwhelmed';

export interface Level {
  level: number;
  name: string;
  xpRequired: number; // XP acumulados para entrar al nivel
}

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  salt: string;
  hash: string;
  algo: 'pbkdf2' | 'sha256js';
  profileLabel: string; // etiqueta de la cuenta demo
}

export interface CompletedChallenge {
  at: number; // epoch ms
  xp: number;
  /** Respuesta o resumen guardado como evidencia (texto, listas, etc.) */
  data?: Record<string, unknown>;
  /** Ids de evidencias binarias (fotos/archivos) guardadas en IndexedDB */
  evidenceIds?: string[];
}

export interface PersonalPlan {
  goal: string;
  reason: string;
  nextStep: string;
  obstacle: string;
  strategy: string;
  support: string;
  reviewDate: string;
}

export interface FinalEvaluation {
  participantName: string;
  age: string;
  institution: string;
  program: string;
  enrollment: string; // matrícula
  semester: string;
  startDate: string;
  answers: number[]; // 10 respuestas (1-5), 0 = sin responder
  consent: boolean;
  submitted: boolean;
  submittedAt?: number;
}

/** Entrada de una bitácora de varios días (retos tipo "logdays") */
export interface DayLogEntry {
  day: string; // YYYY-MM-DD
  text: string;
}

/** Estado transitorio de un reto en curso (persistido para sobrevivir recargas) */
export interface PendingChallenge {
  startedAt?: number;
  codeIssuedAt?: number;
  code?: string;
  logs?: DayLogEntry[];
  [k: string]: unknown;
}

export interface UserSettings {
  /** Acelera x60 los temporizadores (solo para demostración / pruebas) */
  demoSpeed: boolean;
  sound: boolean;
  /** IA en la nube (Gemini) para chat y fotos; por defecto activa si el build la configura */
  ai?: boolean;
}

export interface UserState {
  userId: string;
  name: string;
  xp: number;
  completed: Record<string, CompletedChallenge>;
  /** Días (YYYY-MM-DD) con cualquier actividad registrada (reto, enfoque, ánimo) */
  activityDays: string[];
  /** Días (YYYY-MM-DD) en los que se completó al menos un reto */
  challengeDays: string[];
  pending: Record<string, PendingChallenge>;
  focusSessions: number;
  focusMinutes: number;
  educationSectionsRead: string[];
  reflexionAnswers: string[];
  personalPlan: PersonalPlan;
  learningNote: string;
  savedVideos: string[];
  evaluation: FinalEvaluation;
  levelUpShown: number;
  createdAt: number;
  settings: UserSettings;
  /** Datos del reto "Hábito/energía": bitácoras por reto */
  strengths: string[];
}

export interface MoodEntry {
  id?: number;
  userId: string;
  mood: MoodKey;
  note: string;
  t: number;
  day: string;
}

export interface ChatMessage {
  id?: number;
  userId: string;
  role: 'bot' | 'user';
  text: string;
  buttons?: ChatButton[];
  t: number;
}

export interface ChatButton {
  label: string;
  action: string; // p.ej. "intent:m1", "route:/support", "tel:8009112000", "say:..."
}

export interface EvidenceRecord {
  id: string;
  userId: string;
  challengeId: string;
  kind: 'photo' | 'file';
  name: string;
  mime: string;
  blob: Blob;
  code?: string;
  takenAt: number;
}
