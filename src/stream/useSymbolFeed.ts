import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { appendManyCapped } from '../core/batcher';
import { parseBookTop, parseEnvelope, parseTrade, symbolStreamUrl } from './binance';
import { BookTop, Trade } from './types';
import { useSocket } from './useSocket';

export const TAPE_LIMIT = 120;
const FLUSH_INTERVAL_MS = 100;

interface SymbolFeed {
  trades: Trade[];
  book: BookTop | null;
  status: ReturnType<typeof useSocket>['status'];
  tradesSeen: number;
}

export function useSymbolFeed(symbol: string | null): SymbolFeed {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [book, setBook] = useState<BookTop | null>(null);
  const [tradesSeen, setTradesSeen] = useState(0);

  const tradeBuffer = useRef<Trade[]>([]);
  const bookBuffer = useRef<BookTop | null>(null);
  const seenRef = useRef(0);

  const url = useMemo(() => (symbol === null ? null : symbolStreamUrl(symbol)), [symbol]);

  useEffect(() => {
    tradeBuffer.current = [];
    bookBuffer.current = null;
    seenRef.current = 0;
    setTrades([]);
    setBook(null);
    setTradesSeen(0);
  }, [symbol]);

  const onMessage = useCallback((raw: string) => {
    const envelope = parseEnvelope(raw);
    if (envelope === null) return;

    if (envelope.stream.endsWith('@aggTrade')) {
      const trade = parseTrade(envelope.data);
      if (trade === null) return;
      tradeBuffer.current.push(trade);
      seenRef.current += 1;
      return;
    }

    if (envelope.stream.endsWith('@bookTicker')) {
      const top = parseBookTop(envelope.data);
      if (top !== null) bookBuffer.current = top;
    }
  }, []);

  const { status } = useSocket(url, onMessage);

  useEffect(() => {
    const timer = setInterval(() => {
      if (tradeBuffer.current.length > 0) {
        const incoming = tradeBuffer.current;
        tradeBuffer.current = [];
        setTrades((current) => appendManyCapped(current, incoming, TAPE_LIMIT));
        setTradesSeen(seenRef.current);
      }
      if (bookBuffer.current !== null) {
        setBook(bookBuffer.current);
        bookBuffer.current = null;
      }
    }, FLUSH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return { trades, book, status, tradesSeen };
}
