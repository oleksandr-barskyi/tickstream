import { memo, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { displaySymbol, formatCompact, formatPercent, formatPrice } from '../core/format';
import { Ticker, displayPrice } from '../stream/types';
import { ROW_HEIGHT, colors, spacing } from './theme';

interface Props {
  ticker: Ticker;
  onPress: (symbol: string) => void;
}

const FLASH_IN_MS = 90;
const FLASH_OUT_MS = 420;

function TickerRowComponent({ ticker, onPress }: Props) {
  const price = displayPrice(ticker);
  const previous = useRef(price);
  const flash = useSharedValue(0);

  useEffect(() => {
    const direction = price > previous.current ? 1 : price < previous.current ? -1 : 0;
    previous.current = price;
    if (direction === 0) return;
    flash.value = withSequence(
      withTiming(direction, { duration: FLASH_IN_MS }),
      withTiming(0, { duration: FLASH_OUT_MS }),
    );
  }, [price, flash]);

  const flashStyle = useAnimatedStyle(() => {
    const intensity = Math.abs(flash.value) * 0.22;
    return {
      backgroundColor:
        flash.value > 0
          ? `rgba(34, 201, 138, ${intensity})`
          : `rgba(255, 84, 112, ${intensity})`,
    };
  });

  const up = ticker.changePercent >= 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={displaySymbol(ticker.symbol)}
      onPress={() => onPress(ticker.symbol)}
    >
      <Animated.View style={[styles.row, flashStyle]}>
        <View style={styles.left}>
          <Text style={styles.symbol}>{displaySymbol(ticker.symbol)}</Text>
          <Text style={styles.volume}>vol {formatCompact(ticker.quoteVolume)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          <Text style={[styles.change, { color: up ? colors.up : colors.down }]}>
            {formatPercent(ticker.changePercent)}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function areEqual(prev: Props, next: Props): boolean {
  return (
    prev.ticker.symbol === next.ticker.symbol &&
    prev.ticker.last === next.ticker.last &&
    prev.ticker.bid === next.ticker.bid &&
    prev.ticker.ask === next.ticker.ask &&
    prev.ticker.changePercent === next.ticker.changePercent &&
    prev.ticker.quoteVolume === next.ticker.quoteVolume &&
    prev.onPress === next.onPress
  );
}

export const TickerRow = memo(TickerRowComponent, areEqual);

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  symbol: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  volume: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  price: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
