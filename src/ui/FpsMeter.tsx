import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from './theme';

const SAMPLE_MS = 500;

export function useFps(): number {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const since = useRef(Date.now());

  useEffect(() => {
    let handle: number;

    const tick = () => {
      frames.current += 1;
      const elapsed = Date.now() - since.current;
      if (elapsed >= SAMPLE_MS) {
        setFps(Math.round((frames.current * 1000) / elapsed));
        frames.current = 0;
        since.current = Date.now();
      }
      handle = requestAnimationFrame(tick);
    };

    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, []);

  return fps;
}

function tone(fps: number): string {
  if (fps >= 50) return colors.up;
  if (fps >= 30) return colors.warning;
  return colors.down;
}

export function FpsMeter({ label }: { label?: string }) {
  const fps = useFps();
  return (
    <View style={styles.pill}>
      <Text style={[styles.value, { color: tone(fps) }]}>{fps}</Text>
      <Text style={styles.unit}>{label ?? 'fps'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: spacing.xs,
  },
});
