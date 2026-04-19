import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface EventType {
  id: string;
  name: string;
  duration: 10 | 15 | 20 | 30;
  createdAt: string;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  duration: 10 | 15 | 20 | 30;
  guestName: string;
  guestEmail: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface Store {
  eventTypes: Map<string, EventType>;
  bookings: Map<string, Booking>;
}

const loadJsonl = <T extends { id: string }>(filePath: string): Map<string, T> => {
  const map = new Map<string, T>();
  try {
    const lines = readFileSync(filePath, 'utf-8').trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const item = JSON.parse(line) as T;
        map.set(item.id, item);
      }
    }
  } catch {
    // файл не найден — пустой store
  }
  return map;
};

export const createStore = ({ seed = false }: { seed?: boolean } = {}): Store => {
  if (!seed) {
    return {
      eventTypes: new Map(),
      bookings: new Map(),
    };
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dataDir = resolve(__dirname, '..', 'data');

  return {
    eventTypes: loadJsonl<EventType>(resolve(dataDir, 'event-types.jsonl')),
    bookings: loadJsonl<Booking>(resolve(dataDir, 'bookings.jsonl')),
  };
};
