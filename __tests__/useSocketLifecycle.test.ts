import { renderHook } from '@testing-library/react-native';

import { useSocket } from '../src/stream/useSocket';

class FakeSocket {
  static constructed = 0;
  static closed = 0;

  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public readonly url: string) {
    FakeSocket.constructed += 1;
  }

  close(): void {
    FakeSocket.closed += 1;
  }
}

const LIVE_URL = 'wss://example.test/stream';

describe('useSocket lifecycle', () => {
  const original = globalThis.WebSocket;

  beforeEach(() => {
    FakeSocket.constructed = 0;
    FakeSocket.closed = 0;
    globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = original;
  });

  it('opens nothing while the url is null', async () => {
    const { result } = await renderHook(() => useSocket(null, () => {}));

    expect(FakeSocket.constructed).toBe(0);
    expect(result.current.status).toBe('closed');
  });

  it('opens exactly one connection once a url appears', async () => {
    const { rerender } = await renderHook(
      ({ url }: { url: string | null }) => useSocket(url, () => {}),
      { initialProps: { url: null as string | null } },
    );

    await rerender({ url: LIVE_URL });

    expect(FakeSocket.constructed).toBe(1);
  });

  it('closes the socket when the url goes back to null', async () => {
    const { result, rerender } = await renderHook(
      ({ url }: { url: string | null }) => useSocket(url, () => {}),
      { initialProps: { url: LIVE_URL as string | null } },
    );

    expect(FakeSocket.constructed).toBe(1);

    await rerender({ url: null });

    expect(FakeSocket.closed).toBe(1);
    expect(result.current.status).toBe('closed');
  });

  it('does not reopen while the url stays null', async () => {
    const { rerender } = await renderHook(
      ({ url }: { url: string | null }) => useSocket(url, () => {}),
      { initialProps: { url: null as string | null } },
    );

    await rerender({ url: null });
    await rerender({ url: null });

    expect(FakeSocket.constructed).toBe(0);
  });
});
