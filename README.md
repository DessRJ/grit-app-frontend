# GritAI (PWA, 100 % offline)

Ionic 9 + Angular 21. Sin llamadas a backend: IndexedDB + localStorage + service worker.

## Ejecutar
    npm ci --legacy-peer-deps
    npm start                      # desarrollo en :8100
    npm run build:pwa              # build de producción con service worker
    npm run serve:pwa              # sirve dist/ (pruebas offline)

## Cuentas de demostración (contraseña `Grit2026!`)
- `nuevo@gritai.app`    → usuario nuevo (Sofía, nivel 1)
- `maestria@gritai.app` → usuario avanzado (Ana, nivel 8)

Perfil → "Modo demostración" acelera x60 los temporizadores y omite la antigüedad de la foto.
Si agregas `ion-icon` nuevos, ejecuta `python3 scripts/gen-icons.py`.

## IA opcional (Gemini)
1. `cp gritai.properties.example gritai.properties` y llena `gemini.apiKey` (o `gemini.proxyUrl`). También acepta la variable `GEMINI_API_KEY`.
2. `npm start` / `npm run build:pwa` leen ese archivo (`scripts/gen-ai-config.mjs`). `gritai.properties` está en `.gitignore`.
3. Sin key la IA queda apagada y todo funciona offline como antes.

Qué hace: (a) ayuda a revisar fotos (solo rechaza si es claramente incorrecta; si hay duda o no hay internet se acepta con la validación local de fecha/código) y (b) responde en el chat lo que el motor local no sabe. Las señales de crisis siempre las atiende el motor local (líneas de ayuda) y la IA también puede marcar `[CRISIS]` para mostrarlas.
Privacidad: se envía solo el texto/imagen del momento y las últimas ~6 líneas del chat, sin nombre, correo ni IDs; se enmascaran correos, teléfonos y enlaces.

**Importante:** una key dentro de una app de navegador NO queda oculta: el archivo la saca del repositorio, pero viaja en el bundle y se ve en la pestaña Network. Restrínjala en Google AI Studio/Cloud (límite de cuota y restricción por dominio) o use `gemini.proxyUrl`.
