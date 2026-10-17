export interface Quote {
  text: string;
  author?: string;
}

/** 30 frases motivacionales (documento del proyecto) */
export const QUOTES: Quote[] = [
  { text: 'Siempre parece imposible hasta que se hace.', author: 'Nelson Mandela' },
  { text: 'No dejes que lo que no puedes hacer interfiera con lo que puedes hacer.', author: 'John R. Wooden' },
  { text: 'Tus talentos y habilidades irán mejorando con el tiempo, pero para eso has de empezar.', author: 'Martin Luther King' },
  { text: 'Eres más que capaz de encontrar el éxito, pero solo ocurrirá si te pones a ello.', author: 'Vince Lombardi' },
  { text: 'La perseverancia puede transformar el fracaso en un logro extraordinario.', author: 'Matt Biondi' },
  { text: 'La paciencia, la perseverancia y el sudor hacen una combinación invencible para llegar al éxito.', author: 'Napoleon Hill' },
  { text: 'Ten paciencia; todas las cosas son difíciles hasta que se hacen fáciles.', author: 'Saadi' },
  { text: 'Los tiempos difíciles nunca duran, pero las personas fuertes sí.', author: 'Robert H. Schuller' },
  { text: 'El éxito no llega por casualidad; es trabajo duro, perseverancia, aprendizaje y sacrificio.', author: 'Pelé' },
  { text: 'La disciplina es el puente entre las metas y los logros.', author: 'Jim Rohn' },
  { text: 'El fracaso y el rechazo son solo el primer escalón hacia el éxito.', author: 'Jim Valvano' },
  { text: 'Los grandes esfuerzos traen grandes recompensas.' },
  { text: 'Confía en el proceso y te darás cuenta de que todo es posible.' },
  { text: 'La manera de empezar es dejar de hablar y comenzar a hacer.', author: 'Walt Disney' },
  { text: 'La disciplina diaria siempre vence al talento que no se esfuerza.' },
  { text: 'Vive como si fueras a morir mañana; aprende como si fueras a vivir siempre.', author: 'Mahatma Gandhi' },
  { text: 'No dejes que el ayer ocupe mucho espacio de tu hoy.', author: 'Will Rogers' },
  { text: 'Fijarse metas es el secreto para un futuro grandioso.', author: 'Tony Robbins' },
  { text: "La única persona que puede decirte 'no puedes lograrlo' eres tú misma, y no debes escucharla.", author: 'Jessica Ennis' },
  { text: 'Acepta tus victorias, sean las que sean, valóralas, úsalas, pero no te conformes con ellas.', author: 'Mia Hamm' },
  { text: 'Empieza donde estás. Usa lo que tienes. Haz lo que puedas.', author: 'Arthur Ashe' },
  { text: 'Nunca renuncies a un sueño simplemente por el tiempo que necesitarás para lograrlo. El tiempo pasará de todos modos.', author: 'Earl Nightingale' },
  { text: 'Lo que haces marca la diferencia, y tienes que decidir qué diferencia quieres marcar.', author: 'Jane Goodall' },
  { text: 'Nunca te aburrirás si intentas algo nuevo. Realmente no existe un límite para todo lo que puedes hacer.', author: 'Dr. Seuss' },
  { text: 'Cada caída es una oportunidad para levantarte más fuerte y sabio.' },
  { text: 'Cada problema tiene solución, solo hay que buscarla con calma y confianza.' },
  { text: 'Tu mente es poderosa, así que llénala de pensamientos que te hagan sentir bien.' },
  { text: 'No es lo que logras, es lo que superas. Eso es lo que define tu vida.' },
  { text: 'No desees que las cosas sean más fáciles, desea tú ser mejor.' },
  { text: 'El momento en que quieres dejarlo es justo el momento en que tienes que seguir avanzando.' },
];

export interface SupportContact {
  city: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
}

export const HOTLINES = [
  { name: 'Línea de la Vida (Nacional 24/7)', phone: '8009112000', display: '800 911 2000', email: 'lalineadelavida@salud.gob.mx' },
  { name: 'Línea de Crisis Coahuila (estatal gratuita)', phone: '8008223737', display: '800 822 3737' },
];

