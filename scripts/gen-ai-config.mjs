// Lee gritai.properties y genera src/app/core/ai.config.generated.ts (ignorado por git).
import fs from 'node:fs';
const props = {};
if (fs.existsSync('gritai.properties')) {
  for (const line of fs.readFileSync('gritai.properties', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) props[m[1]] = m[2];
  }
}
const cfg = {
  apiKey: process.env.GEMINI_API_KEY || props['gemini.apiKey'] || '',
  model: props['gemini.model'] || 'gemini-2.5-flash',
  proxyUrl: props['gemini.proxyUrl'] || '',
};
fs.writeFileSync('src/app/core/ai.config.generated.ts', `// GENERADO por scripts/gen-ai-config.mjs. No editar ni subir a git.\nexport const AI_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`);
console.log('ai config:', cfg.proxyUrl ? 'proxy' : cfg.apiKey ? 'api key' : 'desactivada');
