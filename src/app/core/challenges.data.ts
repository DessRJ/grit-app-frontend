import { difficultyOfLevel } from './levels';

/** Segmento de un temporizador */
export interface Seg {
  k: 'work' | 'break';
  m: number; // minutos
  /** Al terminar el segmento hay que registrar un entregable intermedio */
  deliver?: boolean;
  /** El descanso también obliga a permanecer en la app (pantalla bloqueada) */
  locked?: boolean;
}

export interface Field {
  key: string;
  label: string;
  hint?: string;
  minWords?: number;
  rows?: number;
  kind?: 'text' | 'number' | 'date';
}

export type Validation =
  | { t: 'timer'; segs: Seg[]; note?: string }
  | { t: 'breathing'; minutes: number }
  | {
      t: 'photo';
      shots: string[];
      hint: string;
      /** false: no exige código dinámico (p. ej. captura de pantalla) */
      code?: boolean;
      /** 'any': permite elegir archivo existente (capturas, PDF) */
      source?: 'camera' | 'any';
      allowLink?: boolean;
      /** Exige indicar una fecha límite al menos 24 h posterior */
      deadline?: boolean;
    }
  | { t: 'text'; fields: Field[] }
  | { t: 'list'; mainLabel?: string; count: number; itemLabel: string; checkable?: boolean; minWordsEach?: number }
  | { t: 'table'; rows: number; cols: Field[]; rowLabel: string }
  | { t: 'checkin'; before?: { h: number; m: number }; fields?: Field[]; confirmLabel: string }
  | { t: 'streak'; days: number; basis: 'activity' | 'challenge' }
  | { t: 'logdays'; days: number; prompt: string; minWords: number }
  | { t: 'fast'; hours: number }
  | { t: 'sleeplock'; from: { h: number; m: number }; to: { h: number; m: number } }
  | { t: 'hardday' }
  | { t: 'peer' }
  | { t: 'planner'; minTasks: number };

export interface Challenge {
  id: string;
  level: number;
  n: number;
  name: string;
  xp: number;
  icon: string;
  mech: string; // criterio de validación tal como aparece en el manual
  difficulty: string;
  minutes: number; // duración estimada
  v: Validation;
}

type Raw = [string, number, string, string, number, Validation];

const w = (m: number, extra: Partial<Seg> = {}): Seg => ({ k: 'work', m, ...extra });
const b = (m: number, extra: Partial<Seg> = {}): Seg => ({ k: 'break', m, ...extra });

