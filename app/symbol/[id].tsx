import { useLocalSearchParams, useNavigation } from 'expo-router';
import { memo, useCallback, useEffect } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native';

import { displaySymbol, formatClock, formatPrice, formatQty, spreadBps } from '../../src/core/format';
import { Trade } from '../../src/stream/types';
import { useSymbolFeed } from '../../src/stream/useSymbolFeed';
import { FpsMeter } from '../../src/ui/FpsMeter';
import { TAPE_ROW_HEIGHT, colors, spacing } from '../../src/ui/theme';

const TapeRow = memo(function TapeRow({ trade }: { trade: Trade }) {
  const tone = trade.buyerIsMaker ? colors.down : colors.up;
  return (
    <View style={styles.tapeRow}>
      <Text style={styles.tapeTime}>{formatClock(trade.at)}</Text>
      <Text style={[styles.tapePrice, { color: tone }]}>{formatPrice(trade.price)}</Text>
      <Text style={styles.tapeQty}>{formatQty(trade.qty)}</Text>
    </View>
  );
});

export default function SymbolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const symbol = typeof id === 'string' ? id : null;
  const { trades, book, status, tradesSeen } = useSymbolFeed(symbol);

  useEffect(() => {
    if (symbol !== null) navigation.setOptions({ title: displaySymbol(symbol) });
  }, [symbol, navigation]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Trade>) => <TapeRow trade={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Trade) => String(item.id), []);

  const getItemLayout = useCallback(
    (_d: ArrayLike<Trade> | null | undefined, index: number) => ({
      length: TAPE_ROW_HEIGHT,
      offset: TAPE_ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  const spread = book === null ? null : spreadBps(book.bid, book.ask);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.bookRow}>
          <View style={styles.bookSide}>
            <Text style={styles.bookLabel}>bid</Text>
            <Text style={[styles.bookPrice, { color: colors.up }]}>
              {book === null ? '--' : formatPrice(book.bid)}
            </Text>
            <Text style={styles.bookQty}>{book === null ? '' : formatQty(book.bidQty)}</Text>
          </View>
          <View style={styles.spreadBox}>
            <Text style={styles.bookLabel}>spread</Text>
            <Text style={styles.spread}>{spread === null ? '--' : `${spread.toFixed(1)} bps`}</Text>
          </View>
          <View style={[styles.bookSide, styles.bookSideRight]}>
            <Text style={styles.bookLabel}>ask</Text>
            <Text style={[styles.bookPrice, { color: colors.down }]}>
              {book === null ? '--' : formatPrice(book.ask)}
            </Text>
            <Text style={styles.bookQty}>{book === null ? '' : formatQty(book.askQty)}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {status} · {tradesSeen} trades received · showing last {trades.length}
          </Text>
          <FpsMeter />
        </View>
      </View>

      <FlatList
        data={trades}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookSide: {
    flex: 1,
  },
  bookSideRight: {
    alignItems: 'flex-end',
  },
  spreadBox: {
    alignItems: 'center',
    flex: 1,
  },
  bookLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bookPrice: {
    fontSize: 19,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  bookQty: {
    color: colors.textMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  spread: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
    flex: 1,
  },
  tapeRow: {
    height: TAPE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  tapeTime: {
    color: colors.textMuted,
    fontSize: 12,
    width: 76,
    fontVariant: ['tabular-nums'],
  },
  tapePrice: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  tapeQty: {
    color: colors.textMuted,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
