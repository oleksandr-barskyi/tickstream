import { BookTop, Ticker, Trade } from './types';

const WS_BASE = 'wss://stream.binance.com:9443/stream';

export const SYMBOLS = [
  'btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt', 'adausdt',
  'dogeusdt', 'avaxusdt', 'linkusdt', 'dotusdt', 'maticusdt', 'ltcusdt',
  'trxusdt', 'nearusdt', 'atomusdt', 'uniusdt', 'aptusdt', 'arbusdt',
  'opusdt', 'filusdt', 'injusdt', 'suiusdt', 'seiusdt', 'tiausdt',
  'rndrusdt', 'imxusdt', 'grtusdt', 'aaveusdt', 'algousdt', 'ftmusdt',
];

export function tickerStreamUrl(symbols: string[]): string {
  const streams = symbols.flatMap((s) => [`${s}@ticker`, `${s}@bookTicker`]).join('/');
  return `${WS_BASE}?streams=${streams}`;
}

export function symbolStreamUrl(symbol: string): string {
  const lower = symbol.toLowerCase();
  return `${WS_BASE}?streams=${lower}@aggTrade/${lower}@bookTicker`;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export type TickerPatch = Partial<Ticker> & { symbol: string };

export function parseTicker(payload: unknown): TickerPatch | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const d = payload as Record<string, unknown>;

  const symbol = typeof d.s === 'string' ? d.s : null;
  const last = num(d.c);
  const changePercent = num(d.P);
  if (symbol === null || last === null || changePercent === null) return null;

  return {
    symbol,
    last,
    changePercent,
    quoteVolume: num(d.q) ?? 0,
    at: num(d.E) ?? Date.now(),
  };
}

export function parseBookPatch(payload: unknown): TickerPatch | null {
  const top = parseBookTop(payload);
  if (top === null) return null;
  return { symbol: top.symbol, bid: top.bid, ask: top.ask };
}

export function parseTrade(payload: unknown): Trade | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const d = payload as Record<string, unknown>;

  const symbol = typeof d.s === 'string' ? d.s : null;
  const price = num(d.p);
  const qty = num(d.q);
  const id = num(d.a);
  if (symbol === null || price === null || qty === null || id === null) return null;

  return {
    id,
    symbol,
    price,
    qty,
    at: num(d.T) ?? Date.now(),
    buyerIsMaker: d.m === true,
  };
}

export function parseBookTop(payload: unknown): BookTop | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const d = payload as Record<string, unknown>;

  const symbol = typeof d.s === 'string' ? d.s : null;
  const bid = num(d.b);
  const ask = num(d.a);
  if (symbol === null || bid === null || ask === null) return null;

  return {
    symbol,
    bid,
    bidQty: num(d.B) ?? 0,
    ask,
    askQty: num(d.A) ?? 0,
  };
}

export interface Envelope {
  stream: string;
  data: unknown;
}

export function parseEnvelope(raw: string): Envelope | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const e = parsed as Record<string, unknown>;
    if (typeof e.stream !== 'string') return null;
    return { stream: e.stream, data: e.data };
  } catch {
    return null;
  }
}
