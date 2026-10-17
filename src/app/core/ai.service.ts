import { Injectable, inject } from '@angular/core';
import { AI_CONFIG } from './ai.config.generated';
import { GameStore } from './game.store';
import { PwaService } from './pwa.service';

export type PhotoVerdict = 'ok' | 'fail' | 'unsure';
export interface PhotoCheck { verdict: PhotoVerdict; reason: string }
export interface AiChatReply { text: string; crisis: boolean }

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
const TIMEOUT_MS = 9000;

const CHAT_SYSTEM = `Eres "Coach GritAI", un acompañante breve y cálido para estudiantes mexicanos de nivel medio superior/superior, basado en la metodología GRIT (pasión y perseverancia) de Angela Duckworth.
Reglas:
- Responde en español de México, máximo 4 oraciones, sin emojis, sin listas largas.
- Valida la emoción y ofrece UN paso pequeño y concreto (respirar, un bloque de enfoque de 5 minutos, partir una tarea).
- No eres terapeuta: no diagnostiques ni des consejos médicos.
- NUNCA inventes teléfonos ni direcciones.
- Si el mensaje muestra cualquier señal de autolesión, suicidio, deseo de desaparecer, abuso o peligro inmediato, responde ÚNICAMENTE con la palabra [CRISIS] y nada más.
- Si te piden algo ajeno al bienestar o al estudio, redirige con amabilidad.`;

/** Quita datos personales evidentes antes de enviar texto a un tercero */
export function anonymize(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[correo]')
    .replace(/https?:\/\/\S+/gi, '[enlace]')
    .replace(/(?:\+?\d[\s().-]?){7,}/g, '[número]')
    .slice(0, 600);
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private game = inject(GameStore);
  private pwa = inject(PwaService);

  /** ¿Hay una key o un proxy configurado en el build? */
  readonly configured = !!(AI_CONFIG.apiKey || AI_CONFIG.proxyUrl);

  /** Activa solo si está configurada, el usuario no la apagó y hay conexión */
  get active(): boolean {
    return this.configured && this.game.state()?.settings.ai !== false && this.pwa.online();
  }

  private async call(body: unknown): Promise<string | null> {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const url = AI_CONFIG.proxyUrl || `${ENDPOINT}${AI_CONFIG.model}:generateContent`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!AI_CONFIG.proxyUrl) headers['x-goog-api-key'] = AI_CONFIG.apiKey;
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!res.ok) return null;
      const json = await res.json();
      const text: string | undefined = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('');
      return text?.trim() || null;
    } catch {
      return null;
    } finally {
      clearTimeout(to);
    }
  }

  /** Respuesta del coach para mensajes que el motor local no sabe responder */
  async chat(history: { role: 'user' | 'bot'; text: string }[], message: string): Promise<AiChatReply | null> {
    if (!this.active) return null;
    const contents = [...history.slice(-6), { role: 'user' as const, text: message }].map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: anonymize(m.text) }],
    }));
    const out = await this.call({
      systemInstruction: { parts: [{ text: CHAT_SYSTEM }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
    });
    if (!out) return null;
    if (/\[CRISIS\]/i.test(out)) return { text: '', crisis: true };
    return { text: out.replace(/\*+/g, ''), crisis: false };
  }

  /** Ayuda de validación de fotos: solo rechaza cuando es claramente incorrecta */
  async checkPhoto(blob: Blob, ctx: { label: string; code?: string; date: string }): Promise<PhotoCheck | null> {
    if (!this.active) return null;
    const b64 = await blobToBase64(blob);
    const prompt = `Valida una foto de evidencia de un reto de estudio.
Debe mostrar: "${ctx.label}".${ctx.code ? ` Además debe verse un papel escrito a mano con el código ${ctx.code} y la fecha ${ctx.date} (acepta formatos de fecha equivalentes).` : ''}
No identifiques personas ni describas rostros. Responde SOLO JSON: {"verdict":"ok"|"fail"|"unsure","reason":"máx 20 palabras en español"}.
Usa "fail" solo si claramente falta el contenido pedido o el código es distinto; si la imagen es borrosa o dudosa usa "unsure".`;
    const out = await this.call({
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: b64 } }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 120, responseMimeType: 'application/json' },
    });
    if (!out) return null;
    try {
      const j = JSON.parse(out.replace(/^```json|```$/g, ''));
      const verdict: PhotoVerdict = j.verdict === 'ok' || j.verdict === 'fail' ? j.verdict : 'unsure';
      return { verdict, reason: String(j.reason ?? '').slice(0, 160) };
    } catch {
      return null;
    }
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}
