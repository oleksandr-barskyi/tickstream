import { backoffDelay } from '../src/stream/useSocket';

describe('backoffDelay', () => {
  it('starts short so a blip reconnects almost immediately', () => {
    expect(backoffDelay(0)).toBe(500);
  });

  it('doubles with each failed attempt', () => {
    expect(backoffDelay(1)).toBe(1000);
    expect(backoffDelay(2)).toBe(2000);
    expect(backoffDelay(3)).toBe(4000);
  });

  it('stops growing at the ceiling so it never sleeps for minutes', () => {
    expect(backoffDelay(10)).toBe(15_000);
    expect(backoffDelay(50)).toBe(15_000);
  });

  it('treats a negative attempt as the first one', () => {
    expect(backoffDelay(-3)).toBe(500);
  });
});
