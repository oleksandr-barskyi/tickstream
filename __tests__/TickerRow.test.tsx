import { fireEvent, render } from '@testing-library/react-native';

import { Ticker } from '../src/stream/types';
import { TickerRow } from '../src/ui/TickerRow';

function ticker(overrides: Partial<Ticker> = {}): Ticker {
  return {
    symbol: 'BTCUSDT',
    last: 64000.12,
    bid: null,
    ask: null,
    changePercent: 1.25,
    quoteVolume: 2_500_000_000,
    at: 1_700_000_000_000,
    ...overrides,
  };
}

function renderRow(overrides: Partial<Ticker> = {}, onPress = jest.fn()) {
  return render(<TickerRow ticker={ticker(overrides)} onPress={onPress} />);
}

describe('TickerRow', () => {
  it('shows the pair, the price and the change', async () => {
    const { getByText } = await renderRow();

    expect(getByText('BTC/USDT')).toBeTruthy();
    expect(getByText('64000.12')).toBeTruthy();
    expect(getByText('+1.25%')).toBeTruthy();
  });

  it('shows a loss without a plus sign', async () => {
    const { getByText } = await renderRow({ changePercent: -3.5 });
    expect(getByText('-3.50%')).toBeTruthy();
  });

  it('shortens the quote volume', async () => {
    const { getByText } = await renderRow();
    expect(getByText('vol 2.5B')).toBeTruthy();
  });

  it('prefers the mid of the book over the last trade once both sides arrive', async () => {
    const { getByText } = await renderRow({ bid: 100, ask: 102 });
    expect(getByText('101.000')).toBeTruthy();
  });

  it('does not print NaN when the feed sends a broken price', async () => {
    const { getByText } = await renderRow({ last: Number.NaN });
    expect(getByText('--')).toBeTruthy();
  });

  it('passes the symbol up on press', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await renderRow({}, onPress);

    fireEvent.press(getByLabelText('BTC/USDT'));

    expect(onPress).toHaveBeenCalledWith('BTCUSDT');
  });
});
