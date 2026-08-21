import { Ticker, displayPrice, mergeTicker } from '../src/stream/types';

const base: Ticker = {
  symbol: 'BTCUSDT',
  last: 64000,
  bid: 63999,
  ask: 64001,
  changePercent: 1.5,
  quoteVolume: 1_000_000,
  at: 1_700_000_000_000,
};

describe('mergeTicker', () => {
  it('creates an entry from the first patch it sees', () => {
    const merged = mergeTicker(undefined, { symbol: 'ETHUSDT', bid: 3000, ask: 3001 });

    expect(merged.symbol).toBe('ETHUSDT');
    expect(merged.bid).toBe(3000);
    expect(merged.changePercent).toBe(0);
    expect(merged.last).toBe(0);
  });

  it('applies a fast book update without touching the slow fields', () => {
    const merged = mergeTicker(base, { symbol: 'BTCUSDT', bid: 64010, ask: 64012 });

    expect(merged.bid).toBe(64010);
    expect(merged.ask).toBe(64012);
    expect(merged.changePercent).toBe(1.5);
    expect(merged.quoteVolume).toBe(1_000_000);
  });

  it('applies a slow ticker update without erasing the fresher book top', () => {
    const merged = mergeTicker(base, {
      symbol: 'BTCUSDT',
      last: 64500,
      changePercent: 2.1,
      quoteVolume: 2_000_000,
    });

    expect(merged.last).toBe(64500);
    expect(merged.changePercent).toBe(2.1);
    expect(merged.bid).toBe(63999);
    expect(merged.ask).toBe(64001);
  });

  it('lets a patch clear a side explicitly with null', () => {
    const merged = mergeTicker(base, { symbol: 'BTCUSDT', bid: null });
    expect(merged.bid).toBeNull();
    expect(merged.ask).toBe(64001);
  });

  it('does not mutate the previous value', () => {
    mergeTicker(base, { symbol: 'BTCUSDT', bid: 1 });
    expect(base.bid).toBe(63999);
  });
});

describe('displayPrice', () => {
  it('uses the mid of the book when both sides are known', () => {
    expect(displayPrice(base)).toBe(64000);
  });

  it('falls back to the last trade when the book is incomplete', () => {
    expect(displayPrice({ ...base, bid: null })).toBe(64000);
    expect(displayPrice({ ...base, ask: null })).toBe(64000);
  });

  it('falls back when the book is crossed', () => {
    expect(displayPrice({ ...base, bid: 65000, ask: 64000, last: 12345 })).toBe(12345);
  });
});