export const SUPPORT_CONTACTS: SupportContact[] = [
  { city: 'Torreón', name: 'Centro de Atención Psicológica — Escuela de Psicología UAdeC', phone: '8717165740', address: 'Prolongación Comonfort esq. con Blvd. Revolución, Col. Luis Echeverría (Unidad Laguna).' },
  { city: 'Torreón', name: 'CECOSAMA / UNEME-CAPA Torreón (Salud Mental y Adicciones)', phone: '8712851724', email: 'capatorreon@gmail.com', address: 'Calle del Mueble 210 Ote., Parque Industrial Oriente, 27272 Torreón, Coah.' },
  { city: 'Saltillo', name: 'Central de Servicios Psicológicos de la UAdeC (Saltillo)', phone: '8442869926', address: 'Unidad Camporredondo, Edificio del Departamento de Posgrado de la Facultad de Psicología.' },
  { city: 'Saltillo', name: 'Coordinación de Salud Mental — DIF Saltillo', phone: '8444120356', address: 'Dámaso Rodríguez #275, Col. Nuevo Centro Metropolitano.' },
  { city: 'Gómez Palacio', name: 'DIF Gómez Palacio — Módulo de Bienestar Emocional', phone: '8717151500', address: 'Calle Constitución 544, Col. Francisco Zarco.' },
  { city: 'Gómez Palacio', name: 'CISAME Gómez Palacio (Centro Integral de Salud Mental)', phone: '8717487958', address: 'Blvd. Francisco Villa No. 486, Fracc. Rinconada Villa Nápoles.' },
];

export function formatPhone(p: string): string {
  if (p.startsWith('800')) return `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;
  return `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // gradiente CSS
}

export const BADGES: BadgeDef[] = [
  { id: 'first', name: 'Primer paso', description: 'Completa tu primer reto', icon: 'footsteps-outline', color: 'linear-gradient(135deg,#34d399,#059669)' },
  { id: 'focus10', name: 'Maestro del enfoque', description: '10 sesiones de enfoque', icon: 'timer-outline', color: 'linear-gradient(135deg,#fbbf24,#f97316)' },
  { id: 'xp300', name: 'Explorador', description: 'Alcanza 300 XP', icon: 'compass-outline', color: 'linear-gradient(135deg,#60a5fa,#8b5cf6)' },
  { id: 'challenges5', name: 'Constante', description: 'Completa 5 retos', icon: 'ribbon-outline', color: 'linear-gradient(135deg,#4ade80,#10b981)' },
  { id: 'streak7', name: 'Semana de fuego', description: 'Racha de 7 días', icon: 'flame-outline', color: 'linear-gradient(135deg,#fb923c,#ef4444)' },
  { id: 'xp1350', name: 'Enfocado', description: 'Alcanza 1,350 XP', icon: 'eye-outline', color: 'linear-gradient(135deg,#a78bfa,#ec4899)' },
  { id: 'mood10', name: 'Autoconocimiento', description: '10 registros de ánimo', icon: 'heart-outline', color: 'linear-gradient(135deg,#f472b6,#e11d48)' },
  { id: 'focus20', name: 'Disciplinado', description: '20 sesiones de enfoque', icon: 'barbell-outline', color: 'linear-gradient(135deg,#f472b6,#ef4444)' },
  { id: 'challenges30', name: 'Imparable', description: 'Completa 30 retos', icon: 'rocket-outline', color: 'linear-gradient(135deg,#38bdf8,#6366f1)' },
  { id: 'streak30', name: 'Leyenda', description: 'Racha de 30 días', icon: 'medal-outline', color: 'linear-gradient(135deg,#facc15,#d97706)' },
  { id: 'xp5250', name: 'Maestría Grit', description: 'Alcanza 5,250 XP', icon: 'trophy-outline', color: 'linear-gradient(135deg,#6366f1,#a855f7)' },
  { id: 'plan', name: 'Estratega', description: 'Completa tu plan personal GRIT', icon: 'map-outline', color: 'linear-gradient(135deg,#2dd4bf,#0ea5e9)' },
];
