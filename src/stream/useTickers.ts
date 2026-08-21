import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BatchStats, createBatcher } from '../core/batcher';
import { parseEnvelope, parseTicker, tickerStreamUrl } from './binance';
import { Ticker } from './types';
import { useSocket } from './useSocket';

export type RenderMode = 'batched' | 'naive';

export const FLUSH_INTERVAL_MS = 100;

interface TickerFeed {
  tickers: Ticker[];
  status: ReturnType<typeof useSocket>['status'];
  reconnects: number;
  stats: BatchStats;
}

export function useTickers(symbols: string[], mode: RenderMode): TickerFeed {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [stats, setStats] = useState<BatchStats>({
    received: 0,
    emitted: 0,
    coalesced: 0,
    flushes: 0,
  });

  const batcher = useMemo(() => createBatcher<Ticker>((t) => t.symbol), []);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
    batcher.reset();
    setStats(batcher.stats());
  }, [mode, batcher]);

  const url = useMemo(() => tickerStreamUrl(symbols), [symbols]);

  const onMessage = useCallback(
    (raw: string) => {
      const envelope = parseEnvelope(raw);
      if (envelope === null) return;
      const ticker = parseTicker(envelope.data);
      if (ticker === null) return;

      if (modeRef.current === 'naive') {
        setTickers((current) => ({ ...current, [ticker.symbol]: ticker }));
        return;
      }
      batcher.push(ticker);
    },
    [batcher],
  );

  const { status, reconnects } = useSocket(url, onMessage);

  useEffect(() => {
    if (mode !== 'batched') return;

    const timer = setInterval(() => {
      const batch = batcher.flush();
      if (batch.length === 0) return;
      setTickers((current) => {
        const next = { ...current };
        for (const ticker of batch) next[ticker.symbol] = ticker;
        return next;
      });
      setStats(batcher.stats());
    }, FLUSH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [mode, batcher]);

  const list = useMemo(
    () => Object.values(tickers).sort((a, b) => b.quoteVolume - a.quoteVolume),
    [tickers],
  );

  return { tickers: list, status, reconnects, stats };
}
