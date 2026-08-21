export function decimalsFor(price: number): number {
  const value = Math.abs(price);
  if (value >= 1000) return 2;
  if (value >= 1) return 3;
  if (value >= 0.01) return 5;
  return 8;
}

export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '--';
  return price.toFixed(decimalsFor(price));
}

export function formatPercent(percent: number): string {
  if (!Number.isFinite(percent)) return '--';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '--';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}

export function formatQty(qty: number): string {
  if (!Number.isFinite(qty)) return '--';
  if (qty >= 1000) return qty.toFixed(0);
  if (qty >= 1) return qty.toFixed(3);
  return qty.toFixed(5);
}

export function displaySymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  return upper.endsWith('USDT') ? `${upper.slice(0, -4)}/USDT` : upper;
}

export function formatClock(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function spreadBps(bid: number, ask: number): number | null {
  if (!Number.isFinite(bid) || !Number.isFinite(ask)) return null;
  if (bid <= 0 || ask <= 0 || ask < bid) return null;
  const mid = (bid + ask) / 2;
  if (mid === 0) return null;
  return ((ask - bid) / mid) * 10_000;
}
