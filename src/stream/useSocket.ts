import { useEffect, useRef, useState } from 'react';

import { StreamStatus } from './types';

const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 15_000;

export function backoffDelay(attempt: number): number {
  const exponential = BASE_DELAY_MS * 2 ** Math.max(0, attempt);
  return Math.min(exponential, MAX_DELAY_MS);
}

export interface SocketState {
  status: StreamStatus;
  reconnects: number;
}

export function useSocket(url: string | null, onMessage: (raw: string) => void): SocketState {
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const [reconnects, setReconnects] = useState(0);
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (url === null) {
      setStatus('closed');
      return;
    }

    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      socket = new WebSocket(url);

      socket.onopen = () => {
        if (disposed) return;
        attempt = 0;
        setStatus('open');
      };

      socket.onmessage = (event) => {
        if (disposed) return;
        if (typeof event.data === 'string') handlerRef.current(event.data);
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (disposed) return;
        setStatus('reconnecting');
        setReconnects((n) => n + 1);
        timer = setTimeout(connect, backoffDelay(attempt));
        attempt += 1;
      };
    };

    connect();

    return () => {
      disposed = true;
      if (timer !== null) clearTimeout(timer);
      if (socket !== null) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      }
    };
  }, [url]);

  return { status, reconnects };
}
