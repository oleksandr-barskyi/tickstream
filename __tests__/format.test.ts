import {
  decimalsFor,
  displaySymbol,
  formatCompact,
  formatPercent,
  formatPrice,
  formatQty,
  spreadBps,
} from '../src/core/format';

describe('decimalsFor', () => {
  it.each([
    [64000, 2],
    [1000, 2],
    [12.5, 3],
    [1, 3],
    [0.5, 5],
    [0.01, 5],
    [0.0001, 8],
  ])('gives %p a sensible precision', (price, expected) => {
    expect(decimalsFor(price)).toBe(expected);
  });
});

describe('formatPrice', () => {
  it('scales precision with the size of the number', () => {
    expect(formatPrice(64000.123)).toBe('64000.12');
    expect(formatPrice(12.3456)).toBe('12.346');
    expect(formatPrice(0.000123456)).toBe('0.00012346');
  });

  it('marks a non-finite price instead of printing NaN', () => {
    expect(formatPrice(Number.NaN)).toBe('--');
  });
});

describe('formatPercent', () => {
  it('always shows the sign for a gain', () => {
    expect(formatPercent(2.5)).toBe('+2.50%');
  });

  it('keeps the minus for a loss', () => {
    expect(formatPercent(-2.5)).toBe('-2.50%');
  });

  it('does not prefix zero with a plus', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });
});

describe('formatCompact', () => {
  it.each([
    [2_500_000_000, '2.5B'],
    [1_250_000, '1.3M'],
    [1_500, '1.5K'],
    [12.5, '12.50'],
  ])('shortens %p', (value, expected) => {
    expect(formatCompact(value)).toBe(expected);
  });
});

describe('formatQty', () => {
  it('uses whole units for large sizes and more precision for small ones', () => {
    expect(formatQty(1500)).toBe('1500');
    expect(formatQty(1.5)).toBe('1.500');
    expect(formatQty(0.00015)).toBe('0.00015');
  });
});

describe('displaySymbol', () => {
  it('splits the quote currency out', () => {
    expect(displaySymbol('btcusdt')).toBe('BTC/USDT');
  });

  it('leaves an unknown pair alone', () => {
    expect(displaySymbol('btceur')).toBe('BTCEUR');
  });
});

describe('spreadBps', () => {
  it('measures the spread in basis points of the mid price', () => {
    expect(spreadBps(100, 101)).toBeCloseTo(99.5, 1);
  });

  it('returns null for a crossed book', () => {
    expect(spreadBps(101, 100)).toBeNull();
  });

  it('returns null for non-positive prices', () => {
    expect(spreadBps(0, 100)).toBeNull();
  });
});
