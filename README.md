# TickStream

A React Native app that renders a live market feed without dropping frames, and
lets you switch off the thing that makes it possible so you can watch it fall over.

No API key, no account, no configuration.

```bash
npm install
npx expo start
```

Open it in Expo Go, an emulator, or the browser with `w`.

## The problem this is about

A market feed is not a list that updates. It is thirty symbols each pushing
several messages per second, plus a trade tape that can exceed a hundred messages
per second on a single pair. The naive implementation calls `setState` on every
message. That works on a laptop and stutters on a phone, which is exactly the
kind of bug that is invisible until it is in front of users.

The interesting part of a trading UI is not the chart. It is the gap between the
rate the data arrives and the rate a screen can usefully repaint.

## See it happen

The header has a **Batched / Naive** switch and a live FPS counter.

- **Batched** is the real implementation. Updates are coalesced per symbol and
  committed on a fixed 100ms interval. If BTC ticks twelve times between frames,
  eleven of those are dropped, because nobody can see a price that was replaced
  40ms later. The header reports the ratio: how many messages arrived and how
  many actually became renders.
- **Naive** removes the coalescing and commits every message immediately. Same
  data, same components, same device.

Switch between them and watch the FPS counter. That difference is the whole
project.

## How it works

**Coalescing.** `src/core/batcher.ts` is a keyed buffer: pushing a value replaces
any earlier value for the same key, and `flush()` returns the survivors and
empties the buffer. It has no React in it, no timers, and no socket, so it is
tested directly rather than through the UI.

**Frame budget.** The flush runs on an interval rather than per message, so the
render count is bounded by wall time instead of by whatever the exchange decides
to send. Under load the app renders 10 times per second regardless of whether 50
or 500 messages arrived.

**Animation off the JS thread.** Price flashes run through Reanimated, so a busy
JavaScript thread does not stop the highlight from animating. This matters more
in naive mode, where the JS thread is the bottleneck by design.

**Rows that do not re-render.** `TickerRow` is memoised with an explicit
comparator on the four fields it actually draws. A ticker whose volume changed
but whose price did not will not repaint.

**Fixed row heights.** Both lists set `getItemLayout`, so React Native never
measures a row to know where it goes.

**Reconnect.** `useSocket` reconnects with exponential backoff capped at 15
seconds, and cleans up its handlers on unmount so a screen you left cannot push
state into a component that is gone.

**Parsing.** Binance sends numbers as strings, and occasionally sends fields that
are absent. Every payload is treated as `unknown`, validated field by field, and
dropped if it cannot be identified. A missing price renders as `--`, never `NaN`.

## Architecture

```
app/
  _layout.tsx        stack and providers
  index.tsx          ticker list, 30 symbols
  symbol/[id].tsx    trade tape and best bid/ask for one pair
src/
  core/              pure logic: coalescing buffer, capped buffers, formatting
  stream/            endpoints, payload parsing, socket lifecycle, feed hooks
  ui/                presentational components, FPS meter, theme
__tests__/           57 tests
```

The rule the layout enforces: anything worth testing lives in `core` or in the
parsers, as a function that takes values and returns values. The React layer
holds the socket lifecycle and the rendering, and nothing else.

## Tests

```bash
npm test
npm run typecheck
```

57 tests across five suites: the coalescing buffer including how many messages it
discards, the capped tape buffers and their ordering, URL building, payload
parsing including malformed and partial messages, price and spread formatting,
reconnect backoff, and the list row down to press handling.

TypeScript runs in strict mode with no `any` in application code.

## Data source

Public market streams from the Binance WebSocket API, which require no key and no
account. This project is not affiliated with Binance and is a rendering demo, not
trading software.

## License

MIT
