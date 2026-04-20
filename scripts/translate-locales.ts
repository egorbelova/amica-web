/**
 * Sync locale .ts files from English using the DeepL API.
 *
 * Env:
 *   DEEPL_AUTH_KEY — required (https://www.deepl.com/pro-api)
 *   DEEPL_API_URL  — optional, default https://api-free.deepl.com/v2/translate
 *                    (use https://api.deepl.com/v2/translate for Pro)
 *
 * Usage:
 *   bun scripts/translate-locales.ts --lang=de,ru
 *   bun scripts/translate-locales.ts --all
 *   bun scripts/translate-locales.ts --lang=fr --force
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'src/locales');

type NestedMessages = { [k: string]: string | NestedMessages };

/** File name (without .ts) → DeepL target_lang */
const LOCALE_TO_DEEPL: Record<string, string> = {
  ru: 'RU',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  pt: 'PT-BR',
  ua: 'UK',
  ar: 'AR',
  zh: 'ZH',
  ja: 'JA',
  ko: 'KO',
};

const PLACEHOLDER_TAG = 'x';
const BATCH_SIZE = 45;
const DEFAULT_DEEPL_URL = 'https://api-free.deepl.com/v2/translate';

function flattenMessages(
  obj: NestedMessages,
  prefix = '',
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      out[p] = v;
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenMessages(v as NestedMessages, p));
    }
  }
  return out;
}

function placeholderSet(s: string): Set<string> {
  return new Set(s.match(/\{[^}]+\}/g) ?? []);
}

/** Wrap `{name}` segments in `<x>{name}</x>` for DeepL XML handling */
function wrapForDeepL(s: string): string {
  return s.replace(/\{([^}]*)\}/g, (_m, inner: string) => {
    return `<${PLACEHOLDER_TAG}>{${inner}}</${PLACEHOLDER_TAG}>`;
  });
}

function unwrapFromDeepL(s: string): string {
  return s.replace(
    new RegExp(
      `<${PLACEHOLDER_TAG}>\\s*(\\{[^}]*\\})\\s*</${PLACEHOLDER_TAG}>`,
      'g',
    ),
    '$1',
  );
}

function assertPlaceholdersPreserved(
  sourceEn: string,
  translated: string,
  keyPath: string,
): void {
  const a = placeholderSet(sourceEn);
  const b = placeholderSet(translated);
  if (a.size !== b.size || [...a].some((x) => !b.has(x))) {
    console.warn(
      `[translate-locales] Placeholder mismatch at "${keyPath}" (en vs translated). Check manually.`,
    );
    console.warn(`  en: ${sourceEn.slice(0, 120)}${sourceEn.length > 120 ? '…' : ''}`);
    console.warn(
      `  tr: ${translated.slice(0, 120)}${translated.length > 120 ? '…' : ''}`,
    );
  }
}

function mapTemplateFromFlat(
  template: NestedMessages,
  flat: Record<string, string>,
  basePath: string,
): NestedMessages {
  const out: NestedMessages = {};
  for (const [k, v] of Object.entries(template)) {
    const p = basePath ? `${basePath}.${k}` : k;
    if (typeof v === 'string') {
      const t = flat[p];
      if (typeof t !== 'string') {
        throw new Error(`Missing translation for key "${p}"`);
      }
      out[k] = t;
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = mapTemplateFromFlat(v as NestedMessages, flat, p);
    }
  }
  return out;
}

function escapeTsString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function serializeValue(s: string): string {
  return `'${escapeTsString(s)}'`;
}

function serializeTree(obj: NestedMessages, indent: number): string {
  const keys = Object.keys(obj);
  const lines: string[] = [];
  const pad = '  '.repeat(indent);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]!;
    const v = obj[k]!;
    const comma = i < keys.length - 1 ? ',' : '';
    if (typeof v === 'string') {
      lines.push(`${pad}${k}: ${serializeValue(v)}${comma}`);
    } else {
      lines.push(`${pad}${k}: {`);
      lines.push(serializeTree(v as NestedMessages, indent + 1));
      lines.push(`${pad}}${comma}`);
    }
  }
  return lines.join('\n');
}

function writeLocaleFile(lang: string, tree: NestedMessages): void {
  const body = serializeTree(tree, 1);
  const content = `export default {\n${body}\n} as const;\n`;
  const outPath = path.join(LOCALES_DIR, `${lang}.ts`);
  fs.writeFileSync(outPath, content, 'utf8');
}

function runPrettier(filePath: string): void {
  try {
    execFileSync(
      'bunx',
      ['prettier', '--write', filePath],
      { cwd: ROOT, stdio: 'pipe' },
    );
  } catch {
    try {
      execFileSync(
        'npx',
        ['prettier', '--write', filePath],
        { cwd: ROOT, stdio: 'pipe' },
      );
    } catch {
      console.warn(
        '[translate-locales] Prettier not run; format the file manually if needed.',
      );
    }
  }
}

type DeepLTranslateResponse = {
  translations: Array<{ detected_source_language?: string; text: string }>;
};

