import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BatchStats } from '../core/batcher';
import { RenderMode } from '../stream/useTickers';
import { StreamStatus } from '../stream/types';
import { FpsMeter } from './FpsMeter';
import { colors, spacing } from './theme';

interface Props {
  mode: RenderMode;
  onModeChange: (mode: RenderMode) => void;
  status: StreamStatus;
  stats: BatchStats;
  symbolCount: number;
  running: boolean;
  onRunningChange: (running: boolean) => void;
}

const STATUS_LABEL: Record<StreamStatus, string> = {
  connecting: 'connecting',
  open: 'live',
  reconnecting: 'reconnecting',
  closed: 'closed',
};

const STATUS_COLOR: Record<StreamStatus, string> = {
  connecting: colors.warning,
  open: colors.up,
  reconnecting: colors.warning,
  closed: colors.down,
};

export function ModeBar({
  mode,
  onModeChange,
  status,
  stats,
  symbolCount,
  running,
  onRunningChange,
}: Props) {
  const saved =
    stats.received === 0 ? 0 : Math.round((stats.coalesced / stats.received) * 100);

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.dot,
              { backgroundColor: running ? STATUS_COLOR[status] : colors.textMuted },
            ]}
          />
          <Text style={styles.statusText}>
            {running ? STATUS_LABEL[status] : 'stopped'} · {symbolCount} symbols
          </Text>
        </View>
        <View style={styles.topRight}>
          <FpsMeter active={running} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={running ? 'Stop the stream' : 'Start the stream'}
            onPress={() => onRunningChange(!running)}
            style={[styles.runButton, running ? styles.runButtonStop : styles.runButtonStart]}
          >
            <Text style={[styles.runText, running ? styles.runTextStop : styles.runTextStart]}>
              {running ? 'Stop' : 'Start'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.switch}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'batched' }}
          onPress={() => onModeChange('batched')}
          style={[styles.option, mode === 'batched' && styles.optionActive]}
        >
          <Text style={[styles.optionText, mode === 'batched' && styles.optionTextActive]}>
            Batched
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'naive' }}
          onPress={() => onModeChange('naive')}
          style={[styles.option, mode === 'naive' && styles.optionActive]}
        >
          <Text style={[styles.optionText, mode === 'naive' && styles.optionTextActive]}>
            Naive
          </Text>
        </Pressable>
      </View>

      <Text style={styles.explain}>
        {!running
          ? `Stopped. The socket is closed, the flush timer is cleared and the frame counter is not running, so this tab costs nothing. Last reading: ${stats.received} messages became ${stats.emitted} renders.`
          : mode === 'batched'
            ? `Updates coalesced per symbol and committed every 100ms. ${stats.received} messages became ${stats.emitted} renders, ${saved}% dropped as superseded.`
            : 'One setState per message, no coalescing. This is the version that looks fine on a laptop and stutters on a phone.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runButton: {
    marginLeft: spacing.sm,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  runButtonStop: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.down,
  },
  runButtonStart: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  runText: {
    fontSize: 13,
    fontWeight: '700',
  },
  runTextStop: {
    color: colors.down,
  },
  runTextStart: {
    color: colors.background,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  switch: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: colors.accent,
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.background,
  },
  explain: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
});
