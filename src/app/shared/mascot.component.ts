import { Component, Input } from '@angular/core';
import { MoodKey } from '../core/models';

/**
 * Mascota GritAI. Las 4 emociones se expresan con animación, tono y accesorios
 * (destellos, lágrima, gota de estrés) sobre la ilustración oficial.
 */
@Component({
  selector: 'app-mascot',
  standalone: true,
  template: `
    <div class="m" [class.animated]="animated" [class]="'m ' + mood" [style.width.px]="size" [style.height.px]="size">
      <img src="assets/img/mascot.png" alt="Mascota GritAI" draggable="false" />
      @switch (mood) {
        @case ('happy') {
          <svg class="fx sp1" viewBox="0 0 24 24"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" fill="#facc15" /></svg>
          <svg class="fx sp2" viewBox="0 0 24 24"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" fill="#fb923c" /></svg>
        }
        @case ('sad') {
          <svg class="fx tear" viewBox="0 0 24 32"><path d="M12 2C12 2 3 14 3 21a9 9 0 0018 0C21 14 12 2 12 2z" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5" /></svg>
        }
        @case ('overwhelmed') {
          <svg class="fx sweat" viewBox="0 0 24 32"><path d="M12 2C12 2 3 14 3 21a9 9 0 0018 0C21 14 12 2 12 2z" fill="#bae6fd" stroke="#0ea5e9" stroke-width="1.5" /></svg>
          <svg class="fx swirl" viewBox="0 0 40 24"><path d="M3 12c4-9 10-9 14 0s10 9 14 0" fill="none" stroke="#7c3aed" stroke-width="3" stroke-linecap="round" /></svg>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; line-height: 0; }
    .m { position: relative; display: inline-block; }
    img { width: 100%; height: 100%; object-fit: contain; display: block; user-select: none; -webkit-user-drag: none; }
    .animated img { animation: float 3.4s ease-in-out infinite; }
    .happy img { filter: saturate(1.15) brightness(1.04); }
    .sad img { filter: saturate(0.55) brightness(0.93) hue-rotate(-12deg); transform: rotate(-4deg) translateY(3%); }
    .overwhelmed img { filter: saturate(0.75) brightness(0.97); transform: rotate(5deg); }
    .animated.sad img, .animated.overwhelmed img { animation: none; }
    .fx { position: absolute; pointer-events: none; }
    .sp1 { width: 22%; height: 22%; top: 2%; right: 4%; animation: pulseSp 1.8s ease-in-out infinite; }
    .sp2 { width: 14%; height: 14%; top: 18%; left: 2%; animation: pulseSp 2.2s ease-in-out infinite 0.5s; }
    .tear { width: 9%; height: 12%; left: 36%; top: 40%; animation: drip 2.4s ease-in infinite; }
    .sweat { width: 9%; height: 12%; right: 12%; top: 14%; animation: drip 2.8s ease-in infinite; }
    .swirl { width: 32%; height: 20%; left: 34%; top: -2%; animation: pulseSp 2s ease-in-out infinite; }
    @keyframes pulseSp { 0%,100% { transform: scale(0.85) rotate(0); opacity: 0.8; } 50% { transform: scale(1.15) rotate(14deg); opacity: 1; } }
    @keyframes drip { 0% { transform: translateY(-4px); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } }
  `],
})
export class MascotComponent {
  @Input() mood: MoodKey = 'normal';
  @Input() size = 96;
  @Input() animated = false;
}
