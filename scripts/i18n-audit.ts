/*
  Simple i18n audit:
  - Scans src/ for t("...") usages
  - Compares against locales/en.json and locales/ko.json
  - Prints missing and unused keys per locale
*/

import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const LOCALES_DIR = path.join(SRC_DIR, "locales");
const EN_PATH = path.join(LOCALES_DIR, "en.json");
const KO_PATH = path.join(LOCALES_DIR, "ko.json");

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) files.push(full);
  }
  return files;
}

function extractKeysFromSource(content: string): Set<string> {
  const keys = new Set<string>();
  // Match t("...") and t('...') optionally with params: t("a.b", ...) or t('a.b')
  const regex = /\bt\(\s*["']([\w.-]+)["']\s*(?:,\s*\{[^)]*\})?\)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [];
  const result: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null) {
      result.push(...flattenKeys(v, p));
    } else {
      result.push(p);
    }
  }
  return result;
}

function loadJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function main() {
  const files = walk(SRC_DIR);
  const used = new Set<string>();
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const keys = extractKeysFromSource(content);
    keys.forEach((k) => used.add(k));
  }

  const en = loadJson(EN_PATH);
  const ko = loadJson(KO_PATH);
  const enKeys = new Set(flattenKeys(en));
  const koKeys = new Set(flattenKeys(ko));

  const printSet = (title: string, s: Set<string>) => {
    if (s.size === 0) {
      console.log(`${title}: none`);
      return;
    }
    console.log(`${title} (${s.size}):`);
    Array.from(s)
      .sort()
      .forEach((k) => console.log(`  - ${k}`));
  };

  const missingInEn = new Set<string>();
  const missingInKo = new Set<string>();
  const unusedInEn = new Set<string>();
  const unusedInKo = new Set<string>();

  used.forEach((k) => {
    if (!enKeys.has(k)) missingInEn.add(k);
    if (!koKeys.has(k)) missingInKo.add(k);
  });

  enKeys.forEach((k) => {
    if (!used.has(k)) unusedInEn.add(k);
  });
  koKeys.forEach((k) => {
    if (!used.has(k)) unusedInKo.add(k);
  });

  console.log("\n=== i18n audit ===");
  printSet("Missing in en.json", missingInEn);
  printSet("Missing in ko.json", missingInKo);
  printSet("Unused in en.json", unusedInEn);
  printSet("Unused in ko.json", unusedInKo);
}

main();
