import { Injectable, inject, signal } from '@angular/core';
import { AiService } from './ai.service';
import { FALLBACK, INTENTS, Intent, SAY, VENT_REPLIES } from './chatbot.data';
import { QUOTES } from './content';
import { DbService } from './db.service';
import { GameStore } from './game.store';
import { ChatButton, ChatMessage } from './models';
import { normalize, pick } from './util';

export type Awaiting = 'task' | 'vent' | 'strength' | null;

export interface BotReply {
  text: string;
  buttons: ChatButton[];
  intentId: string;
  crisis: boolean;
  awaiting?: Awaiting;
}

/** Motor de intenciones por palabras clave (sin conexión, sin IA remota) */
export function detectIntent(message: string): { intent: Intent; score: number } {
  const msg = ' ' + normalize(message) + ' ';
  let best: { intent: Intent; score: number } = { intent: FALLBACK, score: 0 };
  for (const it of INTENTS) {
    let score = 0;
    for (const kw of it.keywords) {
      if (msg.includes(' ' + kw)) score += kw.includes(' ') ? 2 : 1;
    }
    if (score === 0) continue;
    // El protocolo de emergencia siempre gana
    if (it.id === 'm0') return { intent: it, score };
    if (score > best.score) best = { intent: it, score };
  }
  return best;
}

