import { config } from '../config.js';
import { sqliteAdapter } from './sqlite.js';
import { postgresAdapter } from './postgres.js';

/** Active database adapter (SQLite default) */
let adapter = sqliteAdapter;

export async function initDatabase() {
  if (config.databaseDriver === 'postgres') {
    adapter = postgresAdapter;
    await adapter.init();
    console.log('Database: PostgreSQL');
  } else {
    adapter = sqliteAdapter;
    adapter.init();
    console.log('Database: SQLite at', config.databasePath);
  }
}

/** Wrap sync SQLite calls so routes can always await db methods */
function wrapAdapter(a) {
  return new Proxy(a, {
    get(target, prop) {
      const val = target[prop];
      if (typeof val !== 'function') return val;
      return (...args) => {
        const result = val.apply(target, args);
        return result instanceof Promise ? result : Promise.resolve(result);
      };
    },
  });
}

export const db = wrapAdapter(
  new Proxy(
    {},
    {
      get(_t, prop) {
        return (...args) => {
          const fn = adapter[prop];
          if (!fn) throw new Error(`Unknown db method: ${String(prop)}`);
          const result = fn(...args);
          return result instanceof Promise ? result : Promise.resolve(result);
        };
      },
    }
  )
);
