import { ChatButton } from './models';

export interface Intent {
  id: string;
  title: string;
  keywords: string[];
  replies: string[];
  buttons: ChatButton[];
}

const btn = (label: string, action: string): ChatButton => ({ label, action });

/**
 * Módulos del chatbot por reglas (documento "Arquitectura de Intenciones y Detección").
 * Los textos de respuesta se sirven en variantes aleatorias.
 */
export const INTENTS: Intent[] = [
  {
    id: 'm0',
    title: 'Protocolo de emergencia',
    keywords: [
      'ya no puedo mas', 'no puedo mas', 'estoy muy mal', 'me quiero morir', 'quiero desaparecer', 'no vale la pena vivir',
      'hacerme dano', 'desesperado', 'desesperada', 'me rindo', 'no tiene sentido', 'ayuda urgente', 'colapso',
      'quiero morir', 'quitarme la vida', 'suicid',
    ],
    replies: [
      'Por favor, respira hondo. No estás solo en esto ni tienes que pasar por esto en silencio. Aunque ahora todo se sienta abrumador, hay personas capacitadas que quieren escucharte y apoyarte en este momento exacto. No te rindas, tu vida importa mucho.\n\nLíneas directas de atención psicológica inmediata y gratuita:\n• Línea de la Vida (Nacional 24/7): 800 911 2000\n• Línea de Crisis Coahuila (estatal gratuita): 800 822 3737',
    ],
    buttons: [btn('Llamar a Línea de la Vida', 'tel:8009112000'), btn('Llamar a Coahuila', 'tel:8008223737'), btn('Ver ubicaciones', 'route:/support')],
  },
  {
    id: 'm1',
    title: 'Estrés y sobrecarga mental',
    keywords: ['estresado', 'estresada', 'estres', 'abrumado', 'abrumada', 'demasiadas tareas', 'no me alcanza el tiempo', 'mucha presion', 'saturado', 'saturada', 'tension', 'bloqueado', 'bloqueada'],
    replies: [
      'Es normal sentirse saturado cuando se juntan muchas cosas. Haz una pausa de 2 minutos conmigo: suelta los hombros y toma una respiración profunda. ¿Qué es lo que más te tiene presionado en este momento?',
      'El estrés solo nos dice que nos importa lo que hacemos, pero no tienes que resolver todo hoy. Vamos a partir el problema en partes chiquitas. ¿Quieres que organicemos tus pendientes o prefieres una pausa de respiración?',
      'Cuando la mente se llena de pendientes, el cuerpo lo resiente. Detén lo que estás haciendo por un instante. ¿Quieres desahogarte escribiéndolo aquí o prefieres un ejercicio rápido para calmar la mente?',
    ],
    buttons: [btn('Ejercicio de respiración', 'breathe'), btn('Organizar una tarea', 'ask:task'), btn('Solo quiero desahogarme', 'ask:vent')],
  },
  {
    id: 'm2',
    title: 'Tristeza, soledad y desánimo',
    keywords: ['triste', 'me siento mal', 'bajon', 'desanimado', 'desanimada', 'llorar', 'me siento solo', 'me siento sola', 'estoy solo', 'estoy sola', 'soledad', 'vacio', 'nadie me entiende', 'deprimido', 'deprimida', 'sin ganas'],
    replies: [
      'Lamento que te sientas así, pero quiero recordarte que tus emociones son válidas y está bien no estar bien todo el tiempo. Si quieres platicar, aquí estoy para leerte sin juzgarte. ¿Qué fue lo que detonó este sentimiento?',
      'A veces el día pesa más de lo normal. No te exijas estar al 100% hoy; ser constante también significa saber descansar cuando te sientes mal. Cuéntame, ¿qué pasó hoy?',
      'Gracias por compartir cómo te sientes, se necesita valor para admitirlo. No estás solo. Tómate las cosas con calma y platícame lo que traes en mente. Te escucho.',
    ],
    buttons: [btn('Platicar qué pasó', 'ask:vent'), btn('Ver contactos de apoyo', 'route:/support'), btn('Frase de motivación', 'quote')],
  },
  {
    id: 'm3',
    title: 'Cansancio y falta de energía',
    keywords: ['cansado', 'cansada', 'agotado', 'agotada', 'sin energia', 'sueno', 'no doy una', 'desgastado', 'fatiga', 'fundido', 'no tengo fuerzas'],
    replies: [
      'El cansancio es una señal clara de que tu cuerpo y tu mente necesitan recargar batería. Forzarte ahora solo te va a frustrar más. ¿Cuándo fue la última vez que tomaste un vaso con agua o te alejaste de una pantalla?',
      'Descansar también es parte de la disciplina. Si ya diste lo mejor de ti hoy, permítete parar. ¿Qué te parece si dejamos lo no urgente para mañana y te enfocas en dormir bien?',
      'Tu energía no es infinita. Si sientes el cuerpo agotado, date crédito por lo que ya hiciste hoy. ¿Quieres hacer una lista rápida de pendientes para liberarte la mente antes de descansar?',
    ],
    buttons: [btn('Hacer pausa de 10 min', 'route:/tabs/focus?break=10'), btn('Cerrar pendientes de hoy', 'route:/tabs/challenges'), btn('Técnicas de sueño', 'say:sleep')],
  },
  {
    id: 'm4',
    title: 'Procrastinación y falta de motivación',
    keywords: ['flojera', 'procrastinando', 'procrastinar', 'no quiero hacer nada', 'desmotivado', 'desmotivada', 'sin motivacion', 'dejo todo al final', 'posponer', 'no me puedo concentrar'],
    replies: [
      'La motivación no llega sola antes de empezar; suele aparecer después de los primeros minutos de acción. Apliquemos la regla de los 5 minutos: solo comprométete a avanzar 5 minutos en tu tarea. Si después quieres parar, puedes hacerlo. ¿Aceptas el reto?',
      'Es fácil postergar cuando la meta parece enorme. ¿Cuál es el paso más chiquito y ridículamente fácil que puedes dar ahorita mismo para avanzar?',
      'Tener flojera o dispersión no te hace flojo; muchas veces es solo miedo a empezar o una tarea aburrida. ¿Ponemos un cronómetro de 15 minutos sin celular y vemos cuánto avanzas?',
    ],
    buttons: [btn('Reto de 5 minutos', 'route:/tabs/focus?work=5'), btn('Dividir mi tarea', 'ask:task'), btn('Bloquear celular', 'route:/tabs/focus?work=15')],
  },
  {
    id: 'm5',
    title: 'Frustración y sensación de fracaso',
    keywords: ['no sirvo', 'no me sale', 'frustrado', 'frustrada', 'repro', 'falle', 'todo me sale mal', 'inutil', 'me equivoque', 'bronca', 'rabia'],
    replies: [
      'Equivocarse duele y da coraje, pero fallar en un intento no te convierte a ti en un fracaso. El método Grit se basa exactamente en cómo respondes después de caer. Cuéntame, ¿qué fue lo que no salió como esperabas?',
      'Respira profundo. Cuando estamos molestos, tendemos a exagerar el problema. Vamos a analizar qué parte sí está bajo tu control y qué solución práctica podemos encontrar.',
      'Ningún avance importante se logra a la primera. Date permiso de sentir coraje, pero luego pregúntate: ¿qué lección nos deja este tropiezo para el siguiente intento?',
    ],
    buttons: [btn('Analizar el error', 'say:err'), btn('Ver qué está bajo mi control', 'say:control'), btn('Dejarlo salir', 'ask:vent')],
  },
  {
    id: 'm7',
    title: 'Ansiedad ante exámenes y entregas',
    keywords: ['examen', 'tengo examen', 'evaluacion', 'voy a reprobar', 'entrega manana', 'se me acaba el tiempo', 'panico', 'ansioso', 'ansiosa', 'ansiedad', 'me tiemblan las manos', 'bloqueo mental', 'no me acuerdo de nada', 'se me borro todo', 'muchos proyectos'],
    replies: [
      'El pánico bloquea tu memoria de trabajo, pero la información sigue ahí. Hagamos una pausa de 60 segundos con la técnica 4-4-4: inhala por la nariz contando mentalmente 1, 2, 3, 4; sostén el aire 1, 2, 3, 4; y exhala despacio por la boca 1, 2, 3, 4. Repítelo dos veces más. Ahora dime: ¿cuál es el primer concepto clave que necesitas repasar en este instante?',
      'Sentir nervios antes de una entrega grande solo significa que te importa tu resultado. No intentes abarcar todo el temario en un solo bloque. Toma una hoja en blanco, anota los 3 puntos indispensables que sí o sí deben ir en el trabajo y resuelve el primero durante 20 minutos sin mirar el reloj.',
      'Respira hondo. El examen o la entrega mide un momento específico, no define tu inteligencia ni tu capacidad. Deja el teléfono fuera de tu vista, toma un vaso de agua y enfoquémonos únicamente en el entregable más urgente. ¿Por cuál empezamos?',
    ],
    buttons: [btn('Técnica de respiración 4-4-4', 'breathe'), btn('Priorizar lo más urgente', 'ask:task'), btn('Simular preguntas clave', 'say:quiz')],
  },
  {
    id: 'm8',
    title: 'Síndrome del impostor y comparación social',
    keywords: ['no soy tan inteligente', 'todos van mas avanzados', 'siento que no pertenezco', 'fue pura suerte', 'impostor', 'impostora', 'no merezco estar aqui', 'mis companeros son mejores', 'me comparo', 'no encajo', 'siento que los engano'],
    replies: [
      'La perseverancia y el esfuerzo deliberado importan mucho más que el talento innato. No estás aquí por suerte; estás aquí por cada hora de estudio, cada entrega completada y cada error que decidiste corregir. Tu único punto de comparación válido es tu propia versión del mes pasado.',
      'En redes sociales o en clase solo ves el resultado final de los demás, nunca sus momentos de duda, frustración o errores. Medir tu proceso interno contra el escaparate externo de otros no es justo contigo. Revisa tus retos completados en la app: cada uno es evidencia real de tu constancia.',
      'Sentir que no sabes lo suficiente no significa que seas un fraude; significa que estás aprendiendo en una zona que te reta. La mentalidad Grit no exige que todo te salga perfecto a la primera, sino que decidas presentarte y perseverar a pesar de la incertidumbre. ¿Qué habilidad dominas hoy que antes te costaba trabajo?',
    ],
    buttons: [btn('Ver mi historial de retos', 'route:/progress'), btn('Registrar una fortaleza hoy', 'ask:strength'), btn('Enfocarme en mi ritmo', 'say:rhythm')],
  },
  {
    id: 'm9',
    title: 'Celebración de logros y rachas',
    keywords: ['lo logre', 'aprobe', 'saque 100', 'pase el examen', 'termine la tarea', 'entregue a tiempo', 'complete el reto', 'subi de nivel', 'nueva racha', 'cumpli mi meta', 'por fin termine', 'lo consegui'],
    replies: [
      '¡Excelente trabajo! Ese logro no cayó del cielo: es el resultado directo de sentarte a trabajar incluso los días en que no tenías ganas. Reconocer tus victorias consolida el hábito y le enseña a tu cerebro que el esfuerzo da frutos. Tómate un momento para disfrutarlo antes de ir por el siguiente objetivo.',
      '¡Meta cumplida y bien ganada! Cada racha mantenida y cada entrega concluida demuestran que tu disciplina le está ganando a la procrastinación. Anota cómo te sientes ahorita para recordarlo el día que la motivación baje. ¡A seguir con ese ritmo!',
      '¡Felicidades por cerrar ese reto! Construir constancia no es fácil, y tú acabas de dar un paso sólido hacia adelante. Sumaste tus puntos de experiencia con esfuerzo real. Date un respiro merecido y cuando estés listo, seguimos construyendo esa maestría.',
    ],
    buttons: [btn('Ver mis nuevos XP', 'route:/progress'), btn('Fijar siguiente meta', 'route:/discover'), btn('Tomar descanso merecido', 'say:rest')],
  },
  {
    id: 'm6',
    title: 'Saludo inicial y menú principal',
    keywords: ['hola', 'buenas', 'hey', 'que onda', 'iniciar', 'menu', 'ayuda', 'empezar'],
    replies: [
      '¡Hola! Soy tu asistente de apoyo y constancia. Estoy aquí para acompañarte cuando necesites desahogarte, si te sientes estresado o cansado, o si necesitas ordenar tus ideas para no rendirte. ¿Cómo te encuentras en este momento?',
    ],
    buttons: [btn('Me siento estresado', 'intent:m1'), btn('Estoy triste/desanimado', 'intent:m2'), btn('No puedo empezar a estudiar', 'intent:m4'), btn('Necesito apoyo profesional', 'say:pro')],
  },
];

