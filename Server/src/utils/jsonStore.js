import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Store outside `src` so nodemon watching `src/` does not restart on every write
const DATA_DIR = path.join(__dirname, "..", "..", "data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

/**
 * Minimal JSON-file collection store. Not concurrency-safe for heavy
 * parallel writes, but fine for a single-process demo backend.
 */
export function collection(name, defaultValue = []) {
  const file = filePath(name);

  function ensureFile() {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
    }
  }

  function readAll() {
    ensureFile();
    const raw = fs.readFileSync(file, "utf-8");
    try {
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  function writeAll(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return data;
  }

  return {
    all: () => readAll(),
    save: (data) => writeAll(data),
    find: (predicate) => readAll().find(predicate),
    filter: (predicate) => readAll().filter(predicate),
    insert: (item) => {
      const data = readAll();
      data.push(item);
      writeAll(data);
      return item;
    },
    update: (predicate, patch) => {
      const data = readAll();
      const idx = data.findIndex(predicate);
      if (idx === -1) return null;
      data[idx] = { ...data[idx], ...patch };
      writeAll(data);
      return data[idx];
    },
    replace: (predicate, nextItem) => {
      const data = readAll();
      const idx = data.findIndex(predicate);
      if (idx === -1) return null;
      data[idx] = nextItem;
      writeAll(data);
      return data[idx];
    },
    remove: (predicate) => {
      const data = readAll();
      const idx = data.findIndex(predicate);
      if (idx === -1) return false;
      data.splice(idx, 1);
      writeAll(data);
      return true;
    },
  };
}

/** Singleton record (e.g. app settings) stored as a single JSON object. */
export function singleton(name, defaultValue = {}) {
  const file = filePath(name);

  function ensureFile() {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
    }
  }

  return {
    get: () => {
      ensureFile();
      try {
        return JSON.parse(fs.readFileSync(file, "utf-8"));
      } catch {
        return defaultValue;
      }
    },
    set: (patch) => {
      ensureFile();
      const current = JSON.parse(fs.readFileSync(file, "utf-8"));
      const next = { ...current, ...patch };
      fs.writeFileSync(file, JSON.stringify(next, null, 2));
      return next;
    },
  };
}
