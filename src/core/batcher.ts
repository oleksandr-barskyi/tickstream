export interface BatchStats {
  received: number;
  emitted: number;
  coalesced: number;
  flushes: number;
}

export interface Batcher<T> {
  push: (item: T) => void;
  flush: () => T[];
  pending: () => number;
  stats: () => BatchStats;
  reset: () => void;
}

export function createBatcher<T>(keyOf: (item: T) => string): Batcher<T> {
  const pending = new Map<string, T>();
  let received = 0;
  let emitted = 0;
  let flushes = 0;

  return {
    push(item: T) {
      received += 1;
      pending.set(keyOf(item), item);
    },
    flush() {
      if (pending.size === 0) return [];
      const out = Array.from(pending.values());
      pending.clear();
      emitted += out.length;
      flushes += 1;
      return out;
    },
    pending() {
      return pending.size;
    },
    stats() {
      return { received, emitted, coalesced: received - emitted, flushes };
    },
    reset() {
      pending.clear();
      received = 0;
      emitted = 0;
      flushes = 0;
    },
  };
}

export function appendCapped<T>(buffer: T[], item: T, limit: number): T[] {
  if (limit <= 0) return [];
  const next = [item, ...buffer];
  return next.length > limit ? next.slice(0, limit) : next;
}

export function appendManyCapped<T>(buffer: T[], items: T[], limit: number): T[] {
  if (limit <= 0) return [];
  if (items.length === 0) return buffer;
  const incoming = items.slice().reverse();
  const next = incoming.concat(buffer);
  return next.length > limit ? next.slice(0, limit) : next;
}
