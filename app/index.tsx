import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native';

import { SYMBOLS } from '../src/stream/binance';
import { Ticker } from '../src/stream/types';
import { RenderMode, useTickers } from '../src/stream/useTickers';
import { ModeBar } from '../src/ui/ModeBar';
import { TickerRow } from '../src/ui/TickerRow';
import { ROW_HEIGHT, colors, spacing } from '../src/ui/theme';

export default function FeedScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<RenderMode>('batched');
  const { tickers, status, stats } = useTickers(SYMBOLS, mode);

  const openSymbol = useCallback(
    (symbol: string) => router.push({ pathname: '/symbol/[id]', params: { id: symbol } }),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Ticker>) => <TickerRow ticker={item} onPress={openSymbol} />,
    [openSymbol],
  );

  const keyExtractor = useCallback((item: Ticker) => item.symbol, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<Ticker> | null | undefined, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  return (
    <View style={styles.screen}>
      <ModeBar
        mode={mode}
        onModeChange={setMode}
        status={status}
        stats={stats}
        symbolCount={SYMBOLS.length}
      />
      {tickers.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.emptyTitle}>Waiting for the first tick</Text>
          <Text style={styles.emptyHint}>
            Connecting to the public Binance stream. No API key is involved.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={9}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 19,
  },
});
