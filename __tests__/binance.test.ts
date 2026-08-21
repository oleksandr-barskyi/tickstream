import {
  parseBookTop,
  parseEnvelope,
  parseTicker,
  parseTrade,
  symbolStreamUrl,
  tickerStreamUrl,
} from '../src/stream/binance';

describe('stream urls', () => {
  it('subscribes each symbol to both the slow ticker and the fast book top', () => {
    expect(tickerStreamUrl(['btcusdt', 'ethusdt'])).toBe(
      'wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/btcusdt@bookTicker/ethusdt@ticker/ethusdt@bookTicker',
    );
  });

  it('lowercases the symbol and subscribes to trades and book top', () => {
    expect(symbolStreamUrl('BTCUSDT')).toBe(
      'wss://stream.binance.com:9443/stream?streams=btcusdt@aggTrade/btcusdt@bookTicker',
    );
  });
});

describe('parseEnvelope', () => {
  it('reads the stream name and payload', () => {
    const envelope = parseEnvelope('{"stream":"btcusdt@ticker","data":{"s":"BTCUSDT"}}');
    expect(envelope?.stream).toBe('btcusdt@ticker');
  });

  it('returns null on malformed json instead of throwing', () => {
    expect(parseEnvelope('{ not json')).toBeNull();
  });

  it('returns null when the stream name is missing', () => {
    expect(parseEnvelope('{"data":{}}')).toBeNull();
  });
});

describe('parseTicker', () => {
  const raw = {
    s: 'BTCUSDT',
    c: '64000.10',
    P: '-1.25',
    h: '65000.00',
    l: '63000.00',
    q: '1250000000.5',
    E: 1_700_000_000_000,
  };

  it('converts the string numbers Binance sends', () => {
    const ticker = parseTicker(raw);
    expect(ticker).toEqual({
      symbol: 'BTCUSDT',
      last: 64000.1,
      changePercent: -1.25,
      quoteVolume: 1250000000.5,
      at: 1_700_000_000_000,
    });
  });

  it('does not carry bid or ask, so a slow ticker cannot erase a fresh book top', () => {
    const ticker = parseTicker(raw);
    expect(ticker).not.toHaveProperty('bid');
    expect(ticker).not.toHaveProperty('ask');
  });

  it('rejects a payload without a price', () => {
    expect(parseTicker({ ...raw, c: undefined })).toBeNull();
  });

  it('rejects a payload where the price is not numeric', () => {
    expect(parseTicker({ ...raw, c: 'n/a' })).toBeNull();
  });

  it('defaults volume to zero rather than dropping the message', () => {
    expect(parseTicker({ ...raw, q: undefined })?.quoteVolume).toBe(0);
  });
});

describe('parseTrade', () => {
  const raw = { a: 42, s: 'BTCUSDT', p: '64000.10', q: '0.015', T: 1_700_000_000_000, m: true };

  it('maps an aggregated trade', () => {
    expect(parseTrade(raw)).toEqual({
      id: 42,
      symbol: 'BTCUSDT',
      price: 64000.1,
      qty: 0.015,
      at: 1_700_000_000_000,
      buyerIsMaker: true,
    });
  });

  it('treats a missing maker flag as false rather than undefined', () => {
    expect(parseTrade({ ...raw, m: undefined })?.buyerIsMaker).toBe(false);
  });

  it('rejects a trade without an id', () => {
    expect(parseTrade({ ...raw, a: undefined })).toBeNull();
  });
});

describe('parseBookTop', () => {
  it('maps best bid and ask', () => {
    expect(parseBookTop({ s: 'BTCUSDT', b: '64000', B: '1.5', a: '64001', A: '2.5' })).toEqual({
      symbol: 'BTCUSDT',
      bid: 64000,
      bidQty: 1.5,
      ask: 64001,
      askQty: 2.5,
    });
  });

  it('rejects a payload without both sides', () => {
    expect(parseBookTop({ s: 'BTCUSDT', b: '64000' })).toBeNull();
  });
});
