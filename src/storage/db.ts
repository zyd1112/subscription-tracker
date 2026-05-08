import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Subscription } from '../domain/subscription';

interface AppDB extends DBSchema {
  subscriptions: {
    key: string;
    value: Subscription;
    indexes: {
      'by-status': string;
    };
  };
}

const DB_NAME = 'subscription-tracker-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('subscriptions')) {
          const store = db.createObjectStore('subscriptions', { keyPath: 'id' });
          store.createIndex('by-status', 'status');
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const db = await initDB();
  return db.getAll('subscriptions');
}

export async function getActiveSubscriptions(): Promise<Subscription[]> {
  const db = await initDB();
  return db.getAllFromIndex('subscriptions', 'by-status', 'active');
}

export async function getSubscription(id: string): Promise<Subscription | undefined> {
  const db = await initDB();
  return db.get('subscriptions', id);
}

export async function saveSubscription(sub: Subscription): Promise<string> {
  const db = await initDB();
  await db.put('subscriptions', sub);
  return sub.id;
}

export async function deleteSubscription(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('subscriptions', id);
}

export async function clearAllData(): Promise<void> {
  const db = await initDB();
  await db.clear('subscriptions');
}