async function translateBatch(
  texts: string[],
  targetLang: string,
  authKey: string,
  apiUrl: string,
  attempt = 0,
): Promise<string[]> {
  const max429Retries = 5;
  const body = new URLSearchParams();
  body.set('source_lang', 'EN');
  body.set('target_lang', targetLang);
  body.set('tag_handling', 'xml');
  body.set('non_splitting_tags', PLACEHOLDER_TAG);
  for (const t of texts) {
    body.append('text', wrapForDeepL(t));
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${authKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (res.status === 429 && attempt < max429Retries) {
    const retryAfter = res.headers.get('Retry-After');
    const waitSec = retryAfter ? parseInt(retryAfter, 10) : 5;
    console.warn(
      `[translate-locales] Rate limited; waiting ${waitSec}s…`,
    );
    await new Promise((r) => setTimeout(r, waitSec * 1000));
    return translateBatch(texts, targetLang, authKey, apiUrl, attempt + 1);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepL HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as DeepLTranslateResponse;
  if (!data.translations || data.translations.length !== texts.length) {
    throw new Error('DeepL response size does not match request batch');
  }
  return data.translations.map((t) => unwrapFromDeepL(t.text));
}

function parseArgs(argv: string[]): {
  langs: string[] | 'all';
  force: boolean;
} {
  let langs: string[] | 'all' = [];
  let force = false;

  for (const a of argv) {
    if (a === '--all') {
      langs = 'all';
    } else if (a === '--force') {
      force = true;
    } else if (a.startsWith('--lang=')) {
      const v = a.slice('--lang='.length).trim();
      langs = v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === '--help' || a === '-h') {
      console.log(`Usage:
  bun scripts/translate-locales.ts --lang=de,ru
  bun scripts/translate-locales.ts --all
  bun scripts/translate-locales.ts --lang=fr --force

Env: DEEPL_AUTH_KEY (required), DEEPL_API_URL (optional)
`);
      process.exit(0);
    }
  }

  if (langs !== 'all' && langs.length === 0) {
    console.error(
      'Specify --lang=code[,code] or --all. Example: --lang=de,ru',
    );
    process.exit(1);
  }

  return { langs, force };
}

function listLocaleFiles(): string[] {
  return fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith('.ts') && f !== 'en.ts')
    .map((f) => f.replace(/\.ts$/, ''));
}

async function main(): Promise<void> {
  const { langs: langsArg, force } = parseArgs(process.argv.slice(2));

  const authKey = process.env.DEEPL_AUTH_KEY?.trim();
  if (!authKey) {
    console.error('Set DEEPL_AUTH_KEY in the environment.');
    process.exit(1);
  }

  const apiUrl = (process.env.DEEPL_API_URL ?? DEFAULT_DEEPL_URL).replace(
    /\/$/,
    '',
  );

  const enMod = await import(pathToFileURL(path.join(LOCALES_DIR, 'en.ts')).href);
  const enDefault = enMod.default as NestedMessages;
  const enFlat = flattenMessages(enDefault);

  const targetLangs =
    langsArg === 'all'
      ? listLocaleFiles()
      : (langsArg as string[]).filter((l) => l !== 'en');

  if (targetLangs.length === 0) {
    console.error(
      '[translate-locales] No target locales (use non-en codes with --lang or add .ts files under src/locales).',
    );
    process.exit(1);
  }

  for (const lang of targetLangs) {
    const deepl = LOCALE_TO_DEEPL[lang];
    if (!deepl) {
      console.error(
        `[translate-locales] No DeepL code for locale "${lang}". Add it to LOCALE_TO_DEEPL.`,
      );
      process.exit(1);
    }
  }

  for (const lang of targetLangs) {
    const deepl = LOCALE_TO_DEEPL[lang]!;
    const modPath = path.join(LOCALES_DIR, `${lang}.ts`);
    if (!fs.existsSync(modPath)) {
      console.error(`Missing locale file: ${modPath}`);
      process.exit(1);
    }

    const prevMod = await import(pathToFileURL(modPath).href);
    const prevDefault = prevMod.default as NestedMessages;
    const prevFlat = flattenMessages(prevDefault);

    const keysToTranslate = Object.keys(enFlat).filter((path) => {
      if (force) return true;
      return !(path in prevFlat);
    });

    if (keysToTranslate.length === 0) {
      console.log(`[translate-locales] ${lang}: nothing to do (use --force to retranslate).`);
      continue;
    }

    console.log(
      `[translate-locales] ${lang} (${deepl}): translating ${keysToTranslate.length} string(s)…`,
    );

    const updatedFlat: Record<string, string> = { ...prevFlat };

    for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
      const batchKeys = keysToTranslate.slice(i, i + BATCH_SIZE);
      const batchSrc = batchKeys.map((k) => enFlat[k]!);
      const translated = await translateBatch(batchSrc, deepl, authKey, apiUrl);
      batchKeys.forEach((k, j) => {
        const tr = translated[j]!;
        assertPlaceholdersPreserved(enFlat[k]!, tr, k);
        updatedFlat[k] = tr;
      });
    }

    const tree = mapTemplateFromFlat(enDefault, updatedFlat, '');
    writeLocaleFile(lang, tree);
    runPrettier(path.join(LOCALES_DIR, `${lang}.ts`));
    console.log(`[translate-locales] Wrote src/locales/${lang}.ts`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
