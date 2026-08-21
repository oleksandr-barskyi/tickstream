export interface Ticker {
  symbol: string;
  last: number;
  changePercent: number;
  high: number;
  low: number;
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
