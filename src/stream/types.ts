export interface Ticker {
  symbol: string;
  last: number;
  bid: number | null;
  ask: number | null;
  changePercent: number;
  quoteVolume: number;
  at: number;
}

export interface Trade {
  id: number;
  symbol: string;
  price: number;
  qty: number;
  at: number;
  buyerIsMaker: boolean;
}

export interface BookTop {
  symbol: string;
  bid: number;
  bidQty: number;
  ask: number;
  askQty: number;
}

export type StreamStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export function displayPrice(ticker: Ticker): number {
  if (ticker.bid !== null && ticker.ask !== null && ticker.ask >= ticker.bid) {
    return (ticker.bid + ticker.ask) / 2;
  }
  return ticker.last;
}

export function mergeTicker(previous: Ticker | undefined, patch: Partial<Ticker> & { symbol: string }): Ticker {
  const base: Ticker = previous ?? {
    symbol: patch.symbol,
    last: 0,
    bid: null,
    ask: null,
    changePercent: 0,
    quoteVolume: 0,
    at: 0,
  };

  return {
    symbol: patch.symbol,
    last: patch.last ?? base.last,
    bid: patch.bid !== undefined ? patch.bid : base.bid,
    ask: patch.ask !== undefined ? patch.ask : base.ask,
    changePercent: patch.changePercent ?? base.changePercent,
    quoteVolume: patch.quoteVolume ?? base.quoteVolume,
    at: patch.at ?? base.at,
  };
}