const RAW: Record<number, Raw[]> = {
  1: [
    ['Cero distracciones', 30, 'phone-portrait-outline', 'Temporizador de 15 min en la app. Falla si se cambia de pantalla o app.', 15, { t: 'timer', segs: [w(15)] }],
    ['Espacio de enfoque', 35, 'desktop-outline', 'Foto en vivo: escritorio limpio con papel que muestre el código temporal.', 5, { t: 'photo', shots: ['Escritorio limpio'], hint: 'Tu escritorio limpio y un papel manuscrito con la fecha de hoy y el código.' }],
    ['Intención del día', 30, 'create-outline', 'Texto obligatorio: redacción de 3 prioridades del día (mínimo 40 palabras).', 5, { t: 'text', fields: [{ key: 'prioridades', label: 'Mis 3 prioridades de hoy', hint: 'Escribe tus 3 prioridades y por qué son importantes…', minWords: 40, rows: 6 }] }],
    ['Lectura activa', 35, 'book-outline', 'Foto en vivo: libro o material de estudio abierto con código dinámico visible.', 10, { t: 'photo', shots: ['Material de estudio abierto'], hint: 'Libro o material de estudio abierto, con el papel del código visible.' }],
    ['Hidratación y orden', 35, 'water-outline', 'Foto en vivo: botella/vaso de agua junto a cuaderno de notas con código.', 5, { t: 'photo', shots: ['Agua y cuaderno'], hint: 'Botella o vaso de agua junto a tu cuaderno de notas y el papel con el código.' }],
    ['Cierre de pendientes', 40, 'checkmark-done-outline', 'Foto doble (antes y después) de la tarea realizada, ambas con código.', 20, { t: 'photo', shots: ['Antes', 'Después'], hint: 'Una foto antes y otra después de tu tarea. Cada foto necesita su propio código.' }],
    ['Calma y respiración', 40, 'leaf-outline', 'Sesión interactiva en app de 3 minutos de respiración sin pausar.', 3, { t: 'breathing', minutes: 3 }],
    ['Reflexión semanal', 55, 'journal-outline', 'Texto obligatorio: reflexión sobre constancia semanal (mínimo 60 palabras).', 10, { t: 'text', fields: [{ key: 'reflexion', label: 'Reflexión sobre mi constancia esta semana', hint: '¿Qué hábitos mantuve? ¿Qué me costó? ¿Qué ajustaré?', minWords: 60, rows: 8 }] }],
  ],
  2: [
    ['Pomodoro individual', 50, 'timer-outline', 'Temporizador ininterrumpido de 25 min en pantalla completa de la app.', 25, { t: 'timer', segs: [w(25)] }],
    ['Desglose de tarea', 50, 'git-branch-outline', 'Formulario: tarea principal dividida en 4 subtareas accionables completadas.', 15, { t: 'list', mainLabel: 'Tarea principal', count: 4, itemLabel: 'Subtarea', checkable: true }],
    ['Bitácora de foco', 55, 'eye-off-outline', 'Texto: registro de 2 distracciones detectadas y la acción tomada para evitarlas.', 10, { t: 'table', rows: 2, rowLabel: 'Distracción', cols: [{ key: 'a', label: '¿Qué te distrajo?', minWords: 2 }, { key: 'b', label: 'Acción para evitarla', minWords: 3 }] }],
    ['Apuntes esquemáticos', 55, 'git-network-outline', 'Foto en vivo: mapa mental o notas manuscritas con código temporal visible.', 15, { t: 'photo', shots: ['Mapa mental o apuntes'], hint: 'Tu mapa mental o notas manuscritas, con el papel del código a la vista.' }],
    ['Pausa activa real', 55, 'walk-outline', 'Cronómetro de 10 min de descanso con pantalla bloqueada en la app.', 10, { t: 'timer', segs: [b(10, { locked: true })], note: 'Descansa de verdad: estira, camina, respira. La pantalla se bloquea durante la pausa.' }],
    ['Preparación previa', 60, 'bag-handle-outline', 'Foto en vivo: materiales y libreta listos para el día siguiente con código.', 10, { t: 'photo', shots: ['Materiales listos'], hint: 'Materiales y libreta listos para mañana, con el papel del código.' }],
    ['Lectura de avance', 60, 'reader-outline', 'Foto en vivo: 2 páginas leídas y subrayadas con código anotado al pie.', 20, { t: 'photo', shots: ['Páginas leídas y subrayadas'], hint: 'Dos páginas leídas y subrayadas, con el código anotado al pie.' }],
    ['Racha inicial (3 días)', 65, 'flame-outline', 'Validación del sistema: registro de actividad diaria por 3 días seguidos.', 0, { t: 'streak', days: 3, basis: 'activity' }],
  ],
  3: [
    ['Doble Pomodoro', 70, 'copy-outline', 'Temporizador: 2 bloques de 25 min con 5 min de descanso obligatorio intermedio.', 55, { t: 'timer', segs: [w(25), b(5), w(25)] }],
    ['Límites digitales', 70, 'hourglass-outline', 'Captura de pantalla: configuración activa de límite de uso en redes sociales.', 10, { t: 'photo', shots: ['Captura de pantalla del límite'], hint: 'Captura de la configuración de tiempo de uso / límite de apps de redes sociales.', code: false, source: 'any' }],
    ['Entrega anticipada', 75, 'rocket-outline', 'Foto en vivo: tarea o informe terminado con carátula y código dinámico.', 20, { t: 'photo', shots: ['Entrega terminada'], hint: 'Tu tarea o informe terminado, con carátula visible y el papel del código.' }],
    ['Práctica deliberada', 75, 'barbell-outline', 'Texto: descripción de un tema difícil practicado y corrección hecha (mín. 70 palabras).', 20, { t: 'text', fields: [{ key: 'practica', label: 'Tema difícil practicado y corrección realizada', minWords: 70, rows: 8 }] }],
    ['Inicio temprano', 75, 'sunny-outline', 'Check-in en la aplicación antes de las 7:30 AM con confirmación de botón.', 1, { t: 'checkin', before: { h: 7, m: 30 }, confirmLabel: 'Ya empecé mi día' }],
    ['Espacio despejado', 75, 'sparkles-outline', 'Foto en vivo: área de estudio completamente ordenada con código visible.', 10, { t: 'photo', shots: ['Área de estudio ordenada'], hint: 'Tu área de estudio completamente ordenada, con el papel del código.' }],
    ['Explicación activa', 80, 'chatbubbles-outline', 'Texto: explicación resumida de un concepto enseñado a otra persona.', 15, { t: 'text', fields: [{ key: 'concepto', label: 'Concepto que enseñaste', rows: 2, minWords: 2 }, { key: 'explicacion', label: 'Resumen de tu explicación', minWords: 40, rows: 6 }] }],
    ['Racha media (5 días)', 80, 'flame-outline', 'Validación del sistema: 5 días continuos cumpliendo al menos un reto.', 0, { t: 'streak', days: 5, basis: 'challenge' }],
  ],
  4: [
    ['Bloque de Deep Work', 85, 'telescope-outline', 'Temporizador continuo de 60 min sin abandonar la pantalla de la app.', 60, { t: 'timer', segs: [w(60)] }],
    ['Prioridad pesada', 85, 'barbell-outline', 'Check-in antes del mediodía informando la tarea más difícil terminada.', 5, { t: 'checkin', before: { h: 12, m: 0 }, confirmLabel: 'Terminé mi tarea más difícil', fields: [{ key: 'tarea', label: 'La tarea más difícil que terminaste', minWords: 3, rows: 3 }] }],
    ['Metas quincenales', 90, 'calendar-outline', 'Foto en vivo: plan escrito con 3 metas de los próximos 15 días y código.', 15, { t: 'photo', shots: ['Plan de 3 metas a 15 días'], hint: 'Tu plan escrito con 3 metas para los próximos 15 días y el papel del código.' }],
    ['Higiene de sueño', 90, 'moon-outline', 'Bloqueo voluntario de la app desde 10:30 PM hasta 6:30 AM sin actividad.', 0, { t: 'sleeplock', from: { h: 22, m: 30 }, to: { h: 6, m: 30 } }],
    ['Problema complejo', 95, 'extension-puzzle-outline', 'Foto en vivo: desarrollo de ejercicio complejo resuelto en papel con código.', 30, { t: 'photo', shots: ['Ejercicio complejo resuelto'], hint: 'El desarrollo de tu ejercicio complejo resuelto en papel, con el código a la vista.' }],
    ['Auditoría de tiempo', 95, 'stopwatch-outline', 'Texto/tabla: comparativa de tiempo estimado vs. tiempo real en 3 tareas.', 15, { t: 'table', rows: 3, rowLabel: 'Tarea', cols: [{ key: 'a', label: 'Tarea', minWords: 1 }, { key: 'b', label: 'Estimado (min)', kind: 'number' }, { key: 'c', label: 'Real (min)', kind: 'number' }] }],
    ['Revisión de errores', 100, 'bug-outline', 'Texto: análisis de un fallo previo y protocolo exacto para no repetirlo.', 15, { t: 'text', fields: [{ key: 'fallo', label: 'Análisis del fallo previo', minWords: 30, rows: 5 }, { key: 'protocolo', label: 'Protocolo exacto para no repetirlo', minWords: 25, rows: 5 }] }],
    ['Semana perfecta (7 días)', 110, 'trophy-outline', 'Validación del sistema: 7 días consecutivos completando retos diarios.', 0, { t: 'streak', days: 7, basis: 'challenge' }],
  ],
  5: [
    ['Sesión de 90 minutos', 100, 'albums-outline', 'Temporizador: 3 bloques de 30 min con 5 min de descanso entre cada uno.', 100, { t: 'timer', segs: [w(30), b(5), w(30), b(5), w(30)] }],
    ['Limpieza de archivos', 105, 'folder-open-outline', 'Foto en vivo: pantalla de computadora con carpetas ordenadas y código.', 20, { t: 'photo', shots: ['Carpetas ordenadas'], hint: 'La pantalla de tu computadora con carpetas ordenadas y el papel del código al lado.' }],
    ['Plan semanal cerrado', 110, 'calendar-number-outline', 'Foto en vivo: agenda semanal completada y planificada junto al código del día.', 20, { t: 'photo', shots: ['Agenda semanal'], hint: 'Tu agenda semanal completa y planificada junto al papel del código.' }],
    ['Cero postergación', 110, 'alarm-outline', 'Texto: registro de una tarea postergada por días y resuelta hoy mismo.', 15, { t: 'text', fields: [{ key: 'tarea', label: 'Tarea que habías postergado y cómo la resolviste hoy', minWords: 40, rows: 6 }] }],
    ['Proyecto en curso', 115, 'construct-outline', 'Foto en vivo: avance físico o digital tangible de un proyecto con código.', 30, { t: 'photo', shots: ['Avance del proyecto'], hint: 'Un avance tangible de tu proyecto (físico o digital) con el papel del código.' }],
    ['Día difícil superado', 115, 'shield-checkmark-outline', 'Completar la meta obligatoria en un día marcado por el usuario como cansado.', 0, { t: 'hardday' }],
    ['Asimilación de crítica', 120, 'ear-outline', 'Texto: retroalimentación recibida de un profesor o mentor y plan aplicado.', 20, { t: 'text', fields: [{ key: 'critica', label: 'Retroalimentación que recibiste', minWords: 20, rows: 4 }, { key: 'plan', label: 'Plan que aplicarás', minWords: 20, rows: 4 }] }],
    ['Racha firme (10 días)', 125, 'flame-outline', 'Validación del sistema: 10 días continuos sin interrupciones.', 0, { t: 'streak', days: 10, basis: 'challenge' }],
  ],
  6: [
    ['Respuesta ante error', 120, 'return-up-back-outline', 'Texto: descripción de un obstáculo no previsto y solución en menos de 24 h.', 15, { t: 'text', fields: [{ key: 'obstaculo', label: 'Obstáculo imprevisto y cómo lo resolviste en menos de 24 h', minWords: 40, rows: 7 }] }],
    ['Foco en silencio', 125, 'volume-mute-outline', 'Temporizador de 45 min de trabajo sin música ni cambios de pantalla.', 45, { t: 'timer', segs: [w(45)], note: 'Sin música ni cambios de pantalla durante los 45 minutos.' }],
    ['Causa raíz de fallas', 130, 'git-compare-outline', 'Foto en vivo: diagrama simple de causa y efecto de un mal hábito con código.', 20, { t: 'photo', shots: ['Diagrama causa–efecto'], hint: 'Tu diagrama de causa y efecto de un mal hábito, con el papel del código.' }],
    ['Optimización de rutina', 130, 'options-outline', 'Texto: descripción de una rutina diaria rediseñada para ahorrar tiempo.', 20, { t: 'text', fields: [{ key: 'rutina', label: 'Tu rutina rediseñada y el tiempo que ahorra', minWords: 50, rows: 7 }] }],
    ['Entrega bajo presión', 135, 'flash-outline', 'Foto en vivo: documento finalizado 24 horas antes de su fecha límite oficial.', 30, { t: 'photo', shots: ['Documento finalizado'], hint: 'Tu documento finalizado y el papel del código. Indica su fecha límite oficial (debe ser al menos 24 h después).', deadline: true }],
    ['Apoyo mutuo Grit', 135, 'people-outline', 'Texto: registro de apoyo o tutoría académica brindada a un compañero.', 20, { t: 'text', fields: [{ key: 'companero', label: 'A quién apoyaste', minWords: 1, rows: 1 }, { key: 'apoyo', label: 'Qué apoyo o tutoría brindaste', minWords: 40, rows: 6 }] }],
    ['Ayuno digital parcial', 135, 'cloud-offline-outline', '6 horas seguidas en horario diurno con cero uso de redes y apps de ocio.', 360, { t: 'fast', hours: 6 }],
    ['Racha fuerte (14 días)', 140, 'flame-outline', 'Validación del sistema: 2 semanas consecutivas de cumplimiento estricto.', 0, { t: 'streak', days: 14, basis: 'challenge' }],
  ],
  7: [
    ['Bloque de 120 minutos', 140, 'hourglass-outline', 'Temporizador: 2 horas de trabajo con 2 pausas breves de 5 min monitoreadas.', 130, { t: 'timer', segs: [w(40), b(5), w(40), b(5), w(40)] }],
    ['Punto de estancamiento', 145, 'trending-up-outline', 'Foto en vivo: problema difícil de días resuelto, con notas y código del día.', 30, { t: 'photo', shots: ['Problema resuelto con notas'], hint: 'El problema que llevaba días atorado, ya resuelto, con tus notas y el papel del código.' }],
    ['Auditoría semanal', 150, 'pie-chart-outline', 'Foto o archivo: desglose real de las 168 horas semanales analizadas.', 30, { t: 'photo', shots: ['Desglose de 168 horas'], hint: 'Foto o archivo (imagen/PDF) con el desglose real de tus 168 horas semanales.', code: false, source: 'any' }],
    ['Exposición pública', 150, 'mic-outline', 'Foto en vivo / link: evidencia de presentación de proyecto o entregable público.', 30, { t: 'photo', shots: ['Evidencia de la presentación'], hint: 'Foto en vivo de tu presentación o un enlace público a tu entregable.', allowLink: true }],
    ['Energía física y mental', 150, 'fitness-outline', 'Registro de 5 días seguidos combinando estudio con actividad física diaria.', 0, { t: 'logdays', days: 5, prompt: 'Describe qué estudiaste y qué actividad física hiciste hoy.', minWords: 12 }],
    ['Hábito reemplazado', 150, 'swap-horizontal-outline', 'Texto: bitácora de 7 días reemplazando una conducta nociva por una útil.', 0, { t: 'logdays', days: 7, prompt: 'Anota la conducta nociva que reemplazaste hoy y por cuál útil.', minWords: 10 }],
    ['Plan de contingencia', 155, 'umbrella-outline', 'Texto: protocolo redactado de qué hacer cuando una entrega o plan falla.', 20, { t: 'text', fields: [{ key: 'protocolo', label: 'Mi protocolo de contingencia', minWords: 60, rows: 8 }] }],
    ['Racha consolidada (21 días)', 160, 'flame-outline', 'Validación del sistema: 3 semanas consecutivas sin fallar ningún día.', 0, { t: 'streak', days: 21, basis: 'challenge' }],
  ],
  8: [
    ['Proyecto hito', 200, 'ribbon-outline', 'Foto en vivo: producto o entrega final terminada con post-it y código dinámico.', 30, { t: 'photo', shots: ['Producto o entrega final'], hint: 'Tu producto o entrega final terminada, con un post-it y el papel del código.' }],
    ['Filosofía de constancia', 175, 'library-outline', 'Texto obligatorio: ensayo reflexivo de 250 palabras sobre constancia y propósito.', 40, { t: 'text', fields: [{ key: 'ensayo', label: 'Ensayo: constancia y propósito', hint: 'Mínimo 250 palabras.', minWords: 250, rows: 14 }] }],
    ['Guía para novatos', 175, 'compass-outline', 'Texto: creación de una guía práctica de 5 consejos para usuarios que inician en Nivel 1.', 25, { t: 'list', count: 5, itemLabel: 'Consejo', minWordsEach: 8 }],
    ['Jornada impecable', 175, 'checkbox-outline', 'Cumplimiento del 100% de las tareas planeadas del día sin posponer nada.', 0, { t: 'planner', minTasks: 3 }],
    ['Resistencia de 3 horas', 200, 'infinite-outline', 'Bloque de estudio de 180 min con entregables intermedios registrados en la app.', 180, { t: 'timer', segs: [w(60, { deliver: true }), w(60, { deliver: true }), w(60, { deliver: true })] }],
    ['Metas a largo plazo', 185, 'flag-outline', 'Foto en vivo: plan escrito para los próximos 6 a 12 meses con código visible.', 30, { t: 'photo', shots: ['Plan de 6 a 12 meses'], hint: 'Tu plan escrito a 6–12 meses, con el papel del código.' }],
    ['Mentoría verificada', 190, 'school-outline', 'Confirmación de un compañero en la plataforma validando acompañamiento recibido.', 10, { t: 'peer' }],
    ['Racha legendaria (30 días)', 200, 'medal-outline', 'Validación del sistema: 1 mes calendario completo con cumplimiento diario.', 0, { t: 'streak', days: 30, basis: 'challenge' }],
  ],
};

export const CHALLENGES: Challenge[] = Object.entries(RAW).flatMap(([lv, list]) =>
  list.map(([name, xp, icon, mech, minutes, v], i): Challenge => ({
    id: `L${lv}-${i + 1}`,
    level: +lv,
    n: i + 1,
    name,
    xp,
    icon,
    mech,
    minutes,
    difficulty: difficultyOfLevel(+lv),
    v,
  })),
);

export const CHALLENGE_BY_ID = new Map(CHALLENGES.map((c) => [c.id, c]));

export function challengesOfLevel(level: number): Challenge[] {
  return CHALLENGES.filter((c) => c.level === level);
}

export function levelXPTotal(level: number): number {
  return challengesOfLevel(level).reduce((s, c) => s + c.xp, 0);
}