export function containsCrisis(message: string): boolean {
  return detectIntent(message).intent.id === 'm0';
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private db = inject(DbService);
  private game = inject(GameStore);
  private ai = inject(AiService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly typing = signal(false);
  private awaiting: Awaiting = null;

  private get uid(): string {
    return this.game.state()?.userId ?? '';
  }

  async load(): Promise<void> {
    const list = await this.db.getAllByUser<ChatMessage>('chat', this.uid);
    list.sort((a, b) => a.t - b.t);
    this.messages.set(list);
    this.awaiting = null;
    if (!list.length) {
      const greet = INTENTS.find((i) => i.id === 'm6')!;
      await this.push({ role: 'bot', text: greet.replies[0], buttons: greet.buttons });
    }
  }

  private async push(m: Omit<ChatMessage, 'userId' | 't' | 'id'>): Promise<void> {
    const msg: ChatMessage = { ...m, userId: this.uid, t: Date.now() };
    const id = (await this.db.put('chat', msg)) as number;
    this.messages.update((l) => [...l, { ...msg, id }]);
  }

  async clear(): Promise<void> {
    await this.db.deleteAllByUser('chat', this.uid);
    this.messages.set([]);
    await this.load();
  }

  async send(text: string): Promise<BotReply | null> {
    const t = text.trim();
    if (!t) return null;
    await this.push({ role: 'user', text: t });
    this.typing.set(true);
    await new Promise((r) => setTimeout(r, 450 + Math.random() * 450));
    let reply = this.respond(t);
    // Solo lo que el motor local no sabe responder se delega a la IA (si está disponible)
    if (this.ai.active && !reply.crisis && (reply.intentId === FALLBACK.id || reply.intentId === 'vent')) {
      const hist = this.messages().slice(0, -1).map((m) => ({ role: m.role, text: m.text }));
      const out = await this.ai.chat(hist, t);
      if (out?.crisis) {
        this.awaiting = null;
        reply = this.fromIntent(INTENTS.find((i) => i.id === 'm0')!);
      } else if (out) {
        reply = { text: out.text, buttons: [{ label: 'Respirar 1 minuto', action: 'breathe' }, { label: 'Volver al menú principal', action: 'intent:m6' }], intentId: 'ai', crisis: false };
      }
    }
    await this.push({ role: 'bot', text: reply.text, buttons: reply.buttons });
    this.typing.set(false);
    return reply;
  }

  /** Ejecuta un botón de acción rápida que no navega (intent/say/ask/quote) */
  async runAction(label: string, action: string): Promise<BotReply | null> {
    await this.push({ role: 'user', text: label });
    this.typing.set(true);
    await new Promise((r) => setTimeout(r, 350));
    let reply: BotReply;
    if (action.startsWith('intent:')) {
      const it = INTENTS.find((i) => i.id === action.slice(7))!;
      reply = this.fromIntent(it);
    } else if (action.startsWith('say:')) {
      const s = SAY[action.slice(4)];
      reply = { text: s.text, buttons: s.buttons, intentId: 'say', crisis: false };
    } else if (action === 'quote') {
      const q = pick(QUOTES);
      reply = { text: `“${q.text}”${q.author ? ' — ' + q.author : ''}`, buttons: [{ label: 'Otra frase', action: 'quote' }, { label: 'Volver al menú principal', action: 'intent:m6' }], intentId: 'quote', crisis: false };
    } else if (action === 'ask:task') {
      this.awaiting = 'task';
      reply = { text: 'Cuéntame en una frase cuál es la tarea (o lo más urgente) y la partimos en pasos pequeños.', buttons: [], intentId: 'ask', crisis: false };
    } else if (action === 'ask:vent') {
      this.awaiting = 'vent';
      reply = { text: 'Aquí estoy. Escribe lo que traes en mente, sin filtro. Nada de esto sale de tu dispositivo.', buttons: [], intentId: 'ask', crisis: false };
    } else if (action === 'ask:strength') {
      this.awaiting = 'strength';
      reply = { text: '¿Qué fortaleza tuya notaste hoy? (por ejemplo: “no me rendí con el ejercicio difícil”).', buttons: [], intentId: 'ask', crisis: false };
    } else {
      reply = { text: 'Listo.', buttons: [], intentId: 'noop', crisis: false };
    }
    await this.push({ role: 'bot', text: reply.text, buttons: reply.buttons });
    this.typing.set(false);
    return reply;
  }

  private fromIntent(it: Intent): BotReply {
    return { text: pick(it.replies), buttons: it.buttons, intentId: it.id, crisis: it.id === 'm0' };
  }

  private respond(text: string): BotReply {
    const detected = detectIntent(text);
    if (detected.intent.id === 'm0') {
      this.awaiting = null;
      return this.fromIntent(detected.intent);
    }
    if (this.awaiting === 'task') {
      this.awaiting = null;
      const topic = text.length > 70 ? text.slice(0, 67) + '…' : text;
      return {
        text: `Vamos a partir «${topic}» en pasos que sí puedes dar hoy:\n1) Define cómo se ve “terminado” (un resultado mínimo, concreto).\n2) Haz solo los primeros 10 minutos, con el celular fuera de la vista.\n3) Anota cuál es el siguiente paso y deténte con calma.\nCuando quieras, arrancamos un bloque de enfoque.`,
        buttons: [{ label: 'Reto de 5 minutos', action: 'route:/tabs/focus?work=5' }, { label: 'Volver al menú principal', action: 'intent:m6' }],
        intentId: 'task',
        crisis: false,
      };
    }
    if (this.awaiting === 'strength') {
      this.awaiting = null;
      this.game.update((s) => {
        s.strengths = [...s.strengths, text.slice(0, 140)].slice(-20);
      });
      return {
        text: 'Anotado en tu registro de fortalezas. Eso es evidencia real de quién eres cuando las cosas se ponen difíciles.',
        buttons: [{ label: 'Ver mi historial de retos', action: 'route:/progress' }, { label: 'Volver al menú principal', action: 'intent:m6' }],
        intentId: 'strength',
        crisis: false,
      };
    }
    if (this.awaiting === 'vent' && detected.score === 0) {
      return {
        text: pick(VENT_REPLIES),
        buttons: [{ label: 'Ejercicio de respiración', action: 'breathe' }, { label: 'Organizar una tarea', action: 'ask:task' }, { label: 'Volver al menú principal', action: 'intent:m6' }],
        intentId: 'vent',
        crisis: false,
      };
    }
    this.awaiting = null;
    return this.fromIntent(detected.intent);
  }
}