export const FALLBACK: Intent = {
  id: 'm10',
  title: 'Fuera de contexto',
  keywords: [],
  replies: [
    'No tengo información sobre ese tema ni puedo ayudarte con esa solicitud específica. Mi función aquí es acompañarte cuando sientas estrés, cansancio o bloqueo, y ayudarte a mantener la constancia en tus retos diarios. Si necesitas apoyo con tu estudio o tus hábitos, dime con qué empezamos.',
    'Eso se sale de lo que puedo hacer. Estoy diseñado para ser tu espacio de apoyo emocional, organización de tareas y desarrollo de disciplina. ¿Hay algo de tus pendientes, tus niveles o tu estado de ánimo con lo que te pueda echar una mano ahorita?',
    'No cuento con respuesta para esa pregunta en particular. Para no desviarnos de tus metas, dime si te sientes saturado con alguna entrega, si necesitas hacer una pausa guiada o si quieres revisar tus retos de hoy.',
  ],
  buttons: [btn('Ver mis retos del día', 'route:/tabs/challenges'), btn('Me siento estresado', 'intent:m1'), btn('Volver al menú principal', 'intent:m6')],
};

/** Respuestas fijas de botones "say:" */
export const SAY: Record<string, { text: string; buttons: ChatButton[] }> = {
  sleep: {
    text: 'Para dormir mejor esta noche: 1) Fija una hora de dormir y levantarte. 2) Deja el celular fuera de la cama 30 minutos antes. 3) Escribe en una hoja lo que te preocupa para "sacarlo" de la cabeza. 4) Haz 3 rondas de respiración 4-4-4. Tu mejor entrenamiento de mañana empieza con un buen descanso.',
    buttons: [{ label: 'Ejercicio de respiración', action: 'breathe' }, { label: 'Volver al menú principal', action: 'intent:m6' }],
  },
  err: {
    text: 'Hagamos un mini análisis sin juzgarte: 1) ¿Qué pasó exactamente? 2) ¿Qué sí funcionó, aunque sea poco? 3) ¿Qué cambiarías en el siguiente intento? Escríbeme lo que se te ocurra y lo vamos aterrizando juntos.',
    buttons: [{ label: 'Dejarlo salir', action: 'ask:vent' }, { label: 'Volver al menú principal', action: 'intent:m6' }],
  },
  control: {
    text: 'Haz dos columnas en una hoja. En la primera, lo que SÍ depende de ti (tu preparación, tu horario, pedir ayuda). En la segunda, lo que NO (la dificultad del examen, el humor de otros). Dedica tu energía solo a la primera columna y suelta la segunda.',
    buttons: [{ label: 'Dividir mi tarea', action: 'ask:task' }, { label: 'Volver al menú principal', action: 'intent:m6' }],
  },
  quiz: {
    text: 'Toma el tema que más te preocupa y escribe 3 preguntas que crees que podrían salir. Respóndelas sin ver tus apuntes, luego compara y marca lo que fallaste: eso es exactamente lo que vale la pena repasar. Hacerlo en bloques de 15 minutos es suficiente.',
    buttons: [{ label: 'Reto de 5 minutos', action: 'route:/tabs/focus?work=15' }, { label: 'Volver al menú principal', action: 'intent:m6' }],
  },
  rhythm: {
    text: 'Tu ritmo es el único que importa. Mira tu racha, tus niveles y los retos que ya completaste: eso es avance real y medible. Hoy basta con dar un paso más que ayer.',
    buttons: [{ label: 'Ver mi historial de retos', action: 'route:/progress' }, { label: 'Volver al menú principal', action: 'intent:m6' }],
  },
  rest: {
    text: 'Descansar también suma. Toma agua, estírate y date unos minutos sin pantallas. Cuando regreses, seguimos construyendo constancia. ',
    buttons: [{ label: 'Hacer pausa de 10 min', action: 'route:/tabs/focus?break=10' }, { label: 'Volver al menú principal', action: 'intent:m6' }],
  },
  pro: {
    text: 'Buscar apoyo profesional es un acto de fortaleza. En la sección de Apoyo emocional tienes las líneas de atención gratuitas y los centros de atención psicológica en Torreón, Saltillo y Gómez Palacio. Esta app no sustituye atención psicológica profesional.',
    buttons: [{ label: 'Ver contactos de apoyo', action: 'route:/support' }, { label: 'Llamar a Línea de la Vida', action: 'tel:8009112000' }],
  },
};

export const VENT_REPLIES = [
  'Gracias por contármelo. Te leo con atención. ¿Qué es lo que más te pesa de todo eso?',
  'Tiene sentido que te sientas así. No tienes que resolverlo ahorita; ponerlo en palabras ya ayuda. ¿Quieres seguir contándome?',
  'Te escucho y estoy contigo. Cuando quieras, podemos convertir esto en un primer paso pequeño o simplemente hacer una pausa.',
];
