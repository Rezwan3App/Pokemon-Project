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

/**
 * Unified async db facade. Calls adapter[method] with `this` bound to adapter,
 * so SQLite methods that use `this.foo()` work correctly. Always returns a
 * Promise, so routes can `await` uniformly across SQLite (sync) and PG (async).
 */
export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      return (...args) => {
        const fn = adapter[prop];
        if (typeof fn !== 'function') {
          return Promise.reject(new Error(`Unknown db method: ${String(prop)}`));
        }
        try {
          const result = fn.apply(adapter, args);
          return result instanceof Promise ? result : Promise.resolve(result);
        } catch (err) {
          return Promise.reject(err);
        }
      };
    },
  }
);
