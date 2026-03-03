import type { Chat } from '@/types';

const DB_NAME = 'amica-chat-state';
const STORE_NAME = 'state';
const DB_VERSION = 1;
const LAST_USER_ID_KEY = 'amica-last-user-id';

export function getLastUserId(): number | null {
  try {
    const raw = localStorage.getItem(LAST_USER_ID_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function setLastUserId(userId: number): void {
  try {
    if (userId > 0) {
      localStorage.setItem(LAST_USER_ID_KEY, String(userId));
    } else {
      localStorage.removeItem(LAST_USER_ID_KEY);
    }
  } catch {
    localStorage.removeItem(LAST_USER_ID_KEY);
  }
}

export interface ChatStateSnapshot {
  chats: Chat[];
  selectedChatId: number | null;
  savedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'userId' });
    };
  });
}

function getStore(db: IDBDatabase, mode: IDBTransactionMode = 'readonly') {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

export async function getChatState(
  userId: number,
): Promise<ChatStateSnapshot | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = getStore(db).get(userId);
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
    req.onsuccess = () => {
      db.close();
      const row = req.result as { userId: number; data: ChatStateSnapshot } | undefined;
      resolve(row?.data ?? null);
    };
  });
}

export async function setChatState(
  userId: number,
  snapshot: ChatStateSnapshot,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, 'readwrite');
    const payload = {
      userId,
      data: {
        chats: snapshot.chats,
        selectedChatId: snapshot.selectedChatId,
        savedAt: new Date().toISOString(),
      },
    };
    const req = store.put(payload);
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
    req.onsuccess = () => {
      db.close();
      setLastUserId(userId);
      resolve();
    };
  });
}
