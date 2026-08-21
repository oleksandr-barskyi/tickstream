import { appendCapped, appendManyCapped, createBatcher } from '../src/core/batcher';

interface Tick {
  symbol: string;
  price: number;
}

const tick = (symbol: string, price: number): Tick => ({ symbol, price });

describe('createBatcher', () => {
  it('keeps only the latest value per key', () => {
    const batcher = createBatcher<Tick>((t) => t.symbol);

    batcher.push(tick('BTC', 1));
    batcher.push(tick('BTC', 2));
    batcher.push(tick('BTC', 3));
    batcher.push(tick('ETH', 9));

    const out = batcher.flush();

    expect(out).toHaveLength(2);
    expect(out.find((t) => t.symbol === 'BTC')?.price).toBe(3);
    expect(out.find((t) => t.symbol === 'ETH')?.price).toBe(9);
  });

  it('reports how many messages were superseded before render', () => {
    const batcher = createBatcher<Tick>((t) => t.symbol);

    for (let i = 0; i < 50; i += 1) batcher.push(tick('BTC', i));
    batcher.flush();

    const stats = batcher.stats();
    expect(stats.received).toBe(50);
    expect(stats.emitted).toBe(1);
    expect(stats.coalesced).toBe(49);
    expect(stats.flushes).toBe(1);
  });

  it('empties itself on flush so the next frame starts clean', () => {
    const batcher = createBatcher<Tick>((t) => t.symbol);

    batcher.push(tick('BTC', 1));
    expect(batcher.pending()).toBe(1);

    batcher.flush();
    expect(batcher.pending()).toBe(0);
    expect(batcher.flush()).toEqual([]);
  });

  it('does not count an empty flush', () => {
    const batcher = createBatcher<Tick>((t) => t.symbol);
    batcher.flush();
    expect(batcher.stats().flushes).toBe(0);
  });

  it('resets counters and pending state', () => {
    const batcher = createBatcher<Tick>((t) => t.symbol);
    batcher.push(tick('BTC', 1));
    batcher.reset();

    expect(batcher.pending()).toBe(0);
    expect(batcher.stats()).toEqual({ received: 0, emitted: 0, coalesced: 0, flushes: 0 });
  });
});

describe('appendCapped', () => {
  it('puts the newest item first', () => {
    expect(appendCapped([2, 3], 1, 10)).toEqual([1, 2, 3]);
  });

  it('drops the oldest items past the limit', () => {
    expect(appendCapped([2, 3, 4], 1, 3)).toEqual([1, 2, 3]);
  });

  it('returns an empty buffer for a non-positive limit', () => {
    expect(appendCapped([1, 2], 3, 0)).toEqual([]);
  });
});

describe('appendManyCapped', () => {
  it('preserves arrival order with the newest first', () => {
    expect(appendManyCapped([9], [1, 2, 3], 10)).toEqual([3, 2, 1, 9]);
  });

  it('trims to the limit', () => {
    expect(appendManyCapped([9, 8], [1, 2, 3], 4)).toEqual([3, 2, 1, 9]);
  });

  it('returns the buffer untouched when nothing arrived', () => {
    const buffer = [1, 2];
    expect(appendManyCapped(buffer, [], 5)).toBe(buffer);
  });

  it('does not mutate the incoming array', () => {
    const incoming = [1, 2, 3];
    appendManyCapped([], incoming, 10);
    expect(incoming).toEqual([1, 2, 3]);
  });
});
